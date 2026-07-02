"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/admin/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { studioDateTimeToDate } from "@/features/admin/availability/utils/slot-time-options";
import type { Enums } from "@/types/supabase";
import { syncAvailabilitySlotToGoogleCalendar } from "@/features/integrations/google-calendar/services/sync";
import {
    DEFAULT_PRIORITY_ACCESS_HOURS,
    studioDateTimeInputToDate,
} from "@/lib/utils/studio-time";

const EDITABLE_STATUSES: Enums<"slot_status">[] = ["available", "blocked"];
const FALLBACK_SLOT_DURATION_MINUTES = 90;

export type AvailabilityActionState = {
    error: string;
    success: string;
    messageId: string;
};

function actionState(
    input: Omit<AvailabilityActionState, "messageId">,
): AvailabilityActionState {
    return {
        ...input,
        messageId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
}

function parseSlotDate(formData: FormData, timeKey: string, optional = false) {
    const date = String(formData.get("date") ?? "");
    const time = String(formData.get(timeKey) ?? "");

    if (optional && !time) {
        return null;
    }

    return studioDateTimeToDate(date, time);
}

function parseRequiredSlotDate(formData: FormData, timeKey: string) {
    const value = parseSlotDate(formData, timeKey);
    if (!value) {
        throw new Error("Choose a valid date and time.");
    }
    return value;
}

function getPriorityReleaseAt(formData: FormData, now = new Date()) {
    const input = String(formData.get("priorityReleaseAt") ?? "").trim();
    const releaseAt = input
        ? studioDateTimeInputToDate(input)
        : new Date(
              now.getTime() +
                  DEFAULT_PRIORITY_ACCESS_HOURS * 60 * 60 * 1000,
          );

    if (releaseAt <= now) {
        throw new Error("Public release must be in the future.");
    }

    return releaseAt;
}

async function assertNoOverlap(
    admin: ReturnType<typeof createAdminClient>,
    startsAt: Date,
    endsAt: Date | null,
    excludedSlotId?: string,
) {
    const effectiveEnd =
        endsAt ??
        new Date(
            startsAt.getTime() + FALLBACK_SLOT_DURATION_MINUTES * 60 * 1000,
        );

    let query = admin
        .from("availability_slots")
        .select("id, starts_at, ends_at")
        .eq("active", true)
        .lt("starts_at", effectiveEnd.toISOString());

    if (excludedSlotId) query = query.neq("id", excludedSlotId);
    const { data, error } = await query;
    if (error) throw error;
    const overlaps = data?.some((slot) => {
        const existingStart = new Date(slot.starts_at);
        const existingEnd = slot.ends_at
            ? new Date(slot.ends_at)
            : new Date(
                  existingStart.getTime() +
                      FALLBACK_SLOT_DURATION_MINUTES * 60 * 1000,
              );
        return existingStart < effectiveEnd && existingEnd > startsAt;
    });
    if (overlaps) throw new Error("That time overlaps another active slot.");
}

function isSlotOverlapConstraintError(error: {
    code?: string;
    message?: string;
}) {
    return (
        error.code === "23P01" ||
        error.code === "23505" ||
        error.message?.includes("availability_slots_one_active_start_idx") ===
            true
    );
}

export async function createAvailabilitySlotAction(
    _previousState: AvailabilityActionState,
    formData: FormData,
): Promise<AvailabilityActionState> {
    try {
        const { user } = await requireAdmin();
        const startsAt = parseRequiredSlotDate(formData, "startTime");
        const endsAt = parseSlotDate(formData, "endTime", true);
        const status = String(formData.get("status") ?? "available") as Enums<"slot_status">;
        const notes = String(formData.get("notes") ?? "").trim() || null;
        const accessMode =
            String(formData.get("accessMode") ?? "priority") === "everyone"
                ? "everyone"
                : "priority";
        const regularsFirst =
            accessMode === "priority" && status === "available";

        if ((endsAt && startsAt >= endsAt) || startsAt < new Date()) {
            return actionState({ error: "Choose a valid future start time.", success: "" });
        }

        if (!EDITABLE_STATUSES.includes(status)) {
            return actionState({ error: "Invalid slot status.", success: "" });
        }

        const admin = createAdminClient();
        await assertNoOverlap(admin, startsAt, endsAt);
        const publicAccessAt =
            regularsFirst
                ? getPriorityReleaseAt(formData)
                : new Date();
        const { data: slot, error } = await admin
            .from("availability_slots")
            .insert({
                starts_at: startsAt.toISOString(),
                ends_at: endsAt?.toISOString() ?? null,
                status,
                notes,
                created_by: user.id,
                regulars_first: regularsFirst,
                public_access_at: publicAccessAt.toISOString(),
            })
            .select("id")
            .single();

        if (error) {
            console.error("[admin:availability:create]", error);
            if (isSlotOverlapConstraintError(error)) {
                return actionState({
                    error: "That time overlaps another active slot.",
                    success: "",
                });
            }
            return actionState({ error: "We couldn't create that availability slot.", success: "" });
        }
        await syncAvailabilitySlotToGoogleCalendar(slot.id);

        revalidatePath("/admin");
        revalidatePath("/admin/availability");
        revalidatePath("/book");
        revalidatePath("/booking");
        revalidatePath("/dashboard");

        return actionState({ error: "", success: "Availability added." });
    } catch (error) {
        console.error("[admin:availability:create]", error);
        return actionState({ error: error instanceof Error ? error.message : "We couldn't create that availability slot.", success: "" });
    }
}

async function updateAvailabilitySlot(formData: FormData) {
    await requireAdmin();
    const slotId = String(formData.get("slotId") ?? "");
    const startsAt = parseRequiredSlotDate(formData, "startTime");
    const endsAt = parseSlotDate(formData, "endTime", true);
    const status = String(formData.get("status") ?? "available") as Enums<"slot_status">;
    const notes = String(formData.get("notes") ?? "").trim() || null;
    const accessMode =
        String(formData.get("accessMode") ?? "priority") === "everyone"
            ? "everyone"
            : "priority";

    if (!slotId || (endsAt && startsAt >= endsAt) || startsAt < new Date()) {
        throw new Error("Choose a valid future start time.");
    }
    if (!EDITABLE_STATUSES.includes(status)) throw new Error("Invalid slot status.");

    const admin = createAdminClient();
    await assertNoOverlap(admin, startsAt, endsAt, slotId);
    const currentResult = await admin
        .from("availability_slots")
        .select("id")
        .eq("id", slotId)
        .eq("active", true)
        .in("status", EDITABLE_STATUSES)
        .maybeSingle();

    if (currentResult.error || !currentResult.data) {
        console.error(
            "[admin:availability:update-data]",
            currentResult.error,
        );
        throw new Error("Only open or blocked future slots can be edited.");
    }

    const regularsFirst = accessMode === "priority" && status === "available";
    const publicAccessAt = regularsFirst
        ? getPriorityReleaseAt(formData).toISOString()
        : new Date().toISOString();

    const { data, error } = await admin
        .from("availability_slots")
        .update({
            starts_at: startsAt.toISOString(),
            ends_at: endsAt?.toISOString() ?? null,
            status,
            notes,
            regulars_first: regularsFirst,
            public_access_at: publicAccessAt,
        })
        .eq("id", slotId)
        .eq("active", true)
        .in("status", EDITABLE_STATUSES)
        .select("id")
        .maybeSingle();

    if (error || !data) {
        if (error) console.error("[admin:availability:update]", error);
        if (error && isSlotOverlapConstraintError(error)) {
            throw new Error("That time overlaps another active slot.");
        }
        throw new Error("Only open or blocked future slots can be edited.");
    }
    await syncAvailabilitySlotToGoogleCalendar(slotId);

    revalidatePath("/admin");
    revalidatePath("/admin/availability");
    revalidatePath("/book");
    revalidatePath("/booking");
    revalidatePath("/dashboard");
}

export async function updateAvailabilitySlotAction(
    _previousState: AvailabilityActionState,
    formData: FormData,
): Promise<AvailabilityActionState> {
    try {
        await updateAvailabilitySlot(formData);
        return actionState({
            error: "",
            success: "Availability updated.",
        });
    } catch (error) {
        console.error("[admin:availability:update]", error);
        return actionState({
            error:
                error instanceof Error
                    ? error.message
                    : "We couldn't update that availability slot.",
            success: "",
        });
    }
}

export async function deactivateAvailabilitySlotAction(formData: FormData) {
    await requireAdmin();
    const slotId = String(formData.get("slotId") ?? "");

    if (!slotId) return;

    const admin = createAdminClient();
    const { error } = await admin
        .from("availability_slots")
        .update({ active: false })
        .eq("id", slotId)
        .eq("status", "available");

    if (error) {
        console.error("[admin:availability:deactivate]", error);
        throw new Error("We couldn't deactivate that slot.");
    }
    await syncAvailabilitySlotToGoogleCalendar(slotId);

    revalidatePath("/admin/availability");
    revalidatePath("/book");
    revalidatePath("/booking");
    revalidatePath("/dashboard");
}

export async function releasePriorityAvailabilitySlotAction(formData: FormData) {
    await requireAdmin();
    const slotId = String(formData.get("slotId") ?? "");
    if (!slotId) return;

    const admin = createAdminClient();
    const now = new Date().toISOString();
    const { data, error } = await admin
        .from("availability_slots")
        .update({
            regulars_first: false,
            public_access_at: now,
        })
        .eq("id", slotId)
        .eq("active", true)
        .eq("status", "available")
        .eq("regulars_first", true)
        .gt("starts_at", now)
        .gt("public_access_at", now)
        .select("id")
        .maybeSingle();

    if (error || !data) {
        if (error) {
            console.error("[admin:availability:release-priority]", error);
        }
        throw new Error("This priority slot is no longer awaiting release.");
    }

    revalidatePath("/admin");
    revalidatePath("/admin/availability");
    revalidatePath("/book");
    revalidatePath("/booking");
    revalidatePath("/dashboard");
}
