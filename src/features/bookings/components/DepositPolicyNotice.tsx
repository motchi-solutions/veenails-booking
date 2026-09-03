import { FiInfo } from "react-icons/fi";

type DepositPolicyNoticeVariant = "booking" | "cancellation";

export default function DepositPolicyNotice({
    variant = "booking",
}: {
    variant?: DepositPolicyNoticeVariant;
}) {
    const isCancellation = variant === "cancellation";

    return (
        <aside
            aria-label="Deposit policy"
            className="rounded-2xl border border-pink-main/20 bg-pink-main/10 p-4"
        >
            <div className="flex items-start gap-3">
                <FiInfo
                    className="mt-0.5 h-5 w-5 shrink-0 text-pink-main"
                    aria-hidden="true"
                />
                <div className="min-w-0 text-sm leading-relaxed text-muted">
                    <p className="font-semibold text-foreground">
                        Please note: All deposits are non-refundable.
                    </p>
                    <p className="mt-1">
                        {isCancellation
                            ? "While the studio will try to accommodate your cancellation where possible, deposit refunds are unlikely. Any account credit, if offered by the studio, is not a refund."
                            : "Your deposit is required to secure your appointment and will be applied toward your final service total."}
                    </p>
                </div>
            </div>
        </aside>
    );
}
