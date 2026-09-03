"use client";

import { useState } from "react";
import { FiXCircle } from "react-icons/fi";

import StepSectionCard from "@/components/shared/ui/StepSectionCard";
import CancellationRequestModal from "@/features/bookings/components/CancellationRequestModal";
import DepositPolicyNotice from "@/features/bookings/components/DepositPolicyNotice";
import type { BookingDetailsData } from "@/features/bookings/details/data/booking-details";
import { canRequestCancellation } from "@/features/bookings/utils/booking-status";

function formatStatus(status: string) {
    return status
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatRefundMethod(method: string) {
    if (method === "refund_etransfer") {
        return "Legacy e-transfer refund";
    }

    if (method === "account_credit") {
        return "Account credit";
    }

    return "No refund requested";
}

export default function BookingCancellationCard({
    data,
    variant = "card",
}: {
    data: BookingDetailsData;
    variant?: "card" | "section";
}) {
    const [isCancellationOpen, setIsCancellationOpen] = useState(false);
    const booking = data.summary;
    const cancellationRequest = data.cancellationRequest;
    const canCancel = canRequestCancellation(
        booking.status,
        booking.cancellationRequest,
    );

    const content = (
        <>
            {cancellationRequest ? (
                <div className="rounded-2xl border border-border/60 bg-background p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-foreground">
                                {formatStatus(cancellationRequest.status)}
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-muted">
                                The studio will review your request. You’ll see
                                the status here.
                            </p>
                        </div>
                        <span className="rounded-full bg-pink-main/10 px-3 py-1 text-xs font-semibold text-pink-main">
                            {formatRefundMethod(
                                cancellationRequest.requestedRefundMethod,
                            )}
                        </span>
                    </div>

                    <div className="mt-4 rounded-2xl bg-surface p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                            Reason
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-foreground">
                            {cancellationRequest.reason}
                        </p>
                    </div>
                </div>
            ) : canCancel ? (
                <div className="rounded-2xl border border-border/60 bg-background p-4">
                    <p className="text-sm leading-relaxed text-muted">
                        Need to cancel this appointment? Send a request and the
                        studio will review it.
                    </p>
                    <div className="mt-4">
                        <DepositPolicyNotice variant="cancellation" />
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsCancellationOpen(true)}
                        className="btn-secondary mt-4 inline-flex items-center justify-center gap-2"
                    >
                        <FiXCircle className="h-4 w-4" aria-hidden="true" />
                        Request cancellation
                    </button>
                </div>
            ) : (
                <p className="rounded-2xl border border-dashed border-border/60 bg-background p-4 text-sm text-muted">
                    Cancellation is not available for this booking.
                </p>
            )}
        </>
    );

    return (
        <>
            {variant === "card" ? (
                <StepSectionCard
                    icon={<FiXCircle className="h-5 w-5" aria-hidden="true" />}
                    title="Cancellation request"
                    description="If plans change, the studio will review your request."
                >
                    {content}
                </StepSectionCard>
            ) : (
                content
            )}

            {isCancellationOpen ? (
                <CancellationRequestModal
                    booking={booking}
                    onClose={() => setIsCancellationOpen(false)}
                />
            ) : null}
        </>
    );
}
