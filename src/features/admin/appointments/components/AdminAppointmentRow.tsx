import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import type { AdminAppointmentListItem } from "@/features/admin/appointments/data/admin-appointments";
import AdminStatusPill from "@/features/admin/components/AdminStatusPill";
import {
    formatBookingDateTime,
    formatContactMethod,
    formatInstagramHandle,
    formatMoney,
} from "@/features/admin/components/admin-formatters";
import {
    getBookingStatusLabel,
} from "@/features/bookings/utils/booking-status";
import AdminBookingWorkflowButton from "@/features/admin/appointments/components/AdminBookingWorkflowButton";

function QuickAction({ booking }: { booking: AdminAppointmentListItem }) {
    return (
        <>
            <AdminBookingWorkflowButton
                booking={booking}
                className="btn-primary inline-flex items-center justify-center"
            />
            {booking.inspoStatus === "sent" ? (
                <Link
                    href={`/admin/appointments/${booking.id}#design-inspo`}
                    className="btn-secondary inline-flex items-center justify-center"
                >
                    Review inspo
                </Link>
            ) : null}
            {booking.latestCancellationStatus === "pending" ? (
                <Link
                    href={`/admin/appointments/${booking.id}`}
                    className="btn-secondary inline-flex items-center justify-center"
                >
                    Review cancellation
                </Link>
            ) : null}
            {booking.pendingDateChangeRequest ? (
                <Link
                    href={`/admin/appointments/${booking.id}#date-change-request`}
                    className="btn-secondary inline-flex items-center justify-center"
                >
                    Review date change
                </Link>
            ) : null}
        </>
    );
}

export default function AdminAppointmentRow({
    booking,
    quickAction = false,
}: {
    booking: AdminAppointmentListItem;
    quickAction?: boolean;
}) {
    const instagramHandle = booking.clientInstagramHandle;
    const preferredContact = booking.clientPreferredContactMethod;
    const contactValue =
        preferredContact === "email"
            ? booking.clientEmail
            : preferredContact === "instagram"
              ? instagramHandle
                  ? formatInstagramHandle(instagramHandle)
                  : null
              : null;
    const fallbackContact =
        booking.clientEmail ??
        (instagramHandle ? formatInstagramHandle(instagramHandle) : null) ??
        booking.clientPhone ??
        "Contact details unavailable";
    const contact = preferredContact
        ? `${formatContactMethod(preferredContact)} · ${contactValue ?? fallbackContact}`
        : fallbackContact;
    const total =
        booking.finalTotal > 0 ? booking.finalTotal : booking.estimatedTotal;

    return (
        <article className="rounded-2xl border border-border/60 bg-background p-4 transition hover:border-dark-green/30 hover:shadow-sm sm:p-5">
            <div className="my-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="font-semibold text-dark-green">
                        #{booking.bookingReference}
                    </span>
                    <AdminStatusPill
                        label={getBookingStatusLabel(booking.status)}
                    />
                    {booking.isExternalClient ? (
                        <AdminStatusPill label="External client" />
                    ) : null}
                    {booking.pendingDateChangeRequest ? (
                        <AdminStatusPill label="Date change requested" />
                    ) : null}
                </div>
                <p className="text-sm font-semibold text-foreground sm:max-w-52 sm:shrink-0 sm:text-right">
                    {formatBookingDateTime(booking.startsAt, booking.endsAt)}
                </p>
            </div>
            <div className="my-2 min-w-0 space-y-1">
                <p className="wrap-break-word font-medium text-foreground">
                    {booking.clientDisplayName}
                </p>
                <p className="wrap-break-word text-sm text-muted">{contact}</p>
            </div>
            <div className="my-2 grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-4">
                <div className="min-w-0">
                    <p className="line-clamp-2 text-sm leading-relaxed text-foreground">
                        {booking.serviceSummary}
                    </p>
                </div>
                <p className="text-sm text-muted sm:shrink-0 sm:text-right">
                    Amount due:{" "}
                    <span className="font-semibold text-foreground">
                        {formatMoney(total)}
                    </span>
                </p>
            </div>
            <div
                className={[
                    "my-4 grid gap-2",
                    quickAction ? "sm:grid-cols-2" : "",
                ].join(" ")}
            >
                {quickAction ? <QuickAction booking={booking} /> : null}
                <Link
                    href={`/admin/appointments/${booking.id}`}
                    className="btn-secondary inline-flex items-center justify-center gap-2 only:sm:col-span-2"
                >
                    View details <FiArrowRight aria-hidden="true" />
                </Link>
            </div>
        </article>
    );
}
