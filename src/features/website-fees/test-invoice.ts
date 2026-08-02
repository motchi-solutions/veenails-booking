import "server-only";

import { createWebsiteFeeInvoicePdf } from "@/features/website-fees/invoice-pdf";

function previousTorontoMonth() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Toronto",
        year: "numeric",
        month: "2-digit",
    }).formatToParts(new Date());
    const year = Number(parts.find((part) => part.type === "year")?.value);
    const month = Number(parts.find((part) => part.type === "month")?.value);
    const previous = new Date(Date.UTC(year, month - 2, 1));
    const start = previous.toISOString().slice(0, 10);
    const end = new Date(Date.UTC(previous.getUTCFullYear(), previous.getUTCMonth() + 1, 1))
        .toISOString()
        .slice(0, 10);
    return { start, end };
}

export async function createTestWebsiteFeeInvoice() {
    const period = previousTorontoMonth();
    const invoiceNumber = `TEST-${period.start.slice(0, 7)}`;
    const now = new Date();
    const toronto = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Toronto",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(now);
    const year = Number(toronto.find((part) => part.type === "year")?.value);
    const month = Number(toronto.find((part) => part.type === "month")?.value);
    const day = Number(toronto.find((part) => part.type === "day")?.value);
    const due = new Date(Date.UTC(year, month - 1 + (day > 10 ? 1 : 0), 10));
    const invoice = {
        invoice_number: invoiceNumber,
        billing_month: period.start,
        period_start: period.start,
        period_end: period.end,
        eligible_net_revenue: 1000,
        fee_rate_percent: 3,
        fee_total: 30,
        booking_count: 3,
        source_line_count: 3,
        issued_at: now.toISOString(),
        due_date: due.toISOString().slice(0, 10),
    };
    const evidence = [
        { booking_reference_snapshot: "TEST-BOOKING-001", paid_at_snapshot: `${period.start}T15:00:00Z`, payment_type_snapshot: "deposit", eligible_net_amount_snapshot: 250 },
        { booking_reference_snapshot: "TEST-BOOKING-002", paid_at_snapshot: `${period.start}T16:00:00Z`, payment_type_snapshot: "final_payment", eligible_net_amount_snapshot: 425 },
        { booking_reference_snapshot: "TEST-BOOKING-003", paid_at_snapshot: `${period.start}T17:00:00Z`, payment_type_snapshot: "final_payment", eligible_net_amount_snapshot: 325 },
    ];

    return {
        invoice,
        pdf: await createWebsiteFeeInvoicePdf(invoice, evidence, { testMode: true }),
        filename: `${invoiceNumber}.pdf`,
    };
}
