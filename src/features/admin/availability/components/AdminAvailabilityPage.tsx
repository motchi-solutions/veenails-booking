"use client";

import { useEffect, useMemo, useState } from "react";

import AvailabilitySlotForm from "@/features/admin/availability/components/AvailabilitySlotForm";
import type { AdminAvailabilitySlot } from "@/features/admin/availability/data/admin-availability";
import AdminEmptyState from "@/features/admin/components/AdminEmptyState";
import AdminPageHeader from "@/features/admin/components/AdminPageHeader";
import AvailabilitySlotCard from "@/features/admin/availability/components/AvailabilitySlotCard";
import AvailabilitySelectionToolbar from "@/features/admin/availability/components/AvailabilitySelectionToolbar";
import BulkAvailabilityActionModal from "@/features/admin/availability/components/BulkAvailabilityActionModal";
import type { BulkAvailabilityAction } from "@/features/admin/availability/utils/bulk-availability";

function SlotList({
    slots,
    history = false,
    emptyMessage,
    selectedIds,
    onSelectedChange,
    onToggleAll,
}: {
    slots: AdminAvailabilitySlot[];
    history?: boolean;
    emptyMessage?: string;
    selectedIds: Set<string>;
    onSelectedChange: (slotId: string, checked: boolean) => void;
    onToggleAll: (slotIds: string[], selected: boolean) => void;
}) {
    if (!slots.length)
        return (
            <AdminEmptyState
                message={
                    emptyMessage ??
                    (history
                        ? "No past availability yet."
                        : "No future availability yet.")
                }
            />
        );

    const selectableIds = slots
        .filter((slot) => slot.bulkSelectable)
        .map((slot) => slot.id);
    const allSelected =
        selectableIds.length > 0 &&
        selectableIds.every((slotId) => selectedIds.has(slotId));

    return (
        <>
            {selectableIds.length > 0 ? (
                <button
                    type="button"
                    className="btn-secondary inline-flex w-full items-center justify-center sm:w-auto"
                    onClick={() => onToggleAll(selectableIds, !allSelected)}
                >
                    {allSelected ? "Clear visible selection" : "Select all visible"}
                </button>
            ) : null}
            {slots.map((slot) => (
                <AvailabilitySlotCard
                    key={slot.id}
                    slot={slot}
                    history={history}
                    selected={selectedIds.has(slot.id)}
                    onSelectedChange={
                        slot.bulkSelectable
                            ? (checked) => onSelectedChange(slot.id, checked)
                            : undefined
                    }
                />
            ))}
        </>
    );
}

export default function AdminAvailabilityPage({
    slots,
    nowIso,
}: {
    slots: AdminAvailabilitySlot[];
    nowIso: string;
}) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(
        () => new Set(),
    );
    const [modalAction, setModalAction] =
        useState<BulkAvailabilityAction | null>(null);
    const now = new Date(nowIso).getTime();
    const future = slots
        .filter(
            (slot) => slot.active && new Date(slot.startsAt).getTime() >= now,
        )
        .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
    const futureUnbooked = future.filter((slot) => !slot.bookingId);
    const futureBooked = future.filter((slot) => Boolean(slot.bookingId));
    const past = slots.filter(
        (slot) =>
            slot.active && new Date(slot.startsAt).getTime() < now,
    );
    const validSelectableIds = useMemo(
        () =>
            new Set(
                slots
                    .filter((slot) => slot.bulkSelectable)
                    .map((slot) => slot.id),
            ),
        [slots],
    );
    const visibleSelectedIds = useMemo(
        () =>
            new Set(
                [...selectedIds].filter((slotId) =>
                    validSelectableIds.has(slotId),
                ),
            ),
        [selectedIds, validSelectableIds],
    );
    const selectedSlots = slots.filter((slot) =>
        visibleSelectedIds.has(slot.id),
    );
    const hasSelection = visibleSelectedIds.size > 0;

    useEffect(() => {
        if (!hasSelection) {
            return;
        }

        function clearSelectionOnEscape(event: KeyboardEvent) {
            if (event.key !== "Escape") {
                return;
            }

            setSelectedIds(new Set());
            setModalAction(null);
        }

        window.addEventListener("keydown", clearSelectionOnEscape);
        return () =>
            window.removeEventListener("keydown", clearSelectionOnEscape);
    }, [hasSelection]);

    function setSlotSelected(slotId: string, checked: boolean) {
        setSelectedIds((current) => {
            const next = new Set(
                [...current].filter((id) => validSelectableIds.has(id)),
            );
            if (checked) next.add(slotId);
            else next.delete(slotId);
            return next;
        });
    }

    function toggleAll(slotIds: string[], selected: boolean) {
        setSelectedIds((current) => {
            const next = new Set(
                [...current].filter((id) => validSelectableIds.has(id)),
            );
            for (const slotId of slotIds) {
                if (selected) next.add(slotId);
                else next.delete(slotId);
            }
            return next;
        });
    }

    function clearSelection() {
        setSelectedIds(new Set());
    }

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                <AdminPageHeader
                    eyebrow="Admin"
                    title="Availability"
                    description="Add open hours or block time without wrestling a browser date picker."
                />
                <AvailabilitySlotForm />
            </section>
            <section className="space-y-3 rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">
                        Future availability
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                        Open and blocked time coming up.
                    </p>
                </div>
                <AvailabilitySelectionToolbar
                    selectedSlots={selectedSlots}
                    nowIso={nowIso}
                    onAction={setModalAction}
                    onClear={clearSelection}
                />
                <SlotList
                    slots={futureUnbooked}
                    emptyMessage="No unbooked future availability yet."
                    selectedIds={visibleSelectedIds}
                    onSelectedChange={setSlotSelected}
                    onToggleAll={toggleAll}
                />
            </section>
            {futureBooked.length > 0 ? (
                <details className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                    <summary className="cursor-pointer font-semibold text-foreground">
                        Booked future slots
                        <span className="ml-2 text-sm font-normal text-muted">
                            {futureBooked.length} slots
                        </span>
                    </summary>
                    <p className="mt-2 text-sm text-muted">
                        Upcoming availability tied to a booking or request.
                    </p>
                    <div className="mt-4 space-y-3">
                        <SlotList
                            slots={futureBooked}
                            selectedIds={visibleSelectedIds}
                            onSelectedChange={setSlotSelected}
                            onToggleAll={toggleAll}
                        />
                    </div>
                </details>
            ) : null}
            <details className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                <summary className="cursor-pointer font-semibold text-foreground">
                    Past availability{" "}
                    <span className="ml-2 text-sm font-normal text-muted">
                        {past.length} slots
                    </span>
                </summary>
                <div className="mt-4 space-y-3">
                    <SlotList
                        slots={past}
                        history
                        selectedIds={visibleSelectedIds}
                        onSelectedChange={setSlotSelected}
                        onToggleAll={toggleAll}
                    />
                </div>
            </details>
            {modalAction ? (
                <BulkAvailabilityActionModal
                    key={`${modalAction}-${[...visibleSelectedIds].join(",")}`}
                    action={modalAction}
                    selectedSlots={selectedSlots}
                    nowIso={nowIso}
                    onClose={() => setModalAction(null)}
                    onComplete={() => {
                        setModalAction(null);
                        clearSelection();
                    }}
                />
            ) : null}
        </div>
    );
}
