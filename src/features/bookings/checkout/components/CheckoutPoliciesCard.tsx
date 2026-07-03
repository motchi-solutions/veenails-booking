import Link from "next/link";
import FormCheckbox from "@/components/shared/form/FormCheckbox";
import StepSectionCard from "@/components/shared/ui/StepSectionCard";

export default function CheckoutPoliciesCard({
    policiesConfirmed,
    setPoliciesConfirmed,
}: {
    policiesConfirmed: boolean;
    setPoliciesConfirmed: (value: boolean) => void;
}) {
    return (
        <StepSectionCard
            title="Booking Policies"
            description="Please read and accept the policies before sending your booking request."
        >
                <FormCheckbox
                    id="policies-confirmed"
                    name="policies-confirmed"
                    checked={policiesConfirmed}
                    onCheckedChange={setPoliciesConfirmed}
                    required
                >
                    I have read and agree to the{" "}
                    <Link
                        href="/privacy-policy"
                        target="_blank"
                        rel="noreferrer"
                        className="link-default font-semibold"
                    >
                        Privacy Policy
                    </Link>{" "}
                    and{" "}
                    <Link
                        href="/legal/terms-of-service.pdf"
                        target="_blank"
                        rel="noreferrer"
                        className="link-default font-semibold"
                    >
                        Terms
                    </Link>
                    .
                </FormCheckbox>
        </StepSectionCard>
    );
}
