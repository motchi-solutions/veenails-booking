"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { FiCalendar } from "react-icons/fi";

import AvailabilityCalendarDayColumn from "./AvailabilityCalendarDayColumn";
import AvailabilityCalendarHeader from "./AvailabilityCalendarHeader";
import {
    formatVisibleDateRange,
    type DashboardCalendarDay,
} from "./availability-calendar-utils";

function subscribeToResize(callback: () => void) {
    window.addEventListener("resize", callback);

    return () => window.removeEventListener("resize", callback);
}

function getVisibleDayCountSnapshot() {
    if (typeof window === "undefined") {
        return 2;
    }

    if (window.innerWidth >= 1280) {
        return 4;
    }

    if (window.innerWidth >= 768) {
        return 3;
    }

    return 2;
}

function getServerVisibleDayCountSnapshot() {
    return 2;
}

function useVisibleDayCount() {
    return useSyncExternalStore(
        subscribeToResize,
        getVisibleDayCountSnapshot,
        getServerVisibleDayCountSnapshot,
    );
}

export default function DashboardAvailabilityCalendar({
    days,
}: {
    days: DashboardCalendarDay[];
}) {
    const visibleCount = useVisibleDayCount();
    const [pageOffset, setPageOffset] = useState(0);
    const normalizedDays = useMemo(() => days ?? [], [days]);
    const todayIndex = normalizedDays.findIndex((day) => day.isToday);
    const baseStartIndex = todayIndex >= 0 ? todayIndex : 0;
    const maxOffset = Math.max(0, normalizedDays.length - 1 - baseStartIndex);
    const boundedPageOffset = Math.min(pageOffset, maxOffset);
    const currentStartIndex = baseStartIndex + boundedPageOffset;
    const visibleDays = normalizedDays.slice(
        currentStartIndex,
        currentStartIndex + visibleCount,
    );
    const dateRange = formatVisibleDateRange(visibleDays);
    const canGoBack = boundedPageOffset > 0;
    const canGoForward =
        currentStartIndex + visibleCount < normalizedDays.length;
    const hasAnySlots = normalizedDays.some((day) => day.slots.length > 0);
    const hasVisibleSlots = visibleDays.some((day) => day.slots.length > 0);
    const nextAvailableIndex = normalizedDays.findIndex((day) =>
        day.slots.some((slot) => slot.available),
    );

    if (!hasAnySlots) {
        return (
            <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-main/10 text-pink-main">
                        <FiCalendar className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">
                            Upcoming openings
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted">
                            No appointment openings are listed right now.
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-6 lg:p-7">
            <AvailabilityCalendarHeader
                dateRange={dateRange}
                canGoBack={canGoBack}
                canGoForward={canGoForward}
                canGoToNextAvailable={nextAvailableIndex >= 0}
                onToday={() => setPageOffset(0)}
                onNextAvailable={() =>
                    setPageOffset(
                        nextAvailableIndex >= baseStartIndex
                            ? nextAvailableIndex - baseStartIndex
                            : 0,
                    )
                }
                onPrevious={() =>
                    setPageOffset(Math.max(0, boundedPageOffset - visibleCount))
                }
                onNext={() =>
                    setPageOffset(
                        Math.min(maxOffset, boundedPageOffset + visibleCount),
                    )
                }
            />

            {!hasVisibleSlots ? (
                <div className="mt-5 rounded-3xl border border-dashed border-border/60 bg-background p-5 text-sm text-muted">
                    No openings in this date range. Try the next dates.
                </div>
            ) : null}

            <div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
                {visibleDays.map((day) => (
                    <AvailabilityCalendarDayColumn key={day.date} day={day} />
                ))}
            </div>
        </section>
    );
}
