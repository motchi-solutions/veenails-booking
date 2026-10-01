import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminCancellationOutcome = {
    reason: string;
    internalNote: string | null;
    depositOutcome: string;
    refundStatus: string;
    finalPaymentStatus: string | null;
    depositAmount: number;
    cancelledAt: string;
};

export async function getAdminCancellationOutcome(
    bookingId: string,
): Promise<AdminCancellationOutcome | null> {
    const admin = createAdminClient() as unknown as SupabaseClient;
    const { data, error } = await admin
        .from("booking_cancellations")
        .select("reason, internal_note, deposit_outcome, refund_status, final_payment_status, deposit_amount, cancelled_at")
        .eq("booking_id", bookingId)
        .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
        reason: data.reason,
        internalNote: data.internal_note,
        depositOutcome: data.deposit_outcome,
        refundStatus: data.refund_status,
        finalPaymentStatus: data.final_payment_status,
        depositAmount: Number(data.deposit_amount),
        cancelledAt: data.cancelled_at,
    };
}
