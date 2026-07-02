import { requireAdmin } from "@/features/admin/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/supabase";

export type AdminBookingSettings = Pick<
    Database["public"]["Tables"]["booking_settings"]["Row"],
    | "id"
    | "active"
    | "deposit_amount"
    | "booking_fee_rate"
    | "booking_fee_mode"
    | "hold_minutes"
    | "etransfer_email"
    | "instagram_url"
>;

export async function getAdminBookingSettings() {
    await requireAdmin();
    const admin = createAdminClient();

    const { data, error } = await admin
        .from("booking_settings")
        .select(
            "id, active, deposit_amount, booking_fee_rate, booking_fee_mode, hold_minutes, etransfer_email, instagram_url",
        )
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle()
        .overrideTypes<AdminBookingSettings | null>();

    if (error) {
        console.error("[admin:settings]", error);
        throw new Error("We couldn't load booking settings.");
    }

    return data;
}
