import { detailBlock, emailLayout, escapeHtml } from "@/features/notifications/email/templates/layout";

export function appointmentStatusTemplate({
    name,
    reference,
    status,
    appointment,
    message,
    detailsUrl,
    extraDetails = [],
}: {
    name: string;
    reference: string;
    status: string;
    appointment: string;
    message: string;
    detailsUrl?: string;
    extraDetails?: Array<[string, string]>;
}) {
    const subject = `Appointment ${status} · ${reference}`;
    const details: Array<[string, string]> = [
        ["Booking", reference],
        ["Appointment", appointment],
        ["Status", status],
        ...extraDetails,
    ];
    const extraDetailsText = extraDetails
        .map(([label, value]) => `${label}: ${value}`)
        .join("\n");

    return {
        subject,
        text: `Hi ${name},\n\n${message}\n\nBooking: ${reference}\nAppointment: ${appointment}\nStatus: ${status}${extraDetailsText ? `\n${extraDetailsText}` : ""}\n\nVee’s Nail Studio`,
        html: emailLayout({
            heading: `Appointment ${status}`,
            preview: subject,
            body: `<p>Hi ${escapeHtml(name)},</p><p>${escapeHtml(message)}</p>${detailBlock(details)}`,
            cta: detailsUrl
                ? { label: "View appointment", href: detailsUrl }
                : undefined,
        }),
    };
}
