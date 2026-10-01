import { FiClock } from "react-icons/fi";
import FormCheckbox from "@/components/shared/form/FormCheckbox";
import StepSectionCard from "@/components/shared/ui/StepSectionCard";
import DepositPolicyNotice from "@/features/bookings/components/DepositPolicyNotice";

export default function CheckoutSubmitCard({
    depositConfirmed,
    setDepositConfirmed,
    canSubmit,
    pending,
    error,
}: {
    depositConfirmed: boolean;
    setDepositConfirmed: (value: boolean) => void;
    canSubmit: boolean;
    pending: boolean;
    error?: string;
}) {
    return (
        <StepSectionCard
            icon={<FiClock className="h-5 w-5" aria-hidden="true" />}
            title="Send Booking Request"
            description="Confirm your deposit details before submitting."
        >
            <DepositPolicyNotice />

            <FormCheckbox
                id="deposit-confirmed"
                name="deposit-confirmed"
                checked={depositConfirmed}
                onCheckedChange={setDepositConfirmed}
                required
            >
                I have sent the <span className="font-bold">e-Transfer</span>{" "}
                deposit and included the required message/note.
            </FormCheckbox>

            {error ? (
                <div className="mt-5 rounded-3xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
                    {error}
                </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-relaxed text-muted sm:max-w-2/3">
                    After submission, your request is marked as sent and the
                    studio will review the appointment and deposit.
                </p>
                <button
                    type="submit"
                    disabled={!canSubmit}
                    className="btn-primary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {pending ? "Sending Request..." : "Submit Booking Request"}
                </button>
            </div>
        </StepSectionCard>
    );
}
