import { getUserTimeZone } from "@/lib/utils/studio-time";

export type DashboardCalendarSlot = {
    id: string;
    startsAt: string;
    endsAt: string | null;
    available: boolean;
};

export type DashboardCalendarDay = {
    date: string;
    label: string;
    dayName: string;
    dayNumber: string;
    monthLabel: string;
    isToday: boolean;
    slots: DashboardCalendarSlot[];
};

const rangeFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: getUserTimeZone(),
    hour: "numeric",
    minute: "2-digit",
});

export function formatVisibleDateRange(days: DashboardCalendarDay[]) {
    const firstDay = days[0];
    const lastDay = days.at(-1);

    if (!firstDay || !lastDay) {
        return "No dates";
    }

    const firstDate = new Date(`${firstDay.date}T12:00:00Z`);
    const lastDate = new Date(`${lastDay.date}T12:00:00Z`);
    const year = lastDate.getUTCFullYear();

    if (firstDay.date === lastDay.date) {
        return `${rangeFormatter.format(firstDate)}, ${year}`;
    }

    return `${rangeFormatter.format(firstDate)} - ${rangeFormatter.format(
        lastDate,
    )}, ${year}`;
}

export function formatSlotTime(startsAt: string, endsAt: string | null) {
    const start = timeFormatter.format(new Date(startsAt));

    if (!endsAt) {
        return start;
    }

    return `${start} - ${timeFormatter.format(new Date(endsAt))}`;
}

export function sortSlotsByStartTime(slots: DashboardCalendarSlot[]) {
    return slots
        .slice()
        .sort(
            (a, b) =>
                new Date(a.startsAt).getTime() -
                new Date(b.startsAt).getTime(),
        );
}
