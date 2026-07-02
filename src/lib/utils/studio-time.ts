export const STUDIO_TIME_ZONE = "America/Toronto";
export const DEFAULT_PRIORITY_ACCESS_HOURS = 24;

export function getUserTimeZone() {
    if (typeof window === "undefined") {
        return STUDIO_TIME_ZONE;
    }

    try {
        return (
            Intl.DateTimeFormat().resolvedOptions().timeZone ||
            STUDIO_TIME_ZONE
        );
    } catch {
        return STUDIO_TIME_ZONE;
    }
}

const studioAppointmentFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: STUDIO_TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
});

const studioAppointmentTimeFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: STUDIO_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
});

export function formatStudioAppointmentDateTime(value: string | Date) {
    return studioAppointmentFormatter.format(
        typeof value === "string" ? new Date(value) : value,
    );
}

export function formatStudioAppointmentTime(value: string | Date) {
    return studioAppointmentTimeFormatter.format(
        typeof value === "string" ? new Date(value) : value,
    );
}

const studioPartsFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: STUDIO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
});

function partsRecord(date: Date) {
    return Object.fromEntries(
        studioPartsFormatter
            .formatToParts(date)
            .filter((part) => part.type !== "literal")
            .map((part) => [part.type, Number(part.value)]),
    ) as Record<"year" | "month" | "day" | "hour" | "minute", number>;
}

export function getStudioDateKey(date = new Date()) {
    const parts = partsRecord(date);
    return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function getStudioTimeKey(date: Date) {
    const parts = partsRecord(date);
    return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

export function getStudioDateTimeParts(date: Date) {
    return {
        date: getStudioDateKey(date),
        time: getStudioTimeKey(date),
    };
}

export function formatStudioDateTimeInput(date: Date) {
    const parts = getStudioDateTimeParts(date);
    return `${parts.date}T${parts.time}`;
}

export function addDaysToStudioDateKey(dateKey: string, days: number) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        throw new Error("Invalid studio date.");
    }
    const [year, month, day] = dateKey.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day + days, 12));
    return date.toISOString().slice(0, 10);
}

export function addMonthsToStudioDateKey(dateKey: string, months: number) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        throw new Error("Invalid studio date.");
    }

    const [year, month, day] = dateKey.split("-").map(Number);
    const targetMonthStart = new Date(
        Date.UTC(year, month - 1 + months, 1, 12),
    );
    const targetYear = targetMonthStart.getUTCFullYear();
    const targetMonth = targetMonthStart.getUTCMonth();
    const lastDay = new Date(
        Date.UTC(targetYear, targetMonth + 1, 0, 12),
    ).getUTCDate();

    return new Date(
        Date.UTC(targetYear, targetMonth, Math.min(day, lastDay), 12),
    )
        .toISOString()
        .slice(0, 10);
}

export function getStudioDateKeyDay(dateKey: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        throw new Error("Invalid studio date.");
    }
    return new Date(`${dateKey}T12:00:00Z`).getUTCDay();
}

function studioDateTimePartsToDate(
    dateKey: string,
    timeKey: string,
    minuteIncrement: number,
) {
    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(dateKey) ||
        !/^\d{2}:\d{2}$/.test(timeKey)
    ) {
        throw new Error("Choose a valid date and time.");
    }

    const [year, month, day] = dateKey.split("-").map(Number);
    const [hour, minute] = timeKey.split(":").map(Number);
    if (
        minute % minuteIncrement !== 0 ||
        hour > 23 ||
        minute > 59 ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
    ) {
        throw new Error(
            minuteIncrement === 30
                ? "Times must use 30-minute increments."
                : "Choose a valid time.",
        );
    }

    const target = Date.UTC(year, month - 1, day, hour, minute);
    let guess = target;

    for (let pass = 0; pass < 3; pass += 1) {
        const parts = partsRecord(new Date(guess));
        const represented = Date.UTC(
            parts.year,
            parts.month - 1,
            parts.day,
            parts.hour,
            parts.minute,
        );
        guess += target - represented;
    }

    const result = new Date(guess);
    const resultParts = getStudioDateTimeParts(result);
    if (resultParts.date !== dateKey || resultParts.time !== timeKey) {
        throw new Error("That time does not exist in the studio timezone.");
    }

    return result;
}

export function studioDateTimeToDate(dateKey: string, timeKey: string) {
    return studioDateTimePartsToDate(dateKey, timeKey, 30);
}

export function studioDateTimeInputToDate(value: string) {
    const match = value.match(
        /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?$/,
    );

    if (!match) {
        throw new Error("Choose a valid public release date and time.");
    }

    return studioDateTimePartsToDate(match[1], match[2], 1);
}
