import type { AdminAppointmentListItem } from "@/features/admin/appointments/data/admin-appointments";

export const adminAppointmentViews = {
    upcoming_confirmed: {
        label: "Upcoming confirmed",
        description: "Confirmed appointments scheduled for the future.",
    },
    pending_requests: {
        label: "Pending requests",
        description:
            "Booking requests waiting for a decision, including overdue requests.",
    },
    pending_cancellations: {
        label: "Pending cancellations",
        description: "Cancellation requests waiting for an admin decision.",
    },
    pending_date_changes: {
        label: "Date changes",
        description: "Client date and time change requests waiting for review.",
    },
    inspo_reviews: {
        label: "Inspo to review",
        description: "Design inspiration marked as sent and ready to review.",
    },
} as const;

export type AdminAppointmentView = keyof typeof adminAppointmentViews;

export function isAdminAppointmentView(
    value: string,
): value is AdminAppointmentView {
    return Object.hasOwn(adminAppointmentViews, value);
}

export function matchesAdminAppointmentView(
    booking: AdminAppointmentListItem,
    view: AdminAppointmentView,
    now: number,
) {
    const startsAt = booking.startsAt
        ? new Date(booking.startsAt).getTime()
        : null;
    if (view === "upcoming_confirmed") {
        return (
            booking.status === "confirmed" &&
            startsAt !== null &&
            startsAt >= now
        );
    }

    if (view === "pending_requests") {
        return booking.status === "requested" || booking.status === "held";
    }

    if (view === "pending_cancellations") {
        return booking.latestCancellationStatus === "pending";
    }

    if (view === "pending_date_changes") {
        return booking.pendingDateChangeRequest !== null;
    }

    return booking.inspoStatus === "sent";
}

export function needsAdminAction(
    booking: AdminAppointmentListItem,
    now: number,
) {
    const startsAt = booking.startsAt
        ? new Date(booking.startsAt).getTime()
        : null;
    const started = startsAt !== null && startsAt <= now;
    const unresolvedRequest =
        booking.status === "requested" || booking.status === "held";
    const unresolvedDeposit =
        booking.status === "confirmed" &&
        (booking.depositStatus === "pending" ||
            booking.depositStatus === "marked_sent");
    const readyToClose = booking.status === "confirmed" && started;

    return (
        unresolvedRequest ||
        unresolvedDeposit ||
        readyToClose ||
        booking.latestCancellationStatus === "pending" ||
        booking.pendingDateChangeRequest !== null ||
        booking.inspoStatus === "sent"
    );
}
