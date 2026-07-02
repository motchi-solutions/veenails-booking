"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/admin/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeInstagramUrl } from "@/features/bookings/utils/instagram-contact";

export type AdminSettingsActionState = {
    error: string;
    success: string;
};

function numberFromForm(formData: FormData, key: string) {
    const value = Number(formData.get(key));
    return Number.isFinite(value) ? value : null;
}

export async function updateBookingSettingsAction(formData: FormData) {
    await requireAdmin();

    const id = numberFromForm(formData, "id");
    const depositAmount = numberFromForm(formData, "depositAmount");
    const bookingFeeRate = numberFromForm(formData, "bookingFeeRate");
    const holdMinutes = numberFromForm(formData, "holdMinutes");
    const bookingFeeMode = String(formData.get("bookingFeeMode") ?? "");
    const etransferEmail =
        String(formData.get("etransferEmail") ?? "").trim() || null;
    const instagramUrlInput =
        String(formData.get("instagramUrl") ?? "").trim() || null;
    const instagramUrl = normalizeInstagramUrl(instagramUrlInput);

    if (
        !id ||
        depositAmount === null ||
        bookingFeeRate === null ||
        holdMinutes === null
    ) {
        return {
            error: "Booking settings are incomplete.",
            success: "",
        };
    }

    if (
        bookingFeeMode !== "included_in_price" &&
        bookingFeeMode !== "added_on_top"
    ) {
        return {
            error: "Choose a valid booking fee mode.",
            success: "",
        };
    }

    if (instagramUrlInput && !instagramUrl) {
        return {
            error: "Enter a valid Instagram URL.",
            success: "",
        };
    }

    if (etransferEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(etransferEmail)) {
        return {
            error: "Enter a valid e-transfer email.",
            success: "",
        };
    }

    if (
        depositAmount < 0 ||
        bookingFeeRate < 0 ||
        bookingFeeRate > 100 ||
        holdMinutes < 1 ||
        !Number.isInteger(holdMinutes)
    ) {
        return {
            error: "Booking settings contain an invalid value.",
            success: "",
        };
    }
    const admin = createAdminClient();
    const { error } = await admin
        .from("booking_settings")
        .update({
            deposit_amount: depositAmount,
            booking_fee_rate: bookingFeeRate,
            booking_fee_mode: bookingFeeMode,
            hold_minutes: holdMinutes,
            etransfer_email: etransferEmail,
            instagram_url: instagramUrl,
        })
        .eq("id", id);

    if (error) {
        console.error("[admin:settings:update]", error);
        return {
            error: "We couldn't update booking settings.",
            success: "",
        };
    }

    revalidatePath("/admin/settings");
    revalidatePath("/book");
    revalidatePath("/book/checkout");
    revalidatePath("/booking");
    revalidatePath("/dashboard");

    return {
        error: "",
        success: "Settings saved.",
    };
}
