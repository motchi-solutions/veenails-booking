import { calculateBookingLedger, roundMoney, type LedgerPayment } from "./booking-ledger";

export type CostItem = { id: string; itemType: string; label: string; lineTotal: number };
export type AppointmentTotalsInput = {
    items: readonly CostItem[];
    bookingFee: number;
    appointmentTotal: number;
    payments: readonly LedgerPayment[];
    courtesyApplied?: boolean;
};

export function calculateAppointmentTotals(input: AppointmentTotalsInput) {
    const costs = input.items.filter((item) => item.itemType !== "discount" && item.itemType !== "fee");
    const promotions = input.items.filter((item) => item.itemType === "discount" && item.lineTotal < 0);
    const services = roundMoney(costs.reduce((sum, item) => sum + item.lineTotal, 0));
    const discounts = roundMoney(-promotions.reduce((sum, item) => sum + item.lineTotal, 0));
    const fee = Math.max(0, input.bookingFee);
    const beforeCourtesy = Math.max(0, roundMoney(services - discounts + fee));
    const ledger = calculateBookingLedger({
        appointmentTotal: input.courtesyApplied ? beforeCourtesy : input.appointmentTotal,
        payments: input.payments,
        courtesyApplied: input.courtesyApplied,
    });
    return {
        costs, promotions, services, discounts, fee, ...ledger,
        finalAdjustment: input.courtesyApplied ? 0 : roundMoney(ledger.appointmentTotal - beforeCourtesy),
    };
}
