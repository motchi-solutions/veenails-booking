import {
    formatBookingDate,
    formatBookingTimeRange,
    formatMoney,
    formatShortLineItems,
} from "@/features/bookings/utils/booking-formatters";

import {
    getBookingStatusLabel,
    getDepositStatusLabel,
} from "@/features/bookings/utils/booking-status";
import { getBookingInspoStatusLabel } from "@/features/bookings/inspo/data/booking-inspo";
import type { BookingDetailsData } from "@/features/bookings/details/data/booking-details";
import type { BookingSummary } from "@/features/bookings/types/bookings";

type TotalDisplay = {
    label: string;
    value: string;
};

type SummaryRowsData = Pick<
    BookingDetailsData,
    "depositStatus" | "cancellationRequest" | "inspoPrompt" | "courtesyApplied"
>;

type SummaryRow = {
    label: string;
    value: string;
};

function formatCancellationStatus(status: string): string {
    return status
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export const summaryRows = (
    booking: BookingSummary,
    totalDisplay: TotalDisplay,
    remainingBalance: number,
    creditUsed: number,
    data: SummaryRowsData,
): SummaryRow[] => {
    const designTier = booking.lineItems.find(
        (item) => item.itemType === "design_tier",
    );

    return [
        { label: "Date", value: formatBookingDate(booking.startsAt) },
        {
            label: "Time",
            value: formatBookingTimeRange(booking.startsAt, booking.endsAt),
        },
        { label: "Status", value: getBookingStatusLabel(booking.status) },
        {
            label: "Services",
            value: formatShortLineItems(booking.lineItems),
        },
        ...(designTier
            ? [{ label: "Design tier", value: designTier.label }]
            : []),
        {
            label: "Removal option",
            value:
                booking.lineItems.find((item) => item.itemType === "removal")
                    ?.label ?? "No removal",
        },
        { label: totalDisplay.label, value: totalDisplay.value },
        {
            label: "Remaining balance",
            value: formatMoney(remainingBalance),
        },
        {
            label: "Deposit/payment status",
            value: data.courtesyApplied
                ? "Complimentary · Loyalty courtesy applied"
                : getDepositStatusLabel(data.depositStatus),
        },
        {
            label: "Design inspo",
            value: getBookingInspoStatusLabel(data.inspoPrompt?.status),
        },
        ...(creditUsed > 0
            ? [{ label: "Credit used", value: formatMoney(creditUsed) }]
            : []),
        ...(data.cancellationRequest
            ? [
                  {
                      label: "Cancellation request",
                      value: formatCancellationStatus(
                          data.cancellationRequest.status,
                      ),
                  },
              ]
            : []),
    ];
};
