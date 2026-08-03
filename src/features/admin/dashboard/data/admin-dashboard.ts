import { requireAdmin } from "@/features/admin/auth/require-admin";
import {
    getAdminAppointments,
    type AdminAppointmentListItem,
} from "@/features/admin/appointments/data/admin-appointments";
import {
    matchesAdminAppointmentView,
    needsAdminAction,
} from "@/features/admin/appointments/utils/admin-appointment-views";

export type AdminDashboardData = {
    metrics: {
        upcomingConfirmed: number;
        pendingRequests: number;
        pendingCancellations: number;
        pendingDateChanges: number;
        pendingInspoReviews: number;
    };
    upcoming: AdminAppointmentListItem[];
    queue: AdminAppointmentListItem[];
    current: AdminAppointmentListItem | null;
};

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
    await requireAdmin();

    const appointments = await getAdminAppointments({ status: "active" });
    const now = Date.now();
    const upcoming = appointments
        .filter(
            (booking) =>
                !booking.startsAt ||
                new Date(booking.startsAt).getTime() >= now,
        )
        .sort((a, b) => {
            const aTime = a.startsAt ? new Date(a.startsAt).getTime() : 0;
            const bTime = b.startsAt ? new Date(b.startsAt).getTime() : 0;
            return aTime - bTime;
        });
    const queue = appointments
        .filter((booking) => needsAdminAction(booking, now))
        .sort((a, b) => {
            const aTime = a.startsAt
                ? new Date(a.startsAt).getTime()
                : Number.NEGATIVE_INFINITY;
            const bTime = b.startsAt
                ? new Date(b.startsAt).getTime()
                : Number.NEGATIVE_INFINITY;
            return aTime - bTime;
        });
    const current = upcoming.find((booking) => {
        if (!booking.startsAt) return false;
        const startsAt = new Date(booking.startsAt).getTime();
        const endsAt = booking.endsAt ? new Date(booking.endsAt).getTime() : startsAt + 90 * 60_000;
        return startsAt <= now && endsAt >= now;
    }) ?? upcoming.find((booking) => booking.startsAt && new Date(booking.startsAt).getTime() - now <= 90 * 60_000) ?? null;

    return {
        metrics: {
            upcomingConfirmed: upcoming.filter(
                (booking) =>
                    matchesAdminAppointmentView(
                        booking,
                        "upcoming_confirmed",
                        now,
                    ),
            ).length,
            pendingRequests: appointments.filter(
                (booking) =>
                    matchesAdminAppointmentView(
                        booking,
                        "pending_requests",
                        now,
                    ),
            ).length,
            pendingCancellations: appointments.filter(
                (booking) =>
                    matchesAdminAppointmentView(
                        booking,
                        "pending_cancellations",
                        now,
                    ),
            ).length,
            pendingDateChanges: appointments.filter(
                (booking) => booking.pendingDateChangeRequest !== null,
            ).length,
            pendingInspoReviews: appointments.filter(
                (booking) =>
                    matchesAdminAppointmentView(
                        booking,
                        "inspo_reviews",
                        now,
                    ),
            ).length,
        },
        upcoming: upcoming.slice(0, 6),
        queue: queue.slice(0, 8),
        current,
    };
}
