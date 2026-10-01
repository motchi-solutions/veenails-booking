"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppSelect from "@/components/shared/form/AppSelect";
import ModalShell from "@/components/shared/ui/ModalShell";
import { useToast } from "@/components/shared/toast/ToastProvider";
import {
    cancelAppointmentWithOutcomeAction,
    type AdminCancellationState,
} from "@/features/admin/appointments/actions/admin-cancellation";
import {
    reviewCancellationAction,
    type AdminCancellationReviewState,
} from "@/features/admin/appointments/actions/admin-appointments";
import type {
    AdminAppointmentDetails,
    AdminAppointmentListItem,
} from "@/features/admin/appointments/data/admin-appointments";
import {
    formatInstagramHandle,
    formatMoney,
} from "@/features/admin/components/admin-formatters";

const initial: AdminCancellationState = {
    error: "",
    success: "",
    messageId: "",
};

const initialReview: AdminCancellationReviewState = {
    error: "",
    success: "",
    messageId: "",
};

export default function AdminCancellationModal({
    booking,
    onClose,
}: {
    booking: AdminAppointmentDetails | AdminAppointmentListItem;
    onClose: () => void;
}) {
    const router = useRouter();
    const { error, success } = useToast();
    const [state, action, pending] = useActionState(
        cancelAppointmentWithOutcomeAction,
        initial,
    );
    const [reviewState, reviewAction, reviewPending] = useActionState(
        reviewCancellationAction,
        initialReview,
    );
    const cancellationRequest =
        "cancellationRequest" in booking ? booking.cancellationRequest : null;
    const pendingRequest =
        cancellationRequest?.status === "pending"
            ? cancellationRequest
            : null;
    const depositReceived = booking.depositStatus === "received";
    const preference = cancellationRequest?.requestedRefundMethod;
    const canIssueCredit = Boolean(booking.userId);
    const defaultOutcome =
        preference === "account_credit" && canIssueCredit
            ? "credit"
            : preference === "no_refund"
              ? "no_refund"
              : "";
    const [outcome, setOutcome] = useState(defaultOutcome);

    useEffect(() => {
        if (!state.messageId) return;
        if (state.error) error(state.error, "Cancellation failed");
        if (state.success) {
            success(state.success, "Appointment cancelled");
            onClose();
        }
    }, [error, onClose, state.error, state.messageId, state.success, success]);

    useEffect(() => {
        if (!reviewState.messageId) return;
        if (reviewState.error) {
            error(reviewState.error, "Review failed");
        }
        if (reviewState.success) {
            success(reviewState.success, "Cancellation declined");
            onClose();
            router.refresh();
        }
    }, [
        error,
        onClose,
        reviewState.error,
        reviewState.messageId,
        reviewState.success,
        router,
        success,
    ]);

    return (
        <ModalShell
            title={
                pendingRequest
                    ? "Review cancellation request"
                    : "Cancel appointment"
            }
            description={`#${booking.bookingReference} · ${booking.clientDisplayName}`}
            onClose={onClose}
            size="wide"
        >
            {pendingRequest ? (
                <div className="mb-4 rounded-2xl border border-border/60 bg-background p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Client reason
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">
                        {pendingRequest.reason}
                    </p>
                </div>
            ) : null}

            <form action={action} className="space-y-4">
                <input type="hidden" name="bookingId" value={booking.id} />
                <input
                    type="hidden"
                    name="requestId"
                    value={
                        cancellationRequest?.status === "pending"
                            ? cancellationRequest.id
                            : ""
                    }
                />
                <div className="grid gap-3 rounded-2xl bg-background p-4 sm:grid-cols-2">
                    <p className="text-sm text-muted">
                        Client
                        <span className="mt-1 block font-semibold text-foreground">
                            {booking.clientDisplayName}
                        </span>
                        {booking.clientEmail ? (
                            <span className="mt-1 block text-xs">
                                {booking.clientEmail}
                            </span>
                        ) : booking.clientInstagramHandle ? (
                            <span className="mt-1 block text-xs">
                                {formatInstagramHandle(
                                    booking.clientInstagramHandle,
                                )}
                            </span>
                        ) : (
                            <span className="mt-1 block text-xs text-muted">
                                Contact details unavailable
                            </span>
                        )}
                    </p>
                    <p className="text-sm text-muted">
                        Deposit
                        <span className="mt-1 block text-lg font-semibold text-foreground">
                            {formatMoney(booking.depositAmount)}
                        </span>
                        <span className="mt-1 block text-xs">
                            {depositReceived ? "Received" : "Not received"}
                        </span>
                    </p>
                </div>
                <label className="block space-y-2">
                    <span className="label-text">
                        {pendingRequest
                            ? "Approval note"
                            : "Cancellation reason"}
                    </span>{" "}
                    <span className="text-red-500">*</span>
                    <textarea
                        name="reason"
                        required
                        minLength={4}
                        className="input-field min-h-24 resize-y leading-relaxed"
                        placeholder={
                            pendingRequest
                                ? "Add the reason that will be shared with the client…"
                                : "Explain why the appointment is being cancelled…"
                        }
                        defaultValue={pendingRequest?.reason ?? ""}
                    />
                </label>
                {depositReceived ? (
                    <>
                        <p className="rounded-2xl bg-surface-2 p-4 text-sm leading-relaxed text-muted">
                            {canIssueCredit
                                ? "Credit adds the deposit amount to the client's account. No refund records the deposit as forfeited."
                                : "External clients do not have account credits, so this cancellation can only record no refund."}
                        </p>
                        <AppSelect
                            label="Deposit outcome"
                            name="outcome"
                            value={outcome}
                            onChange={setOutcome}
                            placeholder="Choose deposit outcome"
                            required
                            options={[
                                ...(canIssueCredit
                                    ? [
                                          {
                                              value: "credit",
                                              label: "Issue account credit",
                                          },
                                      ]
                                    : []),
                                { value: "refund", label: "Refund deposit" },
                                { value: "no_refund", label: "No refund" },
                            ]}
                        />
                        {outcome === "refund" ? (
                            <AppSelect
                                label="Deposit refund status"
                                name="refundStatus"
                                defaultValue="completed"
                                required
                                options={[
                                    { value: "completed", label: "Refund completed" },
                                    { value: "pending", label: "Refund pending" },
                                ]}
                            />
                        ) : (
                            <input type="hidden" name="refundStatus" value="pending" />
                        )}
                    </>
                ) : (
                    <>
                        <input type="hidden" name="outcome" value="no_refund" />
                        <p className="rounded-2xl bg-surface-2 p-4 text-sm text-muted">
                            No received deposit was found, so this cancellation
                            will only close the appointment and reopen a future
                            slot.
                        </p>
                    </>
                )}
                <AppSelect
                    label="Final payment status"
                    name="paymentStatus"
                    defaultValue="not_applicable"
                    required
                    options={[
                        { value: "not_applicable", label: "No final payment" },
                        { value: "pending", label: "Payment pending" },
                        { value: "received", label: "Payment received" },
                        { value: "refunded", label: "Payment refunded" },
                        { value: "failed", label: "Payment not collected" },
                    ]}
                />
                <label className="block space-y-2">
                    <span className="label-text">Internal note (optional)</span>
                    <textarea
                        name="internalNote"
                        className="input-field min-h-24 resize-y leading-relaxed"
                        placeholder="Private context for appointment history…"
                    />
                </label>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={onClose}
                        disabled={pending}
                    >
                        Keep appointment
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={pending}
                    >
                        {pending
                            ? "Processing…"
                            : pendingRequest
                              ? "Approve cancellation"
                              : "Confirm cancellation"}
                    </button>
                </div>
            </form>

            {pendingRequest ? (
                <form
                    action={reviewAction}
                    className="mt-5 space-y-4 border-t border-border/60 pt-5"
                >
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <input
                        type="hidden"
                        name="requestId"
                        value={pendingRequest.id}
                    />
                    <input type="hidden" name="decision" value="rejected" />
                    <label className="block space-y-2">
                        <span className="label-text">
                            Decline reason
                        </span>{" "}
                        <span className="text-red-500">*</span>
                        <textarea
                            name="reason"
                            required
                            minLength={4}
                            className="input-field min-h-24 resize-y leading-relaxed"
                            placeholder="Explain why the appointment will remain scheduled…"
                        />
                    </label>
                    <button
                        type="submit"
                        className="btn-secondary w-full"
                        disabled={reviewPending || pending}
                    >
                        {reviewPending
                            ? "Declining…"
                            : "Decline cancellation request"}
                    </button>
                </form>
            ) : null}
        </ModalShell>
    );
}
