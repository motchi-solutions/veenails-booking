"use client";

import { useActionState } from "react";
import { sendTestInvoiceAction, type TestInvoiceState } from "@/features/admin/settings/actions/test-invoice";

const initialState: TestInvoiceState = { error: "", success: "", messageId: "" };

export default function AdminInvoiceTestCard() {
    const [state, action, pending] = useActionState(sendTestInvoiceAction, initialState);

    return (
        <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-semibold text-foreground">Invoice diagnostics</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                Preview the invoice PDF or send a test attachment to your admin profile email. Test documents use sample data, are marked not payable, do not create database invoice records, and are never sent to the salon.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a className="btn-secondary text-center" href="/api/admin/website-fees/test-invoice">
                    Download test PDF
                </a>
                <form action={action}>
                    <button type="submit" className="btn-secondary w-full" disabled={pending}>
                        {pending ? "Sending test…" : "Email test invoice to me"}
                    </button>
                </form>
            </div>
            {state.success ? <p key={state.messageId} className="mt-4 rounded-2xl bg-background p-4 text-sm text-foreground">{state.success}</p> : null}
            {state.error ? <p key={state.messageId} className="mt-4 rounded-2xl border border-border/60 bg-background p-4 text-sm text-muted">{state.error}</p> : null}
        </section>
    );
}
