"use client";

import { useActionState, useEffect } from "react";
import AppSelect from "@/components/shared/form/AppSelect";
import ModalShell from "@/components/shared/ui/ModalShell";
import { useToast } from "@/components/shared/toast/ToastProvider";
import { requestBookingCancellation } from "@/features/bookings/actions/bookings";
import DepositPolicyNotice from "@/features/bookings/components/DepositPolicyNotice";
import {
    formatBookingDateTime,
    formatBookingReference,
} from "@/features/bookings/utils/booking-formatters";
import type {
    BookingCancellationActionState,
    BookingSummary,
} from "@/features/bookings/types/bookings";

const initialState: BookingCancellationActionState = {
    error: "",
    success: "",
    messageId: "",
};

export default function CancellationRequestModal({
    booking,
    onClose,
}: {
    booking: BookingSummary;
    onClose: () => void;
}) {
    const { error, success } = useToast();
    const [state, formAction, pending] = useActionState(
        requestBookingCancellation,
        initialState,
    );

    useEffect(() => {
        if (!state.messageId) return;

        if (state.error) {
            error(state.error, "Cancellation request failed");
            return;
        }

        if (state.success) {
            success(state.success, "Request submitted");
            onClose();
        }
    }, [error, onClose, state.error, state.messageId, state.success, success]);

    return (
        <ModalShell
            title="Request cancellation"
            description={
                <>
                    {formatBookingReference(booking.bookingReference)} ·{" "}
                    {formatBookingDateTime(booking.startsAt, booking.endsAt)}
                </>
            }
            onClose={onClose}
        >
            <form action={formAction} className="space-y-4">
                <input type="hidden" name="bookingId" value={booking.id} />

                <DepositPolicyNotice variant="cancellation" />

                <label className="block">
                    <span className="text-sm font-semibold text-foreground">
                        Reason
                    </span>
                    <textarea
                        name="reason"
                        rows={4}
                        className="input-field mt-2 min-h-24 resize-y leading-relaxed"
                        placeholder="Optional message for the studio."
                    />
                </label>

                <AppSelect
                    label="Cancellation request preference"
                    name="requestedRefundMethod"
                    defaultValue="account_credit"
                    options={[
                        {
                            value: "account_credit",
                            label: "Request account credit review (not a refund)",
                        },
                        { value: "no_refund", label: "No refund needed" },
                    ]}
                />

                <p className="rounded-2xl bg-pink-main/10 px-4 py-3 text-sm leading-relaxed text-muted">
                    Deposits are non-refundable. Submitting this sends your
                    request for review, and the studio will try to accommodate
                    where possible, but a deposit refund is unlikely.
                </p>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={onClose}
                        disabled={pending}
                    >
                        Keep Booking
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={pending}
                    >
                        {pending ? "Submitting..." : "Submit Request"}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}
