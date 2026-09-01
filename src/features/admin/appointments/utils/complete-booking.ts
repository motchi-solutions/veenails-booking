import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

type AdminClient = ReturnType<typeof createAdminClient>;

export type CompletedBookingSettlement = {
    appointmentTotal: number;
    totalApplied: number;
    overpaymentCredit: number;
    creditId: string | null;
};

export async function completeBookingWithSettlement({
    admin,
    bookingId,
    userId,
    adminUserId,
    totalCharged,
    paymentMethod,
}: {
    admin: AdminClient;
    bookingId: string;
    userId: string | null;
    adminUserId: string;
    totalCharged: number;
    paymentMethod: "etransfer" | "cash" | "other";
}): Promise<CompletedBookingSettlement> {
    void userId;
    const untyped = admin as unknown as SupabaseClient;
    const { data, error } = await untyped.rpc("complete_booking_with_payment", {
        p_booking_id: bookingId,
        p_total_charged: totalCharged,
        p_payment_method: paymentMethod,
        p_marked_by: adminUserId,
    });
    const settlement = Array.isArray(data) ? data[0] : null;

    if (error || !settlement) {
        throw error ?? new Error("The appointment could not be settled.");
    }

    return {
        appointmentTotal: Number(settlement.appointment_total),
        totalApplied:
            Number(settlement.prior_applied) +
            Number(settlement.final_payment_amount),
        overpaymentCredit: 0,
        creditId: null,
    };
}
