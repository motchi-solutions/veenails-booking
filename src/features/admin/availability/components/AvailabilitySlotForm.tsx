"use client";

import CalendarDateSelector from "@/components/shared/date/CalendarDateSelector";
import AppSelect from "@/components/shared/form/AppSelect";
import TimeSelect from "@/components/shared/form/TimeSelect";
import { useToast } from "@/components/shared/toast/ToastProvider";
import {
    createAvailabilitySlotAction,
    type AvailabilityActionState,
} from "@/features/admin/availability/actions/admin-availability";
import {
    getSlotTimeOptions,
    getStudioDateKey,
} from "@/features/admin/availability/utils/slot-time-options";
import PriorityReleaseDateTimeField from "@/features/admin/availability/components/PriorityReleaseDateTimeField";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";

export default function AvailabilitySlotForm() {
    const today = getStudioDateKey();
    const [selectedDate, setSelectedDate] = useState(today);
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("");
    const [slotStatus, setSlotStatus] = useState("available");
    const [accessMode, setAccessMode] = useState("priority");
    const router = useRouter();
    const { error, success } = useToast();
    const initialState: AvailabilityActionState = {
        error: "",
        success: "",
        messageId: "",
    };
    const [state, formAction, pending] = useActionState(
        createAvailabilitySlotAction,
        initialState,
    );

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
                afterTime: selectedStartTime || null,
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
            error(state.error, "Availability not added");
        }

        if (state.success) {
            success(state.success, "Availability added");
            router.refresh();
        }
    }, [error, router, state.error, state.messageId, state.success, success]);

    return (
        <form action={formAction} className="mt-6 space-y-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(19rem,26rem)_minmax(0,1fr)]">
                <CalendarDateSelector
                    name="date"
                    defaultValue={today}
                    min={today}
                    onChange={setSelectedDate}
                />
                <div className="space-y-4 rounded-3xl bg-background p-4 sm:p-5">
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
                            helperText={
                                startTimeOptions.length === 0
                                    ? "No future times remain on this date."
                                    : undefined
                            }
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
                        <span className="label-text">Slot type</span>
                        <select
                            name="status"
                            className="input-field"
                            value={slotStatus}
                            onChange={(event) =>
                                setSlotStatus(event.target.value)
                            }
                        >
                            <option value="available">Open for booking</option>
                            <option value="blocked">Blocked time</option>
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
                        helperText="Priority access opens to regular customers first. Choose when it becomes public below."
                    />
                    {slotStatus === "available" &&
                    accessMode === "priority" ? (
                        <PriorityReleaseDateTimeField />
                    ) : null}
                    <label className="block space-y-2">
                        <span className="label-text">
                            Internal note (optional)
                        </span>
                        <textarea
                            name="notes"
                            rows={3}
                            className="input-field resize-none"
                            placeholder="Why this time is blocked, special hours…"
                        />
                    </label>
                    <button
                        type="submit"
                        className="btn-primary w-full sm:w-auto"
                        disabled={pending || startTimeOptions.length === 0}
                    >
                        {pending ? "Adding..." : "Add availability"}
                    </button>
                    <p className="text-xs text-muted">
                        Times use 30-minute increments. Slots without an end
                        time reserve a 90-minute window for overlap checks.
                    </p>
                </div>
            </div>
        </form>
    );
}
