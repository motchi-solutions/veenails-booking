import {
    formatBookingDateTime,
    formatMoney,
} from "@/features/bookings/utils/booking-formatters";
import { getUserTimeZone } from "@/lib/utils/studio-time";

export { formatBookingDateTime, formatMoney };

export function formatDateTime(value: string | null | undefined) {
    if (!value) return "Not set";

    return new Intl.DateTimeFormat("en-CA", {
        timeZone: getUserTimeZone(),
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(value));
}

export function formatContactMethod(value: string | null | undefined) {
    if (value === "instagram") return "Instagram";
    if (value === "phone") return "Phone";
    if (value === "email") return "Email";
    return "Not provided";
}

export function formatInstagramHandle(value: string) {
    return `@${value.replace(/^@/, "")}`;
}
