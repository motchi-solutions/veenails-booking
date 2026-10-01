import Link from "next/link";
import { FiArrowLeft, FiEdit3 } from "react-icons/fi";

import SummaryRow from "@/components/shared/ui/SummaryRow";
import AppointmentTotals from "@/features/bookings/components/AppointmentTotals";
import BookingStatusBadge from "@/features/bookings/components/BookingStatusBadge";
import BookingCancellationCard from "@/features/bookings/details/components/BookingCancellationCard";
import type { BookingDetailsData } from "@/features/bookings/details/data/booking-details";
import BookingInspoInstagramStep from "@/features/bookings/inspo/components/BookingInspoInstagramStep";
import { shouldShowBookingInspoSubmission } from "@/features/bookings/inspo/data/booking-inspo";
import {
    formatBookingDateTime,
    formatBookingReference,
    getBookingReferenceHref,
    getBookingTotalDisplay,
} from "@/features/bookings/utils/booking-formatters";
import {
    canEditBookingOnline,
    isUpcomingBooking,
} from "@/features/bookings/utils/booking-status";
import {
    getBookingDiscounts,
    getBookingSubtotalBeforeDiscount,
} from "@/features/bookings/utils/booking-pricing";
import { calculateBookingLedger } from "@/features/bookings/utils/booking-ledger";
import BookingDetailsHeader from "./BookingDetailsHeader";
import { summaryRows } from "../data/summary-rows";
import BookingCancellationSummary from "@/features/bookings/details/components/BookingCancellationSummary";
import StudioArrivalContactCard from "./StudioArrivalContactCard";

export default function BookingDetailsPage({
    data,
}: {
    data: BookingDetailsData;
}) {
    const booking = data.summary;
    const totalDisplay = getBookingTotalDisplay(booking);
    const canEdit = canEditBookingOnline(booking.status, booking.startsAt);
    const discounts = getBookingDiscounts(booking);
    const subtotalBeforeDiscount = getBookingSubtotalBeforeDiscount(booking);
    const discountTotal = discounts.reduce(
        (total, discount) => total + discount.amount,
        0,
    );
    const discountedSubtotal = Math.max(
        0,
        subtotalBeforeDiscount - discountTotal,
    );
    const ledger = calculateBookingLedger({
        courtesyApplied: data.courtesyApplied,
        appointmentTotal: data.courtesyApplied
            ? discountedSubtotal + data.bookingFeeAmount
            : totalDisplay.amount,
        payments: data.payments.map((payment) => ({
            type: payment.type,
            status: payment.status,
            amount: payment.amount,
        })),
    });
    const creditUsed = ledger.creditApplied;
    const remainingBalance = ledger.amountDue;
    const showInspoAction =
        isUpcomingBooking(booking.status, booking.startsAt) &&
        shouldShowBookingInspoSubmission(data.inspoPrompt?.status);

    return (
        <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7 xl:p-8">
            <div className="flex flex-col gap-5 pb-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-dark-green">
                        Booking reference
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold text-foreground">
                        {formatBookingReference(booking.bookingReference)}
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                        {formatBookingDateTime(
                            booking.startsAt,
                            booking.endsAt,
                        )}
                    </p>
                    <div className="mt-4">
                        <BookingStatusBadge status={booking.status} />
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row xl:justify-end">
                    <Link
                        href="/booking"
                        className="btn-secondary inline-flex items-center justify-center gap-2"
                    >
                        <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to My Bookings
                    </Link>

                    {canEdit ? (
                        <Link
                            href={getBookingReferenceHref(
                                booking.bookingReference,
                                "/edit",
                            )}
                            className="btn-primary inline-flex items-center justify-center gap-2"
                        >
                            <FiEdit3 className="h-4 w-4" aria-hidden="true" />
                            Edit appointment
                        </Link>
                    ) : null}
                </div>
            </div>

            {booking.status === "rejected" ? (
                <div className="mb-2 rounded-3xl border border-border/60 bg-background p-5">
                    <p className="text-base font-semibold text-foreground">
                        Appointment not accepted
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                        {data.rejectionReason ??
                            "The studio wasn’t able to accept this appointment request."}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                        Please choose another available time or contact us if
                        you have questions.
                    </p>
                </div>
            ) : null}

            <BookingCancellationSummary data={data} />

            {data.latestDateChangeOutcome && !data.dateChangeRequest ? (
                <div className="mb-2 rounded-3xl border border-dark-green/20 bg-dark-green/5 p-5 sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-green">
                        Date change {data.latestDateChangeOutcome.decision}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-foreground">
                        {data.latestDateChangeOutcome.decision === "approved"
                            ? "Your appointment time was updated"
                            : "Your original appointment time was kept"}
                    </h2>
                    {data.latestDateChangeOutcome.decision === "approved" ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                            <DateChangeTime
                                label="Previous time"
                                startsAt={data.latestDateChangeOutcome.previousStartsAt}
                                endsAt={data.latestDateChangeOutcome.previousEndsAt}
                            />
                            <span className="hidden text-lg font-semibold text-dark-green sm:block" aria-hidden="true">→</span>
                            <DateChangeTime
                                label="New time"
                                startsAt={data.latestDateChangeOutcome.nextStartsAt}
                                endsAt={data.latestDateChangeOutcome.nextEndsAt}
                            />
                        </div>
                    ) : (
                        <p className="mt-3 text-sm leading-relaxed text-muted">
                            {data.latestDateChangeOutcome.reason || "The studio wasn’t able to approve the requested date change."}
                        </p>
                    )}
                </div>
            ) : null}

            <div className="py-6">
                <BookingDetailsHeader title="Appointment summary" />
                {data.arrivalContact ? (
                    <StudioArrivalContactCard
                        instagramUrl={data.arrivalContact.instagramUrl}
                    />
                ) : null}

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {summaryRows(
                        booking,
                        totalDisplay,
                        remainingBalance,
                        creditUsed,
                        data,
                    ).map((row) => (
                        <SummaryRow
                            key={row.label}
                            label={row.label}
                            value={row.value}
                        />
                    ))}
                </div>

                {data.clientNotes ? (
                    <div className="mt-5 rounded-2xl bg-background p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                            Your notes
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-foreground">
                            {data.clientNotes}
                        </p>
                    </div>
                ) : null}
            </div>

            <div className="py-6">
                <BookingDetailsHeader title="Services and pricing" />
                <div className="mt-4">
                    <AppointmentTotals input={{
                        items: booking.lineItems,
                        bookingFee: data.bookingFeeAmount,
                        appointmentTotal: totalDisplay.amount,
                        payments: data.payments,
                        courtesyApplied: data.courtesyApplied,
                    }} />
                </div>
            </div>

            {data.policies.length > 0 ? (
                <div className="py-6">
                    <BookingDetailsHeader title="Accepted Policies" />
                    <div className="mt-4 grid gap-4 xl:grid-cols-2">
                        {data.policies.map((policy) => (
                            <div
                                key={policy.id}
                                className="rounded-2xl bg-background p-4"
                            >
                                <p className="text-sm font-semibold text-foreground">
                                    {policy.title}
                                </p>
                                {policy.description ? (
                                    <p className="mt-2 text-sm leading-relaxed text-muted">
                                        {policy.description}
                                    </p>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {showInspoAction ? (
                <div className="py-6">
                    <BookingDetailsHeader title="Design Inspo" />
                    <div className="mt-4">
                        <BookingInspoInstagramStep
                            bookingId={booking.id}
                            compact
                        />
                    </div>
                </div>
            ) : null}

            <div className="pt-6">
                <BookingDetailsHeader title="Request Cancellation" />
                <div className="mt-4">
                    <BookingCancellationCard data={data} variant="section" />
                </div>
            </div>
        </section>
    );
}

function DateChangeTime({ label, startsAt, endsAt }: { label: string; startsAt: string | null; endsAt: string | null }) {
    return (
        <div className="rounded-2xl bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
            <p className="mt-2 text-sm font-semibold text-foreground">
                {startsAt ? formatBookingDateTime(startsAt, endsAt) : "Not available"}
            </p>
        </div>
    );
}
