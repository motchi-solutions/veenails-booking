import { createClient } from "@/lib/supabase/server";
import { getDashboardUpcomingBookings } from "@/features/bookings/data/bookings";
import { getCreditsPageData } from "@/features/credits/data/credits";
import type { DashboardOverviewData } from "@/features/dashboard/types/dashboard";
import type { Enums } from "@/types/supabase";
import {
    addDaysToStudioDateKey,
    addMonthsToStudioDateKey,
    getStudioDateKey,
    studioDateTimeToDate,
} from "@/lib/utils/studio-time";

const CLIENT_VISIBLE_SLOT_STATUSES: Enums<"slot_status">[] = [
    "available",
    "held",
    "requested",
    "confirmed",
];

function getFallbackDisplayName(email?: string | null) {
    return email?.split("@")[0] || "Client";
}

function throwDashboardDataError(action: string, error: { message: string }) {
    console.error(`[dashboard:${action}]`, {
        message: error.message,
    });

    throw new Error("We couldn't load your dashboard right now.");
}

export async function getDashboardOverviewData(
    userId: string,
    fallbackEmail?: string | null,
): Promise<DashboardOverviewData> {
    const supabase = await createClient();
    const now = new Date();
    const nowIso = now.toISOString();
    const todayKey = getStudioDateKey(now);
    const calendarEndKey = addMonthsToStudioDateKey(todayKey, 1);
    const calendarEndExclusive = studioDateTimeToDate(
        addDaysToStudioDateKey(calendarEndKey, 1),
        "00:00",
    ).toISOString();

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(
            "display_name, email, phone, instagram_handle, preferred_contact_method, is_regular",
        )
        .eq("id", userId)
        .single();

    if (profileError) {
        throwDashboardDataError("profile", profileError);
    }

    let availabilityQuery = supabase
        .from("availability_slots")
        .select("id, starts_at, ends_at, status, active, regulars_first, public_access_at")
        .eq("active", true)
        .in("status", CLIENT_VISIBLE_SLOT_STATUSES)
        .gte("starts_at", nowIso)
        .lt("starts_at", calendarEndExclusive)
        .order("starts_at", { ascending: true });

    if (!profile?.is_regular) {
        availabilityQuery = availabilityQuery.or(
            `status.neq.available,regulars_first.eq.false,public_access_at.lte.${nowIso}`,
        );
    }

    const [pendingBookings, confirmedBookings, creditsPageData, upcomingBookings, availabilityResult] =
        await Promise.all([
        supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("status", "requested"),

        supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("status", "confirmed"),

        getCreditsPageData(userId),

        getDashboardUpcomingBookings(userId, 3),

        availabilityQuery,

    ]);

    if (pendingBookings.error) {
        throwDashboardDataError("pending-bookings", pendingBookings.error);
    }

    if (confirmedBookings.error) {
        throwDashboardDataError("confirmed-bookings", confirmedBookings.error);
    }

    if (availabilityResult.error) {
        throwDashboardDataError("availability", availabilityResult.error);
    }

    const profileEmail = profile?.email ?? fallbackEmail ?? "";
    const visibleAvailability = (availabilityResult.data ?? []).filter(
        (slot) =>
            slot.status === "available"
                ? new Date(slot.starts_at).getTime() >= now.getTime() &&
                  (profile?.is_regular ||
                      !slot.regulars_first ||
                      new Date(slot.public_access_at).getTime() <= now.getTime())
                : true,
    );
    const days = buildAvailabilityDays(
        visibleAvailability,
        todayKey,
        calendarEndKey,
        todayKey,
    );

    return {
        profile: {
            displayName:
                profile?.display_name || getFallbackDisplayName(profileEmail),
            email: profileEmail,
            phone: profile?.phone ?? null,
            instagramHandle: profile?.instagram_handle ?? null,
            preferredContactMethod:
                profile?.preferred_contact_method ?? "email",
        },
        stats: {
            pendingRequests: pendingBookings.count ?? 0,
            confirmedBookings: confirmedBookings.count ?? 0,
            availableCredits: creditsPageData.totalActiveAmount,
        },
        availability: {
            days,
        },
        upcomingAppointments: upcomingBookings,
    };
}

function buildAvailabilityDays(
    slots: Array<{
        id: string;
        starts_at: string;
        ends_at: string | null;
        regulars_first: boolean;
        public_access_at: string;
        status: Enums<"slot_status">;
    }>,
    startDateKey = getStudioDateKey(),
    endDateKey = addMonthsToStudioDateKey(startDateKey, 1),
    todayKey = getStudioDateKey(),
) {
    const dayMap = new Map<
        string,
        {
            date: string;
            label: string;
            dayName: string;
            dayNumber: string;
            monthLabel: string;
            isToday: boolean;
            slots: {
                id: string;
                startsAt: string;
                endsAt: string | null;
                available: boolean;
            }[];
        }
    >();

    for (
        let offset = 0;
        addDaysToStudioDateKey(startDateKey, offset) <= endDateKey;
        offset += 1
    ) {
        const key = addDaysToStudioDateKey(startDateKey, offset);
        const date = new Date(`${key}T12:00:00Z`);

        dayMap.set(key, {
            date: key,
            label: date.toLocaleDateString("en-CA", {
                timeZone: "UTC",
                weekday: "short",
                month: "short",
                day: "numeric",
            }),
            dayName: date.toLocaleDateString("en-CA", {
                timeZone: "UTC",
                weekday: "short",
            }),
            dayNumber: date.toLocaleDateString("en-CA", {
                timeZone: "UTC",
                day: "numeric",
            }),
            monthLabel: date.toLocaleDateString("en-CA", {
                timeZone: "UTC",
                month: "short",
            }),
            isToday: key === todayKey,
            slots: [],
        });
    }

    for (const slot of slots) {
        const dateKey = getStudioDateKey(new Date(slot.starts_at));
        const day = dayMap.get(dateKey);

        if (!day) {
            continue;
        }

        day.slots.push({
            id: slot.id,
            startsAt: slot.starts_at,
            endsAt: slot.ends_at,
            available: slot.status === "available",
        });
    }

    return Array.from(dayMap.values());
}
