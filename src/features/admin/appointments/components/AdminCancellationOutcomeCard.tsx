import { formatDateTime, formatMoney } from "@/features/admin/components/admin-formatters";
import type { AdminCancellationOutcome } from "@/features/admin/appointments/data/admin-cancellation-outcome";

function label(value: string | null) {
    if (!value) return "Not applicable";
    return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function AdminCancellationOutcomeCard({ outcome }: { outcome: AdminCancellationOutcome }) {
    return (
        <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Cancellation record</p>
                    <h2 className="mt-1 text-lg font-semibold text-foreground">{outcome.reason}</h2>
                </div>
                <p className="text-xs text-muted">{formatDateTime(outcome.cancelledAt)}</p>
            </div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-background p-4">
                    <dt className="text-xs font-semibold uppercase text-muted">Deposit outcome</dt>
                    <dd className="mt-1 font-semibold text-foreground">{label(outcome.depositOutcome)}</dd>
                    <dd className="mt-1 text-sm text-muted">{formatMoney(outcome.depositAmount)}</dd>
                </div>
                <div className="rounded-2xl bg-background p-4">
                    <dt className="text-xs font-semibold uppercase text-muted">Refund status</dt>
                    <dd className="mt-1 font-semibold text-foreground">{label(outcome.refundStatus)}</dd>
                </div>
                <div className="rounded-2xl bg-background p-4">
                    <dt className="text-xs font-semibold uppercase text-muted">Final payment</dt>
                    <dd className="mt-1 font-semibold text-foreground">{label(outcome.finalPaymentStatus)}</dd>
                </div>
            </dl>
            {outcome.internalNote ? <p className="mt-4 text-sm leading-relaxed text-muted">Internal note: {outcome.internalNote}</p> : null}
        </section>
    );
}
