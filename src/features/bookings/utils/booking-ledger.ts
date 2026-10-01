export type LedgerPayment = {
    method?: string;
    type: string;
    status: string;
    amount: number;
};

const CASH_APPLIED_STATUSES = new Set([
    "marked_sent",
    "received",
    "completed",
]);
const CREDIT_APPLIED_STATUSES = new Set(["credited", "completed"]);
const REFUND_APPLIED_STATUSES = new Set([
    "refunded",
    "credited",
    "completed",
]);

export function roundMoney(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

function positiveAmount(value: number) {
    return Math.max(0, roundMoney(Number(value) || 0));
}

export function calculateBookingLedger({
    appointmentTotal,
    payments,
    courtesyApplied = false,
}: {
    appointmentTotal: number;
    courtesyApplied?: boolean;
    payments: readonly LedgerPayment[];
}) {
    const originalTotal = positiveAmount(appointmentTotal);
    const total = courtesyApplied ? 0 : originalTotal;
    let cashApplied = 0;
    let creditApplied = 0;
    let refundsApplied = 0;

    for (const payment of payments) {
        const amount = positiveAmount(payment.amount);

        if (
            payment.type === "credit" &&
            CREDIT_APPLIED_STATUSES.has(payment.status)
        ) {
            creditApplied += amount;
        } else if (
            payment.type === "refund" &&
            REFUND_APPLIED_STATUSES.has(payment.status)
        ) {
            refundsApplied += amount;
        } else if (
            (payment.type === "deposit" ||
                payment.type === "final_payment") &&
            CASH_APPLIED_STATUSES.has(payment.status)
        ) {
            cashApplied += amount;
        }
    }

    cashApplied = roundMoney(cashApplied);
    creditApplied = roundMoney(creditApplied);
    refundsApplied = roundMoney(refundsApplied);
    const totalApplied = Math.max(
        0,
        roundMoney(cashApplied + creditApplied - refundsApplied),
    );

    return {
        appointmentTotal: total,
        courtesyAdjustment: courtesyApplied ? originalTotal : 0,
        cashApplied,
        creditApplied,
        refundsApplied,
        totalApplied,
        amountDue: Math.max(0, roundMoney(total - totalApplied)),
        overpayment: Math.max(0, roundMoney(totalApplied - total)),
    };
}

export function calculateCheckoutPaymentPlan({
    appointmentTotal,
    configuredDeposit,
    creditAmount = 0,
}: {
    appointmentTotal: number;
    configuredDeposit: number;
    creditAmount?: number;
}) {
    const total = positiveAmount(appointmentTotal);
    const depositDue = Math.min(total, positiveAmount(configuredDeposit));
    const maxCreditAmount = Math.max(0, roundMoney(total - depositDue));
    const appliedCredit = Math.min(
        maxCreditAmount,
        positiveAmount(creditAmount),
    );
    const totalAfterCredit = Math.max(0, roundMoney(total - appliedCredit));

    return {
        appointmentTotal: total,
        depositDue,
        maxCreditAmount,
        creditAmount: appliedCredit,
        totalAfterCredit,
        balanceAfterDeposit: Math.max(
            0,
            roundMoney(totalAfterCredit - depositDue),
        ),
    };
}

export function hasLoyaltyCourtesy(events: readonly {
    event_type: string;
    actor_type?: string;
    metadata: unknown;
}[]) {
    return events.some((event) =>
        event.event_type === "loyalty_courtesy_applied" &&
        event.actor_type === "admin" &&
        typeof event.metadata === "object" &&
        event.metadata !== null &&
        "adjustment" in event.metadata &&
        event.metadata.adjustment === "free"
    );
}
