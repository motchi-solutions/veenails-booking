"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/admin/auth/require-admin";
import { cancellationTemplate } from "@/features/notifications/email/templates/cancellation-template";
import { resolveBookingRecipient } from "@/features/notifications/utils/resolve-booking-recipient";
import { sendTransactionalEmail } from "@/lib/email/brevo";
import { getAppBaseUrl } from "@/lib/email/config";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Enums } from "@/types/supabase";
import { syncBookingToGoogleCalendar } from "@/features/integrations/google-calendar/services/sync";
import { formatStudioAppointmentDateTime } from "@/lib/utils/studio-time";

export type AdminCancellationState = { error: string; success: string; messageId: string };
type Outcome = "credit" | "no_refund";

function result(input: Omit<AdminCancellationState, "messageId">): AdminCancellationState {
    return { ...input, messageId: `${Date.now()}-${Math.random().toString(36).slice(2)}` };
}

function value(formData: FormData, key: string) {
    const input = formData.get(key);
    return typeof input === "string" ? input.trim() : "";
}

export async function cancelAppointmentWithOutcomeAction(
    _previous: AdminCancellationState,
    formData: FormData,
): Promise<AdminCancellationState> {
    const { user } = await requireAdmin();
    const bookingId = value(formData, "bookingId");
    const requestId = value(formData, "requestId");
    const reason = value(formData, "reason");
    const internalNote = value(formData, "internalNote");
    const requestedOutcome = value(formData, "outcome") as Outcome;

    if (!bookingId || reason.length < 4) return result({ error: "Add a cancellation reason.", success: "" });
    if (!(["credit", "no_refund"] as const).includes(requestedOutcome)) return result({ error: "Choose what should happen to the deposit.", success: "" });

    const admin = createAdminClient();
    const { data: booking, error: bookingError } = await admin
        .from("bookings")
        .select("id, booking_reference, user_id, status, deposit_status, deposit_amount, slot_id, client_display_name, client_email, client_instagram_handle, client_preferred_contact_method, profiles:user_id(display_name, email, instagram_handle, preferred_contact_method), availability_slots:slot_id(starts_at, ends_at)")
        .eq("id", bookingId)
        .maybeSingle()
        .overrideTypes<{
            id: string; booking_reference: string; user_id: string | null; status: Enums<"booking_status">; deposit_status: Enums<"deposit_status">; deposit_amount: number; slot_id: string | null; client_display_name: string | null; client_email: string | null; client_instagram_handle: string | null; client_preferred_contact_method: string | null;
            profiles: { display_name: string; email: string; instagram_handle: string | null; preferred_contact_method: string | null } | null;
            availability_slots: { starts_at: string; ends_at: string | null } | null;
        } | null>();

    if (bookingError) console.error("[admin:cancellation:booking]", bookingError);
    if (!booking || !["held", "requested", "confirmed", "cancellation_requested"].includes(booking.status)) return result({ error: "This appointment can no longer be cancelled.", success: "" });

    const depositReceived = booking.deposit_status === "received";
    const outcome: Outcome = depositReceived ? requestedOutcome : "no_refund";
    const now = new Date().toISOString();

    try {
        const { data: payment, error: paymentError } = await admin
            .from("booking_payments")
            .select("id, amount, status")
            .eq("booking_id", bookingId)
            .eq("payment_type", "deposit")
            .eq("status", "received")
            .maybeSingle()
            .overrideTypes<{ id: string; amount: number; status: Enums<"payment_status"> } | null>();
        if (paymentError) throw paymentError;
        if (depositReceived && !payment) return result({ error: "The received deposit record could not be verified.", success: "" });

        const depositAmount = Number(payment?.amount ?? booking.deposit_amount ?? 0);
        if (outcome === "credit" && !booking.user_id) return result({ error: "Account credit can only be issued to an app customer.", success: "" });
        if (outcome === "credit" && depositAmount <= 0) return result({ error: "A positive received deposit amount is required for that outcome.", success: "" });
        let issuedCreditId: string | null = null;
        if (payment) {
            const paymentStatus: Enums<"payment_status"> = outcome === "credit" ? "credited" : "forfeited";
            const { data: changedPayment, error } = await admin.from("booking_payments").update({ status: paymentStatus, notes: internalNote || reason, marked_by: user.id }).eq("id", payment.id).eq("status", "received").select("id").maybeSingle();
            if (error || !changedPayment) return result({ error: "The deposit was already processed. Refresh before trying again.", success: "" });
        }

        if (outcome === "credit") {
            if (!booking.user_id) return result({ error: "Account credit can only be issued to an app customer.", success: "" });
            const { data: existingCredit, error: creditCheckError } = await admin
                .from("user_credits")
                .select("id")
                .eq("user_id", booking.user_id)
                .eq("source_booking_id", bookingId)
                .ilike("reason", "Cancellation credit%")
                .limit(1)
                .maybeSingle();
            if (creditCheckError) throw creditCheckError;
            if (existingCredit) {
                if (payment) await admin.from("booking_payments").update({ status: "received" }).eq("id", payment.id).eq("status", "credited");
                return result({ error: "A cancellation credit was already issued for this appointment.", success: "" });
            }

            const { data: issuedCredit, error } = await admin.from("user_credits").insert({ user_id: booking.user_id, amount: depositAmount, reason: `Cancellation credit · ${reason}`, source_booking_id: bookingId }).select("id").single();
            if (error || !issuedCredit) {
                if (payment) await admin.from("booking_payments").update({ status: "received" }).eq("id", payment.id).eq("status", "credited");
                throw error ?? new Error("Credit insert failed.");
            }
            issuedCreditId = issuedCredit.id;
        }

        const depositStatus: Enums<"deposit_status"> = !depositReceived ? booking.deposit_status : outcome === "credit" ? "credited" : "forfeited";
        const { data: cancelled, error: cancelError } = await admin.from("bookings").update({ status: "cancelled", cancelled_at: now, deposit_status: depositStatus }).eq("id", bookingId).in("status", ["held", "requested", "confirmed", "cancellation_requested"]).select("id").maybeSingle();
        if (cancelError || !cancelled) {
            if (issuedCreditId) await admin.from("user_credits").delete().eq("id", issuedCreditId);
            if (payment) await admin.from("booking_payments").update({ status: "received" }).eq("id", payment.id).eq("status", outcome === "credit" ? "credited" : "forfeited");
            throw cancelError ?? new Error("Booking status changed while cancelling.");
        }

        if (requestId) {
            const { error } = await admin.from("cancellation_requests").update({ status: "approved", reviewed_at: now, reviewed_by: user.id, admin_reason: internalNote || reason, admin_decision: outcome }).eq("id", requestId).eq("booking_id", bookingId).eq("status", "pending");
            if (error) throw error;
        }

        const futureSlot = Boolean(booking.availability_slots?.starts_at && new Date(booking.availability_slots.starts_at) > new Date());
        if (futureSlot && booking.slot_id) {
            const { error } = await admin.from("availability_slots").update({ status: "available", active: true }).eq("id", booking.slot_id);
            if (error) throw error;
        }

        const outcomeLabel = outcome === "credit" ? "Deposit converted to studio credit" : depositReceived ? "No refund / deposit forfeited" : "No deposit received";
        const { error: eventError } = await admin.from("booking_events").insert([
            { booking_id: bookingId, actor_type: "admin", actor_user_id: user.id, event_type: "admin_booking_cancelled", message: `Admin cancelled the appointment: ${reason}`, metadata: { previousStatus: booking.status, newStatus: "cancelled", reason, internalNote: internalNote || null, outcome, depositAmount } },
            { booking_id: bookingId, actor_type: "admin" as const, actor_user_id: user.id, event_type: "cancellation_deposit_decision", message: outcomeLabel, metadata: { outcome, depositAmount, previousDepositStatus: booking.deposit_status, newDepositStatus: depositStatus } },
            ...(futureSlot && booking.slot_id ? [{ booking_id: bookingId, actor_type: "admin" as const, actor_user_id: user.id, event_type: "availability_slot_reopened", message: "The future appointment slot was reopened for booking.", metadata: { slotId: booking.slot_id } }] : []),
            ...(outcome === "credit" ? [{ booking_id: bookingId, actor_type: "admin" as const, actor_user_id: user.id, event_type: "cancellation_credit_issued", message: `A ${depositAmount.toFixed(2)} cancellation credit was issued.`, metadata: { amount: depositAmount, reason } }] : []),
        ]);
        if (eventError) throw eventError;

        await syncBookingToGoogleCalendar(bookingId);
        revalidatePath("/admin"); revalidatePath("/admin/appointments"); revalidatePath(`/admin/appointments/${bookingId}`); if (booking.user_id) revalidatePath(`/admin/users/${booking.user_id}`); revalidatePath("/booking"); revalidatePath(`/booking/${booking.booking_reference}`); revalidatePath("/dashboard"); revalidatePath("/credits"); revalidatePath("/book");

        const recipient = resolveBookingRecipient(booking);
        const recipientName = recipient.displayName;
        const siteUrl = getAppBaseUrl();
        const template = cancellationTemplate({ name: recipientName, reference: booking.booking_reference, heading: "Appointment cancelled", appointment: booking.availability_slots ? formatStudioAppointmentDateTime(booking.availability_slots.starts_at) : "Not scheduled", reason, outcome: outcomeLabel, message: "Your appointment has been cancelled by the studio.", detailsUrl: booking.user_id && siteUrl ? `${siteUrl}/booking/${booking.booking_reference}` : undefined });
        await sendTransactionalEmail({ to: { email: recipient.email, name: recipientName }, ...template, notificationType: "admin_cancellation", bookingId, userId: booking.user_id });
        return result({ error: "", success: `Appointment cancelled. ${outcomeLabel}.` });
    } catch (error) {
        console.error("[admin:cancellation]", error);
        return result({ error: "We couldn't complete the cancellation safely. Please review the appointment before trying again.", success: "" });
    }
}
