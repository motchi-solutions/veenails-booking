import AdminCancellationButton from "@/features/admin/appointments/components/AdminCancellationButton";
import AdminBookingWorkflowButton from "@/features/admin/appointments/components/AdminBookingWorkflowButton";
import type { AdminAppointmentDetails } from "@/features/admin/appointments/data/admin-appointments";
import { getAdminAppointmentActionRules } from "@/features/admin/appointments/utils/admin-appointment-actions";

export default function AdminAppointmentActions({
    booking,
    openCancellation = false,
}: {
    booking: AdminAppointmentDetails;
    openCancellation?: boolean;
}) {
    const rules = getAdminAppointmentActionRules(booking);
    const request = booking.cancellationRequest;

    const hasOperationalActions =
        rules.canConfirm ||
        rules.canConfirmDeposit ||
        rules.canComplete ||
        rules.canMarkNoShow;

    return (
        <section className="rounded-3xl border border-border/60 bg-surface p-4 shadow-sm sm:p-5 lg:p-6">
            <div className="max-w-2xl">
                <h2 className="text-lg font-semibold text-foreground">
                    Actions
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                    Available actions reflect the appointment&apos;s current
                    state.
                </p>
            </div>

            <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 w-full h-full items-center justify-center gap-4 sm:mt-6 sm:gap-5">
                {rules.canReviewCancellation && request ? (
                    <div className="w-full rounded-2xl border border-border/60 bg-surface-2 p-4 sm:p-5">
                        <div className="border-b border-border/60 pb-4">
                            <h3 className="text-base font-semibold text-foreground">
                                Cancellation review
                            </h3>
                            <p className="mt-2 wrap-break-word text-sm leading-relaxed text-muted">
                                {request.reason}
                            </p>
                        </div>

                        <div className="mt-5">
                            <AdminCancellationButton
                                booking={booking}
                                label="Review cancellation request"
                                className="btn-primary w-full"
                            />
                        </div>
                    </div>
                ) : null}

                {hasOperationalActions ? (
                    <div className="w-full">
                        <AdminBookingWorkflowButton booking={booking} />
                    </div>
                ) : null}

                {rules.canCancel ? (
                    <div className="w-full">
                        <AdminCancellationButton
                            booking={booking}
                            className="btn-secondary w-full"
                            initiallyOpen={openCancellation}
                        />
                    </div>
                ) : null}

                {rules.terminal ? (
                    <p className="w-full rounded-2xl bg-background p-4 text-sm leading-relaxed text-muted">
                        This appointment is closed. Normal operational actions
                        are hidden; its details and services remain available
                        for admin correction.
                    </p>
                ) : null}
            </div>
        </section>
    );
}
