"use client";

import { useState } from "react";
import AppSelect from "@/components/shared/form/AppSelect";
import FormField from "@/components/shared/form/FormField";

export default function AdminLoyaltyAdjustmentFields() {
    const [adjustment, setAdjustment] = useState("free");

    return (
        <section className="space-y-4 rounded-2xl border border-border/60 bg-surface-2 p-4">
            <div>
                <h3 className="text-sm font-semibold text-foreground">Loyalty courtesy</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                    This is an admin decision only. The website does not track stamps, balances, or eligibility.
                </p>
            </div>
            <AppSelect
                name="loyaltyAdjustment"
                label="Courtesy type"
                value={adjustment}
                onChange={setAdjustment}
                options={[
                    { value: "free", label: "Free appointment" },
                    { value: "discount", label: "Percentage discount" },
                ]}
                required
            />
            {adjustment === "discount" ? (
                <>
                    <FormField
                        id="discountPercentage"
                        name="discountPercentage"
                        label="Loyalty discount"
                        type="number"
                        inputMode="decimal"
                        min={0.01}
                        max={99.99}
                        step={0.01}
                        placeholder="10"
                        required
                    />
                    <AppSelect
                        name="paymentMethod"
                        label="Final payment method"
                        defaultValue="cash"
                        options={[
                            { value: "cash", label: "Cash" },
                            { value: "etransfer", label: "E-transfer" },
                            { value: "other", label: "Other" },
                        ]}
                        required
                    />
                </>
            ) : (
                <p className="rounded-xl bg-background p-3 text-xs leading-relaxed text-muted">
                    The appointment will close at $0.00. Payments already applied will be recorded as refunded.
                </p>
            )}
        </section>
    );
}
