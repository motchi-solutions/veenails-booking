import { createClient } from "@/lib/supabase/server";
import type {
    AvailableAppointmentSlot,
    BookingSettingsSummary,
    DesignTier,
} from "@/features/bookings/new-booking/types";
import { getUser } from "@/features/auth/guards/get-user";
import type { Database } from "@/types/supabase";

type SlotRow = Pick<
    Database["public"]["Tables"]["availability_slots"]["Row"],
    "id" | "starts_at" | "ends_at"
> & {
    regulars_first: boolean;
    public_access_at: string;
};

type ProfileAccessRow = Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "is_regular"
>;

type SettingsRow = Pick<
    Database["public"]["Tables"]["booking_settings"]["Row"],
    "deposit_amount" | "booking_fee_mode" | "booking_fee_rate" | "hold_minutes"
>;

type DesignTierRow = Pick<
    Database["public"]["Tables"]["design_tiers"]["Row"],
    "id" | "name" | "description" | "price" | "display_order"
>;

type DesignTierImageRow = Pick<
    Database["public"]["Tables"]["design_tier_images"]["Row"],
    | "id"
    | "design_tier_id"
    | "image_url"
    | "alt_text"
    | "display_order"
>;

export async function getNewBookingPageData(): Promise<{
    slots: AvailableAppointmentSlot[];
    settings: BookingSettingsSummary;
    designTiers: DesignTier[];
}> {
    const supabase = await createClient();
    const now = new Date().toISOString();
    const user = await getUser();

    const profileResult = user
        ? await supabase
              .from("profiles")
              .select("is_regular")
              .eq("id", user.id)
              .maybeSingle()
              .overrideTypes<ProfileAccessRow | null>()
        : { data: null, error: null };
    const isRegular = Boolean(profileResult.data?.is_regular);

    let slotsQuery = supabase
        .from("availability_slots")
        .select("id, starts_at, ends_at, regulars_first, public_access_at")
        .eq("active", true)
        .eq("status", "available")
        .gte("starts_at", now)
        .order("starts_at", { ascending: true });

    if (!isRegular) {
        slotsQuery = slotsQuery.or(
            `regulars_first.eq.false,public_access_at.lte.${now}`,
        );
    }

    const [
        slotsResult,
        settingsResult,
        designTiersResult,
        designTierImagesResult,
    ] = await Promise.all([
        slotsQuery.overrideTypes<SlotRow[]>(),

        supabase
            .from("booking_settings")
            .select(
                "deposit_amount, booking_fee_mode, booking_fee_rate, hold_minutes",
            )
            .eq("id", 1)
            .maybeSingle()
            .overrideTypes<SettingsRow | null>(),

        supabase
            .from("design_tiers")
            .select("id, name, description, price, display_order")
            .eq("active", true)
            .order("display_order", { ascending: true })
            .overrideTypes<DesignTierRow[]>(),

        supabase
            .from("design_tier_images")
            .select("id, design_tier_id, image_url, alt_text, display_order")
            .eq("active", true)
            .order("display_order", { ascending: true })
            .overrideTypes<DesignTierImageRow[]>(),

    ]);

    if (slotsResult.error) {
        console.error("[bookings:new-booking.slots]", slotsResult.error);
        throw new Error("We couldn't load appointment slots right now.");
    }

    if (settingsResult.error) {
        console.error(
            "[bookings:new-booking.booking-settings]",
            settingsResult.error,
        );
        throw new Error("We couldn't load booking settings right now.");
    }

    if (designTiersResult.error) {
        console.error(
            "[bookings:new-booking.design-tiers]",
            designTiersResult.error,
        );
        throw new Error("We couldn't load design tiers right now.");
    }

    if (designTierImagesResult.error) {
        console.error(
            "[bookings:new-booking.design-tier-images]",
            designTierImagesResult.error,
        );
        throw new Error("We couldn't load design tier images right now.");
    }

    const previewImageByTierId = new Map<string, DesignTierImageRow>();

    for (const image of designTierImagesResult.data ?? []) {
        if (!previewImageByTierId.has(image.design_tier_id)) {
            previewImageByTierId.set(image.design_tier_id, image);
        }
    }

    return {
        slots: (slotsResult.data ?? [])
            .filter(
                (slot) =>
                    isRegular ||
                    !slot.regulars_first ||
                    new Date(slot.public_access_at).getTime() <=
                        new Date(now).getTime(),
            )
            .map((slot) => ({
            id: slot.id,
            startsAt: slot.starts_at,
            endsAt: slot.ends_at,
            availability: "available",
        })),
        settings: settingsResult.data
            ? {
                  depositAmount: Number(settingsResult.data.deposit_amount ?? 0),
                  bookingFeeMode: settingsResult.data.booking_fee_mode,
                  bookingFeeRate: Number(
                      settingsResult.data.booking_fee_rate ?? 0,
                  ),
                  holdMinutes: Number(settingsResult.data.hold_minutes ?? 0),
              }
            : null,
        designTiers: (designTiersResult.data ?? []).map((tier) => {
            const previewImage = previewImageByTierId.get(tier.id);

            return {
                id: tier.id,
                label: tier.name,
                description: tier.description,
                price: Number(tier.price ?? 0),
                imageSrc: previewImage?.image_url ?? null,
                imageAlt:
                    previewImage?.alt_text ??
                    `${tier.name} design tier preview`,
            };
        }),
    };
}
