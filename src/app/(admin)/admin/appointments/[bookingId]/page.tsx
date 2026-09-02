import AdminAppointmentDetailsPage from "@/features/admin/appointments/components/AdminAppointmentDetailsPage";
import { getAdminAppointmentDetails } from "@/features/admin/appointments/data/admin-appointments";
import { buildMetadata } from "@/lib/seo/metadata";
import { getAdminCancellationOutcome } from "@/features/admin/appointments/data/admin-cancellation-outcome";

export const metadata = buildMetadata({
    title: "Admin Appointment Details",
    description: "Manage appointment details.",
    path: "/admin/appointments",
    noIndex: true,
});

export default async function AdminAppointmentDetailsRoute({
    params,
    searchParams,
}: {
    params: Promise<{ bookingId: string }>;
    searchParams: Promise<{ cancel?: string }>;
}) {
    const { bookingId } = await params;
    const { cancel } = await searchParams;
    const booking = await getAdminAppointmentDetails(bookingId);
    const cancellationOutcome = await getAdminCancellationOutcome(booking.id);

    return <AdminAppointmentDetailsPage booking={booking} cancellationOutcome={cancellationOutcome} openCancellation={cancel === "1"} />;
}
