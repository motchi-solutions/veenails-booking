import type { AdminAvailabilitySlot } from "@/features/admin/availability/data/admin-availability";

export const BULK_AVAILABILITY_ACTIONS = [
    "release",
    "priority",
    "deactivate",
] as const;

export type BulkAvailabilityAction =
    (typeof BULK_AVAILABILITY_ACTIONS)[number];

export const bulkAvailabilityActionCopy: Record<
    BulkAvailabilityAction,
    {
        label: string;
        title: string;
        description: string;
    }
> = {
    release: {
        label: "Release to everyone",
        title: "Release slots to everyone?",
        description:
            "Eligible priority slots will become visible to all clients immediately.",
    },
    priority: {
        label: "Set priority access",
        title: "Set priority access?",
        description:
            "Choose exactly when these slots become visible to general clients.",
    },
    deactivate: {
        label: "Deactivate selected slots",
        title: "Deactivate selected slots?",
        description:
            "Eligible slots will be hidden from booking and their availability events removed from Google Calendar.",
    },
};

export function getPriorityAccessActionLabel(
    slots: AdminAvailabilitySlot[],
    now: number,
) {
    const hasExpiredPriority = slots.some(
        (slot) =>
            slot.regularsFirst &&
            new Date(slot.publicAccessAt).getTime() <= now,
    );
    const hasPublicAccess = slots.some((slot) => !slot.regularsFirst);
    const hasActivePriority = slots.some(
        (slot) =>
            slot.regularsFirst &&
            new Date(slot.publicAccessAt).getTime() > now,
    );

    if (
        [hasExpiredPriority, hasPublicAccess, hasActivePriority].filter(Boolean)
            .length > 1
    ) {
        return "Set / reset priority access";
    }

    if (hasExpiredPriority) {
        return "Reset Priority Access Window";
    }

    if (hasActivePriority) {
        return "Change priority release time";
    }

    return "Set priority access";
}

export function isSlotEligibleForBulkAction(
    slot: AdminAvailabilitySlot,
    action: BulkAvailabilityAction,
    now: number,
) {
    if (
        !slot.bulkSelectable ||
        new Date(slot.startsAt).getTime() <= now ||
        slot.status !== "available"
    ) {
        return false;
    }

    if (!slot.active) {
        return false;
    }

    if (action === "release") {
        return (
            slot.regularsFirst &&
            new Date(slot.publicAccessAt).getTime() > now
        );
    }

    if (action === "priority") {
        return true;
    }

    return true;
}
