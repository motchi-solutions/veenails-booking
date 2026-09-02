import type { AdminAppointmentDetails } from "@/features/admin/appointments/data/admin-appointments";

const ACTIVE_STATUSES = new Set([
    "held",
    "requested",
    "confirmed",
    "cancellation_requested",
]);

export type AdminAppointmentActionRules = {
    canConfirm: boolean;
    canConfirmDeposit: boolean;
    canComplete: boolean;
    canMarkNoShow: boolean;
    canReject: boolean;
    canCancel: boolean;
    canReviewCancellation: boolean;
    canReviewInspo: boolean;
    terminal: boolean;
};

export function getAdminAppointmentActionRules(
    booking: AdminAppointmentDetails,
): AdminAppointmentActionRules {
    const now = new Date(booking.operationalNow).getTime();
    const startsAt = booking.startsAt
        ? new Date(booking.startsAt).getTime()
        : null;
    const currentOrPast = startsAt !== null && startsAt <= now;
    const active = ACTIVE_STATUSES.has(booking.status);
    const terminal = !active;
    const pendingCancellation =
        booking.status === "cancellation_requested" &&
        booking.cancellationRequest?.status === "pending";

    return {
        canConfirm:
            (booking.status === "requested" || booking.status === "held"),
        canConfirmDeposit:
            (booking.status === "held" ||
                booking.status === "requested" ||
                booking.status === "confirmed") &&
            (booking.depositStatus === "pending" ||
                booking.depositStatus === "marked_sent"),
        canComplete: booking.status === "confirmed" && currentOrPast,
        canMarkNoShow: booking.status === "confirmed" && currentOrPast,
        canReject:
            (booking.status === "requested" || booking.status === "held"),
        canCancel:
            booking.status === "requested" ||
            booking.status === "held" ||
            booking.status === "confirmed",
        canReviewCancellation: pendingCancellation,
        canReviewInspo: booking.inspoPrompt?.status === "sent",
        terminal,
    };
}
