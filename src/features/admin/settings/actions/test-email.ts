"use server";

import { requireAdmin } from "@/features/admin/auth/require-admin";
import { appointmentStatusTemplate } from "@/features/notifications/email/templates/appointment-status-template";
import { resolveBookingRecipient } from "@/features/notifications/utils/resolve-booking-recipient";
import { sendTransactionalEmail } from "@/lib/email/brevo";
import { getEmailConfig } from "@/lib/email/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatStudioAppointmentDateTime } from "@/lib/utils/studio-time";

export type TestEmailState = {
    error: string;
    success: string;
    messageId: string;
};

function result(
    input: Omit<TestEmailState, "messageId">,
): TestEmailState {
    return {
        ...input,
        messageId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
}

export async function sendTestEmailAction(
    _previous: TestEmailState,
): Promise<TestEmailState> {
    void _previous;
    const { user } = await requireAdmin();
    const config = getEmailConfig();

    if (!config.apiKey || !config.senderEmail) {
        return result({
            error: "Brevo is not fully configured in this environment. Check the server logs and environment variables.",
            success: "",
        });
    }

    const admin = createAdminClient();
    const { data: profile, error } = await admin
        .from("profiles")
        .select(
            "display_name, email, instagram_handle, preferred_contact_method",
        )
        .eq("id", user.id)
        .maybeSingle()
        .overrideTypes<{
            display_name: string | null;
            email: string | null;
            instagram_handle: string | null;
            preferred_contact_method: string | null;
        } | null>();

    if (error) {
        console.error(
            JSON.stringify({
                scope: "email:test",
                event: "admin_recipient_lookup_failed",
                userId: user.id,
                code: error.code,
            }),
        );
        return result({
            error: "The admin test recipient could not be resolved.",
            success: "",
        });
    }

    const recipient = resolveBookingRecipient({ profiles: profile });
    const diagnosticTime = formatStudioAppointmentDateTime(new Date());
    const template = appointmentStatusTemplate({
        name: recipient.displayName,
        reference: "EMAIL-TEST",
        status: "email test",
        appointment: diagnosticTime,
        message:
            "Brevo configuration, sender authorization, recipient resolution, and Toronto timezone formatting are working.",
    });
    const delivery = await sendTransactionalEmail({
        to: {
            email: recipient.email,
            name: recipient.displayName,
        },
        ...template,
        notificationType: "admin_email_configuration_test",
        deduplicationKey: `admin_email_configuration_test:${user.id}:${Date.now()}`,
        userId: user.id,
    });

    if (delivery.sent) {
        return result({
            error: "",
            success:
                "Test email accepted by Brevo. Check your admin profile inbox and the notification log.",
        });
    }

    return result({
        error:
            delivery.status === "skipped"
                ? "Your admin profile has no email recipient. The skipped attempt was logged."
                : `${delivery.message} The failed attempt was logged without exposing provider secrets.`,
        success: "",
    });
}
