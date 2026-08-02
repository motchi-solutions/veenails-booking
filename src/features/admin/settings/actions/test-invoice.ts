"use server";

import { requireAdmin } from "@/features/admin/auth/require-admin";
import { websiteFeeInvoiceTemplate } from "@/features/website-fees/email-templates";
import { createTestWebsiteFeeInvoice } from "@/features/website-fees/test-invoice";
import { sendTransactionalEmail } from "@/lib/email/brevo";
import { createAdminClient } from "@/lib/supabase/admin";

export type TestInvoiceState = { error: string; success: string; messageId: string };

function result(input: Omit<TestInvoiceState, "messageId">): TestInvoiceState {
    return { ...input, messageId: `${Date.now()}-${Math.random().toString(36).slice(2)}` };
}

export async function sendTestInvoiceAction(
    _previous: TestInvoiceState,
): Promise<TestInvoiceState> {
    void _previous;
    const { user } = await requireAdmin();
    const admin = createAdminClient();
    const { data: profile, error } = await admin
        .from("profiles")
        .select("display_name, email")
        .eq("id", user.id)
        .maybeSingle();

    if (error || !profile?.email) {
        return result({ error: "Your admin profile does not have an email address available for this test.", success: "" });
    }

    let test: Awaited<ReturnType<typeof createTestWebsiteFeeInvoice>>;
    try {
        test = await createTestWebsiteFeeInvoice();
    } catch (testError) {
        console.error("[website-fees:test-invoice]", testError);
        return result({
            error: "Invoice addresses are not fully configured. Add both server-side invoice address variables and redeploy.",
            success: "",
        });
    }
    const template = websiteFeeInvoiceTemplate({
        invoiceNumber: test.invoice.invoice_number,
        billingMonth: test.invoice.billing_month,
        netRevenue: Number(test.invoice.eligible_net_revenue),
        feeRate: Number(test.invoice.fee_rate_percent),
        feeTotal: Number(test.invoice.fee_total),
        bookingCount: test.invoice.booking_count,
        dueDate: test.invoice.due_date,
    });
    const delivery = await sendTransactionalEmail({
        to: { email: profile.email, name: profile.display_name ?? "Admin" },
        subject: `[TEST — NOT PAYABLE] ${template.subject}`,
        html: template.html.replace("Monthly website fee invoice", "Test invoice — not payable").replace("The website booking fee invoice", "This test website booking fee invoice"),
        text: `TEST ONLY — NOT PAYABLE\nNo invoice record was created and the salon was not contacted.\n\n${template.text}`,
        attachments: [{ name: test.filename, content: test.pdf }],
        notificationType: "admin_website_fee_invoice_test",
        deduplicationKey: `admin_website_fee_invoice_test:${user.id}:${Date.now()}`,
        userId: user.id,
    });

    return delivery.sent
        ? result({ error: "", success: "Test invoice accepted by Brevo. Check your admin profile inbox and notification logs." })
        : result({ error: `${delivery.message} The salon was not contacted and no invoice was issued.`, success: "" });
}
