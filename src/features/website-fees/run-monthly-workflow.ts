import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/email/brevo";
import { getAppBaseUrl } from "@/lib/email/config";
import { createReviewToken } from "@/features/website-fees/review-token";
import { createWebsiteFeeInvoicePdf } from "@/features/website-fees/invoice-pdf";
import { getInvoiceAddresses } from "@/features/website-fees/invoice-config";
import {
    websiteFeeInvoiceTemplate,
    websiteFeeReviewTemplate,
} from "@/features/website-fees/email-templates";

const ADMIN_EMAIL = "admin@motchi.ca";
const STUDIO_EMAIL = "vee.nailsstudio@gmail.com";

type ReadyRow = {
    billing_month: string;
    uninvoiced_source_count: number;
    booking_count: number;
    late_source_count: number;
    eligible_net_revenue: number | string;
    fee_rate_percent: number | string;
    proposed_invoice_total: number | string;
    unresolved_exception_count: number;
    source_drift_count: number;
    invoice_already_exists: boolean;
};

type WorkflowRun = {
    id: string;
    billing_month: string;
    status: string;
    review_token_nonce: string;
    issue_attempts: number;
    invoice_id: string | null;
    invoice_emailed_at: string | null;
};

type InvoiceRow = {
    id: string;
    invoice_number: string;
    billing_month: string;
    period_start: string;
    period_end: string;
    status: string;
    eligible_net_revenue: number | string;
    fee_rate_percent: number | string;
    fee_total: number | string;
    source_line_count: number;
    booking_count: number;
    issued_at: string;
    due_date: string;
    fee_difference: number | string;
};

function untypedAdmin() {
    return createAdminClient() as unknown as SupabaseClient;
}

async function getReadiness(admin: SupabaseClient) {
    const { data, error } = await admin
        .from("website_fee_ready_to_issue")
        .select("*")
        .single();
    if (error || !data) throw error ?? new Error("Monthly readiness is unavailable.");
    return data as ReadyRow;
}

async function getOrCreateRun(admin: SupabaseClient, billingMonth: string) {
    const existing = await admin
        .from("website_fee_workflow_runs")
        .select("id, billing_month, status, review_token_nonce, issue_attempts, invoice_id, invoice_emailed_at")
        .eq("billing_month", billingMonth)
        .maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return existing.data as WorkflowRun;

    const { data, error } = await admin
        .from("website_fee_workflow_runs")
        .insert({ billing_month: billingMonth })
        .select("id, billing_month, status, review_token_nonce, issue_attempts, invoice_id, invoice_emailed_at")
        .single();
    if (error?.code === "23505") {
        const raced = await admin
            .from("website_fee_workflow_runs")
            .select("id, billing_month, status, review_token_nonce, issue_attempts, invoice_id, invoice_emailed_at")
            .eq("billing_month", billingMonth)
            .single();
        if (raced.error || !raced.data) throw raced.error ?? error;
        return raced.data as WorkflowRun;
    }
    if (error || !data) throw error ?? new Error("Could not reserve the monthly workflow.");
    return data as WorkflowRun;
}

async function alertAdmin(
    admin: SupabaseClient,
    run: WorkflowRun,
    ready: ReadyRow,
) {
    const nonce = crypto.randomUUID();
    const baseUrl = getAppBaseUrl();
    if (!baseUrl) throw new Error("NEXT_PUBLIC_SITE_URL is required for review links.");

    const token = createReviewToken({
        runId: run.id,
        nonce,
        billingMonth: ready.billing_month,
    });
    const reviewUrl = `${baseUrl}/api/website-fees/recheck?token=${encodeURIComponent(token)}`;
    const template = websiteFeeReviewTemplate({
        billingMonth: ready.billing_month,
        exceptionCount: ready.unresolved_exception_count,
        driftCount: ready.source_drift_count,
        reviewUrl,
    });

    const { error } = await admin
        .from("website_fee_workflow_runs")
        .update({
            status: "needs_review",
            review_token_nonce: nonce,
            check_details: ready,
            last_checked_at: new Date().toISOString(),
            last_error: null,
        })
        .eq("id", run.id);
    if (error) throw error;

    const delivery = await sendTransactionalEmail({
        to: { email: ADMIN_EMAIL, name: "Motchi Admin" },
        ...template,
        notificationType: "website_fee_checks_failed",
        deduplicationKey: `website-fee-review:${run.id}:${nonce}`,
    });
    if (!delivery.sent && !delivery.duplicate) {
        throw new Error(delivery.message);
    }

    await admin
        .from("website_fee_workflow_runs")
        .update({ admin_alert_sent_at: new Date().toISOString() })
        .eq("id", run.id);
}

async function loadInvoice(admin: SupabaseClient, billingMonth: string) {
    const { data, error } = await admin
        .from("website_fee_invoice_register")
        .select("*")
        .eq("billing_month", billingMonth)
        .neq("status", "void")
        .single();
    if (error || !data) throw error ?? new Error("Issued invoice could not be loaded.");
    const invoice = data as InvoiceRow;
    if (Number(invoice.fee_difference) !== 0) {
        throw new Error("Invoice proof failed: the stored total does not match its evidence.");
    }
    return invoice;
}

async function deliverInvoice(admin: SupabaseClient, run: WorkflowRun, invoice: InvoiceRow) {
    if (run.invoice_emailed_at) return;

    const { data, error } = await admin
        .from("website_fee_invoice_evidence")
        .select("booking_reference_snapshot, paid_at_snapshot, payment_type_snapshot, eligible_net_amount_snapshot")
        .eq("invoice_id", invoice.id)
        .order("paid_at_snapshot", { ascending: true });
    if (error) throw error;

    const pdf = await createWebsiteFeeInvoicePdf(invoice, data ?? []);
    const template = websiteFeeInvoiceTemplate({
        invoiceNumber: invoice.invoice_number,
        billingMonth: invoice.billing_month,
        netRevenue: Number(invoice.eligible_net_revenue),
        feeRate: Number(invoice.fee_rate_percent),
        feeTotal: Number(invoice.fee_total),
        bookingCount: invoice.booking_count,
        dueDate: invoice.due_date,
    });
    const delivery = await sendTransactionalEmail({
        to: { email: ADMIN_EMAIL, name: "Motchi Admin" },
        cc: [{ email: STUDIO_EMAIL, name: "Vee's Nail Studio" }],
        attachments: [{ name: `${invoice.invoice_number}.pdf`, content: pdf }],
        ...template,
        notificationType: "website_fee_invoice",
        deduplicationKey: `website-fee-invoice:${invoice.id}`,
    });
    if (!delivery.sent && !delivery.duplicate) throw new Error(delivery.message);

    const { error: updateError } = await admin
        .from("website_fee_workflow_runs")
        .update({
            status: "invoiced",
            invoice_id: invoice.id,
            invoice_emailed_at: new Date().toISOString(),
            last_error: null,
        })
        .eq("id", run.id);
    if (updateError) throw updateError;
}

export async function runMonthlyWebsiteFeeWorkflow() {
    const admin = untypedAdmin();
    const ready = await getReadiness(admin);
    const run = await getOrCreateRun(admin, ready.billing_month);

    if (run.status === "invoiced" && run.invoice_emailed_at) {
        return { status: "already_invoiced", billingMonth: ready.billing_month };
    }

    if (ready.unresolved_exception_count > 0 || ready.source_drift_count > 0) {
        await alertAdmin(admin, run, ready);
        return {
            status: "needs_review",
            billingMonth: ready.billing_month,
            exceptionCount: ready.unresolved_exception_count,
            driftCount: ready.source_drift_count,
        };
    }

    if (ready.uninvoiced_source_count === 0 && !ready.invoice_already_exists) {
        await admin
            .from("website_fee_workflow_runs")
            .update({
                status: "no_activity",
                check_details: ready,
                last_checked_at: new Date().toISOString(),
                last_error: null,
            })
            .eq("id", run.id);
        return { status: "no_activity", billingMonth: ready.billing_month };
    }

    await admin
        .from("website_fee_workflow_runs")
        .update({
            status: "processing",
            check_details: ready,
            issue_attempts: run.issue_attempts + 1,
            last_checked_at: new Date().toISOString(),
            last_error: null,
        })
        .eq("id", run.id);

    try {
        // Validate required PDF configuration before creating an immutable
        // invoice snapshot. This prevents issuing an invoice that cannot be sent.
        getInvoiceAddresses();
        let invoice: InvoiceRow;
        if (ready.invoice_already_exists) {
            invoice = await loadInvoice(admin, ready.billing_month);
        } else {
            const { data: invoiceId, error } = await admin.rpc(
                "issue_website_fee_invoice",
                {
                    p_billing_month: ready.billing_month,
                    p_notes: "Automatically issued after monthly checks passed.",
                    p_issued_by: null,
                },
            );
            if (error || !invoiceId) throw error ?? new Error("Invoice issuance failed.");
            invoice = await loadInvoice(admin, ready.billing_month);
        }

        await deliverInvoice(admin, run, invoice);
        return {
            status: "invoiced",
            billingMonth: ready.billing_month,
            invoiceNumber: invoice.invoice_number,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Invoice workflow failed.";
        await admin
            .from("website_fee_workflow_runs")
            .update({ status: "failed", last_error: message })
            .eq("id", run.id);
        throw error;
    }
}

export async function validateReviewRun(input: {
    runId: string;
    nonce: string;
    billingMonth: string;
}) {
    const admin = untypedAdmin();
    const { data, error } = await admin
        .from("website_fee_workflow_runs")
        .select("id")
        .eq("id", input.runId)
        .eq("billing_month", input.billingMonth)
        .eq("review_token_nonce", input.nonce)
        .eq("status", "needs_review")
        .maybeSingle();
    if (error) throw error;
    return Boolean(data);
}
