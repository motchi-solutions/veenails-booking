"use client";

import type { AdminAvailabilitySlot } from "@/features/admin/availability/data/admin-availability";
import {
    BULK_AVAILABILITY_ACTIONS,
    bulkAvailabilityActionCopy,
    getPriorityAccessActionLabel,
    type BulkAvailabilityAction,
} from "@/features/admin/availability/utils/bulk-availability";

export default function AvailabilitySelectionToolbar({
    selectedSlots,
    nowIso,
    onAction,
    onClear,
}: {
    selectedSlots: AdminAvailabilitySlot[];
    nowIso: string;
    onAction: (action: BulkAvailabilityAction) => void;
    onClear: () => void;
}) {
    if (!selectedSlots.length) {
        return null;
    }

    const now = new Date(nowIso).getTime();
    const hasPrioritySlots = selectedSlots.some(
        (slot) =>
            slot.regularsFirst &&
            new Date(slot.publicAccessAt).getTime() > now,
    );
    const visibleActions = BULK_AVAILABILITY_ACTIONS.filter(
        (action) =>
            action === "deactivate" ||
            (action === "release" && hasPrioritySlots) ||
            action === "priority",
    );
    const priorityActionLabel = getPriorityAccessActionLabel(
        selectedSlots,
        now,
    );

    return (
        <div className="sticky top-3 z-20 rounded-2xl border border-border/70 bg-surface/95 p-3 shadow-lg shadow-black/5 backdrop-blur sm:p-4">
            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p
                        className="text-sm font-semibold text-foreground"
                        role="status"
                        aria-live="polite"
                    >
                        {selectedSlots.length}{" "}
                        {selectedSlots.length === 1 ? "slot" : "slots"} selected
                    </p>
                    <button
                        type="button"
                        className="self-start text-sm font-semibold text-dark-green underline-offset-2 hover:underline sm:self-auto"
                        onClick={onClear}
                    >
                        Clear selection
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {visibleActions.map((action) => (
                        <button
                            key={action}
                            type="button"
                            className={
                                action === "deactivate"
                                    ? "btn-danger w-full"
                                    : action === "release"
                                      ? "btn-primary w-full"
                                      : "btn-secondary w-full"
                            }
                            onClick={() => onAction(action)}
                        >
                            {action === "priority"
                                ? priorityActionLabel
                                : bulkAvailabilityActionCopy[action].label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
