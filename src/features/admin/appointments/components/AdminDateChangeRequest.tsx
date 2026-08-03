"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { reviewDateChangeRequestAction } from "@/features/admin/appointments/actions/admin-appointments";
import type { AdminAppointmentDetails } from "@/features/admin/appointments/data/admin-appointments";
import { formatBookingDateTime } from "@/features/admin/components/admin-formatters";
import { useToast } from "@/components/shared/toast/ToastProvider";

const initialState = { error: "", success: "", messageId: "" };

export default function AdminDateChangeRequest({
    booking,
}: {
    booking: AdminAppointmentDetails;
}) {
    const request = booking.pendingDateChangeRequest;
    const outcome = booking.latestDateChangeOutcome;
    const router = useRouter();
    const { error, success } = useToast();
    const [state, formAction, pending] = useActionState(
        reviewDateChangeRequestAction,
        initialState,
    );

    useEffect(() => {
        if (!state.messageId) return;
        if (state.error) {
            error(state.error, "Date change not approved");
        } else if (state.success) {
            success(state.success, "Request reviewed");
            router.refresh();
        }
    }, [error, router, state.error, state.messageId, state.success, success]);

    if (!request) {
        if (!outcome) return null;

        return (
            <section className="rounded-3xl border border-dark-green/20 bg-dark-green/5 p-5 shadow-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-green">
                    Date change {outcome.decision}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">
                    {outcome.decision === "approved"
                        ? "Appointment time updated"
                        : "Original appointment kept"}
                </h2>
                {outcome.decision === "approved" ? (
                    <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                        <TimeBlock label="Previous time" startsAt={outcome.previousStartsAt} endsAt={outcome.previousEndsAt} />
                        <span className="hidden text-lg font-semibold text-dark-green sm:block" aria-hidden="true">→</span>
                        <TimeBlock label="New time" startsAt={outcome.nextStartsAt} endsAt={outcome.nextEndsAt} />
                    </div>
                ) : (
                    <p className="mt-3 text-sm text-muted">
                        {outcome.reason || "The requested date change was declined."}
                    </p>
                )}
            </section>
        );
    }

    return (
        <section
            id="date-change-request"
            className="scroll-mt-24 rounded-3xl border border-requested/25 bg-requested-soft p-5 shadow-sm sm:p-7"
        >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-requested">
                Client request
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
                Date change waiting for review
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-surface p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                        Current appointment
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                        {formatBookingDateTime(booking.startsAt, booking.endsAt)}
                    </p>
                </div>
                <div className="rounded-2xl bg-surface p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                        Requested appointment
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                        {formatBookingDateTime(
                            request.requestedStartsAt,
                            request.requestedEndsAt,
                        )}
                    </p>
                </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
                Approving moves the booking, releases the old slot, syncs Google Calendar, and emails the client. Declining keeps the current appointment.
            </p>
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
                <form action={formAction}>
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <input type="hidden" name="slotId" value={request.requestedSlotId} />
                    <input type="hidden" name="requestEventId" value={request.id} />
                    <input type="hidden" name="decision" value="approve" />
                    <button type="submit" className="btn-primary w-full justify-center" disabled={pending}>
                        {pending ? "Reviewing…" : "Approve date change"}
                    </button>
                </form>
                <form action={formAction} className="flex flex-col gap-3 sm:flex-row">
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <input type="hidden" name="requestEventId" value={request.id} />
                    <input type="hidden" name="decision" value="decline" />
                    <input
                        name="reason"
                        className="input-field min-w-0 flex-1"
                        placeholder="Optional reason for client"
                        maxLength={240}
                    />
                    <button type="submit" className="btn-secondary shrink-0 justify-center" disabled={pending}>
                        {pending ? "Reviewing…" : "Decline"}
                    </button>
                </form>
            </div>
        </section>
    );
}

function TimeBlock({ label, startsAt, endsAt }: { label: string; startsAt: string | null; endsAt: string | null }) {
    return (
        <div className="rounded-2xl bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
            <p className="mt-2 text-sm font-semibold text-foreground">
                {startsAt ? formatBookingDateTime(startsAt, endsAt) : "Not available"}
            </p>
        </div>
    );
}
