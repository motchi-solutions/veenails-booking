"use client";

import { useState } from "react";
import FormField from "@/components/shared/form/FormField";
import AppSelect from "@/components/shared/form/AppSelect";
import AppointmentTotals from "@/features/bookings/components/AppointmentTotals";
import { calculateAppointmentTotals, type AppointmentTotalsInput } from "@/features/bookings/utils/appointment-totals";
import { roundMoney } from "@/features/bookings/utils/booking-ledger";
import { formatMoney } from "@/features/admin/components/admin-formatters";

export default function AdminCompletionPaymentFields({ totals }: { totals: AppointmentTotalsInput }) {
    const [mode, setMode] = useState("standard");
    const [price, setPrice] = useState(totals.appointmentTotal.toFixed(2));
    const [percentage, setPercentage] = useState("10");
    const free = mode === "free";
    const discount = mode === "discount";
    const base = Math.max(0, Number(price) || 0);
    const discountAmount = discount ? roundMoney(base * Math.min(99.99, Math.max(0, Number(percentage) || 0)) / 100) : 0;
    const adjustedTotal = free ? 0 : roundMoney(base - discountAmount);
    const current = calculateAppointmentTotals(totals);
    const remaining = Math.max(0, roundMoney(adjustedTotal - current.totalApplied));
    const cashRefund = Math.max(0, roundMoney(totals.payments.reduce((sum, payment) => {
        if (["deposit", "final_payment"].includes(payment.type) && ["received", "completed"].includes(payment.status)) return sum + payment.amount;
        if (payment.type === "refund" && payment.method !== "account_credit" && ["refunded", "completed"].includes(payment.status)) return sum - payment.amount;
        return sum;
    }, 0)));
    const overpaid = !free && adjustedTotal < current.totalApplied;

    return (
        <section className="space-y-5">
            <AppSelect name="completionMode" label="Complete appointment with" value={mode} onChange={setMode} options={[
                { value: "standard", label: "Normal payment" },
                { value: "discount", label: "Loyalty percentage discount" },
                { value: "free", label: "Free loyalty courtesy" },
            ]} required />
            {!free ? <FormField id="totalCharged" name="totalCharged" label={discount ? "Price before additional loyalty discount" : "Final appointment price"} type="number" inputMode="decimal" min={0.01} max={99999999.99} step={0.01} value={price} onValueChange={setPrice} required hintContent="Full appointment price, including existing promotions. Payments are deducted below." hintCollapsible={false} /> : <input type="hidden" name="totalCharged" value={totals.appointmentTotal} />}
            {discount ? <FormField id="loyaltyPercentage" name="loyaltyPercentage" label="Additional loyalty discount (%)" type="number" inputMode="decimal" min={0.01} max={99.99} step={0.01} value={percentage} onValueChange={setPercentage} required /> : null}
            <h3 className="text-sm font-semibold">Completion preview</h3>
            <AppointmentTotals input={{
                ...totals,
                items: discount ? [...totals.items, { id: "completion-loyalty", itemType: "discount", label: `Loyalty courtesy (${percentage}%)`, lineTotal: -discountAmount }] : totals.items,
                payments: free && current.totalApplied > 0
                    ? [...totals.payments, { type: "refund", status: "refunded", amount: current.totalApplied }]
                    : totals.payments,
                appointmentTotal: adjustedTotal,
                courtesyApplied: free,
            }} />
            {free ? (
                <div className="space-y-3 rounded-2xl bg-surface-2 p-4 text-sm">
                    <p>No final payment will be collected. Any account credit used will be returned to the client’s credit balance.</p>
                    {cashRefund > 0 ? <>
                        <p>Return {formatMoney(cashRefund)} to the client before completing. This form records the refund; it does not transfer money.</p>
                        <AppSelect name="refundMethod" label="Refund method" defaultValue="etransfer" options={[{ value: "etransfer", label: "E-transfer" }, { value: "cash", label: "Cash" }, { value: "other", label: "Other" }]} required />
                        <label className="flex items-start gap-3"><input className="mt-1" type="checkbox" name="refundConfirmed" value="yes" required /><span>I have returned {formatMoney(cashRefund)} to the client.</span></label>
                    </> : null}
                </div>
            ) : <>
                {overpaid ? <p role="alert" className="text-sm text-red-600">The final price is below payments already applied. Adjust the price or resolve the overpayment before completing.</p> : null}
                <p className="text-sm font-semibold">Collect now: {formatMoney(remaining)}</p>
                {remaining > 0 ? <AppSelect name="paymentMethod" label="Payment method for the remaining balance" defaultValue="cash" options={[{ value: "cash", label: "Cash" }, { value: "etransfer", label: "E-transfer" }, { value: "other", label: "Other" }]} required /> : <input type="hidden" name="paymentMethod" value="other" />}
            </>}
        </section>
    );
}
