"use client";

import { FiMail } from "react-icons/fi";

import FormCheckbox from "@/components/shared/form/FormCheckbox";
import CopyableValue from "@/components/shared/ui/CopyableValue";
import StepSectionCard from "@/components/shared/ui/StepSectionCard";
import { useToast } from "@/components/shared/toast/ToastProvider";
import DepositPolicyNotice from "@/features/bookings/components/DepositPolicyNotice";
import { formatAmount } from "@/features/bookings/checkout/utils/checkout-formatters";

export default function CheckoutDepositInstructionsCard({
    etransferEmail,
    depositAmount,
    holdNote,
    etransferMessage,
    depositConfirmed,
    onDepositConfirmedChange,
    messageConfirmed,
    onMessageConfirmedChange,
}: {
    etransferEmail: string | null;
    depositAmount: number;
    holdNote: string | null;
    etransferMessage: string;
    depositConfirmed: boolean;
    onDepositConfirmedChange: (checked: boolean) => void;
    messageConfirmed: boolean;
    onMessageConfirmedChange: (checked: boolean) => void;
}) {
    const { error: showErrorToast, success: showSuccessToast } = useToast();

    const copyFailureMessage =
        "Copy didn't work on this device. Please press and hold the text to copy it manually.";

    function handleCopyFailure() {
        showErrorToast(copyFailureMessage);
    }

    return (
        <StepSectionCard
            icon={<FiMail className="h-5 w-5" aria-hidden="true" />}
            title="Deposit instructions - Interac e-Transfer"
            description="Send your Interac e-Transfer deposit using the details below, then confirm both items before submitting your request."
            contentClassName="grid gap-4"
        >
            <DepositPolicyNotice />

            <div className="rounded-3xl border border-border/60 bg-background p-4 sm:p-5">
                <CopyableValue
                    label="Send to"
                    value={etransferEmail ?? "Email unavailable"}
                    helperText="Use this email as the deposit recipient."
                    disabled={!etransferEmail}
                    onCopySuccess={() =>
                        showSuccessToast("Email copied.", "Copied")
                    }
                    onCopyFailure={handleCopyFailure}
                    copyLabel="Copy"
                    copiedLabel="Copied"
                    className="rounded-none border-0 bg-transparent p-0"
                />

                <div className="my-5 border-t border-border/60" />

                <CopyableValue
                    label="E-transfer message"
                    value={etransferMessage}
                    helperText="Please include this exact message in your e-Transfer note so the studio can match the deposit to your account."
                    onCopySuccess={() =>
                        showSuccessToast("E-transfer message copied.", "Copied")
                    }
                    onCopyFailure={handleCopyFailure}
                    copyLabel="Copy"
                    copiedLabel="Copied"
                    className="rounded-none border-0 bg-transparent p-0"
                />

                <div className="my-5 border-t border-border/60" />

                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                        Deposit amount
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                        {formatAmount(depositAmount, true)}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                        This deposit helps hold your request while the studio
                        reviews your appointment.
                    </p>
                </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-background p-4">
                <p className="text-sm font-semibold text-foreground">
                    Before submitting
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                    Confirm these only after you have sent the transfer and
                    included the required message.
                </p>

                <div className="mt-4 space-y-3">
                    <FormCheckbox
                        id="deposit-confirmed"
                        name="deposit-confirmed"
                        checked={depositConfirmed}
                        onCheckedChange={onDepositConfirmedChange}
                        required
                    >
                        I confirm that I have sent the{" "}
                        <span className="font-bold">e-Transfer deposit</span>.
                    </FormCheckbox>

                    <FormCheckbox
                        id="etransfer-message-confirmed"
                        name="etransfer-message-confirmed"
                        checked={messageConfirmed}
                        onCheckedChange={onMessageConfirmedChange}
                        required
                    >
                        I confirm that I included the required{" "}
                        <span className="font-bold">
                            e-Transfer message/note.
                        </span>
                    </FormCheckbox>
                </div>
            </div>

            {holdNote ? (
                <div className="rounded-3xl bg-pink-50 p-4 text-sm leading-relaxed text-muted">
                    {holdNote}
                </div>
            ) : null}

            <DepositPolicyNotice />
        </StepSectionCard>
    );
}
