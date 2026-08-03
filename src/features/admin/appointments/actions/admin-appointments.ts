"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/admin/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Enums, Json } from "@/types/supabase";
import { removalOptions, services } from "@/features/bookings/new-booking/config";
import { requiresDesignTier } from "@/features/bookings/new-booking/utils";
import { appointmentStatusTemplate } from "@/features/notifications/email/templates/appointment-status-template";
import { cancellationTemplate } from "@/features/notifications/email/templates/cancellation-template";
import { resolveBookingRecipient } from "@/features/notifications/utils/resolve-booking-recipient";
import { sendTransactionalEmail } from "@/lib/email/brevo";
import { getAppBaseUrl } from "@/lib/email/config";
import {
    calculateAdminDiscountedPricing,
    parseAdminDiscountPercentage,
} from "@/features/admin/appointments/utils/admin-discount";
import { completeBookingWithSettlement } from "@/features/admin/appointments/utils/complete-booking";
import { calculateBookingLedger } from "@/features/bookings/utils/booking-ledger";
import { buildBookingServiceLineItems } from "@/features/bookings/utils/booking-line-items";
import {
    syncBookingRescheduleToGoogleCalendar,
    syncBookingToGoogleCalendar,
} from "@/features/integrations/google-calendar/services/sync";
import { formatStudioAppointmentDateTime } from "@/lib/utils/studio-time";

export type AdminAppointmentEditState = {
    error?: string;
    success?: string;
    messageId?: string;
};

export type AdminBookingWorkflowState = {
    error: string;
    success: string;
    messageId: string;
};

function editState(input: Omit<AdminAppointmentEditState, "messageId">) {
    return {
        ...input,
        messageId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
}

function getString(formData: FormData, key: string) {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

function roundCurrency(value: number) {
    return Math.round(value * 100) / 100;
}

function getNumber(formData: FormData, key: string) {
    const value = getString(formData, key);
    if (!value) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function revalidateAdminBooking(
    bookingId: string,
    bookingReference?: string,
) {
    revalidatePath("/admin");
    revalidatePath("/admin/appointments");
    revalidatePath(`/admin/appointments/${bookingId}`);
    revalidatePath("/booking");
    if (bookingReference) {
        revalidatePath(`/booking/${bookingReference}`);
    }
    revalidatePath("/dashboard");
}

async function getBooking(admin: ReturnType<typeof createAdminClient>, bookingId: string) {
    const { data, error } = await admin
        .from("bookings")
        .select("id, booking_reference, status, slot_id, user_id, deposit_status, deposit_amount, booking_fee_mode, booking_fee_rate, client_display_name, client_email, client_instagram_handle, client_preferred_contact_method, availability_slots:slot_id(starts_at, ends_at), profiles:user_id(display_name, email, instagram_handle, preferred_contact_method)")
        .eq("id", bookingId)
        .maybeSingle()
        .overrideTypes<{
            id: string;
            booking_reference: string;
            status: Enums<"booking_status">;
            slot_id: string | null;
            user_id: string | null;
            client_display_name: string | null;
            client_email: string | null;
            client_instagram_handle: string | null;
            client_preferred_contact_method: string | null;
            deposit_status: Enums<"deposit_status">;
            deposit_amount: number;
            booking_fee_mode: Enums<"fee_mode">;
            booking_fee_rate: number;
            availability_slots: { starts_at: string; ends_at: string | null } | null;
            profiles: {
                display_name: string;
                email: string;
                instagram_handle: string | null;
                preferred_contact_method: string | null;
            } | null;
        } | null>();

    if (error) {
        console.error("[admin:booking-action:get-booking]", error);
        throw new Error("We couldn't load this booking.");
    }

    if (!data) {
        throw new Error("Booking not found.");
    }

    return data;
}

async function emailBookingStatus(booking: Awaited<ReturnType<typeof getBooking>>, status: string, message: string, notificationType: string) {
    const recipient = resolveBookingRecipient(booking);
    const recipientName = recipient.displayName;
    const appointment = booking.availability_slots?.starts_at ? formatStudioAppointmentDateTime(booking.availability_slots.starts_at) : "Not scheduled";
    const siteUrl = getAppBaseUrl();
    const template = appointmentStatusTemplate({ name: recipientName, reference: booking.booking_reference, status, appointment, message, detailsUrl: booking.user_id && siteUrl ? `${siteUrl}/booking/${booking.booking_reference}` : undefined });
    await sendTransactionalEmail({ to: { email: recipient.email, name: recipientName }, ...template, notificationType, bookingId: booking.id, userId: booking.user_id });
}

function workflowState(
    input: Omit<AdminBookingWorkflowState, "messageId">,
): AdminBookingWorkflowState {
    return {
        ...input,
        messageId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
}

async function updateDepositPayment({
    admin,
    bookingId,
    userId,
    adminUserId,
    amount,
    status,
    note,
}: {
    admin: ReturnType<typeof createAdminClient>;
    bookingId: string;
    userId: string | null;
    adminUserId: string;
    amount: number;
    status: "received" | "credited" | "rejected";
    note: string;
}) {
    const { data: payment, error: paymentError } = await admin
        .from("booking_payments")
        .select("id, status")
        .eq("booking_id", bookingId)
        .eq("payment_type", "deposit")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .overrideTypes<{
            id: string;
            status: Enums<"payment_status">;
        } | null>();

    if (paymentError) throw paymentError;

    const paidAt =
        status === "received" || status === "credited"
            ? new Date().toISOString()
            : null;

    if (payment) {
        const { error } = await admin
            .from("booking_payments")
            .update({
                status,
                paid_at: paidAt,
                marked_by: adminUserId,
                notes: note,
            })
            .eq("id", payment.id);
        if (error) throw error;
        return payment.id;
    }

    const { data: inserted, error } = await admin
        .from("booking_payments")
        .insert({
            booking_id: bookingId,
            user_id: userId,
            payment_type: "deposit",
            method: "etransfer",
            amount,
            status,
            paid_at: paidAt,
            marked_by: adminUserId,
            notes: note,
        })
        .select("id")
        .single();

    if (error) throw error;
    return inserted.id;
}

async function updateRejectedSlot(
    admin: ReturnType<typeof createAdminClient>,
    slotId: string | null,
    startsAt: string | null | undefined,
) {
    if (!slotId) return;

    const future = Boolean(startsAt && new Date(startsAt) > new Date());
    const { error } = await admin
        .from("availability_slots")
        .update({
            status: future ? "available" : "cancelled",
            active: true,
        })
        .eq("id", slotId);

    if (error) throw error;
}

export async function processAdminBookingWorkflowAction(
    _previousState: AdminBookingWorkflowState,
    formData: FormData,
): Promise<AdminBookingWorkflowState> {
    const { user } = await requireAdmin();
    const bookingId = getString(formData, "bookingId");
    const decision = getString(formData, "decision");
    const reasonInput = getString(formData, "reason");
    const reason =
        decision === "reject_no_deposit" && !reasonInput
            ? "Deposit not received."
            : reasonInput;

    if (!bookingId) {
        return workflowState({ error: "Booking not found.", success: "" });
    }

    const admin = createAdminClient();

    try {
        const booking = await getBooking(admin, bookingId);
        const requested = booking.status === "requested" || booking.status === "held";
        const started = Boolean(
            booking.availability_slots?.starts_at &&
                new Date(booking.availability_slots.starts_at) <= new Date(),
        );
        const depositAmount = Number(booking.deposit_amount ?? 0);

        if (decision === "confirm_deposit") {
            if (!requested && booking.status !== "confirmed") {
                return workflowState({
                    error: "This booking can no longer be confirmed.",
                    success: "",
                });
            }

            await updateDepositPayment({
                admin,
                bookingId,
                userId: booking.user_id,
                adminUserId: user.id,
                amount: depositAmount,
                status: "received",
                note: "Admin confirmed the booking and received deposit.",
            });

            const { data: updated, error } = await admin
                .from("bookings")
                .update({
                    status: "confirmed",
                    deposit_status: "received",
                })
                .eq("id", bookingId)
                .in("status", ["held", "requested", "confirmed"])
                .select("id")
                .maybeSingle();
            if (error || !updated) {
                throw error ?? new Error("Booking status changed.");
            }

            if (booking.slot_id) {
                const { error: slotError } = await admin
                    .from("availability_slots")
                    .update({ status: "confirmed" })
                    .eq("id", booking.slot_id);
                if (slotError) throw slotError;
            }

            await insertEvent({
                admin,
                bookingId,
                adminUserId: user.id,
                eventType: "admin_booking_confirmed_deposit_received",
                message: "Admin confirmed the booking and marked the deposit as received.",
                metadata: {
                    previousStatus: booking.status,
                    newStatus: "confirmed",
                    previousDepositStatus: booking.deposit_status,
                    newDepositStatus: "received",
                    depositAmount,
                },
            });
            await emailBookingStatus(
                booking,
                "confirmed",
                "The studio confirmed your appointment and received your deposit.",
                "appointment_confirmed",
            );

            await syncBookingToGoogleCalendar(bookingId);
            revalidateAdminBooking(bookingId, booking.booking_reference);
            return workflowState({
                error: "",
                success: started
                    ? "Booking confirmed. It remains in Needs action so it can be completed or marked no-show."
                    : "Booking and deposit confirmed.",
            });
        }

        if (decision === "reject_credit") {
            if (!requested) {
                return workflowState({
                    error: "Only pending booking requests can be rejected.",
                    success: "",
                });
            }
            if (!booking.user_id) {
                return workflowState({
                    error: "Deposit credit requires a client account.",
                    success: "",
                });
            }
            if (depositAmount <= 0) {
                return workflowState({
                    error: "A positive deposit is required before issuing credit.",
                    success: "",
                });
            }
            if (reason.length < 4) {
                return workflowState({
                    error: "Add a short reason for rejecting this booking.",
                    success: "",
                });
            }

            const { data: existingCredit, error: creditCheckError } =
                await admin
                    .from("user_credits")
                    .select("id")
                    .eq("user_id", booking.user_id)
                    .eq("source_booking_id", bookingId)
                    .ilike("reason", "Rejected booking deposit credit%")
                    .limit(1)
                    .maybeSingle();
            if (creditCheckError) throw creditCheckError;
            if (existingCredit) {
                return workflowState({
                    error: "Deposit credit was already issued for this booking.",
                    success: "",
                });
            }

            const { data: credit, error: creditError } = await admin
                .from("user_credits")
                .insert({
                    user_id: booking.user_id,
                    amount: depositAmount,
                    reason: `Rejected booking deposit credit · ${reason}`,
                    source_booking_id: bookingId,
                })
                .select("id")
                .single();
            if (creditError) throw creditError;

            try {
                await updateDepositPayment({
                    admin,
                    bookingId,
                    userId: booking.user_id,
                    adminUserId: user.id,
                    amount: depositAmount,
                    status: "credited",
                    note: `Booking rejected; deposit issued as account credit. ${reason}`,
                });

                const { data: updated, error } = await admin
                    .from("bookings")
                    .update({
                        status: "rejected",
                        deposit_status: "credited",
                        cancelled_at: new Date().toISOString(),
                    })
                    .eq("id", bookingId)
                    .in("status", ["held", "requested"])
                    .select("id")
                    .maybeSingle();
                if (error || !updated) {
                    throw error ?? new Error("Booking status changed.");
                }

                await updateRejectedSlot(
                    admin,
                    booking.slot_id,
                    booking.availability_slots?.starts_at,
                );

                await insertEvent({
                    admin,
                    bookingId,
                    adminUserId: user.id,
                    eventType: "admin_booking_rejected_deposit_credited",
                    message: "Admin rejected the booking and issued the deposit as account credit.",
                    metadata: {
                        previousStatus: booking.status,
                        newStatus: "rejected",
                        previousDepositStatus: booking.deposit_status,
                        newDepositStatus: "credited",
                        creditId: credit.id,
                        amount: depositAmount,
                        reason,
                    },
                });
            } catch (error) {
                await admin.from("user_credits").delete().eq("id", credit.id);
                throw error;
            }

            await emailBookingStatus(
                booking,
                "rejected",
                `The studio could not accept this request. Your ${depositAmount.toFixed(2)} deposit was added to your account as studio credit. Reason: ${reason}`,
                "appointment_rejected_credit_issued",
            );
            await syncBookingToGoogleCalendar(bookingId);
            revalidatePath(`/admin/users/${booking.user_id}`);
            revalidatePath("/credits");
            revalidateAdminBooking(bookingId, booking.booking_reference);
            return workflowState({
                error: "",
                success: "Booking rejected and deposit credit issued.",
            });
        }

        if (decision === "reject_no_deposit") {
            if (!requested) {
                return workflowState({
                    error: "Only pending booking requests can be rejected.",
                    success: "",
                });
            }
            if (reason.length < 4) {
                return workflowState({
                    error: "Add a short reason for rejecting this booking.",
                    success: "",
                });
            }
            if (
                booking.deposit_status === "received" ||
                booking.deposit_status === "credited"
            ) {
                return workflowState({
                    error: "This deposit is already recorded as received. Choose deposit credit instead.",
                    success: "",
                });
            }

            await updateDepositPayment({
                admin,
                bookingId,
                userId: booking.user_id,
                adminUserId: user.id,
                amount: depositAmount,
                status: "rejected",
                note: `Booking rejected; deposit not received. ${reason}`,
            });

            const { data: updated, error } = await admin
                .from("bookings")
                .update({
                    status: "rejected",
                    deposit_status: "rejected",
                    cancelled_at: new Date().toISOString(),
                })
                .eq("id", bookingId)
                .in("status", ["held", "requested"])
                .select("id")
                .maybeSingle();
            if (error || !updated) {
                throw error ?? new Error("Booking status changed.");
            }

            await updateRejectedSlot(
                admin,
                booking.slot_id,
                booking.availability_slots?.starts_at,
            );
            await insertEvent({
                admin,
                bookingId,
                adminUserId: user.id,
                eventType: "admin_booking_rejected_deposit_not_received",
                message: "Admin rejected the booking because the deposit was not received.",
                metadata: {
                    previousStatus: booking.status,
                    newStatus: "rejected",
                    previousDepositStatus: booking.deposit_status,
                    newDepositStatus: "rejected",
                    reason,
                },
            });
            await emailBookingStatus(
                booking,
                "rejected",
                `The studio could not accept this request because the deposit was not received. Reason: ${reason}`,
                "appointment_rejected",
            );

            await syncBookingToGoogleCalendar(bookingId);
            revalidateAdminBooking(bookingId, booking.booking_reference);
            return workflowState({
                error: "",
                success: "Booking rejected and recorded as deposit not received.",
            });
        }

        if (decision === "completed" || decision === "no_show") {
            if (booking.status !== "confirmed" || !started) {
                return workflowState({
                    error: "This appointment cannot be closed before it starts.",
                    success: "",
                });
            }
            if (decision === "no_show" && reason.length < 4) {
                return workflowState({
                    error: "Add a short no-show note.",
                    success: "",
                });
            }

            const settlement =
                decision === "completed"
                    ? await completeBookingWithSettlement({
                          admin,
                          bookingId,
                          userId: booking.user_id,
                          adminUserId: user.id,
                      })
                    : null;
            if (decision === "no_show") {
                const { data: updated, error } = await admin
                    .from("bookings")
                    .update({ status: "no_show" })
                    .eq("id", bookingId)
                    .eq("status", "confirmed")
                    .select("id")
                    .maybeSingle();
                if (error || !updated) {
                    throw error ?? new Error("Booking status changed.");
                }
            }

            await insertEvent({
                admin,
                bookingId,
                adminUserId: user.id,
                eventType: `admin_booking_${decision}`,
                message:
                    decision === "completed"
                        ? "Admin marked appointment completed."
                        : "Admin marked appointment as no-show.",
                metadata: {
                    previousStatus: booking.status,
                    newStatus: decision,
                    note: reason || null,
                    overpaymentCredit:
                        settlement?.overpaymentCredit || null,
                },
            });
            await emailBookingStatus(
                booking,
                decision === "completed" ? "completed" : "marked no-show",
                decision === "completed"
                    ? settlement?.overpaymentCredit
                        ? `Your appointment was completed. An overpayment of $${settlement.overpaymentCredit.toFixed(2)} was returned as studio credit.`
                        : "Your appointment was marked completed."
                    : `The appointment was marked as a no-show. ${reason}`,
                `appointment_${decision}`,
            );

            if (settlement?.overpaymentCredit && booking.user_id) {
                revalidatePath("/credits");
                revalidatePath(`/admin/users/${booking.user_id}`);
            }
            await syncBookingToGoogleCalendar(bookingId);
            revalidateAdminBooking(bookingId, booking.booking_reference);
            return workflowState({
                error: "",
                success:
                    decision === "completed"
                        ? settlement?.overpaymentCredit
                            ? `Appointment completed and $${settlement.overpaymentCredit.toFixed(2)} returned as studio credit.`
                            : "Appointment marked completed."
                        : "Appointment marked no-show.",
            });
        }

        return workflowState({
            error: "Choose a valid booking update.",
            success: "",
        });
    } catch (error) {
        console.error("[admin:booking-workflow]", error);
        return workflowState({
            error: "We couldn't apply that booking update. Refresh and try again.",
            success: "",
        });
    }
}

async function insertEvent({
    admin,
    bookingId,
    adminUserId,
    eventType,
    message,
    metadata = {},
}: {
    admin: ReturnType<typeof createAdminClient>;
    bookingId: string;
    adminUserId: string;
    eventType: string;
    message: string;
    metadata?: Json;
}) {
    const { error } = await admin.from("booking_events").insert({
        booking_id: bookingId,
        actor_type: "admin",
        actor_user_id: adminUserId,
        event_type: eventType,
        message,
        metadata,
    });

    if (error) {
        console.error("[admin:booking-action:event]", error);
        throw new Error("The appointment changed, but its history could not be recorded.");
    }
}

export async function confirmAppointmentAction(
    formData: FormData,
): Promise<void> {
    const { user } = await requireAdmin();
    const bookingId = getString(formData, "bookingId");
    const admin = createAdminClient();

    try {
        const booking = await getBooking(admin, bookingId);

        if (booking.status !== "requested" && booking.status !== "held") {
            return;
        }

        const { error } = await admin
            .from("bookings")
            .update({ status: "confirmed" })
            .eq("id", bookingId);

        if (error) throw error;

        if (booking.slot_id) {
            await admin
                .from("availability_slots")
                .update({ status: "confirmed" })
                .eq("id", booking.slot_id);
        }

        await insertEvent({
            admin,
            bookingId,
            adminUserId: user.id,
            eventType: "admin_booking_confirmed",
            message: "Admin confirmed the appointment.",
            metadata: { previousStatus: booking.status, newStatus: "confirmed" },
        });
        await emailBookingStatus(booking, "confirmed", "The studio confirmed your appointment.", "appointment_confirmed");

        await syncBookingToGoogleCalendar(bookingId);
        revalidateAdminBooking(bookingId, booking.booking_reference);
    } catch (error) {
        console.error("[admin:confirm-appointment]", error);
    }
}

export async function rejectAppointmentAction(
    formData: FormData,
): Promise<void> {
    const { user } = await requireAdmin();
    const bookingId = getString(formData, "bookingId");
    const reason = getString(formData, "reason");
    const admin = createAdminClient();

    if (!reason) return;

    try {
        const booking = await getBooking(admin, bookingId);

        if (booking.status !== "requested" && booking.status !== "held") {
            return;
        }

        const { error } = await admin
            .from("bookings")
            .update({ status: "rejected" })
            .eq("id", bookingId);

        if (error) throw error;

        if (booking.slot_id) {
            await admin
                .from("availability_slots")
                .update({ status: "available" })
                .eq("id", booking.slot_id);
        }

        await insertEvent({
            admin,
            bookingId,
            adminUserId: user.id,
            eventType: "admin_booking_rejected",
            message: "Admin rejected the appointment.",
            metadata: {
                reason,
                previousStatus: booking.status,
                newStatus: "rejected",
            },
        });
        await emailBookingStatus(booking, "rejected", `The studio could not accept this request. Reason: ${reason}`, "appointment_rejected");

        await syncBookingToGoogleCalendar(bookingId);
        revalidateAdminBooking(bookingId, booking.booking_reference);
    } catch (error) {
        console.error("[admin:reject-appointment]", error);
    }
}

export async function markDepositReceivedAction(
    formData: FormData,
): Promise<void> {
    const { user } = await requireAdmin();
    const bookingId = getString(formData, "bookingId");
    const admin = createAdminClient();

    try {
        const booking = await getBooking(admin, bookingId);
        if (
            !["held", "requested", "confirmed", "cancellation_requested"].includes(booking.status) ||
            !["pending", "marked_sent"].includes(booking.deposit_status)
        ) return;
        const now = new Date().toISOString();
        const nextStatus =
            booking.status === "held" || booking.status === "requested"
                ? "confirmed"
                : booking.status;

        const { error: bookingError } = await admin
            .from("bookings")
            .update({
                deposit_status: "received",
                status: nextStatus,
            })
            .eq("id", bookingId);

        if (bookingError) throw bookingError;

        if (nextStatus === "confirmed" && booking.slot_id) {
            const { error: slotError } = await admin
                .from("availability_slots")
                .update({ status: "confirmed" })
                .eq("id", booking.slot_id);
            if (slotError) throw slotError;
        }

        const { error: paymentError } = await admin
            .from("booking_payments")
            .update({
                status: "received",
                paid_at: now,
                marked_by: user.id,
            })
            .eq("booking_id", bookingId)
            .eq("payment_type", "deposit")
            .in("status", ["pending", "marked_sent"]);

        if (paymentError) throw paymentError;

        await insertEvent({
            admin,
            bookingId,
            adminUserId: user.id,
            eventType:
                nextStatus === booking.status
                    ? "admin_deposit_received"
                    : "admin_booking_confirmed_deposit_received",
            message:
                nextStatus === booking.status
                    ? "Admin marked deposit as received."
                    : "Admin confirmed the booking and marked the deposit as received.",
            metadata: {
                previousStatus: booking.status,
                newStatus: nextStatus,
                previousDepositStatus: booking.deposit_status,
                newDepositStatus: "received",
                receivedAt: now,
            },
        });
        await emailBookingStatus(
            booking,
            nextStatus === "confirmed" ? "confirmed" : "deposit received",
            nextStatus === booking.status
                ? "Your deposit was marked as received."
                : "The studio confirmed your appointment and received your deposit.",
            nextStatus === booking.status
                ? "deposit_confirmed"
                : "appointment_confirmed",
        );

        await syncBookingToGoogleCalendar(bookingId);
        revalidateAdminBooking(bookingId, booking.booking_reference);
    } catch (error) {
        console.error("[admin:deposit-received]", error);
    }
}

export async function updateAppointmentStatusAction(
    formData: FormData,
): Promise<void> {
    const { user } = await requireAdmin();
    const bookingId = getString(formData, "bookingId");
    const nextStatus = getString(formData, "status") as Enums<"booking_status">;
    const note = getString(formData, "note");
    const admin = createAdminClient();

    if (!["completed", "no_show"].includes(nextStatus)) {
        return;
    }

    try {
        const booking = await getBooking(admin, bookingId);
        if (booking.status !== "confirmed") return;
        if (
            booking.availability_slots?.starts_at &&
            new Date(booking.availability_slots.starts_at) > new Date()
        ) return;
        if (nextStatus === "no_show" && !note) return;
        const settlement =
            nextStatus === "completed"
                ? await completeBookingWithSettlement({
                      admin,
                      bookingId,
                      userId: booking.user_id,
                      adminUserId: user.id,
                  })
                : null;
        if (nextStatus === "no_show") {
            const { error } = await admin
                .from("bookings")
                .update({ status: nextStatus })
                .eq("id", bookingId)
                .eq("status", "confirmed");
            if (error) throw error;
        }

        await insertEvent({
            admin,
            bookingId,
            adminUserId: user.id,
            eventType: `admin_booking_${nextStatus}`,
            message:
                nextStatus === "completed"
                    ? "Admin marked appointment completed."
                    : "Admin marked appointment as no-show.",
            metadata: {
                previousStatus: booking.status,
                newStatus: nextStatus,
                note: note || null,
                overpaymentCredit: settlement?.overpaymentCredit || null,
            },
        });
        await emailBookingStatus(
            booking,
            nextStatus === "no_show" ? "marked no-show" : "completed",
            nextStatus === "no_show"
                ? `The appointment was marked as a no-show. ${note}`
                : settlement?.overpaymentCredit
                  ? `Your appointment was completed. An overpayment of $${settlement.overpaymentCredit.toFixed(2)} was returned as studio credit.`
                  : "Your appointment was marked completed.",
            `appointment_${nextStatus}`,
        );

        if (settlement?.overpaymentCredit && booking.user_id) {
            revalidatePath("/credits");
            revalidatePath(`/admin/users/${booking.user_id}`);
        }
        await syncBookingToGoogleCalendar(bookingId);
        revalidateAdminBooking(bookingId, booking.booking_reference);
    } catch (error) {
        console.error("[admin:update-status]", error);
    }
}

export type AdminCancellationReviewState = {
    error: string;
    success: string;
    messageId: string;
};

function cancellationReviewState(
    input: Omit<AdminCancellationReviewState, "messageId">,
): AdminCancellationReviewState {
    return {
        ...input,
        messageId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
}

export async function reviewCancellationAction(
    _previousState: AdminCancellationReviewState,
    formData: FormData,
): Promise<AdminCancellationReviewState> {
    void _previousState;
    const { user } = await requireAdmin();
    const bookingId = getString(formData, "bookingId");
    const requestId = getString(formData, "requestId");
    const decision = getString(formData, "decision");
    const reason = getString(formData, "reason");
    const admin = createAdminClient();

    if (!requestId || decision !== "rejected") {
        return cancellationReviewState({
            error: "This cancellation request could not be reviewed.",
            success: "",
        });
    }

    try {
        const booking = await getBooking(admin, bookingId);
        if (booking.status !== "cancellation_requested") {
            return cancellationReviewState({
                error: "This cancellation request is no longer pending.",
                success: "",
            });
        }
        const status = decision as "approved" | "rejected";
        if (status === "rejected" && !reason) {
            return cancellationReviewState({
                error: "Add a reason for declining the cancellation request.",
                success: "",
            });
        }
        const now = new Date().toISOString();

        const { data, error } = await admin
            .from("cancellation_requests")
            .update({
                status,
                reviewed_at: now,
                reviewed_by: user.id,
                admin_reason: reason || null,
                admin_decision: status,
            })
            .eq("id", requestId)
            .eq("booking_id", bookingId)
            .eq("status", "pending")
            .select("id")
            .maybeSingle();

        if (error || !data) throw error ?? new Error("Cancellation request is no longer pending.");

        if (status === "approved") {
            await admin
                .from("bookings")
                .update({ status: "cancelled", cancelled_at: now })
                .eq("id", bookingId);

            if (
                booking.slot_id &&
                booking.availability_slots?.starts_at &&
                new Date(booking.availability_slots.starts_at) > new Date()
            ) {
                await admin
                    .from("availability_slots")
                    .update({ status: "available", active: true })
                    .eq("id", booking.slot_id);
            }
        } else {
            await admin
                .from("bookings")
                .update({ status: "confirmed" })
                .eq("id", bookingId)
                .eq("status", "cancellation_requested");

            if (booking.slot_id) {
                await admin
                    .from("availability_slots")
                    .update({ status: "confirmed" })
                    .eq("id", booking.slot_id);
            }
        }

        await insertEvent({
            admin,
            bookingId,
            adminUserId: user.id,
            eventType: `admin_cancellation_${status}`,
            message: `Admin ${status} the cancellation request.`,
            metadata: {
                reason: reason || null,
                requestId,
                previousStatus: booking.status,
                newStatus: status === "approved" ? "cancelled" : "confirmed",
            },
        });
        const recipient = resolveBookingRecipient(booking);
        const recipientName = recipient.displayName;
        const appointment = booking.availability_slots?.starts_at ? formatStudioAppointmentDateTime(booking.availability_slots.starts_at) : "Not scheduled";
        const siteUrl = getAppBaseUrl();
        const template = cancellationTemplate({ name: recipientName, reference: booking.booking_reference, heading: status === "approved" ? "Cancellation approved" : "Cancellation request declined", appointment, reason: reason || "No additional note", outcome: status === "approved" ? "Appointment cancelled" : "Appointment remains confirmed", message: status === "approved" ? "The studio approved your cancellation request." : "The studio reviewed your request and your appointment remains confirmed.", detailsUrl: booking.user_id && siteUrl ? `${siteUrl}/booking/${booking.booking_reference}` : undefined });
        await sendTransactionalEmail({ to: { email: recipient.email, name: recipientName }, ...template, notificationType: `cancellation_${status}`, bookingId, userId: booking.user_id });

        await syncBookingToGoogleCalendar(bookingId);
        revalidateAdminBooking(bookingId, booking.booking_reference);
        return cancellationReviewState({
            error: "",
            success: "Cancellation request declined. The appointment remains confirmed.",
        });
    } catch (error) {
        console.error("[admin:review-cancellation]", error);
        return cancellationReviewState({
            error: "We couldn't decline this cancellation request. Refresh and try again.",
            success: "",
        });
    }
}

export async function markInspoReviewedAction(
    formData: FormData,
): Promise<void> {
    const { user } = await requireAdmin();
    const bookingId = getString(formData, "bookingId");
    const promptId = getString(formData, "promptId");
    const admin = createAdminClient();

    if (!promptId) return;

    try {
        const { data, error } = await admin
            .from("booking_inspo_prompts")
            .update({
                status: "reviewed",
                reviewed_at: new Date().toISOString(),
                reviewed_by: user.id,
            })
            .eq("id", promptId)
            .eq("booking_id", bookingId)
            .eq("status", "sent")
            .select("id")
            .maybeSingle();

        if (error || !data) throw error ?? new Error("Design inspo is not ready for review.");

        await insertEvent({
            admin,
            bookingId,
            adminUserId: user.id,
            eventType: "admin_design_inspo_reviewed",
            message: "Admin marked design inspo reviewed.",
            metadata: {
                promptId,
                previousStatus: "sent",
                newStatus: "reviewed",
            },
        });

        revalidateAdminBooking(bookingId);
    } catch (error) {
        console.error("[admin:inspo-reviewed]", error);
    }
}

export async function updateAppointmentSlotAction(formData: FormData): Promise<void> {
    const { user } = await requireAdmin();
    const bookingId = getString(formData, "bookingId");
    const newSlotId = getString(formData, "slotId");
    const requestEventId = getString(formData, "requestEventId");
    if (!bookingId || !newSlotId) throw new Error("Choose a new appointment time.");

    const admin = createAdminClient();
    const booking = await getBooking(admin, bookingId);
    let requestMetadata: Record<string, Json | undefined> | null = null;

    if (requestEventId) {
        const { data: request, error: requestError } = await admin
            .from("booking_events")
            .select("id, metadata")
            .eq("id", requestEventId)
            .eq("booking_id", bookingId)
            .eq("event_type", "date_change_requested")
            .maybeSingle();
        if (requestError || !request) throw new Error("This date change request is no longer available.");
        const metadata = request.metadata;
        if (!metadata || typeof metadata !== "object" || Array.isArray(metadata) || metadata.requestedSlotId !== newSlotId) {
            throw new Error("The requested appointment time does not match this request.");
        }
        requestMetadata = metadata;
        const { data: resolution, error: resolutionError } = await admin
            .from("booking_events")
            .select("id")
            .eq("booking_id", bookingId)
            .in("event_type", ["date_change_request_approved", "date_change_request_declined"])
            .contains("metadata", { requestEventId })
            .limit(1)
            .maybeSingle();
        if (resolutionError) throw new Error("We couldn't safely verify this request. Please try again.");
        if (resolution) throw new Error("This date change request was already reviewed.");
    }

    if (booking.slot_id === newSlotId) {
        if (!requestEventId || !requestMetadata) return;

        const { data: currentSlot, error: currentSlotError } = await admin
            .from("availability_slots")
            .select("id, starts_at, ends_at")
            .eq("id", newSlotId)
            .maybeSingle()
            .overrideTypes<{ id: string; starts_at: string; ends_at: string | null } | null>();
        if (currentSlotError || !currentSlot) {
            throw new Error("The appointment is already on the requested time, but its slot could not be verified.");
        }

        await insertEvent({
            admin,
            bookingId,
            adminUserId: user.id,
            eventType: "date_change_request_approved",
            message: "Admin approved the client's date/time change request after the appointment had already been moved manually.",
            metadata: {
                requestEventId,
                previousSlotId:
                    typeof requestMetadata.currentSlotId === "string"
                        ? requestMetadata.currentSlotId
                        : null,
                previousStartsAt:
                    typeof requestMetadata.currentStartsAt === "string"
                        ? requestMetadata.currentStartsAt
                        : null,
                previousEndsAt:
                    typeof requestMetadata.currentEndsAt === "string"
                        ? requestMetadata.currentEndsAt
                        : null,
                newSlotId,
                startsAt: currentSlot.starts_at,
                endsAt: currentSlot.ends_at,
                alreadyMovedManually: true,
            },
        });
        await emailApprovedDateChange({
            booking,
            startsAt: currentSlot.starts_at,
            requestEventId,
        });
        revalidateAdminBooking(bookingId, booking.booking_reference);
        return;
    }

    const { data: slot, error: slotError } = await admin.from("availability_slots").select("id, starts_at, ends_at, status").eq("id", newSlotId).eq("active", true).eq("status", "available").gte("starts_at", new Date().toISOString()).maybeSingle().overrideTypes<{ id: string; starts_at: string; ends_at: string; status: Enums<"slot_status"> } | null>();
    if (slotError || !slot) throw new Error("That appointment time is no longer available.");

    const reservedStatus: Enums<"slot_status"> = booking.status === "confirmed" ? "confirmed" : "held";
    const { data: reserved, error: reserveError } = await admin.from("availability_slots").update({ status: reservedStatus }).eq("id", newSlotId).eq("status", "available").select("id").maybeSingle();
    if (reserveError || !reserved) throw new Error("That appointment time was just taken.");

    const { error: bookingError } = await admin.from("bookings").update({ slot_id: newSlotId }).eq("id", bookingId);
    if (bookingError) {
        await admin.from("availability_slots").update({ status: "available" }).eq("id", newSlotId);
        throw bookingError;
    }
    if (booking.slot_id) await admin.from("availability_slots").update({ status: "available" }).eq("id", booking.slot_id);

    await insertEvent({ admin, bookingId, adminUserId: user.id, eventType: requestEventId ? "date_change_request_approved" : "admin_appointment_rescheduled", message: requestEventId ? "Admin approved the client's date/time change request." : "Admin changed the appointment time.", metadata: { requestEventId: requestEventId || null, previousSlotId: booking.slot_id, previousStartsAt: booking.availability_slots?.starts_at ?? null, previousEndsAt: booking.availability_slots?.ends_at ?? null, newSlotId, startsAt: slot.starts_at, endsAt: slot.ends_at } });
    await syncBookingRescheduleToGoogleCalendar({
        bookingId,
        previousSlotId: booking.slot_id,
        newSlotId,
    });
    if (requestEventId) await emailApprovedDateChange({ booking, startsAt: slot.starts_at, requestEventId });
    revalidateAdminBooking(bookingId);
}

async function emailApprovedDateChange({
    booking,
    startsAt,
    requestEventId,
}: {
    booking: Awaited<ReturnType<typeof getBooking>>;
    startsAt: string;
    requestEventId: string;
}) {
    const recipient = resolveBookingRecipient(booking);
    const appointment = formatStudioAppointmentDateTime(startsAt);
    const siteUrl = getAppBaseUrl();
    const template = appointmentStatusTemplate({
        name: recipient.displayName,
        reference: booking.booking_reference,
        status: "date change approved",
        appointment,
        message: `Your date change was approved. Your appointment is now scheduled for ${appointment}.`,
        detailsUrl: booking.user_id && siteUrl ? `${siteUrl}/booking/${booking.booking_reference}` : undefined,
    });
    await sendTransactionalEmail({
        to: { email: recipient.email, name: recipient.displayName },
        ...template,
        notificationType: "date_change_request_approved",
        deduplicationKey: `${booking.id}:date_change_request_approved:${requestEventId}`,
        bookingId: booking.id,
        userId: booking.user_id,
    });
}

export async function declineDateChangeRequestAction(formData: FormData): Promise<void> {
    const { user } = await requireAdmin();
    const bookingId = getString(formData, "bookingId");
    const requestEventId = getString(formData, "requestEventId");
    const reason = getString(formData, "reason");
    if (!bookingId || !requestEventId) throw new Error("Date change request not found.");

    const admin = createAdminClient();
    const booking = await getBooking(admin, bookingId);
    const { data: request, error } = await admin
        .from("booking_events")
        .select("id, metadata")
        .eq("id", requestEventId)
        .eq("booking_id", bookingId)
        .eq("event_type", "date_change_requested")
        .maybeSingle();
    if (error || !request) throw new Error("This date change request is no longer available.");

    const { data: resolution, error: resolutionError } = await admin
        .from("booking_events")
        .select("id")
        .eq("booking_id", bookingId)
        .in("event_type", ["date_change_request_approved", "date_change_request_declined"])
        .contains("metadata", { requestEventId })
        .limit(1)
        .maybeSingle();
    if (resolutionError) throw new Error("We couldn't safely verify this request. Please try again.");
    if (resolution) return;

    await insertEvent({
        admin,
        bookingId,
        adminUserId: user.id,
        eventType: "date_change_request_declined",
        message: reason
            ? `Admin declined the date/time change request: ${reason}`
            : "Admin declined the date/time change request.",
        metadata: {
            requestEventId,
            reason: reason || null,
            previousSlotId: booking.slot_id,
            previousStartsAt: booking.availability_slots?.starts_at ?? null,
            previousEndsAt: booking.availability_slots?.ends_at ?? null,
        },
    });

    const recipient = resolveBookingRecipient(booking);
    const appointment = booking.availability_slots?.starts_at
        ? formatStudioAppointmentDateTime(booking.availability_slots.starts_at)
        : "Not scheduled";
    const siteUrl = getAppBaseUrl();
    const template = appointmentStatusTemplate({
        name: recipient.displayName,
        reference: booking.booking_reference,
        status: "date change declined",
        appointment,
        message: "The studio couldn't approve the requested date change. Your current appointment remains unchanged.",
        extraDetails: reason ? [["Reason", reason]] : [],
        detailsUrl: booking.user_id && siteUrl ? `${siteUrl}/booking/${booking.booking_reference}` : undefined,
    });
    await sendTransactionalEmail({
        to: { email: recipient.email, name: recipient.displayName },
        ...template,
        notificationType: "date_change_request_declined",
        deduplicationKey: `${bookingId}:date_change_request_declined:${requestEventId}`,
        bookingId,
        userId: booking.user_id,
    });
    revalidateAdminBooking(bookingId, booking.booking_reference);
}

export async function reviewDateChangeRequestAction(
    _previousState: AdminAppointmentEditState,
    formData: FormData,
): Promise<AdminAppointmentEditState> {
    const decision = getString(formData, "decision");

    try {
        if (decision === "approve") {
            await updateAppointmentSlotAction(formData);
            return editState({
                success: "Date change approved. The appointment and calendar were updated.",
            });
        }

        if (decision === "decline") {
            await declineDateChangeRequestAction(formData);
            return editState({
                success: "Date change declined. The original appointment was kept.",
            });
        }

        return editState({ error: "Choose whether to approve or decline this request." });
    } catch (error) {
        console.error("[admin:date-change-review]", error);
        return editState({
            error:
                error instanceof Error
                    ? error.message
                    : "We couldn't review this date change request. Please try again.",
        });
    }
}

export async function updateAppointmentServicesAction(
    _previousState: AdminAppointmentEditState,
    formData: FormData,
): Promise<AdminAppointmentEditState> {
    const { user } = await requireAdmin();
    const bookingId = getString(formData, "bookingId");
    const serviceId = getString(formData, "serviceId");
    const optionId = getString(formData, "serviceOptionId");
    const removalId = getString(formData, "removalId");
    const designTierId = getString(formData, "designTierId");
    if (!bookingId) return editState({ error: "Booking not found." });

    const admin = createAdminClient();

    try {
        await getBooking(admin, bookingId);

        const removal = removalOptions.find((option) => option.id === removalId);
        const service = services.find((item) => item.id === serviceId);
        const serviceOption = service?.options.find((option) => option.id === optionId);
        if (!removal || (removal.id !== "removal_only" && (!service || !serviceOption))) return editState({ error: "Choose valid appointment services." });
        if (
            removal.id !== "removal_only" &&
            requiresDesignTier(service) &&
            !designTierId
        ) {
            return editState({ error: "Choose a design tier." });
        }

        let designTier: { id: string; name: string; description: string | null; price: number } | null = null;
        if (
            designTierId &&
            removal.id !== "removal_only" &&
            requiresDesignTier(service)
        ) {
            const result = await admin.from("design_tiers").select("id, name, description, price").eq("id", designTierId).eq("active", true).maybeSingle().overrideTypes<typeof designTier>();
            if (result.error || !result.data) return editState({ error: "Choose a valid design tier." });
            designTier = { ...result.data, price: Number(result.data.price) };
        }

        const nextItemDrafts = buildBookingServiceLineItems({
            selections: {
                slotId: null,
                removalId: removal.id,
                serviceId:
                    removal.id === "removal_only" ? null : service?.id ?? null,
                serviceOptionGroupId:
                    serviceOption && "groupId" in serviceOption
                        ? serviceOption.groupId ?? null
                        : null,
                serviceOptionId:
                    removal.id === "removal_only"
                        ? null
                        : serviceOption?.id ?? null,
                designTierId:
                    removal.id === "removal_only" ? null : designTier?.id ?? null,
            },
            designTier,
        });
        if (!nextItemDrafts || nextItemDrafts.length === 0) {
            return editState({ error: "Choose valid appointment services." });
        }
        const nextItems = nextItemDrafts.map((item) => ({
            ...item,
            booking_id: bookingId,
            added_by: user.id,
        }));

        const now = new Date().toISOString();
        const editableTypes: Enums<"booking_line_item_type">[] = ["service", "design_tier", "removal"];
        const { data: activeItems, error: oldError } = await admin
            .from("booking_line_items")
            .select("id, label_snapshot, description_snapshot, item_type, unit_price, line_total")
            .eq("booking_id", bookingId)
            .eq("active", true)
            .is("removed_at", null)
            .overrideTypes<Array<{
                id: string;
                label_snapshot: string;
                description_snapshot: string | null;
                item_type: Enums<"booking_line_item_type">;
                unit_price: number;
                line_total: number | null;
            }>>();
        if (oldError) throw oldError;
        const oldItems = (activeItems ?? []).filter((item) =>
            editableTypes.includes(item.item_type),
        );
        const activeDiscount =
            (activeItems ?? []).find(
                (item) => item.item_type === "discount",
            ) ?? null;
        const oldIds = (oldItems ?? []).map((item) => item.id);
        const previousEligibleSubtotal = roundCurrency(
            (activeItems ?? [])
                .filter((item) => item.item_type !== "discount")
                .reduce(
                    (sum, item) =>
                        sum + Number(item.line_total ?? item.unit_price),
                    0,
                ),
        );
        const preservedSubtotal = roundCurrency(
            (activeItems ?? [])
                .filter(
                    (item) =>
                        item.item_type !== "discount" &&
                        !editableTypes.includes(item.item_type),
                )
                .reduce(
                    (sum, item) =>
                        sum + Number(item.line_total ?? item.unit_price),
                    0,
                ),
        );
        const activeDiscountPercentage = activeDiscount
            ? parseAdminDiscountPercentage({
                  label: activeDiscount.label_snapshot,
                  fallbackAmount: Math.abs(
                      Number(
                          activeDiscount.line_total ??
                              activeDiscount.unit_price ??
                              0,
                      ),
                  ),
                  subtotal: previousEligibleSubtotal,
              })
            : null;
        if (oldIds.length) {
            const { error } = await admin.from("booking_line_items").update({ active: false, removed_at: now, removed_by: user.id }).in("id", oldIds);
            if (error) throw error;
        }
        const { error: insertError } = await admin.from("booking_line_items").insert(nextItems);
        if (insertError) {
            if (oldIds.length) await admin.from("booking_line_items").update({ active: true, removed_at: null, removed_by: null }).in("id", oldIds);
            throw insertError;
        }

        if (activeDiscount && activeDiscountPercentage !== null) {
            const newEligibleSubtotal = roundCurrency(
                preservedSubtotal +
                    nextItems.reduce(
                        (sum, item) =>
                            sum + item.unit_price * item.quantity,
                        0,
                    ),
            );
            const nextDiscountAmount = Math.min(
                newEligibleSubtotal,
                roundCurrency(
                    (newEligibleSubtotal * activeDiscountPercentage) / 100,
                ),
            );
            const previousDiscountAmount = Math.abs(Number(activeDiscount.line_total ?? activeDiscount.unit_price ?? 0));
            const label = `Admin discount (${activeDiscountPercentage}%)`;
            const { error: discountUpdateError } = await admin
                .from("booking_line_items")
                .update({
                    label_snapshot: label,
                    quantity: 1,
                    unit_price: -nextDiscountAmount,
                })
                .eq("id", activeDiscount.id)
                .eq("booking_id", bookingId)
                .eq("item_type", "discount")
                .eq("active", true);

            if (discountUpdateError) throw discountUpdateError;

            if (previousDiscountAmount !== nextDiscountAmount) {
                await insertEvent({
                    admin,
                    bookingId,
                    adminUserId: user.id,
                    eventType: "admin_discount_updated",
                    message: `Admin discount recalculated to ${activeDiscountPercentage}% after service changes.`,
                    metadata: {
                        discountLineItemId: activeDiscount.id,
                        percentage: activeDiscountPercentage,
                        previousAmount: previousDiscountAmount,
                        amount: nextDiscountAmount,
                        reason: "service_pricing_changed",
                    },
                });
            }
        }

        await insertEvent({
            admin,
            bookingId,
            adminUserId: user.id,
            eventType: "admin_services_updated",
            message: "Admin updated appointment services and pricing.",
            metadata: {
                previousItems: (oldItems ?? []).map((item) => ({ id: item.id, type: item.item_type, label: item.label_snapshot, total: Number(item.line_total ?? 0) })),
                newItems: nextItems.map((item) => ({ type: item.item_type, label: item.label_snapshot, total: item.unit_price * item.quantity })),
                previousSubtotal: (oldItems ?? []).reduce((sum, item) => sum + Number(item.line_total ?? 0), 0),
                newSubtotal: nextItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),
            },
        });
        await syncBookingToGoogleCalendar(bookingId);
        revalidateAdminBooking(bookingId);
        return editState({ success: "Service changes saved." });
    } catch (error) {
        console.error("[admin:update-services]", error);
        return editState({ error: "We couldn't save those service changes. Please review the selections and try again." });
    }
}

export async function updateAppointmentDiscountAction(
    _previousState: AdminAppointmentEditState,
    formData: FormData,
): Promise<AdminAppointmentEditState> {
    const { user } = await requireAdmin();
    const bookingId = getString(formData, "bookingId");
    const percentage = getNumber(formData, "discountPercentage");
    const note = getString(formData, "discountNote");

    if (!bookingId) return editState({ error: "Booking not found." });
    if (percentage === null || percentage < 0 || percentage > 100) {
        return editState({ error: "Enter a discount percentage from 0 to 100." });
    }

    const admin = createAdminClient();

    try {
        const booking = await getBooking(admin, bookingId);
        if (["completed", "no_show", "cancelled", "rejected", "expired"].includes(booking.status)) {
            return editState({ error: "This appointment is closed. Use the correction flow for pricing changes." });
        }

        const { data: lineItems, error: lineItemsError } = await admin
            .from("booking_line_items")
            .select("id, item_type, label_snapshot, description_snapshot, quantity, unit_price, line_total")
            .eq("booking_id", bookingId)
            .eq("active", true)
            .is("removed_at", null)
            .overrideTypes<
                Array<{
                    id: string;
                    item_type: Enums<"booking_line_item_type">;
                    label_snapshot: string;
                    description_snapshot: string | null;
                    quantity: number;
                    unit_price: number;
                    line_total: number | null;
                }>
            >();

        if (lineItemsError) throw lineItemsError;

        const activeItems = lineItems ?? [];
        const existingDiscount = activeItems.find((item) => item.item_type === "discount") ?? null;
        const eligibleSubtotal = roundCurrency(
            activeItems
                .filter((item) => item.item_type !== "discount")
                .reduce((sum, item) => sum + Number(item.line_total ?? Number(item.unit_price ?? 0) * Number(item.quantity ?? 1)), 0),
        );
        const normalizedPercentage = roundCurrency(percentage);
        const discountAmount = Math.min(eligibleSubtotal, roundCurrency((eligibleSubtotal * normalizedPercentage) / 100));
        const now = new Date().toISOString();

        const { data: payments, error: paymentsError } = await admin
            .from("booking_payments")
            .select("payment_type, status, amount")
            .eq("booking_id", bookingId);

        if (paymentsError) throw paymentsError;

        const appliedPayments = calculateBookingLedger({
            appointmentTotal: 0,
            payments: (payments ?? []).map((payment) => ({
                type: payment.payment_type,
                status: payment.status,
                amount: Number(payment.amount),
            })),
        }).totalApplied;
        const proposedPricing = calculateAdminDiscountedPricing({
            subtotal: eligibleSubtotal,
            discountPercentage: normalizedPercentage,
            bookingFeeMode: booking.booking_fee_mode,
            bookingFeeRate: Number(booking.booking_fee_rate),
            amountPaid: appliedPayments,
        });

        if (normalizedPercentage > 0 && eligibleSubtotal <= 0) {
            return editState({ error: "Add services before applying a discount." });
        }
        if (
            normalizedPercentage > 0 &&
            proposedPricing.total < appliedPayments
        ) {
            return editState({
                error: "This discount would make the appointment total lower than payments already applied. Reduce the discount or leave the fully paid booking unchanged.",
            });
        }

        if (normalizedPercentage === 0) {
            if (!existingDiscount) {
                return editState({ success: "No discount is applied." });
            }

            const { error } = await admin
                .from("booking_line_items")
                .update({ active: false, removed_at: now, removed_by: user.id })
                .eq("id", existingDiscount.id)
                .eq("booking_id", bookingId)
                .eq("item_type", "discount");

            if (error) throw error;

            await insertEvent({
                admin,
                bookingId,
                adminUserId: user.id,
                eventType: "admin_discount_removed",
                message: "Admin removed an appointment discount.",
                metadata: {
                    discountLineItemId: existingDiscount.id,
                    previousLabel: existingDiscount.label_snapshot,
                    previousAmount: Math.abs(Number(existingDiscount.line_total ?? existingDiscount.unit_price ?? 0)),
                    note: note || null,
                },
            });

            revalidateAdminBooking(bookingId, booking.booking_reference);
            return editState({ success: "Discount removed." });
        }

        const label = `Admin discount (${normalizedPercentage}%)`;
        const discountPayload: Database["public"]["Tables"]["booking_line_items"]["Update"] = {
            label_snapshot: label,
            description_snapshot: note || null,
            quantity: 1,
            unit_price: -discountAmount,
        };

        if (existingDiscount) {
            const { error } = await admin
                .from("booking_line_items")
                .update(discountPayload)
                .eq("id", existingDiscount.id)
                .eq("booking_id", bookingId)
                .eq("item_type", "discount")
                .eq("active", true);

            if (error) throw error;

            await insertEvent({
                admin,
                bookingId,
                adminUserId: user.id,
                eventType: "admin_discount_updated",
                message: `Admin updated an appointment discount to ${normalizedPercentage}%.`,
                metadata: {
                    discountLineItemId: existingDiscount.id,
                    percentage: normalizedPercentage,
                    amount: discountAmount,
                    previousLabel: existingDiscount.label_snapshot,
                    previousAmount: Math.abs(Number(existingDiscount.line_total ?? existingDiscount.unit_price ?? 0)),
                    note: note || null,
                },
            });

            revalidateAdminBooking(bookingId, booking.booking_reference);
            return editState({ success: "Discount updated." });
        }

        const insertPayload: Database["public"]["Tables"]["booking_line_items"]["Insert"] = {
            booking_id: bookingId,
            item_type: "discount",
            label_snapshot: label,
            description_snapshot: note || null,
            quantity: 1,
            unit_price: -discountAmount,
            active: true,
            added_by: user.id,
        };
        const { data: insertedDiscount, error: insertError } = await admin
            .from("booking_line_items")
            .insert(insertPayload)
            .select("id")
            .single();

        if (insertError) throw insertError;

        await insertEvent({
            admin,
            bookingId,
            adminUserId: user.id,
            eventType: "admin_discount_added",
            message: `Admin added a ${normalizedPercentage}% appointment discount.`,
            metadata: {
                discountLineItemId: insertedDiscount.id,
                percentage: normalizedPercentage,
                amount: discountAmount,
                note: note || null,
            },
        });

        revalidateAdminBooking(bookingId, booking.booking_reference);
        return editState({ success: "Discount saved." });
    } catch (error) {
        console.error("[admin:update-discount]", error);
        return editState({ error: "We couldn't save that discount. Please review it and try again." });
    }
}
