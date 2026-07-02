"use client";

import { FiX } from "react-icons/fi";
import { useRouter } from "next/navigation";
import CalendarDateSelector from "@/components/shared/date/CalendarDateSelector";
import AppSelect from "@/components/shared/form/AppSelect";
import TimeSelect from "@/components/shared/form/TimeSelect";
import { useToast } from "@/components/shared/toast/ToastProvider";
import {
    updateAvailabilitySlotAction,
    type AvailabilityActionState,
} from "@/features/admin/availability/actions/admin-availability";
import type { AdminAvailabilitySlot } from "@/features/admin/availability/data/admin-availability";
import {
    getSlotTimeOptions,
    getStudioDateKey,
    getStudioDateTimeParts,
} from "@/features/admin/availability/utils/slot-time-options";
import PriorityReleaseDateTimeField from "@/features/admin/availability/components/PriorityReleaseDateTimeField";
import { formatStudioDateTimeInput } from "@/lib/utils/studio-time";
import {
    useActionState,
    useEffect,
    useMemo,
    useState,
} from "react";

const initialState: AvailabilityActionState = {
    error: "",
    success: "",
    messageId: "",
};

export default function EditAvailabilitySlotForm({
    slot,
    onClose,
}: {
    slot: AdminAvailabilitySlot;
    onClose: () => void;
}) {
    const router = useRouter();
    const { error: showError, success: showSuccess } = useToast();
    const [state, formAction, pending] = useActionState(
        updateAvailabilitySlotAction,
        initialState,
    );
    const start = getStudioDateTimeParts(new Date(slot.startsAt));
    const end = slot.endsAt
        ? getStudioDateTimeParts(new Date(slot.endsAt))
        : { date: start.date, time: "" };
    const [selectedDate, setSelectedDate] = useState(start.date);
    const [startTime, setStartTime] = useState(start.time);
    const [endTime, setEndTime] = useState(end.time);
    const [slotStatus, setSlotStatus] = useState(slot.status);
    const [accessMode, setAccessMode] = useState(
        slot.regularsFirst ? "priority" : "everyone",
    );
    const releaseDefault =
        slot.regularsFirst &&
        !slot.priorityReleased
            ? formatStudioDateTimeInput(new Date(slot.publicAccessAt))
            : "";
    const startTimeOptions = useMemo(
        () => getSlotTimeOptions({ selectedDate }),
        [selectedDate],
    );
    const selectedStartTime = startTimeOptions.some(
        (option) => option.value === startTime,
    )
        ? startTime
        : (startTimeOptions[0]?.value ?? "");
    const endTimeOptions = useMemo(
        () =>
            getSlotTimeOptions({
                selectedDate,
                afterTime: selectedStartTime,
            }),
        [selectedDate, selectedStartTime],
    );
    const selectedEndTime = endTimeOptions.some(
        (option) => option.value === endTime,
    )
        ? endTime
        : "";

    useEffect(() => {
        if (!state.messageId) return;

        if (state.error) {
            showError(state.error, "Availability not updated");
            return;
        }

        if (state.success) {
            showSuccess(state.success, "Availability updated");
            router.refresh();
            window.setTimeout(onClose, 0);
        }
    }, [
        onClose,
        router,
        showError,
        showSuccess,
        state.error,
        state.messageId,
        state.success,
    ]);

    return (
        <div
            id={`edit-slot-${slot.id}`}
            className="border-t border-border/60 bg-surface-2/50 px-4 py-5 sm:px-5 sm:py-6"
        >
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h3 className="font-semibold text-foreground">Edit slot</h3>
                    <p className="mt-1 text-sm text-muted">
                        Change the date, time, status, or internal note.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close slot editor"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-surface text-foreground transition hover:border-dark-green/30 hover:text-dark-green"
                >
                    <FiX className="h-5 w-5" aria-hidden="true" />
                </button>
            </div>

            <form action={formAction}>
                <input type="hidden" name="slotId" value={slot.id} />
                <div className="grid items-start gap-5 lg:grid-cols-[minmax(18rem,25rem)_minmax(0,1fr)]">
                    <CalendarDateSelector
                        name="date"
                        defaultValue={start.date}
                        min={getStudioDateKey()}
                        onChange={setSelectedDate}
                    />

                    <div className="space-y-4 rounded-2xl border border-border/60 bg-surface p-4 sm:p-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <TimeSelect
                                name="startTime"
                                label="Start time"
                                value={selectedStartTime}
                                options={startTimeOptions}
                                onChange={(value) => {
                                    setStartTime(value);
                                    setEndTime("");
                                }}
                                disabled={startTimeOptions.length === 0}
                            />
                            <TimeSelect
                                name="endTime"
                                label="End time (optional)"
                                value={selectedEndTime}
                                options={endTimeOptions}
                                onChange={setEndTime}
                                optional
                                disabled={!selectedStartTime}
                            />
                        </div>

                        <label className="block space-y-2">
                            <span className="label-text">Status</span>
                            <select
                                name="status"
                                value={slotStatus}
                                onChange={(event) =>
                                    setSlotStatus(
                                        event.target
                                            .value as AdminAvailabilitySlot["status"],
                                    )
                                }
                                className="input-field"
                            >
                                <option value="available">Open</option>
                                <option value="blocked">Blocked</option>
                            </select>
                        </label>

                        <AppSelect
                            name="accessMode"
                            label="Booking access"
                            value={accessMode}
                            onChange={setAccessMode}
                            options={[
                                {
                                    value: "priority",
                                    label: "Priority access",
                                },
                                {
                                    value: "everyone",
                                    label: "Everyone immediately",
                                },
                            ]}
                            helperText="Choose “Everyone immediately” to release this slot now, or set a custom public release below."
                        />
                        {slotStatus === "available" &&
                        accessMode === "priority" ? (
                            <PriorityReleaseDateTimeField
                                defaultValue={releaseDefault}
                            />
                        ) : null}

                        <label className="block space-y-2">
                            <span className="label-text">Internal note</span>
                            <textarea
                                name="notes"
                                defaultValue={slot.notes ?? ""}
                                rows={3}
                                className="input-field resize-none"
                                placeholder="Optional note about this slot"
                            />
                        </label>

                        <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-secondary"
                                disabled={pending}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={pending}
                            >
                                {pending ? "Saving..." : "Save changes"}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
