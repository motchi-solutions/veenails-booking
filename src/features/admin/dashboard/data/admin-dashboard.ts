import { requireAdmin } from "@/features/admin/auth/require-admin";
import {
    getAdminAppointments,
    type AdminAppointmentListItem,
} from "@/features/admin/appointments/data/admin-appointments";
import {
    matchesAdminAppointmentView,
    isStudioDayAppointment,
    needsAdminAction,
} from "@/features/admin/appointments/utils/admin-appointment-views";

export type AdminDashboardData = {
    counts: { needsAction: number; upcoming: number; today: number };
    metrics: {
        upcomingConfirmed: number;
        pendingRequests: number;
        pendingCancellations: number;
        pendingDateChanges: number;
        pendingInspoReviews: number;
    };
    upcoming: AdminAppointmentListItem[];
    queue: AdminAppointmentListItem[];
    today: AdminAppointmentListItem[];
};

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
    await requireAdmin();

    const appointments = await getAdminAppointments({ status: "all" });
    const now = Date.now();
    const upcoming = appointments
        .filter((booking) => matchesAdminAppointmentView(booking, "future_appointments", now))
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
    const today = appointments
        .filter((booking) => isStudioDayAppointment(booking, new Date(now)))
        .sort((a, b) => +new Date(a.startsAt!) - +new Date(b.startsAt!));

    return {
        counts: { needsAction: queue.length, upcoming: upcoming.length, today: today.length },
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
                (booking) =>
                    matchesAdminAppointmentView(booking, "pending_date_changes", now),
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
        today,
    };
}
