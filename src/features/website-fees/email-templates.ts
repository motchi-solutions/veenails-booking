import { detailBlock, emailLayout, escapeHtml } from "@/features/notifications/email/templates/layout";

function money(value: number) {
    return new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD",
    }).format(value);
}

function monthLabel(value: string) {
    return new Intl.DateTimeFormat("en-CA", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(`${value}T12:00:00Z`));
}

export function websiteFeeReviewTemplate(input: {
    billingMonth: string;
    exceptionCount: number;
    driftCount: number;
    reviewUrl: string;
}) {
    const month = monthLabel(input.billingMonth);
    const issues = [
        input.exceptionCount > 0
            ? `${input.exceptionCount} payment record${input.exceptionCount === 1 ? " needs" : "s need"} attention`
            : null,
        input.driftCount > 0
            ? `${input.driftCount} invoiced source record${input.driftCount === 1 ? " has" : "s have"} changed`
            : null,
    ].filter((value): value is string => Boolean(value));
    const body = `<p style="margin:0">The ${escapeHtml(month)} website fee invoice is paused because the monthly checks found an issue.</p>
        ${detailBlock([
            ["Payment issues", String(input.exceptionCount)],
            ["Changed invoice sources", String(input.driftCount)],
        ])}
        <p style="margin:0">Please inspect and correct the records in Supabase. When you are finished, use the button below to run every check again. The invoice will be issued automatically only if all checks pass.</p>`;

    return {
        subject: `Action needed: ${month} website fee checks`,
        html: emailLayout({
            heading: "Invoice checks need attention",
            preview: issues.join(". "),
            body,
            cta: { label: "I fixed it — run checks", href: input.reviewUrl },
        }),
        text: `The ${month} website fee invoice is paused. Payment issues: ${input.exceptionCount}. Changed invoice sources: ${input.driftCount}. Inspect and correct the records in Supabase, then run the checks again: ${input.reviewUrl}`,
    };
}

export function websiteFeeInvoiceTemplate(input: {
    invoiceNumber: string;
    billingMonth: string;
    netRevenue: number;
    feeRate: number;
    feeTotal: number;
    bookingCount: number;
    dueDate: string;
}) {
    const month = monthLabel(input.billingMonth);
    const body = `<p style="margin:0">The website booking fee invoice for ${escapeHtml(month)} is attached.</p>
        ${detailBlock([
            ["Invoice", input.invoiceNumber],
            ["Eligible revenue", money(input.netRevenue)],
            ["Fee rate", `${input.feeRate}%`],
            ["Amount due", money(input.feeTotal)],
            ["Due date", new Intl.DateTimeFormat("en-CA", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${input.dueDate}T12:00:00Z`))],
            ["Payable to", "Mohamad Nakouzi"],
            ["Business", "Motchi Solutions (Motchi Websites)"],
            ["Bookings", String(input.bookingCount)],
        ])}
        <p style="margin:0">The attached PDF is the official invoice snapshot. Its supporting payment records are stored in the website database.</p>`;

    return {
        subject: `${input.invoiceNumber} · ${money(input.feeTotal)} due`,
        html: emailLayout({
            heading: "Monthly website fee invoice",
            preview: `${input.invoiceNumber} for ${money(input.feeTotal)}`,
            body,
        }),
        text: `${month} website fee invoice\nInvoice: ${input.invoiceNumber}\nEligible revenue: ${money(input.netRevenue)}\nFee rate: ${input.feeRate}%\nAmount due: ${money(input.feeTotal)}\nDue date: ${input.dueDate}\nPayable to: Mohamad Nakouzi\nBusiness: Motchi Solutions (Motchi Websites)\nBookings: ${input.bookingCount}\n\nThe PDF invoice is attached.`,
    };
}
