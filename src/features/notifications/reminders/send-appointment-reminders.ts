import "server-only";

import { appointmentReminderTemplate } from "@/features/notifications/email/templates/appointment-reminder-template";
import { resolveBookingRecipient } from "@/features/notifications/utils/resolve-booking-recipient";
import {
    getStudioDateKey,
    formatStudioAppointmentTime,
    STUDIO_TIME_ZONE,
    studioDateTimeToDate,
} from "@/lib/utils/studio-time";
import {
    getAppBaseUrl,
    getEmailConfig,
} from "@/lib/email/config";
import { sendTransactionalEmail } from "@/lib/email/brevo";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/supabase";

type ReminderBookingRow = Pick<
    Database["public"]["Tables"]["bookings"]["Row"],
    | "id"
    | "booking_reference"
    | "user_id"
    | "status"
    | "client_display_name"
    | "client_email"
    | "client_instagram_handle"
    | "client_preferred_contact_method"
> & {
    availability_slots: {
        starts_at: string;
        ends_at: string | null;
    };
    profiles: {
        display_name: string;
        email: string;
        instagram_handle: string | null;
        preferred_contact_method: string | null;
    } | null;
    booking_line_items: Array<{
        label_snapshot: string;
        item_type: string;
        active: boolean;
        removed_at: string | null;
    }> | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: STUDIO_TIME_ZONE,
    dateStyle: "full",
});

export async function sendAppointmentReminders(now = new Date()) {
    const admin = createAdminClient();
    const todayParts = getStudioDateKey(now).split("-").map(Number);
    const tomorrowDate = new Date(
        Date.UTC(todayParts[0], todayParts[1] - 1, todayParts[2] + 1),
    )
        .toISOString()
        .slice(0, 10);
    const followingDate = new Date(
        Date.UTC(todayParts[0], todayParts[1] - 1, todayParts[2] + 2),
    )
        .toISOString()
        .slice(0, 10);
    const windowStart = studioDateTimeToDate(tomorrowDate, "00:00");
    const windowEnd = studioDateTimeToDate(followingDate, "00:00");

    const [bookingsResult, settingsResult] = await Promise.all([
        admin
            .from("bookings")
            .select(
                "id, booking_reference, user_id, status, client_display_name, client_email, client_instagram_handle, client_preferred_contact_method, availability_slots:slot_id!inner(starts_at, ends_at), profiles:user_id(display_name, email, instagram_handle, preferred_contact_method), booking_line_items(label_snapshot, item_type, active, removed_at)",
            )
            .eq("status", "confirmed")
            .gte(
                "availability_slots.starts_at",
                windowStart.toISOString(),
            )
            .lt("availability_slots.starts_at", windowEnd.toISOString())
            .overrideTypes<ReminderBookingRow[]>(),
        admin
            .from("booking_settings")
            .select("instagram_url")
            .eq("active", true)
            .order("id", { ascending: true })
            .limit(1)
            .maybeSingle()
            .overrideTypes<{ instagram_url: string | null } | null>(),
    ]);

    if (bookingsResult.error || settingsResult.error) {
        throw bookingsResult.error ?? settingsResult.error;
    }

    const settings = settingsResult.data;
    const siteUrl = getAppBaseUrl();
    const adminEmail = getEmailConfig().adminNotificationEmail;
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const booking of bookingsResult.data ?? []) {
        const recipient = resolveBookingRecipient(booking);
        const services =
            (booking.booking_line_items ?? [])
                .filter(
                    (item) =>
                        item.active &&
                        !item.removed_at &&
                        item.item_type !== "discount",
                )
                .map((item) => item.label_snapshot)
                .join(" · ") || "Appointment services";
        const startsAt = new Date(booking.availability_slots.starts_at);
        const endsAt = booking.availability_slots.ends_at
            ? new Date(booking.availability_slots.ends_at)
            : null;
        const template = appointmentReminderTemplate({
            name: recipient.displayName,
            reference: booking.booking_reference,
            appointmentDate: dateFormatter.format(startsAt),
            startTime: formatStudioAppointmentTime(startsAt),
            endTime: endsAt ? formatStudioAppointmentTime(endsAt) : null,
            serviceSummary: services,
            instagramUrl: settings?.instagram_url ?? null,
            detailsUrl:
                booking.user_id && siteUrl
                    ? `${siteUrl}/booking/${booking.booking_reference}`
                    : undefined,
        });
        const result = await sendTransactionalEmail({
            to: {
                email: recipient.email,
                name: recipient.displayName,
            },
            bcc: adminEmail
                ? [{ email: adminEmail, name: "Vee's Nail Studio" }]
                : undefined,
            ...template,
            notificationType: "appointment_reminder_24h",
            bookingId: booking.id,
            userId: booking.user_id,
        });

        if (result.sent) sent += 1;
        else if (result.skipped) skipped += 1;
        else failed += 1;
    }

    return {
        eligible: bookingsResult.data?.length ?? 0,
        sent,
        skipped,
        failed,
        windowStart: windowStart.toISOString(),
        windowEnd: windowEnd.toISOString(),
    };
}
