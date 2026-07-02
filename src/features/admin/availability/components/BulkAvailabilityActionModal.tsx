"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import ModalShell from "@/components/shared/ui/ModalShell";
import { useToast } from "@/components/shared/toast/ToastProvider";
import {
    bulkAvailabilityAction,
    type BulkAvailabilityActionState,
} from "@/features/admin/availability/actions/bulk-availability-actions";
import type { AdminAvailabilitySlot } from "@/features/admin/availability/data/admin-availability";
import {
    bulkAvailabilityActionCopy,
    getPriorityAccessActionLabel,
    isSlotEligibleForBulkAction,
    type BulkAvailabilityAction,
} from "@/features/admin/availability/utils/bulk-availability";
import PriorityReleaseDateTimeField from "@/features/admin/availability/components/PriorityReleaseDateTimeField";

const initialState: BulkAvailabilityActionState = {
    success: false,
    error: "",
    messageId: "",
    appliedCount: 0,
    skippedCount: 0,
    skippedReasons: [],
    syncFailedCount: 0,
};

export default function BulkAvailabilityActionModal({
    action,
    selectedSlots,
    nowIso,
    onClose,
    onComplete,
}: {
    action: BulkAvailabilityAction;
    selectedSlots: AdminAvailabilitySlot[];
    nowIso: string;
    onClose: () => void;
    onComplete: () => void;
}) {
    const [state, formAction, pending] = useActionState(
        bulkAvailabilityAction,
        initialState,
    );
    const toast = useToast();
    const router = useRouter();
    const now = new Date(nowIso).getTime();
    const eligibleCount = selectedSlots.filter((slot) =>
        isSlotEligibleForBulkAction(slot, action, now),
    ).length;
    const skippedCount = selectedSlots.length - eligibleCount;
    const copy = bulkAvailabilityActionCopy[action];
    const actionLabel =
        action === "priority"
            ? getPriorityAccessActionLabel(selectedSlots, now)
            : copy.label;

    useEffect(() => {
        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === "Escape" && !pending) {
                onClose();
            }
        }

        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [onClose, pending]);

    useEffect(() => {
        if (!state.messageId) {
            return;
        }

        if (state.error) {
            toast.error(state.error, "Bulk action failed");
            return;
        }

        const skippedDetail = state.skippedReasons[0]
            ? ` ${state.skippedReasons[0]}`
            : "";
        const summary = `${state.appliedCount} updated · ${state.skippedCount} skipped.${skippedDetail}`;
        if (state.syncFailedCount > 0) {
            toast.warning(
                `${summary}. ${state.syncFailedCount} Google Calendar sync ${state.syncFailedCount === 1 ? "needs" : "need"} retrying.`,
                "Slots updated",
            );
        } else {
            toast.success(summary, "Slots updated");
        }

        onComplete();
        router.refresh();
    }, [
        onComplete,
        router,
        state.appliedCount,
        state.error,
        state.messageId,
        state.skippedCount,
        state.skippedReasons,
        state.syncFailedCount,
        toast,
    ]);

    return (
        <ModalShell
            title={action === "priority" ? `${actionLabel}?` : copy.title}
            description={copy.description}
            onClose={() => {
                if (!pending) onClose();
            }}
        >
            <form action={formAction} className="space-y-4">
                <input type="hidden" name="bulkAction" value={action} />
                <input
                    type="hidden"
                    name="slotIds"
                    value={JSON.stringify(
                        selectedSlots.map((slot) => slot.id),
                    )}
                />

                <div className="grid gap-3 rounded-2xl bg-background p-4 sm:grid-cols-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                            Selected
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                            {selectedSlots.length}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                            Eligible
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                            {eligibleCount}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                            Unchanged
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                            {skippedCount}
                        </p>
                    </div>
                </div>

                {action === "priority" ? (
                    <div className="rounded-2xl bg-surface-2 p-4">
                        <PriorityReleaseDateTimeField
                            required
                            now={new Date(nowIso)}
                        />
                    </div>
                ) : null}

                {skippedCount > 0 ? (
                    <p className="rounded-2xl border border-border/60 p-4 text-sm leading-relaxed text-muted">
                        {skippedCount} selected{" "}
                        {skippedCount === 1 ? "slot is" : "slots are"} not
                        eligible for this action and will remain unchanged.
                    </p>
                ) : null}

                {action === "deactivate" ? (
                    <label className="block space-y-2">
                        <span className="label-text">
                            Deactivation reason (optional)
                        </span>
                        <textarea
                            name="deactivationReason"
                            maxLength={240}
                            className="input-field min-h-24 resize-y leading-relaxed"
                            placeholder="Add shared context for these slots…"
                        />
                    </label>
                ) : null}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={onClose}
                        disabled={pending}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className={
                            action === "deactivate"
                                ? "btn-danger"
                                : "btn-primary"
                        }
                        disabled={pending || eligibleCount === 0}
                    >
                        {pending
                            ? "Updating…"
                            : `${actionLabel} (${eligibleCount})`}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}
