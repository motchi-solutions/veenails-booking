"use client";

import { formatStudioDateTimeInput } from "@/lib/utils/studio-time";

export default function PriorityReleaseDateTimeField({
    defaultValue = "",
    required = false,
    now = new Date(),
}: {
    defaultValue?: string;
    required?: boolean;
    now?: Date;
}) {
    return (
        <label className="block space-y-2">
            <span className="label-text">Public release date and time</span>
            <input
                type="datetime-local"
                name="priorityReleaseAt"
                defaultValue={defaultValue}
                min={formatStudioDateTimeInput(now)}
                required={required}
                className="input-field"
            />
            <span className="block text-xs leading-relaxed text-muted">
                Toronto time.{" "}
                {required
                    ? "Choose when these slots become visible to all clients."
                    : "Leave blank to default to 24 hours from now."}
            </span>
        </label>
    );
}
