import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

import SummaryRow from "@/components/shared/ui/SummaryRow";
import BookingStatusBadge from "@/features/bookings/components/BookingStatusBadge";
import BookingCancellationCard from "@/features/bookings/details/components/BookingCancellationCard";
import type {
    BookingDetailsData,
    EditBookingSlot,
} from "@/features/bookings/details/data/booking-details";
import type { DesignTier } from "@/features/bookings/new-booking/types";
import {
    formatBookingDate,
    formatBookingDateTime,
    formatBookingReference,
    formatBookingTimeRange,
    getBookingReferenceHref,
    formatShortLineItems,
    getBookingTotalDisplay,
} from "@/features/bookings/utils/booking-formatters";
import {
    canEditBooking,
    canEditBookingOnline,
    getBookingStatusLabel,
    isWithinEditCutoff,
} from "@/features/bookings/utils/booking-status";

import EditDateChangeRequest from "./EditDateChangeRequest";
import EditServicesForm from "./EditServicesForm";

export default function EditBookingPage({
    data,
    slots,
    designTiers,
}: {
    data: BookingDetailsData;
    slots: EditBookingSlot[];
    designTiers: DesignTier[];
}) {
    const booking = data.summary;
    const canEdit = canEditBookingOnline(booking.status, booking.startsAt);
    const finalStatusBlocked = !canEditBooking(booking.status);
    const cutoffBlocked =
        canEditBooking(booking.status) &&
        isWithinEditCutoff(booking.startsAt);
    const totalDisplay = getBookingTotalDisplay(booking);
    const servicesFormKey = booking.lineItems
        .map((item) => `${item.id}:${item.label}:${item.lineTotal}`)
        .join("|");

    return (
        <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7 xl:p-8">
            <div className="flex flex-col gap-5 border-b border-border/60 pb-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <Link
                        href={getBookingReferenceHref(booking.bookingReference)}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-dark-green transition hover:text-pink-main"
                    >
                        <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to details
                    </Link>
                    <h1 className="mt-4 text-2xl font-semibold text-foreground">
                        Edit appointment
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                        You can update services if your appointment is more
                        than 24 hours away. Date changes are sent as requests
                        for studio approval.
                    </p>
                </div>

                <div className="min-w-0 rounded-2xl bg-background p-4 xl:min-w-72">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-dark-green">
                        {formatBookingReference(booking.bookingReference)}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                        {formatBookingDateTime(
                            booking.startsAt,
                            booking.endsAt,
                        )}
                    </p>
                    <div className="mt-3">
                        <BookingStatusBadge status={booking.status} />
                    </div>
                </div>
            </div>

            {!canEdit ? (
                <div className="mt-6 rounded-2xl border border-warning/30 bg-warning-soft p-4">
                    <p className="text-sm font-semibold text-foreground">
                        This appointment can no longer be edited online.
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                        {cutoffBlocked
                            ? "Online edits are available until 24 hours before your appointment. Please contact the studio if you need help."
                            : finalStatusBlocked
                              ? "Final bookings cannot be changed from the portal."
                              : "Please contact the studio if you need help."}
                    </p>
                </div>
            ) : null}

            <div className="py-6">
                <h2 className="text-lg font-semibold text-foreground">
                    Current appointment
                </h2>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    <SummaryRow
                        label="Date"
                        value={formatBookingDate(booking.startsAt)}
                    />
                    <SummaryRow
                        label="Time"
                        value={formatBookingTimeRange(
                            booking.startsAt,
                            booking.endsAt,
                        )}
                    />
                    <SummaryRow
                        label="Status"
                        value={getBookingStatusLabel(booking.status)}
                    />
                    <SummaryRow
                        label="Services"
                        value={formatShortLineItems(booking.lineItems)}
                    />
                    <SummaryRow
                        label={totalDisplay.label}
                        value={totalDisplay.value}
                    />
                </div>
            </div>

            <div className="border-t border-border/60 py-6">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-foreground">
                        Services
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                        Service changes update your estimated total
                        automatically.
                    </p>
                </div>
                <EditServicesForm
                    key={servicesFormKey}
                    data={data}
                    designTiers={designTiers}
                    canEdit={canEdit}
                />
            </div>

            <div className="border-t border-border/60 py-6">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-foreground">
                        Date change request
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                        Date changes are sent to the studio for approval.
                    </p>
                </div>
                <EditDateChangeRequest
                    data={data}
                    slots={slots}
                    canEdit={canEdit}
                />
            </div>

            <div className="border-t border-border/60 pt-6">
                <h2 className="text-lg font-semibold text-foreground">
                    Cancellation
                </h2>
                <div className="mt-4">
                    <BookingCancellationCard data={data} variant="section" />
                </div>
            </div>
        </section>
    );
}
