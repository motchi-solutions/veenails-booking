import { FiCreditCard } from "react-icons/fi";

import StepSectionCard from "@/components/shared/ui/StepSectionCard";
import AppointmentTotals from "@/features/bookings/components/AppointmentTotals";
import type { BookingDetailsData } from "@/features/bookings/details/data/booking-details";
import { formatMoney } from "@/features/bookings/utils/booking-formatters";

function formatPaymentLabel(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export default function BookingPaymentSummaryCard({
    data,
}: {
    data: BookingDetailsData;
}) {
    const displayTotal =
        data.summary.status === "completed"
            ? data.summary.finalTotal
            : data.summary.estimatedTotal;

    return (
        <StepSectionCard
            icon={<FiCreditCard className="h-5 w-5" aria-hidden="true" />}
            title="Payment summary"
            description="Deposit, credit, and payment activity for this booking."
        >
            <AppointmentTotals input={{
                items: data.summary.lineItems,
                bookingFee: data.bookingFeeAmount,
                appointmentTotal: displayTotal,
                payments: data.payments,
                courtesyApplied: data.courtesyApplied,
            }} />

            {data.payments.length > 0 ? (
                <div className="mt-4 space-y-3">
                    {data.payments.map((payment) => (
                        <div
                            key={payment.id}
                            className="rounded-3xl border border-border/60 bg-background p-4"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        {formatPaymentLabel(payment.type)}
                                    </p>
                                    <p className="mt-1 text-xs text-muted">
                                        {formatPaymentLabel(payment.method)} ·{" "}
                                        {formatPaymentLabel(payment.status)}
                                    </p>
                                </div>
                                <p className="text-sm font-semibold text-foreground">
                                    {formatMoney(payment.amount)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="mt-4 rounded-3xl border border-dashed border-border/60 bg-background p-4 text-sm text-muted">
                    No payment activity is listed yet.
                </p>
            )}
        </StepSectionCard>
    );
}
