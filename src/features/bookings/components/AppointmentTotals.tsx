import TotalsRow from "@/components/shared/ui/TotalsRow";
import { formatMoney } from "@/features/bookings/utils/booking-formatters";
import { calculateAppointmentTotals, type AppointmentTotalsInput } from "@/features/bookings/utils/appointment-totals";

export default function AppointmentTotals({ input }: { input: AppointmentTotalsInput }) {
    const totals = calculateAppointmentTotals(input);
    return (
        <div className="space-y-5 rounded-2xl border border-border/60 bg-background p-4 text-foreground">
            <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Service costs</h3>
                {totals.costs.map((item) => <TotalsRow key={item.id} label={item.label} value={formatMoney(item.lineTotal)} />)}
                <TotalsRow label="Service subtotal" value={formatMoney(totals.services)} />
                {totals.fee > 0 ? <TotalsRow label="Booking fee" value={formatMoney(totals.fee)} /> : null}
            </section>
            {totals.promotions.length > 0 || input.courtesyApplied ? (
                <section className="border-t border-border/60 pt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Promotions & courtesy</h3>
                    {totals.promotions.map((item) => <TotalsRow key={item.id} label={item.label} value={`−${formatMoney(-item.lineTotal)}`} />)}
                    {input.courtesyApplied ? <TotalsRow label="Loyalty courtesy · Free appointment" value={`−${formatMoney(totals.courtesyAdjustment)}`} /> : null}
                </section>
            ) : null}
            <section className="border-t border-border/60 pt-4">
                {totals.finalAdjustment !== 0 ? <TotalsRow label="Final price adjustment" value={`${totals.finalAdjustment > 0 ? "+" : "−"}${formatMoney(Math.abs(totals.finalAdjustment))}`} /> : null}
                <TotalsRow label="Appointment total" value={formatMoney(totals.appointmentTotal)} prominent />
            </section>
            {totals.cashApplied > 0 || totals.creditApplied > 0 || totals.refundsApplied > 0 ? (
                <section className="border-t border-border/60 pt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Payments & refunds</h3>
                    {totals.cashApplied > 0 ? <TotalsRow label="Payments received" value={`−${formatMoney(totals.cashApplied)}`} /> : null}
                    {totals.creditApplied > 0 ? <TotalsRow label="Account credit used" value={`−${formatMoney(totals.creditApplied)}`} /> : null}
                    {totals.refundsApplied > 0 ? <TotalsRow label="Refunds / credit returned" value={`+${formatMoney(totals.refundsApplied)}`} /> : null}
                    <TotalsRow label="Net payments applied" value={formatMoney(totals.totalApplied)} />
                </section>
            ) : null}
            <section className="border-t border-border/60 pt-4">
                <TotalsRow label="Amount due" value={formatMoney(totals.amountDue)} prominent />
                {input.courtesyApplied ? <p className="mt-2 text-sm text-muted">Complimentary appointment. The price was waived.</p> : null}
                {totals.overpayment > 0 ? <TotalsRow label="Overpayment to resolve" value={formatMoney(totals.overpayment)} /> : null}
            </section>
        </div>
    );
}
