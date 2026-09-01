"use client";

import { useState } from "react";
import FormField from "@/components/shared/form/FormField";
import AppSelect from "@/components/shared/form/AppSelect";
import { formatMoney } from "@/features/admin/components/admin-formatters";

export default function AdminCompletionPaymentFields({
    suggestedTotal,
}: {
    suggestedTotal: number;
}) {
    const [totalCharged, setTotalCharged] = useState(
        suggestedTotal.toFixed(2),
    );

    return (
        <section className="space-y-4 rounded-2xl border border-border/60 bg-surface-2 p-4">
            <div>
                <h3 className="text-sm font-semibold text-foreground">
                    Final payment
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                    Confirm the complete amount charged for the appointment. The
                    deposit and any account credit are deducted automatically.
                </p>
            </div>

            <FormField
                id="totalCharged"
                name="totalCharged"
                label="Total charged"
                type="number"
                inputMode="decimal"
                min={0.01}
                max={99999999.99}
                step={0.01}
                value={totalCharged}
                onValueChange={setTotalCharged}
                required
                hintContent={`Current appointment total: ${formatMoney(suggestedTotal)}`}
                hintCollapsible={false}
            />

            <AppSelect
                id="paymentMethod"
                name="paymentMethod"
                label="Final payment method"
                defaultValue="cash"
                options={[
                    { value: "cash", label: "Cash" },
                    { value: "etransfer", label: "E-transfer" },
                    { value: "other", label: "Other" },
                ]}
                required
                helperText="This method applies only to the balance collected at completion."
            />
        </section>
    );
}
