"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/admin/auth/require-admin";
import { syncAvailabilitySlotToGoogleCalendar } from "@/features/integrations/google-calendar/services/sync";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Enums } from "@/types/supabase";
import {
    BULK_AVAILABILITY_ACTIONS,
    type BulkAvailabilityAction,
} from "@/features/admin/availability/utils/bulk-availability";
import { studioDateTimeInputToDate } from "@/lib/utils/studio-time";

export type BulkAvailabilityActionState = {
    success: boolean;
    error: string;
    messageId: string;
    appliedCount: number;
    skippedCount: number;
    skippedReasons: string[];
    syncFailedCount: number;
};

type BulkSlotRow = Pick<
    Database["public"]["Tables"]["availability_slots"]["Row"],
    | "id"
    | "starts_at"
    | "status"
    | "active"
    | "regulars_first"
    | "public_access_at"
> & {
    bookings:
        | Array<
              Pick<
                  Database["public"]["Tables"]["bookings"]["Row"],
                  "status"
              >
          >
        | null;
};

const MAX_BULK_SELECTION = 100;
const ACTIVE_BOOKING_STATUSES = new Set<Enums<"booking_status">>([
    "held",
    "requested",
    "confirmed",
    "cancellation_requested",
]);

function result(
    input: Omit<BulkAvailabilityActionState, "messageId">,
): BulkAvailabilityActionState {
    return {
        ...input,
        messageId: `${Date.now()}-${crypto.randomUUID()}`,
    };
}

function failure(error: string): BulkAvailabilityActionState {
    return result({
        success: false,
        error,
        appliedCount: 0,
        skippedCount: 0,
        skippedReasons: [],
        syncFailedCount: 0,
    });
}

function parseSelectedIds(formData: FormData) {
    const raw = String(formData.get("slotIds") ?? "");
    let values: unknown;

    try {
        values = JSON.parse(raw);
    } catch {
        return null;
    }

    if (!Array.isArray(values)) {
        return null;
    }

    const ids = [
        ...new Set(
            values.filter(
                (value): value is string =>
                    typeof value === "string" &&
                    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                        value,
                    ),
            ),
        ),
    ];

    return ids.length === values.length ? ids : null;
}

function hasActiveBooking(slot: BulkSlotRow) {
    return (slot.bookings ?? []).some((booking) =>
        ACTIVE_BOOKING_STATUSES.has(booking.status),
    );
}

function skipReasonForSlot(
    slot: BulkSlotRow,
    action: BulkAvailabilityAction,
    now: Date,
) {
    if (new Date(slot.starts_at) <= now) {
        return "Past slots cannot be changed.";
    }

    if (slot.status !== "available" || hasActiveBooking(slot)) {
        return "Unavailable or appointment-linked slots were protected.";
    }

    if (!slot.active) {
        return "Inactive slots were unchanged.";
    }

    if (
        action === "release" &&
        (!slot.regulars_first || new Date(slot.public_access_at) <= now)
    ) {
        return "Slots already visible to everyone were unchanged.";
    }

    return null;
}

function summarizeReasons(reasons: string[]) {
    const counts = new Map<string, number>();
    for (const reason of reasons) {
        counts.set(reason, (counts.get(reason) ?? 0) + 1);
    }

    return [...counts.entries()].map(([reason, count]) => `${count} × ${reason}`);
}

function revalidateAvailability() {
    revalidatePath("/admin");
    revalidatePath("/admin/availability");
    revalidatePath("/book");
    revalidatePath("/booking");
    revalidatePath("/dashboard");
}

async function syncChangedSlots(slotIds: string[]) {
    const settled = [];

    for (let index = 0; index < slotIds.length; index += 5) {
        const batch = slotIds.slice(index, index + 5);
        settled.push(
            ...(await Promise.all(
                batch.map((slotId) =>
                    syncAvailabilitySlotToGoogleCalendar(slotId),
                ),
            )),
        );
    }

    return settled.filter((syncResult) => syncResult.status === "failed")
        .length;
}

export async function bulkAvailabilityAction(
    _previousState: BulkAvailabilityActionState,
    formData: FormData,
): Promise<BulkAvailabilityActionState> {
    try {
        const { user } = await requireAdmin();
        const selectedIds = parseSelectedIds(formData);
        const requestedAction = String(formData.get("bulkAction") ?? "");
        const action = BULK_AVAILABILITY_ACTIONS.find(
            (value) => value === requestedAction,
        );

        if (!selectedIds?.length) {
            return failure("Select at least one valid availability slot.");
        }
        if (selectedIds.length > MAX_BULK_SELECTION) {
            return failure(
                `Select no more than ${MAX_BULK_SELECTION} slots at a time.`,
            );
        }
        if (!action) {
            return failure("Choose a valid bulk action.");
        }

        const admin = createAdminClient();
        const now = new Date();
        const nowIso = now.toISOString();
        const { data: slots, error: slotsError } = await admin
            .from("availability_slots")
            .select(
                "id, starts_at, status, active, regulars_first, public_access_at, bookings:bookings!bookings_slot_id_fkey(status)",
            )
            .in("id", selectedIds)
            .overrideTypes<BulkSlotRow[]>();

        if (slotsError) {
            console.error("[admin:availability:bulk-read]", slotsError);
            return failure("We couldn't validate the selected slots.");
        }

        const foundSlots = slots ?? [];
        const missingCount = selectedIds.length - foundSlots.length;
        const skippedReasons: string[] = Array.from(
            { length: missingCount },
            () => "Slots that no longer exist were ignored.",
        );
        const eligibleIds: string[] = [];

        for (const slot of foundSlots) {
            const reason = skipReasonForSlot(slot, action, now);
            if (reason) skippedReasons.push(reason);
            else eligibleIds.push(slot.id);
        }

        if (!eligibleIds.length) {
            return result({
                success: true,
                error: "",
                appliedCount: 0,
                skippedCount: selectedIds.length,
                skippedReasons: summarizeReasons(skippedReasons),
                syncFailedCount: 0,
            });
        }

        let update:
            {
                data: Array<{ id: string }> | null;
                error: { message: string } | null;
            } = {
                data: null,
                error: null,
            };

        if (action === "release") {
            update = await admin
                .from("availability_slots")
                .update({
                    regulars_first: false,
                    public_access_at: nowIso,
                })
                .in("id", eligibleIds)
                .eq("active", true)
                .eq("status", "available")
                .eq("regulars_first", true)
                .gt("starts_at", nowIso)
                .gt("public_access_at", nowIso)
                .select("id");
        } else if (action === "priority") {
            const releaseInput = String(
                formData.get("priorityReleaseAt") ?? "",
            ).trim();
            let publicAccessAt: string;

            try {
                const releaseAt = studioDateTimeInputToDate(releaseInput);
                if (releaseAt <= now) {
                    return failure("Public release must be in the future.");
                }
                publicAccessAt = releaseAt.toISOString();
            } catch (error) {
                return failure(
                    error instanceof Error
                        ? error.message
                        : "Choose a valid public release date and time.",
                );
            }

            update = await admin
                .from("availability_slots")
                .update({
                    regulars_first: true,
                    public_access_at: publicAccessAt,
                })
                .in("id", eligibleIds)
                .eq("active", true)
                .eq("status", "available")
                .gt("starts_at", nowIso)
                .select("id");
        } else if (action === "deactivate") {
            const reason =
                String(formData.get("deactivationReason") ?? "")
                    .trim()
                    .slice(0, 240) || null;

            update = await admin
                .from("availability_slots")
                .update({
                    active: false,
                    deactivated_at: nowIso,
                    deactivated_by: user.id,
                    deactivation_reason: reason,
                })
                .in("id", eligibleIds)
                .eq("active", true)
                .eq("status", "available")
                .gt("starts_at", nowIso)
                .select("id");
        }

        if (update.error) {
            console.error("[admin:availability:bulk-update]", update.error);
            return failure("We couldn't update the selected slots.");
        }

        const appliedIds = (update.data ?? []).map((slot) => slot.id);

        if (action === "priority" && appliedIds.length > 0) {
            const { data: verifiedSlots, error: verificationError } = await admin
                .from("availability_slots")
                .select("id")
                .in("id", appliedIds)
                .eq("active", true)
                .eq("status", "available")
                .eq("regulars_first", true)
                .gt("public_access_at", nowIso);

            if (
                verificationError ||
                (verifiedSlots ?? []).length !== appliedIds.length
            ) {
                console.error(
                    "[admin:availability:bulk-priority-verification]",
                    verificationError ?? {
                        expected: appliedIds.length,
                        actual: verifiedSlots?.length ?? 0,
                    },
                );
                return failure(
                    "Priority access could not be verified. Refresh and try again.",
                );
            }
        }
        const raceSkippedCount = eligibleIds.length - appliedIds.length;
        if (raceSkippedCount > 0) {
            skippedReasons.push(
                ...Array.from(
                    { length: raceSkippedCount },
                    () => "Slots changed while this action was being confirmed.",
                ),
            );
        }

        const syncFailedCount = await syncChangedSlots(appliedIds);
        revalidateAvailability();

        return result({
            success: true,
            error: "",
            appliedCount: appliedIds.length,
            skippedCount: selectedIds.length - appliedIds.length,
            skippedReasons: summarizeReasons(skippedReasons),
            syncFailedCount,
        });
    } catch (error) {
        console.error("[admin:availability:bulk]", error);
        return failure("We couldn't complete that bulk availability action.");
    }
}
