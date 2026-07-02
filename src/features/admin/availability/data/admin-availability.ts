import { requireAdmin } from "@/features/admin/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Enums } from "@/types/supabase";

type SlotRow = Pick<
    Database["public"]["Tables"]["availability_slots"]["Row"],
    "id" | "starts_at" | "ends_at" | "status" | "active" | "notes" | "created_at"
> & {
    google_calendar_event_id: string | null;
    google_calendar_synced_at: string | null;
    google_calendar_sync_error: string | null;
    regulars_first: boolean;
    public_access_at: string;
    bookings:
        | Array<
              Pick<
                  Database["public"]["Tables"]["bookings"]["Row"],
                  "id" | "status" | "created_at"
              >
          >
        | null;
};

export type AdminAvailabilitySlot = {
    id: string;
    startsAt: string;
    endsAt: string | null;
    regularsFirst: boolean;
    publicAccessAt: string;
    status: Enums<"slot_status">;
    active: boolean;
    notes: string | null;
    createdAt: string;
    canReleasePriority: boolean;
    priorityReleased: boolean;
    bulkSelectable: boolean;
    bookingId: string | null;
    googleSyncState: "synced" | "pending" | "issue" | "not_connected";
};

export async function getAdminAvailabilityPageData() {
    await requireAdmin();
    const admin = createAdminClient();

    const slotsResult = await admin
        .from("availability_slots")
        .select(
            "id, starts_at, ends_at, status, active, notes, created_at, regulars_first, public_access_at, google_calendar_event_id, google_calendar_synced_at, google_calendar_sync_error, bookings:bookings!bookings_slot_id_fkey(id, status, created_at)",
        )
        .order("starts_at", { ascending: false })
        .limit(240)
        .overrideTypes<SlotRow[]>();

    if (slotsResult.error) {
        console.error(
            "[admin:availability:data]",
            slotsResult.error,
        );
        throw new Error("We couldn't load availability.");
    }

    const now = Date.now();
    const activeBookingStatuses = new Set<Enums<"booking_status">>([
        "held",
        "requested",
        "confirmed",
        "cancellation_requested",
    ]);

    return {
        slots: (slotsResult.data ?? []).map((slot) => {
            const latestBooking =
                slot.bookings
                    ?.slice()
                    .sort(
                        (a, b) =>
                            new Date(b.created_at).getTime() -
                            new Date(a.created_at).getTime(),
                    )[0] ?? null;
            const occupied = !["available", "blocked"].includes(slot.status);
            const hasActiveBooking = (slot.bookings ?? []).some((booking) =>
                activeBookingStatuses.has(booking.status),
            );
            const future = new Date(slot.starts_at).getTime() > now;

            return {
                id: slot.id,
                startsAt: slot.starts_at,
                endsAt: slot.ends_at,
                regularsFirst: slot.regulars_first,
                publicAccessAt: slot.public_access_at,
                status: slot.status,
                active: slot.active,
                notes: slot.notes,
                createdAt: slot.created_at,
                canReleasePriority:
                    slot.active &&
                    slot.status === "available" &&
                    slot.regulars_first &&
                    new Date(slot.starts_at).getTime() > now &&
                    new Date(slot.public_access_at).getTime() > now,
                priorityReleased:
                    slot.regulars_first &&
                    new Date(slot.public_access_at).getTime() <= now,
                bulkSelectable:
                    future &&
                    slot.active &&
                    slot.status === "available" &&
                    !hasActiveBooking,
                bookingId: occupied ? latestBooking?.id ?? null : null,
                googleSyncState:
                    (slot.google_calendar_sync_error === "not_connected"
                        ? "not_connected"
                        : slot.google_calendar_sync_error
                          ? "issue"
                          : slot.google_calendar_synced_at
                            ? "synced"
                            : "pending") as AdminAvailabilitySlot["googleSyncState"],
            };
        }),
    };
}
