import "server-only";

import { getEmailConfig } from "@/lib/email/config";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Enums } from "@/types/supabase";

export type TransactionalEmail = {
    to: { email: string | null; name?: string | null };
    cc?: Array<{ email: string; name?: string | null }>;
    bcc?: Array<{ email: string; name?: string | null }>;
    attachments?: Array<{ name: string; content: string }>;
    subject: string;
    html: string;
    text: string;
    notificationType: string;
    deduplicationKey?: string;
    bookingId?: string | null;
    userId?: string | null;
};

export type EmailDeliveryResult = {
    sent: boolean;
    skipped: boolean;
    duplicate: boolean;
    status: Enums<"notification_status">;
    message: string;
};

const PENDING_RETRY_AFTER_MS = 15 * 60 * 1000;

function diagnostic(
    level: "error" | "warn",
    event: string,
    fields: Record<string, unknown>,
) {
    console[level](
        JSON.stringify({
            scope: "email:brevo",
            event,
            ...fields,
        }),
    );
}

function providerFailureMessage(status: number) {
    if (status === 401 || status === 403) {
        return "Brevo authentication or sender authorization failed.";
    }
    if (status === 400) {
        return "Brevo rejected the email request.";
    }
    if (status === 429) {
        return "Brevo rate-limited the email request.";
    }
    if (status >= 500) {
        return "Brevo is temporarily unavailable.";
    }
    return `Brevo returned HTTP ${status}.`;
}

export async function sendTransactionalEmail(
    input: TransactionalEmail,
): Promise<EmailDeliveryResult> {
    const recipientEmail = input.to.email?.trim() || null;
    const config = getEmailConfig();
    const deduplicationKey =
        input.deduplicationKey ??
        (input.bookingId
            ? `${input.bookingId}:${input.notificationType}`
            : null);
    let admin: ReturnType<typeof createAdminClient> | null = null;
    let pendingLogId: string | null = null;

    try {
        admin = createAdminClient();
        let existing:
            | {
                  id: string;
                  status: Enums<"notification_status">;
                  created_at: string;
              }
            | null = null;

        if (deduplicationKey) {
            const result = await admin
                .from("notification_logs")
                .select("id, status, created_at")
                .eq("deduplication_key", deduplicationKey)
                .limit(1)
                .maybeSingle();

            if (result.error) {
                diagnostic("error", "deduplication_lookup_failed", {
                    notificationType: input.notificationType,
                    bookingId: input.bookingId ?? null,
                    code: result.error.code,
                });
                return {
                    sent: false,
                    skipped: false,
                    duplicate: false,
                    status: "failed",
                    message: "Email delivery could not be safely reserved.",
                };
            }
            existing = result.data;

            if (existing?.status === "sent") {
                return {
                    sent: false,
                    skipped: true,
                    duplicate: true,
                    status: "sent",
                    message: "This notification was already sent.",
                };
            }

            const pendingAge = existing
                ? Date.now() - new Date(existing.created_at).getTime()
                : 0;
            if (
                existing?.status === "pending" &&
                pendingAge < PENDING_RETRY_AFTER_MS
            ) {
                return {
                    sent: false,
                    skipped: true,
                    duplicate: true,
                    status: "pending",
                    message: "This notification is already being delivered.",
                };
            }
        }

        const logValues = {
            booking_id: input.bookingId ?? null,
            user_id: input.userId ?? null,
            deduplication_key: deduplicationKey,
            notification_type: input.notificationType,
            recipient_email: recipientEmail,
            subject: input.subject,
            provider: "brevo",
        };

        if (!recipientEmail) {
            const skippedValues = {
                ...logValues,
                recipient_email: null,
                status: "skipped" as const,
                error_message:
                    "Skipped: booking has no email recipient. Client contact is Instagram-only.",
            };
            const result = existing
                ? await admin
                      .from("notification_logs")
                      .update(skippedValues)
                      .eq("id", existing.id)
                : await admin.from("notification_logs").insert(skippedValues);

            if (result.error && result.error.code !== "23505") {
                diagnostic("error", "skipped_log_failed", {
                    notificationType: input.notificationType,
                    bookingId: input.bookingId ?? null,
                    code: result.error.code,
                });
            }
            return {
                sent: false,
                skipped: true,
                duplicate: existing?.status === "skipped",
                status: "skipped",
                message: "No email recipient is available.",
            };
        }

        if (!config.apiKey || !config.senderEmail) {
            const failedValues = {
                ...logValues,
                status: "failed" as const,
                error_message:
                    "Brevo environment variables are not configured.",
            };
            const result = existing
                ? await admin
                      .from("notification_logs")
                      .update(failedValues)
                      .eq("id", existing.id)
                : await admin.from("notification_logs").insert(failedValues);

            diagnostic("error", "configuration_missing", {
                notificationType: input.notificationType,
                bookingId: input.bookingId ?? null,
                apiKeyConfigured: Boolean(config.apiKey),
                senderConfigured: Boolean(config.senderEmail),
                logCode: result.error?.code ?? null,
            });
            return {
                sent: false,
                skipped: false,
                duplicate: false,
                status: "failed",
                message: "Transactional email is not configured.",
            };
        }

        pendingLogId = existing?.id ?? null;
        if (pendingLogId) {
            const { error } = await admin
                .from("notification_logs")
                .update({
                    ...logValues,
                    status: "pending",
                    error_message: null,
                    provider_message_id: null,
                    sent_at: null,
                })
                .eq("id", pendingLogId);
            if (error) {
                diagnostic("error", "retry_reservation_failed", {
                    notificationType: input.notificationType,
                    bookingId: input.bookingId ?? null,
                    code: error.code,
                });
                return {
                    sent: false,
                    skipped: false,
                    duplicate: false,
                    status: "failed",
                    message: "Email delivery could not be safely reserved.",
                };
            }
        } else {
            const { data, error } = await admin
                .from("notification_logs")
                .insert({ ...logValues, status: "pending" })
                .select("id")
                .single();

            if (error?.code === "23505") {
                return {
                    sent: false,
                    skipped: true,
                    duplicate: true,
                    status: "pending",
                    message: "This notification is already being delivered.",
                };
            }
            if (error || !data) {
                diagnostic("error", "reservation_failed", {
                    notificationType: input.notificationType,
                    bookingId: input.bookingId ?? null,
                    code: error?.code ?? null,
                });
                return {
                    sent: false,
                    skipped: false,
                    duplicate: false,
                    status: "failed",
                    message: "Email delivery could not be safely reserved.",
                };
            }
            pendingLogId = data.id;
        }

        const bcc = (input.bcc ?? [])
            .map((recipient) => ({
                email: recipient.email.trim(),
                name: recipient.name ?? undefined,
            }))
            .filter(
                (recipient) =>
                    recipient.email &&
                    recipient.email.toLowerCase() !==
                        recipientEmail.toLowerCase(),
            );
        const cc = (input.cc ?? [])
            .map((recipient) => ({
                email: recipient.email.trim(),
                name: recipient.name ?? undefined,
            }))
            .filter(
                (recipient) =>
                    recipient.email &&
                    recipient.email.toLowerCase() !==
                        recipientEmail.toLowerCase(),
            );
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "api-key": config.apiKey,
                "content-type": "application/json",
                accept: "application/json",
            },
            body: JSON.stringify({
                sender: {
                    email: config.senderEmail,
                    name: config.senderName,
                },
                to: [
                    {
                        email: recipientEmail,
                        name: input.to.name ?? undefined,
                    },
                ],
                cc: cc.length > 0 ? cc : undefined,
                bcc: bcc.length > 0 ? bcc : undefined,
                attachment:
                    input.attachments && input.attachments.length > 0
                        ? input.attachments
                        : undefined,
                subject: input.subject,
                htmlContent: input.html,
                textContent: input.text,
            }),
        });
        const payload = (await response.json().catch(() => ({}))) as {
            messageId?: string;
            code?: string;
        };
        if (!response.ok) {
            const safeMessage = providerFailureMessage(response.status);
            diagnostic("error", "provider_rejected", {
                notificationType: input.notificationType,
                bookingId: input.bookingId ?? null,
                httpStatus: response.status,
                providerCode: payload.code ?? null,
            });
            const { error } = await admin
                .from("notification_logs")
                .update({
                    status: "failed",
                    error_message: safeMessage,
                })
                .eq("id", pendingLogId);
            if (error) {
                diagnostic("error", "failed_status_update_failed", {
                    notificationType: input.notificationType,
                    bookingId: input.bookingId ?? null,
                    code: error.code,
                });
            }
            return {
                sent: false,
                skipped: false,
                duplicate: false,
                status: "failed",
                message: safeMessage,
            };
        }

        const { error: sentLogError } = await admin
            .from("notification_logs")
            .update({
                provider_message_id: payload.messageId ?? null,
                status: "sent",
                error_message: null,
                sent_at: new Date().toISOString(),
            })
            .eq("id", pendingLogId);
        if (sentLogError) {
            diagnostic("error", "sent_status_update_failed", {
                notificationType: input.notificationType,
                bookingId: input.bookingId ?? null,
                code: sentLogError.code,
            });
        }
        return {
            sent: true,
            skipped: false,
            duplicate: false,
            status: "sent",
            message: "Email accepted by Brevo.",
        };
    } catch (error) {
        if (admin && pendingLogId) {
            try {
                const { error: logError } = await admin
                    .from("notification_logs")
                    .update({
                        status: "failed",
                        error_message: "Email delivery failed unexpectedly.",
                    })
                    .eq("id", pendingLogId);
                if (logError) {
                    diagnostic("error", "failed_status_update_failed", {
                        notificationType: input.notificationType,
                        bookingId: input.bookingId ?? null,
                        code: logError.code,
                    });
                }
            } catch (logError) {
                diagnostic("error", "failed_status_update_threw", {
                    notificationType: input.notificationType,
                    bookingId: input.bookingId ?? null,
                    errorName:
                        logError instanceof Error
                            ? logError.name
                            : "UnknownError",
                });
            }
        }
        diagnostic("error", "unexpected_failure", {
            notificationType: input.notificationType,
            bookingId: input.bookingId ?? null,
            errorName: error instanceof Error ? error.name : "UnknownError",
        });
        return {
            sent: false,
            skipped: false,
            duplicate: false,
            status: "failed",
            message: "Email delivery failed unexpectedly.",
        };
    }
}
