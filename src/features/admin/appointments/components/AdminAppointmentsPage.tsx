import AdminAppointmentRow from "@/features/admin/appointments/components/AdminAppointmentRow";
import type { AdminAppointmentListItem } from "@/features/admin/appointments/data/admin-appointments";
import AdminEmptyState from "@/features/admin/components/AdminEmptyState";
import AdminPageHeader from "@/features/admin/components/AdminPageHeader";
import Link from "next/link";
import {
    adminAppointmentViews,
    isStudioDayAppointment,
    matchesAdminAppointmentView,
    needsAdminAction,
    type AdminAppointmentView,
} from "@/features/admin/appointments/utils/admin-appointment-views";

function AppointmentList({
    bookings,
    quickAction = false,
}: {
    bookings: AdminAppointmentListItem[];
    quickAction?: boolean;
}) {
    return bookings.length ? (
        bookings.map((booking) => (
            <AdminAppointmentRow
                key={booking.id}
                booking={booking}
                quickAction={quickAction}
            />
        ))
    ) : (
        <AdminEmptyState message="No appointments in this section." />
    );
}

function Section({
    title,
    description,
    bookings,
    quickAction = false,
    collapsed = false,
}: {
    title: string;
    description: string;
    bookings: AdminAppointmentListItem[];
    quickAction?: boolean;
    collapsed?: boolean;
}) {
    if (collapsed)
        return (
            <details className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                <summary className="cursor-pointer font-semibold text-foreground">
                    {title}{" "}
                    <span className="ml-2 text-sm font-normal text-muted">
                        {bookings.length}
                    </span>
                </summary>
                <p className="mt-2 text-sm text-muted">{description}</p>
                <div className="mt-4 space-y-3">
                    <AppointmentList bookings={bookings} />
                </div>
            </details>
        );
    return (
        <section className="space-y-3 rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
            <div>
                <h2 className="text-lg font-semibold text-foreground">
                    {title}
                </h2>
                <p className="mt-1 text-sm text-muted">{description}</p>
            </div>
            <AppointmentList bookings={bookings} quickAction={quickAction} />
        </section>
    );
}

const UPCOMING = new Set([
    "held",
    "requested",
    "confirmed",
    "cancellation_requested",
]);
const CLOSED = new Set(["cancelled", "rejected", "no_show", "expired"]);

export default function AdminAppointmentsPage({
    appointments,
    search,
    status,
    view,
    nowIso,
}: {
    appointments: AdminAppointmentListItem[];
    search: string;
    status: string;
    view: AdminAppointmentView | null;
    nowIso: string;
}) {
    const now = new Date(nowIso).getTime();
    const isPast = (booking: AdminAppointmentListItem) =>
        Boolean(
            booking.startsAt &&
            +(booking.endsAt
                ? new Date(booking.endsAt)
                : new Date(booking.startsAt)) < now,
        );
    const isToday = (booking: AdminAppointmentListItem) =>
        isStudioDayAppointment(booking, new Date(nowIso));
    const byNewest = (
        a: AdminAppointmentListItem,
        b: AdminAppointmentListItem,
    ) =>
        +new Date(b.startsAt ?? b.createdAt) -
        +new Date(a.startsAt ?? a.createdAt);
    const needsAction = appointments.filter((booking) =>
        needsAdminAction(booking, now),
    );
    const current = appointments
        .filter(isToday)
        .sort((a, b) => +new Date(a.startsAt!) - +new Date(b.startsAt!));
    const upcoming = appointments
        .filter(
            (booking) =>
                UPCOMING.has(booking.status) &&
                !isToday(booking) &&
                booking.startsAt &&
                +new Date(booking.startsAt) > now,
        )
        .sort((a, b) => +new Date(a.startsAt!) - +new Date(b.startsAt!));
    const closed = appointments
        .filter((booking) => CLOSED.has(booking.status))
        .sort(byNewest);
    const past = appointments
        .filter(
            (booking) =>
                (booking.status === "completed" || isPast(booking)) &&
                !CLOSED.has(booking.status),
        )
        .sort(byNewest);
    const focused = view
        ? appointments
              .filter((booking) =>
                  matchesAdminAppointmentView(booking, view, now),
              )
              .sort(
                  (a, b) =>
                      +new Date(a.startsAt ?? a.createdAt) -
                      +new Date(b.startsAt ?? b.createdAt),
              )
        : [];

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                <AdminPageHeader
                    eyebrow="Admin"
                    title="Appointments"
                    description="See what is happening now, handle requests, and revisit appointment history."
                    actionHref="/admin/appointments/new"
                    actionLabel="Create appointment"
                />
                {view ? (
                    <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-surface-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-semibold text-foreground">
                                {adminAppointmentViews[view].label}
                            </p>
                            <p className="mt-1 text-sm text-muted">
                                {adminAppointmentViews[view].description}
                            </p>
                        </div>
                        <Link
                            href="/admin/appointments"
                            className="btn-secondary shrink-0"
                        >
                            Clear quick filter
                        </Link>
                    </div>
                ) : null}
                <form className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
                    <input
                        name="q"
                        defaultValue={search}
                        className="input-field"
                        placeholder="Search reference or customer"
                    />
                    <select
                        name="status"
                        defaultValue={status}
                        className="input-field"
                    >
                        <option value="all">All statuses</option>
                        <option value="active">Active</option>
                        <option value="requested">Requested</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <button className="btn-secondary" type="submit">
                        Apply
                    </button>
                </form>
            </section>
            {view ? (
                <Section
                    title={adminAppointmentViews[view].label}
                    description={`${focused.length} matching appointment${focused.length === 1 ? "" : "s"}.`}
                    bookings={focused}
                    quickAction
                />
            ) : (
                <>
                    <Section
                        title="Today"
                        description="All of today's studio appointments, from opening through close."
                        bookings={current}
                        quickAction
                    />
                    <Section
                        title="Needs action"
                        description="Unresolved requests, deposits, and appointments ready to close stay here even when their scheduled time has passed."
                        bookings={needsAction}
                        quickAction
                    />
                    <Section
                        title="Upcoming"
                        description="Active future appointments in chronological order."
                        bookings={upcoming}
                    />
                    <Section
                        title="Cancelled / no-show"
                        description="Closed appointments stay accessible without cluttering upcoming work."
                        bookings={closed}
                        collapsed
                    />
                    <Section
                        title="Past history"
                        description="Completed visits and appointments whose scheduled time has passed."
                        bookings={past}
                        collapsed
                    />
                </>
            )}
        </div>
    );
}
