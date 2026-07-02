import {
    FiArrowLeft,
    FiArrowRight,
    FiCalendar,
    FiRefreshCw,
} from "react-icons/fi";

export default function AvailabilityCalendarHeader({
    dateRange,
    canGoBack,
    canGoForward,
    canGoToNextAvailable,
    onToday,
    onNextAvailable,
    onPrevious,
    onNext,
}: {
    dateRange: string;
    canGoBack: boolean;
    canGoForward: boolean;
    canGoToNextAvailable: boolean;
    onToday: () => void;
    onNextAvailable: () => void;
    onPrevious: () => void;
    onNext: () => void;
}) {
    return (
        <div className="flex flex-col gap-4 border-b border-border/60 pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
                <p className="text-sm font-semibold text-dark-green">
                    Upcoming openings
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
                    Availability
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                    {dateRange}
                </p>
            </div>

            <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={onNextAvailable}
                        disabled={!canGoToNextAvailable}
                        className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <FiCalendar className="h-4 w-4" aria-hidden="true" />
                        Next available
                    </button>

                    <button
                        type="button"
                        onClick={onToday}
                        disabled={!canGoBack}
                        className="btn-secondary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
                        Today
                    </button>

                    <button
                        type="button"
                        onClick={onPrevious}
                        disabled={!canGoBack}
                        aria-label="Show earlier dates"
                        className="btn-secondary inline-flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <button
                        type="button"
                        onClick={onNext}
                        disabled={!canGoForward}
                        aria-label="Show later dates"
                        className="btn-secondary inline-flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <FiArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>

                <p className="text-xs leading-relaxed text-muted md:hidden">
                    Viewing two days at a time. Use the arrows to see more
                    available dates.
                </p>
            </div>
        </div>
    );
}
