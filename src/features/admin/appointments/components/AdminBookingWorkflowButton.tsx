"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import AppSelect from "@/components/shared/form/AppSelect";
import AdminCompletionPaymentFields from "@/features/admin/appointments/components/AdminCompletionPaymentFields";
import { useToast } from "@/components/shared/toast/ToastProvider";
import ModalShell from "@/components/shared/ui/ModalShell";
import {
    processAdminBookingWorkflowAction,
    type AdminBookingWorkflowState,
} from "@/features/admin/appointments/actions/admin-appointments";
import type { AdminAppointmentListItem } from "@/features/admin/appointments/data/admin-appointments";
import {
    formatBookingDateTime,
    formatMoney,
} from "@/features/admin/components/admin-formatters";

type WorkflowDecision =
    | "confirm_deposit"
    | "reject_credit"
    | "reject_no_deposit"
    | "completed"
    | "no_show";

type WorkflowOption = {
    value: WorkflowDecision;
    label: string;
    description: string;
};

const initialState: AdminBookingWorkflowState = {
    error: "",
    success: "",
    messageId: "",
};

function getWorkflowOptions(
    booking: AdminAppointmentListItem,
): WorkflowOption[] {
    const requested =
        booking.status === "requested" || booking.status === "held";
    const started = Boolean(
        booking.startsAt && new Date(booking.startsAt).getTime() <= Date.now(),
    );
    const depositUnresolved =
        booking.depositStatus === "pending" ||
        booking.depositStatus === "marked_sent";
    const options: WorkflowOption[] = [];

    if (requested) {
        options.push({
            value: "confirm_deposit",
            label: "Confirm booking and deposit",
            description:
                "Marks the deposit received and confirms the appointment in one step.",
        });

        if (booking.userId) {
            options.push({
                value: "reject_credit",
                label: "Reject and issue deposit credit",
                description:
                    "Closes the request and adds the deposit amount to the client's account.",
            });
        }

        if (
            booking.depositStatus !== "received" &&
            booking.depositStatus !== "credited"
        ) {
            options.push({
                value: "reject_no_deposit",
                label: "Reject - deposit not received",
                description:
                    "Closes the request and records that the deposit was not received.",
            });
        }
    }

    if (booking.status === "confirmed" && depositUnresolved) {
        options.push({
            value: "confirm_deposit",
            label: "Confirm deposit received",
            description:
                "Keeps the appointment confirmed and records the deposit payment.",
        });
    }

    if (
        booking.status === "confirmed" &&
        booking.depositStatus === "received" &&
        started
    ) {
        options.push(
            {
                value: "completed",
                label: "Mark appointment completed",
                description:
                    "Closes the appointment as successfully completed.",
            },
            {
                value: "no_show",
                label: "Mark client as no-show",
                description:
                    "Closes the appointment as a no-show and records a note.",
            },
        );
    }

    return options;
}

function getButtonLabel(booking: AdminAppointmentListItem) {
    if (booking.status === "requested" || booking.status === "held") {
        return "Review request";
    }

    if (
        booking.depositStatus === "pending" ||
        booking.depositStatus === "marked_sent"
    ) {
        return "Review deposit";
    }

    return "Finish appointment";
}

export default function AdminBookingWorkflowButton({
    booking,
    className = "btn-primary w-full",
}: {
    booking: AdminAppointmentListItem;
    className?: string;
}) {
    const router = useRouter();
    const { error, success } = useToast();
    const options = useMemo(() => getWorkflowOptions(booking), [booking]);
    const [open, setOpen] = useState(false);
    const [decision, setDecision] = useState<WorkflowDecision | "">(
        options[0]?.value ?? "",
    );
    const [state, formAction, pending] = useActionState(
        processAdminBookingWorkflowAction,
        initialState,
    );
    const selected = options.find((option) => option.value === decision);
    const needsReason = decision === "reject_credit" || decision === "no_show";
    const total =
        booking.finalTotal > 0 ? booking.finalTotal : booking.estimatedTotal;

    useEffect(() => {
        if (!state.messageId) return;
        if (state.error) {
            error(state.error, "Booking not updated");
            return;
        }
        if (state.success) {
            success(state.success, "Booking updated");
            window.setTimeout(() => setOpen(false), 0);
            router.refresh();
        }
    }, [error, router, state.error, state.messageId, state.success, success]);

    if (options.length === 0) return null;

    return (
        <>
            <button
                type="button"
                className={className}
                onClick={() => setOpen(true)}
            >
                {getButtonLabel(booking)}
            </button>

            <AnimatePresence>
                {open ? (
                    <ModalShell
                        title="Update booking"
                        description={`#${booking.bookingReference} · ${booking.clientDisplayName}`}
                        onClose={() => setOpen(false)}
                    >
                        <form action={formAction} className="space-y-4">
                            <input
                                type="hidden"
                                name="bookingId"
                                value={booking.id}
                            />

                            <div className="grid gap-3 rounded-2xl bg-background p-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs font-semibold uppercase text-muted">
                                        Appointment
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">
                                        {formatBookingDateTime(
                                            booking.startsAt,
                                            booking.endsAt,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase text-muted">
                                        Total
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">
                                        {formatMoney(total)}
                                    </p>
                                </div>
                            </div>

                            <AppSelect
                                name="decision"
                                label="Select action"
                                value={decision}
                                onChange={(value) =>
                                    setDecision(value as WorkflowDecision)
                                }
                                options={options}
                                required
                            />

                            {selected ? (
                                <p className="rounded-2xl bg-surface-2 p-4 text-sm leading-relaxed text-muted">
                                    {selected.description}
                                </p>
                            ) : null}

                            {decision === "completed" ? (
                                <AdminCompletionPaymentFields
                                    suggestedTotal={total}
                                />
                            ) : null}

                            {needsReason ? (
                                <label className="block space-y-2">
                                    <span className="label-text">
                                        {decision === "no_show"
                                            ? "No-show note"
                                            : "Reason for rejection"}{" "}
                                        <span className="text-red-500">*</span>
                                    </span>
                                    <textarea
                                        name="reason"
                                        required
                                        minLength={4}
                                        rows={3}
                                        className="input-field min-h-24 resize-y leading-relaxed"
                                        placeholder={
                                            decision === "no_show"
                                                ? "Record what happened or any contact attempt."
                                                : "Briefly explain why the request cannot be accepted."
                                        }
                                    />
                                </label>
                            ) : null}

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setOpen(false)}
                                    disabled={pending}
                                >
                                    Go back
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={pending || !decision}
                                >
                                    {pending ? "Saving..." : "Apply update"}
                                </button>
                            </div>
                        </form>
                    </ModalShell>
                ) : null}
            </AnimatePresence>
        </>
    );
}
