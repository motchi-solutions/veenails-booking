import Link from "next/link";
import AdminAppointmentRow from "@/features/admin/appointments/components/AdminAppointmentRow";
import AdminEmptyState from "@/features/admin/components/AdminEmptyState";
import AdminPageHeader from "@/features/admin/components/AdminPageHeader";
import type { AdminDashboardData } from "@/features/admin/dashboard/data/admin-dashboard";
import { FiArrowRight } from "react-icons/fi";

export default function AdminDashboardPage({
    data,
}: {
    data: AdminDashboardData;
}) {
    const metrics = [
        {
            label: "Upcoming confirmed",
            value: data.metrics.upcomingConfirmed,
            view: "upcoming_confirmed",
        },
        {
            label: "Pending requests",
            value: data.metrics.pendingRequests,
            view: "pending_requests",
        },
        {
            label: "Pending cancellations",
            value: data.metrics.pendingCancellations,
            view: "pending_cancellations",
        },
        {
            label: "Date changes",
            value: data.metrics.pendingDateChanges,
            view: "pending_date_changes",
        },
        {
            label: "Inspo to review",
            value: data.metrics.pendingInspoReviews,
            view: "inspo_reviews",
        },
    ] as const;

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                <AdminPageHeader
                    eyebrow="Today"
                    title="Admin Overview"
                    description="A calm operating view for appointments, deposits, cancellations, and design inspo."
                />
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    {metrics.map((metric) => (
                        <Link
                            key={metric.view}
                            href={`/admin/appointments?view=${metric.view}`}
                            aria-label={`View ${metric.label.toLowerCase()} appointments`}
                            className="group rounded-2xl border border-transparent bg-background p-4 transition hover:border-dark-green/25 hover:bg-surface-2 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-green/30"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm text-muted">
                                        {metric.label}
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold text-foreground">
                                        {metric.value}
                                    </p>
                                </div>
                                <FiArrowRight
                                    className="mt-1 h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-dark-green"
                                    aria-hidden="true"
                                />
                            </div>
                            <p className="mt-3 text-xs font-semibold text-dark-green">
                                View appointments
                            </p>
                        </Link>
                    ))}
                </div>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Link
                        href="/admin/appointments/new"
                        className="btn-primary"
                    >
                        Create appointment
                    </Link>
                    <Link href="/admin/appointments" className="btn-secondary">
                        Manage appointments
                    </Link>
                    <Link href="/admin/availability" className="btn-secondary">
                        Add availability
                    </Link>
                    <Link href="/admin/users" className="btn-secondary">
                        View users
                    </Link>
                </div>
            </section>
            {data.current ? (
                <section className="rounded-3xl border border-dark-green/20 bg-surface-2 p-5 shadow-sm sm:p-7">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-green">
                        Now / next
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-foreground">
                        Next appointment
                    </h2>
                    <div className="mt-4">
                        <AdminAppointmentRow booking={data.current} />
                    </div>
                </section>
            ) : null}
            <section className="grid gap-6 xl:grid-cols-2">
                <div className="space-y-3 rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                    <h2 className="text-lg font-semibold text-foreground">
                        Needs action
                    </h2>
                    {data.queue.length > 0 ? (
                        data.queue.map((booking) => (
                            <AdminAppointmentRow
                                key={booking.id}
                                booking={booking}
                                quickAction
                            />
                        ))
                    ) : (
                        <AdminEmptyState message="No pending actions right now." />
                    )}
                </div>
                <div className="space-y-3 rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                    <h2 className="text-lg font-semibold text-foreground">
                        Future appointments
                    </h2>
                    {data.upcoming.length > 0 ? (
                        data.upcoming.map((booking) => (
                            <AdminAppointmentRow
                                key={booking.id}
                                booking={booking}
                            />
                        ))
                    ) : (
                        <AdminEmptyState message="No upcoming appointments." />
                    )}
                </div>
            </section>
        </div>
    );
}
