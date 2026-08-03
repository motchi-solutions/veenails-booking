"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiPercent, FiSave } from "react-icons/fi";
import { updateAppointmentDiscountAction } from "@/features/admin/appointments/actions/admin-appointments";
import type { AdminAppointmentDetails } from "@/features/admin/appointments/data/admin-appointments";
import { formatMoney } from "@/features/admin/components/admin-formatters";
import { useToast } from "@/components/shared/toast/ToastProvider";
import {
    calculateAdminDiscountedPricing,
    parseAdminDiscountPercentage,
    roundCurrency,
} from "@/features/admin/appointments/utils/admin-discount";
import { calculateBookingLedger } from "@/features/bookings/utils/booking-ledger";
import { normalizeBookingFeeRate } from "@/features/bookings/new-booking/utils";

const CLOSED_STATUSES = new Set([
    "completed",
    "no_show",
    "cancelled",
    "rejected",
    "expired",
]);

function SummaryRow({
    label,
    value,
    emphasized = false,
}: {
    label: string;
    value: string;
    emphasized?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted">{label}</span>
            <span
                className={
                    emphasized
                        ? "text-right text-base font-semibold text-foreground"
                        : "text-right font-semibold text-foreground"
                }
            >
                {value}
            </span>
        </div>
    );
}

export default function AdminDiscountEditor({
    booking,
}: {
    booking: AdminAppointmentDetails;
}) {
    const router = useRouter();
    const { error, success } = useToast();
    const [state, formAction, pending] = useActionState(
        updateAppointmentDiscountAction,
        {},
    );
    const discountItem =
        booking.lineItems.find((item) => item.itemType === "discount") ?? null;
    const subtotalBeforeDiscount = useMemo(
        () =>
            roundCurrency(
                booking.lineItems
                    .filter((item) => item.itemType !== "discount")
                    .reduce((sum, item) => sum + item.lineTotal, 0),
            ),
        [booking.lineItems],
    );
    const existingDiscountAmount = Math.abs(
        discountItem?.lineTotal ?? discountItem?.unitPrice ?? 0,
    );
    const [percentage, setPercentage] = useState(() =>
        discountItem
            ? String(
                  parseAdminDiscountPercentage({
                      label: discountItem.label,
                      fallbackAmount: existingDiscountAmount,
                      subtotal: subtotalBeforeDiscount,
                  }) ?? "",
              )
            : "",
    );
    const closed = CLOSED_STATUSES.has(booking.status);
    const enteredPercentage = Number(percentage || 0);
    const numericPercentage = Number.isFinite(enteredPercentage)
        ? Math.min(100, Math.max(0, enteredPercentage))
        : 0;
    const currentAppointmentTotal =
        booking.finalTotal > 0 ? booking.finalTotal : booking.estimatedTotal;
    const currentLedger = calculateBookingLedger({
        appointmentTotal: currentAppointmentTotal,
        payments: booking.payments.map((payment) => ({
            type: payment.paymentType,
            status: payment.status,
            amount: payment.amount,
        })),
    });
    const pricing = calculateAdminDiscountedPricing({
        subtotal: subtotalBeforeDiscount,
        discountPercentage: numericPercentage,
        bookingFeeMode: booking.bookingFeeMode,
        bookingFeeRate: booking.bookingFeeRate,
        amountPaid: currentLedger.totalApplied,
    });
    const bookingFeeRate = normalizeBookingFeeRate(booking.bookingFeeRate);
    const overpayment = Math.max(0, currentLedger.totalApplied - pricing.total);
    const fullyPaid = currentLedger.amountDue === 0;
    const discountLocked = fullyPaid && !discountItem;
    const wouldReturnCredit =
        numericPercentage > 0 && pricing.total < currentLedger.totalApplied;

    useEffect(() => {
        if (!state.messageId) return;
        if (state.error) {
            error(state.error, "Discount not saved");
        }
        if (state.success) {
            success(state.success, "Discount updated");
            router.refresh();
        }
    }, [error, router, state.error, state.messageId, state.success, success]);

    return (
        <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">
                        Discount
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                        Apply before closing out payment.
                    </p>
                </div>
                <span className="rounded-full bg-background p-2 text-dark-green">
                    <FiPercent aria-hidden="true" />
                </span>
            </div>

            {closed ? (
                <p className="mt-4 rounded-2xl bg-background p-4 text-sm text-muted">
                    This appointment is closed. Pricing changes should go
                    through the correction flow.
                </p>
            ) : discountLocked ? (
                <p className="mt-4 rounded-2xl border border-border/60 bg-background p-4 text-sm leading-relaxed text-muted">
                    Discounts are disabled because this appointment is already
                    fully paid.
                </p>
            ) : (
                <form action={formAction} className="mt-4 space-y-4">
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <label className="block space-y-2">
                        <span className="label-text">Percentage</span>
                        <div className="relative">
                            <input
                                name="discountPercentage"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={percentage}
                                onChange={(event) =>
                                    setPercentage(event.target.value)
                                }
                                className="input-field pr-10"
                                placeholder="0"
                            />
                            <FiPercent
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                                aria-hidden="true"
                            />
                        </div>
                    </label>
                    <label className="block space-y-2">
                        <span className="label-text">Reason or note</span>
                        <textarea
                            name="discountNote"
                            defaultValue={discountItem?.description ?? ""}
                            rows={2}
                            className="input-field min-h-20 resize-y leading-relaxed"
                            placeholder="Optional"
                        />
                    </label>

                    <div className="space-y-2 rounded-2xl border border-border/60 bg-background p-4">
                        <SummaryRow
                            label="Current subtotal"
                            value={formatMoney(subtotalBeforeDiscount)}
                        />
                        <SummaryRow
                            label="Discount"
                            value={`${numericPercentage}%`}
                        />
                        <SummaryRow
                            label="Discount amount"
                            value={`-${formatMoney(pricing.discountAmount)}`}
                        />
                        <SummaryRow
                            label="Discounted subtotal"
                            value={formatMoney(pricing.discountedSubtotal)}
                        />
                        <SummaryRow
                            label={
                                booking.bookingFeeMode === "included_in_price"
                                    ? `Internal booking fee (${bookingFeeRate}%)`
                                    : `Booking fee (${bookingFeeRate}%)`
                            }
                            value={
                                booking.bookingFeeMode === "included_in_price"
                                    ? "Studio absorbed"
                                    : `+${formatMoney(pricing.bookingFee)}`
                            }
                        />
                        <SummaryRow
                            label="Appointment total"
                            value={formatMoney(pricing.total)}
                            emphasized
                        />
                        {currentLedger.cashApplied > 0 ? (
                            <SummaryRow
                                label="Deposit/payments"
                                value={`-${formatMoney(currentLedger.cashApplied)}`}
                            />
                        ) : null}
                        {currentLedger.creditApplied > 0 ? (
                            <SummaryRow
                                label="Account credit"
                                value={`-${formatMoney(currentLedger.creditApplied)}`}
                            />
                        ) : null}
                        <SummaryRow
                            label="Amount to charge"
                            value={formatMoney(pricing.amountDue)}
                            emphasized
                        />
                        {overpayment > 0 ? (
                            <SummaryRow
                                label="Credit returned at completion"
                                value={formatMoney(overpayment)}
                            />
                        ) : null}
                    </div>

                    {wouldReturnCredit ? (
                        <p className="rounded-2xl border border-border/60 bg-background p-4 text-sm leading-relaxed text-muted">
                            Reduce the discount. This amount would make the
                            appointment total lower than payments already
                            applied.
                        </p>
                    ) : null}

                    <button
                        type="submit"
                        className="btn-primary inline-flex w-full items-center justify-center gap-2"
                        disabled={
                            pending ||
                            subtotalBeforeDiscount <= 0 ||
                            wouldReturnCredit
                        }
                    >
                        <FiSave aria-hidden="true" />{" "}
                        {pending ? "Saving..." : "Save discount"}
                    </button>
                </form>
            )}
        </section>
    );
}
