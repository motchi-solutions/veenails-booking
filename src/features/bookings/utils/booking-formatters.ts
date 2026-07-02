import type { BookingSummary } from "@/features/bookings/types/bookings";
import { getUserTimeZone } from "@/lib/utils/studio-time";

const userTimeZone = getUserTimeZone();

const dateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: userTimeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: userTimeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: userTimeZone,
    hour: "numeric",
    minute: "2-digit",
});

const moneyFormatter = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
});

export function formatBookingDateTime(
    startsAt: string | null,
    endsAt: string | null,
) {
    if (!startsAt) {
        return "Appointment time pending";
    }

    const startDate = new Date(startsAt);

    if (!endsAt) {
        return dateTimeFormatter.format(startDate);
    }

    const endDate = new Date(endsAt);

    return `${dateFormatter.format(startDate)} at ${timeFormatter.format(
        startDate,
    )} - ${timeFormatter.format(endDate)}`;
}

export function formatBookingDate(startsAt: string | null) {
    if (!startsAt) {
        return "Date pending";
    }

    return dateFormatter.format(new Date(startsAt));
}

export function formatBookingTimeRange(
    startsAt: string | null,
    endsAt: string | null,
) {
    if (!startsAt) {
        return "Time pending";
    }

    const startDate = new Date(startsAt);

    if (!endsAt) {
        return timeFormatter.format(startDate);
    }

    const endDate = new Date(endsAt);

    return `${timeFormatter.format(startDate)} - ${timeFormatter.format(endDate)}`;
}

export function formatMoney(amount: number) {
    return moneyFormatter.format(amount);
}

export function formatBookingPrice(amount: number, fallback = "Price pending") {
    return amount > 0 ? formatMoney(amount) : fallback;
}

export function formatBookingReference(reference: string) {
    return reference.startsWith("#") ? reference : `#${reference}`;
}

export function getBookingReferenceHref(reference: string, suffix = "") {
    const normalizedReference = reference.trim().replace(/^#/, "");

    return `/booking/${encodeURIComponent(normalizedReference)}${suffix}`;
}

export function formatShortLineItems(
    lineItems: {
        label: string;
        itemType?: string;
    }[],
) {
    const visibleItems = lineItems
        .filter((item) => item.label && item.itemType !== "discount")
        .map((item) =>
            item.label.replace(/\s+—\s+/g, " · ").replace(/\s+-\s+/g, " · "),
        );

    if (visibleItems.length === 0) {
        return "Service details pending";
    }

    return visibleItems.join(" · ");
}

export function getBookingTotalDisplay(booking: BookingSummary) {
    const isActive =
        booking.status === "held" ||
        booking.status === "requested" ||
        booking.status === "confirmed" ||
        booking.status === "cancellation_requested";

    if (isActive) {
        return {
            label: "Estimated total",
            value: formatBookingPrice(booking.estimatedTotal),
            amount: booking.estimatedTotal,
        };
    }

    const useFinalTotal =
        booking.status === "completed" && booking.finalTotal > 0;
    const amount = useFinalTotal
        ? booking.finalTotal
        : booking.finalTotal > 0
          ? booking.finalTotal
          : booking.estimatedTotal;

    return {
        label: useFinalTotal ? "Final total" : "Total",
        value: formatBookingPrice(amount),
        amount,
    };
}
