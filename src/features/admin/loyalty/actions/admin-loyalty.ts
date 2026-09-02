"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/admin/auth/require-admin";
import { completeBookingWithSettlement } from "@/features/admin/appointments/utils/complete-booking";
import { calculateAdminDiscountedPricing, roundCurrency } from "@/features/admin/appointments/utils/admin-discount";
import { calculateBookingLedger } from "@/features/bookings/utils/booking-ledger";
import { createAdminClient } from "@/lib/supabase/admin";

export type LoyaltyActionState = { error: string; success: string; messageId: string };

function result(input: Omit<LoyaltyActionState, "messageId">): LoyaltyActionState {
    return { ...input, messageId: crypto.randomUUID() };
}

function value(formData: FormData, key: string) {
    const input = formData.get(key);
    return typeof input === "string" ? input.trim() : "";
}

function refresh(bookingId: string, userId: string | null) {
    revalidatePath("/admin");
    revalidatePath("/admin/appointments");
    revalidatePath(`/admin/appointments/${bookingId}`);
    if (userId) revalidatePath(`/admin/users/${userId}`);
}

export async function applyLoyaltyAdjustmentAction(
    _previous: LoyaltyActionState,
    formData: FormData,
): Promise<LoyaltyActionState> {
    const { user } = await requireAdmin();
    const bookingId = value(formData, "bookingId");
    const adjustment = value(formData, "loyaltyAdjustment");
    const paymentMethod = value(formData, "paymentMethod");
    const percentage = Number(value(formData, "discountPercentage"));
    if (!bookingId || !["free", "discount"].includes(adjustment)) {
        return result({ error: "Choose a loyalty adjustment.", success: "" });
    }
    if (adjustment === "discount" && (!Number.isFinite(percentage) || percentage <= 0 || percentage >= 100)) {
        return result({ error: "Enter a loyalty discount between 0 and 100 percent.", success: "" });
    }
    if (adjustment === "discount" && !["cash", "etransfer", "other"].includes(paymentMethod)) {
        return result({ error: "Choose the final payment method.", success: "" });
    }

    const typedAdmin = createAdminClient();
    const admin = typedAdmin as unknown as SupabaseClient;
    try {
        const bookingResult = await admin.from("bookings")
            .select("id, user_id, status, booking_fee_mode, booking_fee_rate, availability_slots:slot_id(starts_at)")
            .eq("id", bookingId).maybeSingle();
        if (bookingResult.error) throw bookingResult.error;
        const booking = bookingResult.data;
        const slot = booking?.availability_slots as unknown as { starts_at: string } | Array<{ starts_at: string }> | null;
        const startsAt = Array.isArray(slot) ? slot[0]?.starts_at : slot?.starts_at;
        if (!booking || booking.status !== "confirmed" || !startsAt || new Date(startsAt) > new Date()) {
            return result({ error: "This appointment is not ready to finish.", success: "" });
        }

        const [lineItemsResult, paymentsResult] = await Promise.all([
            admin.from("booking_line_items").select("id, item_type, line_total, unit_price, quantity").eq("booking_id", bookingId).eq("active", true).is("removed_at", null),
            admin.from("booking_payments").select("amount, payment_type, status").eq("booking_id", bookingId),
        ]);
        if (lineItemsResult.error || paymentsResult.error) throw lineItemsResult.error ?? paymentsResult.error;
        const appliedAmount = calculateBookingLedger({
            appointmentTotal: 0,
            payments: (paymentsResult.data ?? []).map((payment) => ({
                type: payment.payment_type,
                status: payment.status,
                amount: Number(payment.amount),
            })),
        }).totalApplied;
        const now = new Date().toISOString();

        if (adjustment === "free") {
            if (appliedAmount > 0) {
                const refund = await admin.from("booking_payments").insert({ booking_id: bookingId, user_id: booking.user_id, payment_type: "refund", method: "etransfer", amount: appliedAmount, status: "refunded", paid_at: now, marked_by: user.id, notes: "Loyalty courtesy · refund of payments already applied" });
                if (refund.error) throw refund.error;
            }
            const zeroPayment = await admin.from("booking_payments").insert({ booking_id: bookingId, user_id: booking.user_id, payment_type: "final_payment", method: "other", amount: 0, status: "completed", paid_at: now, marked_by: user.id, notes: "Loyalty courtesy · complimentary appointment" });
            if (zeroPayment.error) throw zeroPayment.error;
            const completed = await admin.from("bookings").update({ is_loyalty_reward: true, status: "completed", final_total: 0, ...(appliedAmount > 0 ? { deposit_status: "refunded" } : {}), completed_at: now }).eq("id", bookingId).eq("status", "confirmed").select("id").maybeSingle();
            if (completed.error || !completed.data) throw completed.error ?? new Error("Booking status changed.");
            await admin.from("booking_events").insert({ booking_id: bookingId, actor_type: "admin", actor_user_id: user.id, event_type: "loyalty_courtesy_applied", message: "Admin completed this appointment free as a loyalty courtesy.", metadata: { adjustment: "free", previousPaymentsRefunded: appliedAmount } });
            refresh(bookingId, booking.user_id);
            return result({ error: "", success: "Appointment completed free as a loyalty courtesy." });
        }

        const items = lineItemsResult.data ?? [];
        const subtotal = roundCurrency(items.filter((item) => item.item_type !== "discount").reduce((sum, item) => sum + Number(item.line_total ?? Number(item.unit_price) * Number(item.quantity)), 0));
        if (subtotal <= 0) return result({ error: "This appointment has no services to discount.", success: "" });
        const pricing = calculateAdminDiscountedPricing({ subtotal, discountPercentage: percentage, bookingFeeMode: booking.booking_fee_mode, bookingFeeRate: Number(booking.booking_fee_rate), amountPaid: appliedAmount });
        if (pricing.total < appliedAmount) return result({ error: "This discount is lower than payments already applied. Choose a smaller discount or make the appointment free.", success: "" });
        const existingDiscount = items.find((item) => item.item_type === "discount");
        const discountValues = { label_snapshot: `Loyalty discount (${roundCurrency(percentage)}%)`, description_snapshot: "Admin-applied loyalty courtesy", quantity: 1, unit_price: -pricing.discountAmount };
        const discountResult = existingDiscount
            ? await admin.from("booking_line_items").update(discountValues).eq("id", existingDiscount.id)
            : await admin.from("booking_line_items").insert({ booking_id: bookingId, item_type: "discount", active: true, added_by: user.id, ...discountValues });
        if (discountResult.error) throw discountResult.error;
        await completeBookingWithSettlement({ admin: typedAdmin, bookingId, userId: booking.user_id, adminUserId: user.id, totalCharged: pricing.total, paymentMethod: paymentMethod as "cash" | "etransfer" | "other" });
        await admin.from("booking_events").insert({ booking_id: bookingId, actor_type: "admin", actor_user_id: user.id, event_type: "loyalty_courtesy_applied", message: `Admin applied a ${roundCurrency(percentage)}% loyalty discount and completed the appointment.`, metadata: { adjustment: "discount", percentage: roundCurrency(percentage), amount: pricing.discountAmount, finalTotal: pricing.total } });
        refresh(bookingId, booking.user_id);
        return result({ error: "", success: `${roundCurrency(percentage)}% loyalty discount applied and appointment completed.` });
    } catch (error) {
        console.error("[admin:loyalty-adjustment]", error);
        return result({ error: "We couldn't apply that loyalty adjustment safely.", success: "" });
    }
}
