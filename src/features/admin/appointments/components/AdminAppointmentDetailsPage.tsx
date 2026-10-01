import AppointmentTotals from "@/features/bookings/components/AppointmentTotals";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { markInspoReviewedAction } from "@/features/admin/appointments/actions/admin-appointments";
import AdminPageHeader from "@/features/admin/components/AdminPageHeader";
import AdminStatusPill from "@/features/admin/components/AdminStatusPill";
import {
    formatBookingDateTime,
    formatContactMethod,
    formatDateTime,
    formatInstagramHandle,
    formatMoney,
} from "@/features/admin/components/admin-formatters";
import type { AdminAppointmentDetails } from "@/features/admin/appointments/data/admin-appointments";
import {
    getBookingStatusLabel,
    getDepositStatusLabel,
} from "@/features/bookings/utils/booking-status";
import AdminAppointmentEditor from "@/features/admin/appointments/components/AdminAppointmentEditor";
import AdminAppointmentActions from "@/features/admin/appointments/components/AdminAppointmentActions";
import AdminDiscountEditor from "@/features/admin/appointments/components/AdminDiscountEditor";
import AdminCancellationSummary from "@/features/admin/appointments/components/AdminCancellationSummary";
import AdminCreditForm from "@/features/admin/credits/components/AdminCreditForm";
import { calculateAppointmentTotals } from "@/features/bookings/utils/appointment-totals";
import { retryGoogleCalendarSyncAction } from "@/features/integrations/google-calendar/actions/integration";
import AdminDateChangeRequest from "@/features/admin/appointments/components/AdminDateChangeRequest";

function ActionButton({
    children,
    variant = "secondary",
}: {
    children: React.ReactNode;
    variant?: "primary" | "secondary";
}) {
    return (
        <button
            type="submit"
            className={variant === "primary" ? "btn-primary" : "btn-secondary"}
        >
            {children}
        </button>
    );
}

function HiddenBookingId({ id }: { id: string }) {
    return <input type="hidden" name="bookingId" value={id} />;
}

export default function AdminAppointmentDetailsPage({
    booking,
}: {
    booking: AdminAppointmentDetails;
}) {
    const isCompleted = booking.status === "completed";
    const instagramOnly =
        !booking.clientEmail && Boolean(booking.clientInstagramHandle);
    const totalsInput = booking.completionTotals;
    const ledger = calculateAppointmentTotals(totalsInput);

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-sm">
                <div className="p-5 sm:p-7">
                    <Link
                        href="/admin/appointments"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-dark-green transition hover:text-pink-main"
                    >
                        <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to appointments
                    </Link>
                    <div className="mt-5">
                        <AdminPageHeader
                            eyebrow="Appointment"
                            title={`#${booking.bookingReference}`}
                            description={`${formatBookingDateTime(
                                booking.startsAt,
                                booking.endsAt,
                            )} · ${booking.clientDisplayName}`}
                        />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <AdminStatusPill
                            label={getBookingStatusLabel(booking.status)}
                        />
                        <AdminStatusPill
                            label={getDepositStatusLabel(booking.depositStatus)}
                        />
                        {!isCompleted && booking.inspoPrompt ? (
                            <AdminStatusPill
                                label={`Inspo ${booking.inspoPrompt.status}`}
                            />
                        ) : null}
                        {booking.isExternalClient ? (
                            <AdminStatusPill label="External client" />
                        ) : null}
                    </div>
                    {!isCompleted ? <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span>
                            Google Calendar:{" "}
                            {booking.googleSyncState === "synced"
                                ? "Synced"
                                : booking.googleSyncState === "issue"
                                  ? "Sync issue"
                                  : booking.googleSyncState === "not_connected"
                                    ? "Not connected"
                                    : "Pending sync"}
                        </span>
                        {booking.googleSyncState === "issue" ? (
                            <form action={retryGoogleCalendarSyncAction}>
                                <input
                                    type="hidden"
                                    name="entity"
                                    value="booking"
                                />
                                <input
                                    type="hidden"
                                    name="entityId"
                                    value={booking.id}
                                />
                                <button
                                    type="submit"
                                    className="font-semibold text-dark-green underline-offset-2 hover:underline"
                                >
                                    Retry Google sync
                                </button>
                            </form>
                        ) : null}
                    </div> : null}
                    {!isCompleted && booking.googleSyncState === "issue" ? (
                        <p className="mt-2 text-xs text-muted">
                            Calendar sync needs attention. Your booking was still
                            saved.
                        </p>
                    ) : null}
                    {!isCompleted && instagramOnly ? (
                        <div className="mt-4 border-l-4 border-pink-main bg-pink-main/10 px-4 py-3 text-sm">
                            <p className="font-semibold text-foreground">
                                Email unavailable
                            </p>
                            <p className="mt-1 text-muted">
                                Contact via Instagram:{" "}
                                {booking.clientInstagramHandle
                                    ? formatInstagramHandle(
                                          booking.clientInstagramHandle,
                                      )
                                    : null}
                            </p>
                        </div>
                    ) : null}
                </div>
            </section>

            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] xl:gap-6">
                <aside className="min-w-0 space-y-5 lg:row-start-1 lg:col-start-2" aria-label="Appointment totals">
                    <section className="rounded-3xl bg-dark-green p-4 text-white sm:p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                            {isCompleted ? "Final balance" : "Amount to charge"}
                        </p>
                        <p className="mt-2 text-3xl font-semibold tabular-nums sm:text-4xl">
                            {formatMoney(ledger.amountDue)}
                        </p>
                        {booking.courtesyApplied ? <p className="mt-2 text-sm text-white/90">Complimentary · Loyalty courtesy applied</p> : null}
                        <div className="mt-4"><AppointmentTotals input={totalsInput} /></div>
                    </section>
                    {!isCompleted ? <AdminDiscountEditor booking={booking} /> : null}
                    {!isCompleted && booking.userId ? (
                        <div className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-foreground">
                                Issue credit
                            </h2>
                            <p className="mt-1 text-sm text-muted">
                                Link a manual credit to this appointment.
                            </p>
                            <div className="mt-4">
                                <AdminCreditForm
                                    userId={booking.userId}
                                    bookingId={booking.id}
                                />
                            </div>
                        </div>
                    ) : null}
                </aside>
                <div className="min-w-0 space-y-5 lg:col-start-1 lg:row-start-1">
                    {!isCompleted ? <>
                        <AdminCancellationSummary booking={booking} />
                        <AdminDateChangeRequest booking={booking} />
                        <AdminAppointmentActions booking={booking} />
                    </> : null}
                    <div className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                        <h2 className="text-lg font-semibold text-foreground">
                            Client
                        </h2>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <Summary
                                label="Type"
                                value={
                                    booking.isExternalClient
                                        ? "External client"
                                        : "App customer"
                                }
                            />
                            <Summary
                                label="Name"
                                value={booking.clientDisplayName}
                            />
                            <Summary
                                label="Email"
                                value={booking.clientEmail}
                            />
                            <Summary
                                label="Phone"
                                value={booking.clientPhone}
                            />
                            <Summary
                                label="Instagram"
                                value={
                                    booking.clientInstagramHandle
                                        ? formatInstagramHandle(
                                              booking.clientInstagramHandle,
                                          )
                                        : null
                                }
                            />
                            <Summary
                                label="Preferred contact"
                                value={formatContactMethod(
                                    booking.clientPreferredContactMethod,
                                )}
                            />
                        </div>
                        {booking.userId ? (
                            <Link
                                href={`/admin/users/${booking.userId}`}
                                className="btn-secondary mt-4 inline-flex"
                            >
                                View customer profile
                            </Link>
                        ) : null}
                    </div>

                    {!isCompleted ? <AdminAppointmentEditor booking={booking} /> : null}
                    {isCompleted ? (
                        <>
                            <details className="rounded-3xl border border-border/60 bg-surface p-4 sm:p-5">
                                <summary className="cursor-pointer text-sm font-semibold">Payment history</summary>
                                <div className="mt-4"><PaymentsPanel booking={booking} /></div>
                            </details>
                            {booking.inspoPrompt?.inspoSentAt ? (
                                <details className="rounded-3xl border border-border/60 bg-surface p-4 sm:p-5">
                                    <summary className="cursor-pointer text-sm font-semibold">Saved design inspiration</summary>
                                    <div className="mt-4"><DesignInspo booking={booking} /></div>
                                </details>
                            ) : null}
                            <details className="rounded-3xl border border-border/60 bg-surface p-4 sm:p-5">
                                <summary className="cursor-pointer text-sm font-semibold">Appointment history</summary>
                                <div className="mt-4"><HistoryLog booking={booking} /></div>
                            </details>
                        </>
                    ) : (
                        <>
                            <PaymentsPanel booking={booking} />
                            <DesignInspo booking={booking} />
                            <HistoryLog booking={booking} />
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}

function Summary({
    label,
    value,
}: {
    label: string;
    value: string | null | undefined;
}) {
    return (
        <div className="rounded-2xl bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                {label}
            </p>
            <p className="mt-2 wrap-break-word text-sm font-semibold text-foreground">
                {value || "Not provided"}
            </p>
        </div>
    );
}

function PaymentsPanel({ booking }: { booking: AdminAppointmentDetails }) {
    return (
        <div className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Payments</h2>
            <div className="mt-4 space-y-3">
                {booking.payments.length > 0 ? (
                    booking.payments.map((payment) => (
                        <div
                            key={payment.id}
                            className="rounded-2xl bg-background p-4"
                        >
                            <p className="text-sm font-semibold text-foreground">
                                {formatMoney(payment.amount)}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                                {payment.paymentType} · {payment.method} ·{" "}
                                {payment.status}
                            </p>
                            {payment.paidAt ? (
                                <p className="mt-1 text-xs text-muted">
                                    Paid {formatDateTime(payment.paidAt)}
                                </p>
                            ) : null}
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted">No payments yet.</p>
                )}
            </div>
        </div>
    );
}

function DesignInspo({ booking }: { booking: AdminAppointmentDetails }) {
    const inspo = booking.inspoPrompt;

    return (
        <div
            id="design-inspo"
            className="scroll-mt-24 rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7"
        >
            <h2 className="text-lg font-semibold text-foreground">
                Design inspo
            </h2>
            {inspo ? (
                <div className="mt-4 space-y-3">
                    <AdminStatusPill label={inspo.status} />
                    <pre className="whitespace-pre-wrap rounded-2xl bg-background p-4 text-sm text-foreground">
                        {inspo.messageText}
                    </pre>
                    {inspo.instagramUrl ? (
                        <Link
                            href={inspo.instagramUrl}
                            target="_blank"
                            className="btn-secondary"
                        >
                            Open Instagram
                        </Link>
                    ) : null}
                    <div className="grid gap-3 text-sm text-muted sm:grid-cols-2">
                        <p>Copied: {formatDateTime(inspo.copiedAt)}</p>
                        <p>Opened: {formatDateTime(inspo.openedAt)}</p>
                        <p>Sent: {formatDateTime(inspo.inspoSentAt)}</p>
                        <p>Reviewed: {formatDateTime(inspo.reviewedAt)}</p>
                    </div>
                    {booking.status !== "completed" && inspo.status === "sent" ? (
                        <form action={markInspoReviewedAction}>
                            <HiddenBookingId id={booking.id} />
                            <input
                                type="hidden"
                                name="promptId"
                                value={inspo.id}
                            />
                            <ActionButton variant="primary">
                                Mark inspo reviewed
                            </ActionButton>
                        </form>
                    ) : null}
                </div>
            ) : (
                <p className="mt-3 text-sm text-muted">No inspo prompt yet.</p>
            )}
        </div>
    );
}

function HistoryLog({ booking }: { booking: AdminAppointmentDetails }) {
    return (
        <div className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-semibold text-foreground">
                Appointment Event Log
            </h2>
            <div className="mt-4 space-y-3">
                {booking.events.length > 0 ? (
                    booking.events.map((event) => (
                        <div
                            key={event.id}
                            className="rounded-2xl bg-background p-4"
                        >
                            <p className="text-sm uppercase font-semibold text-foreground">
                                {event.eventType.replaceAll("_", " ")}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                                {formatDateTime(event.createdAt)} ·{" "}
                                {event.actorType}
                            </p>
                            {event.message ? (
                                <p className="mt-2 text-sm text-muted">
                                    {event.message}
                                </p>
                            ) : null}
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted">No history yet.</p>
                )}
            </div>
        </div>
    );
}
