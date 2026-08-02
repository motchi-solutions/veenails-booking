import { runMonthlyWebsiteFeeWorkflow, validateReviewRun } from "@/features/website-fees/run-monthly-workflow";
import { verifyReviewToken } from "@/features/website-fees/review-token";

function page(title: string, message: string, form = "") {
    return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="margin:0;background:#fff7fb;color:#2a1b22;font-family:Arial,Helvetica,sans-serif"><main style="min-height:100vh;display:grid;place-items:center;padding:24px"><section style="width:100%;max-width:520px;background:#fff;border:1px solid #efd3e4;border-radius:24px;padding:32px;box-sizing:border-box;box-shadow:0 12px 36px rgba(196,106,138,.12);text-align:center"><div style="width:56px;height:56px;border-radius:50%;background:#fbe5ef;margin:0 auto 18px;display:grid;place-items:center;color:#d65d85;font-size:24px">✓</div><h1 style="margin:0;font-size:26px">${title}</h1><p style="color:#6b4b5a;line-height:1.65;margin:16px 0 0">${message}</p>${form}</section></main></body></html>`, {
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    });
}

export async function GET(request: Request) {
    const token = new URL(request.url).searchParams.get("token") ?? "";
    const payload = verifyReviewToken(token);
    if (!payload || !(await validateReviewRun(payload))) {
        return page("Link unavailable", "This review link is invalid, expired, or has already been used.");
    }
    const form = `<form method="post" style="margin-top:24px"><input type="hidden" name="token" value="${token.replaceAll('"', '&quot;')}"><button type="submit" style="border:0;border-radius:14px;background:#d65d85;color:#fff;font-size:15px;font-weight:700;padding:14px 22px;cursor:pointer">Run all checks again</button></form>`;
    return page("Ready to check again?", "Only continue after the payment records have been reviewed and corrected. If every check passes, the invoice will be issued and emailed automatically.", form);
}

export async function POST(request: Request) {
    const form = await request.formData();
    const token = String(form.get("token") ?? "");
    const payload = verifyReviewToken(token);
    if (!payload || !(await validateReviewRun(payload))) {
        return page("Link unavailable", "This review link is invalid, expired, or has already been used.");
    }
    try {
        const result = await runMonthlyWebsiteFeeWorkflow();
        if (result.status === "needs_review") {
            return page("More attention is needed", "The checks still found an issue. A new email with the current details and a fresh review link has been sent to admin@motchi.ca.");
        }
        if (result.status === "no_activity") {
            return page("Checks complete", "All checks passed. There were no eligible payments to invoice for this month.");
        }
        return page("Invoice complete", "All checks passed. The PDF invoice was issued and emailed to both recipients.");
    } catch (error) {
        console.error("[website-fees:recheck]", error);
        return page("Something went wrong", "The checks could not be completed. No new invoice was issued. Please try the review link again or inspect the workflow log in Supabase." );
    }
}
