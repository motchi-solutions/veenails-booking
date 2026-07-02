import type { Enums } from "@/types/supabase";
import { getUserTimeZone } from "@/lib/utils/studio-time";

const appointmentFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: getUserTimeZone(),
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
});

export function formatInspoAppointment(startsAt: string | null) {
    if (!startsAt) {
        return "Appointment time pending";
    }

    return appointmentFormatter.format(new Date(startsAt));
}

function formatPreferredContact({
    preferredContactMethod,
    instagramHandle,
    phone,
}: {
    preferredContactMethod: Enums<"preferred_contact_method">;
    instagramHandle: string | null;
    phone: string | null;
}) {
    if (preferredContactMethod === "instagram" && instagramHandle) {
        return `Instagram @${instagramHandle}`;
    }

    if (preferredContactMethod === "phone" && phone) {
        return `Phone ${phone}`;
    }

    return "Email";
}

export function buildBookingInspoMessage({
    bookingReference,
    startsAt,
    displayName,
    email,
    preferredContactMethod,
    instagramHandle,
    phone,
}: {
    bookingReference: string;
    startsAt: string | null;
    displayName: string;
    email: string;
    preferredContactMethod: Enums<"preferred_contact_method">;
    instagramHandle: string | null;
    phone: string | null;
}) {
    const lines = [
        "Hi Vee! I'm sending design inspo for my appointment.",
        "",
        "Booking details",
        `Reference: ${bookingReference}`,
        `Appointment: ${formatInspoAppointment(startsAt)}`,
        "",
        "Client details",
        `Name: ${displayName}`,
        `Email: ${email}`,
    ];

    const preferredContact = formatPreferredContact({
        preferredContactMethod,
        instagramHandle,
        phone,
    });

    lines.push(`Preferred contact: ${preferredContact}`);

    if (instagramHandle) {
        lines.push(`Instagram: @${instagramHandle}`);
    }

    if (phone) {
        lines.push(`Phone: ${phone}`);
    }

    lines.push(
        "",
        "I'll send my inspo photos right after this first message.",
    );

    return lines.join("\n");
}

export function getInstagramDmUrl({
    instagramUrl,
}: {
    instagramUrl: string | null;
}) {
    const baseUrl = instagramUrl?.trim();

    if (!baseUrl) {
        return null;
    }

    try {
        const url = new URL(baseUrl);
        const host = url.hostname.toLowerCase();
        const allowedHost =
            host === "ig.me" ||
            host === "www.ig.me" ||
            host === "instagram.com" ||
            host === "www.instagram.com";

        if (!allowedHost) {
            return null;
        }

        url.search = "";
        url.hash = "";
        return url.toString();
    } catch {
        return null;
    }
}
