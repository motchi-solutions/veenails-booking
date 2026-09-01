import "server-only";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getInvoiceAddresses } from "@/features/website-fees/invoice-config";

type Invoice = {
    invoice_number: string;
    billing_month: string;
    period_start: string;
    period_end: string;
    eligible_net_revenue: number | string;
    fee_rate_percent: number | string;
    fee_total: number | string;
    booking_count: number;
    source_line_count: number;
    issued_at: string;
    due_date: string;
};

type Evidence = {
    booking_reference_snapshot: string;
    paid_at_snapshot: string;
    payment_type_snapshot: string;
    eligible_net_amount_snapshot: number | string;
};

const invoiceAmountFormatter = new Intl.NumberFormat("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const money = (value: number | string) =>
    `$${invoiceAmountFormatter.format(Number(value))} CAD`;

export async function createWebsiteFeeInvoicePdf(
    invoice: Invoice,
    evidence: Evidence[],
    options: { testMode?: boolean } = {},
) {
    const addresses = getInvoiceAddresses();
    const document = await PDFDocument.create();
    const regular = await document.embedFont(StandardFonts.Helvetica);
    const bold = await document.embedFont(StandardFonts.HelveticaBold);
    const pink = rgb(0.84, 0.36, 0.52);
    const ink = rgb(0.16, 0.1, 0.13);
    const muted = rgb(0.42, 0.29, 0.35);
    const border = rgb(0.94, 0.83, 0.89);
    let page = document.addPage([612, 792]);
    let y = 738;

    const addPage = () => {
        page = document.addPage([612, 792]);
        y = 748;
    };

    const date = (value: string, timeZone = "UTC") =>
        new Date(value.includes("T") ? value : `${value}T12:00:00Z`).toLocaleDateString(
            "en-CA",
            { timeZone, year: "numeric", month: "short", day: "numeric" },
        );
    const periodEndInclusive = new Date(`${invoice.period_end}T12:00:00Z`);
    periodEndInclusive.setUTCDate(periodEndInclusive.getUTCDate() - 1);
    const detail = (label: string, value: string, x: number, lineY: number) => {
        page.drawText(label.toUpperCase(), { x, y: lineY, size: 7, font: bold, color: muted });
        page.drawText(value, { x, y: lineY - 15, size: 9, font: regular, color: ink });
    };
    const wrapText = (value: string, maxWidth: number) => {
        const words = value.split(/\s+/).filter(Boolean);
        const lines: string[] = [];
        for (const word of words) {
            const candidate = lines.length
                ? `${lines.at(-1)} ${word}`
                : word;
            if (
                lines.length > 0 &&
                regular.widthOfTextAtSize(candidate, 9) > maxWidth
            ) {
                lines.push(word);
            } else if (lines.length > 0) {
                lines[lines.length - 1] = candidate;
            } else {
                lines.push(word);
            }
        }
        return lines;
    };

    page.drawText(options.testMode ? "TEST INVOICE" : "INVOICE", {
        x: 54,
        y,
        size: 27,
        font: bold,
        color: ink,
    });
    page.drawText(invoice.invoice_number, { x: 388, y: y + 3, size: 11, font: bold, color: pink });
    page.drawText("Website booking fee", { x: 388, y: y - 14, size: 9, font: regular, color: muted });
    if (options.testMode) {
        page.drawText("PREVIEW ONLY · NOT PAYABLE", { x: 54, y: y - 23, size: 9, font: bold, color: pink });
    }
    y -= 57;
    page.drawLine({ start: { x: 54, y }, end: { x: 558, y }, thickness: 1, color: border });
    y -= 25;

    page.drawText("FROM / PAYABLE TO", { x: 54, y, size: 8, font: bold, color: pink });
    page.drawText("BILL TO", { x: 318, y, size: 8, font: bold, color: pink });
    y -= 19;
    page.drawText("Mohamad Nakouzi", { x: 54, y, size: 12, font: bold, color: ink });
    page.drawText("Veronica Vicena", { x: 318, y, size: 12, font: bold, color: ink });
    y -= 17;
    page.drawText("carrying on business as Motchi Solutions", { x: 54, y, size: 9, font: regular, color: muted });
    page.drawText("Owner, Vee's Nail Studio", { x: 318, y, size: 9, font: regular, color: muted });
    y -= 15;
    page.drawText("Client-facing brand: Motchi Websites", { x: 54, y, size: 9, font: regular, color: muted });
    page.drawText("vee.nailsstudio@gmail.com", { x: 318, y, size: 9, font: regular, color: muted });
    y -= 15;
    page.drawText("admin@motchi.ca", { x: 54, y, size: 9, font: regular, color: muted });
    const supplierAddress = wrapText(addresses.supplier, 225);
    const customerAddress = wrapText(addresses.customer, 225);
    const addressLineCount = Math.max(supplierAddress.length, customerAddress.length);
    supplierAddress.forEach((line, index) =>
        page.drawText(line, { x: 54, y: y - 15 - index * 14, size: 9, font: regular, color: muted }),
    );
    customerAddress.forEach((line, index) =>
        page.drawText(line, { x: 318, y: y - 15 - index * 14, size: 9, font: regular, color: muted }),
    );
    y -= 34 + addressLineCount * 14;

    page.drawRectangle({ x: 54, y: y - 58, width: 504, height: 76, color: rgb(1, 0.97, 0.985), borderColor: border, borderWidth: 1 });
    detail("Invoice date", date(invoice.issued_at, "America/Toronto"), 70, y);
    detail("Due date", date(invoice.due_date), 204, y);
    detail("Currency", "CAD", 338, y);
    detail("Payment terms", "Due by the 10th", 428, y);
    y -= 85;

    page.drawText("DESCRIPTION", { x: 54, y, size: 8, font: bold, color: muted });
    page.drawText("BASIS", { x: 330, y, size: 8, font: bold, color: muted });
    page.drawText("RATE", { x: 440, y, size: 8, font: bold, color: muted });
    page.drawText("AMOUNT", { x: 504, y, size: 8, font: bold, color: muted });
    y -= 14;
    page.drawLine({ start: { x: 54, y }, end: { x: 558, y }, thickness: 1, color: border });
    y -= 21;
    page.drawText(`Website booking fee · ${date(invoice.period_start)}–${date(periodEndInclusive.toISOString())}`, { x: 54, y, size: 9, font: regular, color: ink });
    page.drawText(money(invoice.eligible_net_revenue), { x: 330, y, size: 9, font: regular, color: ink });
    page.drawText(`${Number(invoice.fee_rate_percent)}%`, { x: 440, y, size: 9, font: regular, color: ink });
    page.drawText(money(invoice.fee_total), { x: 492, y, size: 9, font: bold, color: ink });
    y -= 24;
    page.drawLine({ start: { x: 330, y }, end: { x: 558, y }, thickness: 1, color: border });
    y -= 22;
    page.drawText("TOTAL DUE", { x: 390, y, size: 10, font: bold, color: ink });
    page.drawText(money(invoice.fee_total), { x: 492, y, size: 12, font: bold, color: pink });
    y -= 19;
    page.drawText(`${invoice.booking_count} bookings · ${invoice.source_line_count} payment records`, { x: 54, y, size: 8, font: regular, color: muted });

    y -= 32;
    page.drawText("Supporting payment records", { x: 54, y, size: 14, font: bold, color: ink });
    y -= 28;
    for (const item of evidence) {
        if (y < 70) addPage();
        const paid = new Date(item.paid_at_snapshot).toLocaleDateString("en-CA", { timeZone: "America/Toronto" });
        page.drawText(`${paid}  ·  ${item.booking_reference_snapshot}`, { x: 54, y, size: 9, font: bold, color: ink });
        page.drawText(item.payment_type_snapshot.replaceAll("_", " "), { x: 300, y, size: 9, font: regular, color: muted });
        page.drawText(money(item.eligible_net_amount_snapshot), { x: 468, y, size: 9, font: regular, color: ink });
        y -= 19;
    }

    if (y < 85) addPage();
    y -= 12;
    page.drawLine({ start: { x: 54, y }, end: { x: 558, y }, thickness: 1, color: border });
    page.drawText(
        options.testMode
            ? "Test document only. No invoice was issued and no payment is due."
            : "Generated from an immutable invoice snapshot stored in the booking database.",
        { x: 54, y: y - 22, size: 8, font: regular, color: muted },
    );

    const bytes = await document.save();
    return Buffer.from(bytes).toString("base64");
}
