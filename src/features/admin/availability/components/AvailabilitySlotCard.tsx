"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiArrowRight, FiEdit2, FiX } from "react-icons/fi";
import {
    deactivateAvailabilitySlotAction,
    releasePriorityAvailabilitySlotAction,
} from "@/features/admin/availability/actions/admin-availability";
import EditAvailabilitySlotForm from "@/features/admin/availability/components/EditAvailabilitySlotForm";
import type { AdminAvailabilitySlot } from "@/features/admin/availability/data/admin-availability";
import AdminStatusPill from "@/features/admin/components/AdminStatusPill";
import { formatDateTime } from "@/features/admin/components/admin-formatters";
import { formatBookingTimeRange } from "@/features/bookings/utils/booking-formatters";
import { retryGoogleCalendarSyncAction } from "@/features/integrations/google-calendar/actions/integration";
import AvailabilitySlotSelectionCheckbox from "@/features/admin/availability/components/AvailabilitySlotSelectionCheckbox";

function friendlyStatus(slot: AdminAvailabilitySlot) {
    if (!slot.active) return "Inactive";
    if (slot.status === "available") return "Open";
    if (slot.status === "blocked") return "Blocked";
    if (slot.status === "confirmed") return "Booked";
    if (slot.status === "held") return "On hold";
    return slot.status.replaceAll("_", " ");
}

export default function AvailabilitySlotCard({
    slot,
    history = false,
    selected = false,
    onSelectedChange,
}: {
    slot: AdminAvailabilitySlot;
    history?: boolean;
    selected?: boolean;
    onSelectedChange?: (checked: boolean) => void;
}) {
    const [editing, setEditing] = useState(false);
    const canEdit =
        !history &&
        slot.active &&
        (slot.status === "available" || slot.status === "blocked");
    const canReleasePriority = !history && slot.canReleasePriority;

    useEffect(() => {
        if (!editing) return;

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === "Escape") setEditing(false);
        }

        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [editing]);

    return (
        <article
            className={`overflow-hidden rounded-2xl border bg-background transition-colors ${
                editing || selected
                    ? "border-dark-green/40"
                    : "border-border/60"
            }`}
        >
            <div className="flex flex-col gap-4 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                    {slot.bulkSelectable && onSelectedChange ? (
                        <div className="mb-3">
                            <AvailabilitySlotSelectionCheckbox
                                slotId={slot.id}
                                checked={selected}
                                onCheckedChange={onSelectedChange}
                            />
                        </div>
                    ) : null}
                    <p className="font-semibold text-foreground">
                        {formatDateTime(slot.startsAt)}
                        {slot.endsAt
                            ? ` · ${formatBookingTimeRange(slot.startsAt, slot.endsAt)}`
                            : ""}
                    </p>
                    {slot.regularsFirst ||
                    (slot.status === "available" && slot.active) ? (
                        <p className="mt-1 text-sm text-muted">
                            {slot.regularsFirst
                                ? slot.priorityReleased
                                    ? `Priority access · Released to everyone ${formatDateTime(slot.publicAccessAt)}`
                                    : `Priority access · Public after ${formatDateTime(slot.publicAccessAt)}`
                                : "Released to everyone"}
                        </p>
                    ) : null}
                    {slot.notes ? (
                        <p className="mt-1 wrap-break-word text-sm text-muted">
                            {slot.notes}
                        </p>
                    ) : null}
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                        <span>
                            Google Calendar:{" "}
                            {slot.googleSyncState === "synced"
                                ? "Synced"
                                : slot.googleSyncState === "issue"
                                  ? "Sync issue"
                                  : slot.googleSyncState === "not_connected"
                                    ? "Not connected"
                                    : "Pending sync"}
                        </span>
                        {slot.googleSyncState === "issue" ? (
                            <form action={retryGoogleCalendarSyncAction}>
                                <input type="hidden" name="entity" value="slot" />
                                <input
                                    type="hidden"
                                    name="entityId"
                                    value={slot.id}
                                />
                                <button
                                    type="submit"
                                    className="font-semibold text-dark-green underline-offset-2 hover:underline"
                                >
                                    Retry Google sync
                                </button>
                            </form>
                        ) : null}
                    </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="mb-1 self-start sm:mb-0 sm:self-center">
                        <AdminStatusPill
                            label={friendlyStatus(slot)}
                            tone={!slot.active ? "danger" : "neutral"}
                        />
                    </div>

                    {canReleasePriority ? (
                        <form action={releasePriorityAvailabilitySlotAction}>
                            <input
                                type="hidden"
                                name="slotId"
                                value={slot.id}
                            />
                            <button
                                type="submit"
                                className="btn-primary w-full"
                            >
                                Release to everyone now
                            </button>
                        </form>
                    ) : null}

                    {canEdit ? (
                        <button
                            type="button"
                            onClick={() => setEditing((value) => !value)}
                            aria-expanded={editing}
                            aria-controls={`edit-slot-${slot.id}`}
                            className="btn-secondary inline-flex items-center justify-center gap-2 sm:min-w-34"
                        >
                            {editing ? (
                                <FiX className="h-4 w-4" aria-hidden="true" />
                            ) : (
                                <FiEdit2
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                            )}
                            {editing ? "Close editor" : "Edit slot"}
                        </button>
                    ) : null}

                    {slot.bookingId ? (
                        <Link
                            href={`/admin/appointments/${slot.bookingId}`}
                            className="btn-primary inline-flex items-center justify-center gap-2"
                        >
                            View booking details
                            <FiArrowRight
                                className="h-4 w-4"
                                aria-hidden="true"
                            />
                        </Link>
                    ) : null}

                    {!history && slot.status === "available" && slot.active ? (
                        <form action={deactivateAvailabilitySlotAction}>
                            <input
                                type="hidden"
                                name="slotId"
                                value={slot.id}
                            />
                            <button
                                type="submit"
                                className="btn-secondary w-full"
                            >
                                Deactivate
                            </button>
                        </form>
                    ) : null}
                </div>
            </div>

            {editing ? (
                <EditAvailabilitySlotForm
                    slot={slot}
                    onClose={() => setEditing(false)}
                />
            ) : null}
        </article>
    );
}
