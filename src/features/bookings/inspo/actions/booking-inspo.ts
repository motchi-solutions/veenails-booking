"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/features/auth/guards/get-user";
import {
    buildBookingInspoMessage,
    getInstagramDmUrl,
} from "@/features/bookings/inspo/utils/booking-inspo-message";
import { createClient } from "@/lib/supabase/server";
import type { Database, Enums } from "@/types/supabase";
import { createAdminClient } from "@/lib/supabase/admin";
import { appointmentStatusTemplate } from "@/features/notifications/email/templates/appointment-status-template";
import { sendTransactionalEmail } from "@/lib/email/brevo";
import { getAppBaseUrl, getEmailConfig } from "@/lib/email/config";
import { formatStudioAppointmentDateTime } from "@/lib/utils/studio-time";

type InspoPromptRow = Pick<
    Database["public"]["Tables"]["booking_inspo_prompts"]["Row"],
    | "id"
    | "booking_id"
    | "user_id"
    | "message_text"
    | "instagram_url"
    | "copied_at"
    | "opened_at"
    | "status"
    | "inspo_sent_at"
    | "reviewed_at"
>;

type OwnedBookingRow = Pick<
    Database["public"]["Tables"]["bookings"]["Row"],
    "id" | "booking_reference" | "user_id"
> & {
    availability_slots:
        | { starts_at: string | null; ends_at: string | null }
        | { starts_at: string | null; ends_at: string | null }[]
        | null;
};

type ProfileContactRow = Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    | "display_name"
    | "email"
    | "phone"
    | "instagram_handle"
    | "preferred_contact_method"
>;

type SettingsRow = Pick<
    Database["public"]["Tables"]["booking_settings"]["Row"],
    "instagram_url"
>;

export type BookingInspoPrompt = {
    id: string;
    bookingId: string;
    messageText: string;
    instagramUrl: string | null;
    status: Enums<"booking_inspo_status">;
    copiedAt: string | null;
    openedAt: string | null;
    inspoSentAt: string | null;
    reviewedAt: string | null;
};

export type BookingInspoActionResult = {
    error?: string;
    success?: string;
    prompt?: BookingInspoPrompt;
};

function mapPrompt(row: InspoPromptRow): BookingInspoPrompt {
    return {
        id: row.id,
        bookingId: row.booking_id,
        messageText: row.message_text,
        instagramUrl: row.instagram_url,
        status: row.status,
        copiedAt: row.copied_at,
        openedAt: row.opened_at,
        inspoSentAt: row.inspo_sent_at,
        reviewedAt: row.reviewed_at,
    };
}

function getSlot(
    booking: Pick<OwnedBookingRow, "availability_slots">,
) {
    return Array.isArray(booking.availability_slots)
        ? (booking.availability_slots[0] ?? null)
        : booking.availability_slots;
}

async function getOwnedPrompt(promptId: string, userId: string) {
    const supabase = await createClient();

    const { data: prompt, error } = await supabase
        .from("booking_inspo_prompts")
        .select(
            "id, booking_id, user_id, message_text, instagram_url, copied_at, opened_at, status, inspo_sent_at, reviewed_at",
        )
        .eq("id", promptId)
        .eq("user_id", userId)
        .maybeSingle()
        .overrideTypes<InspoPromptRow | null>();

    if (error) {
        console.error("[booking-inspo:getOwnedPrompt]", error);
        return {
            error: "We couldn't verify your inspo prompt. Please try again.",
        };
    }

    if (!prompt) {
        return {
            error: "We couldn't find an inspo prompt you can update.",
        };
    }

    return { prompt };
}

export async function getOrCreateBookingInspoPrompt(
    bookingId: string,
): Promise<BookingInspoActionResult> {
    const user = await getUser();

    if (!user) {
        return { error: "Please sign in before submitting design inspo." };
    }

    if (!bookingId) {
        return { error: "Choose a booking before submitting design inspo." };
    }

    const supabase = await createClient();

    const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select(
            "id, booking_reference, user_id, availability_slots:slot_id(starts_at, ends_at)",
        )
        .eq("id", bookingId)
        .eq("user_id", user.id)
        .maybeSingle()
        .overrideTypes<OwnedBookingRow | null>();

    if (bookingError) {
        console.error("[booking-inspo:booking]", bookingError);
        return { error: "We couldn't verify this booking. Please try again." };
    }

    if (!booking) {
        return { error: "We couldn't find a booking you can update." };
    }

    const { data: existingPrompt, error: existingError } = await supabase
        .from("booking_inspo_prompts")
        .select(
            "id, booking_id, user_id, message_text, instagram_url, copied_at, opened_at, status, inspo_sent_at, reviewed_at",
        )
        .eq("booking_id", booking.id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle()
        .overrideTypes<InspoPromptRow | null>();

    if (existingError) {
        console.error("[booking-inspo:existing]", existingError);
        return {
            error: "We couldn't load your inspo prompt. Please try again.",
        };
    }

    if (existingPrompt) {
        const [profileResult, settingsResult] = await Promise.all([
            supabase
                .from("profiles")
                .select(
                    "display_name, email, phone, instagram_handle, preferred_contact_method",
                )
                .eq("id", user.id)
                .maybeSingle()
                .overrideTypes<ProfileContactRow | null>(),
            supabase
                .from("booking_settings")
                .select("instagram_url")
                .eq("id", 1)
                .eq("active", true)
                .maybeSingle()
                .overrideTypes<SettingsRow | null>(),
        ]);

        if (profileResult.error) {
            console.error(
                "[booking-inspo:existing-profile]",
                profileResult.error,
            );
            return { prompt: mapPrompt(existingPrompt) };
        }

        if (settingsResult.error) {
            console.error(
                "[booking-inspo:existing-settings]",
                settingsResult.error,
            );
            return { prompt: mapPrompt(existingPrompt) };
        }

        const profile = profileResult.data;

        if (!profile) {
            return { prompt: mapPrompt(existingPrompt) };
        }

        const slot = getSlot(booking);
        const refreshedMessageText = buildBookingInspoMessage({
            bookingReference: booking.booking_reference,
            startsAt: slot?.starts_at ?? null,
            displayName: profile.display_name,
            email: profile.email,
            preferredContactMethod: profile.preferred_contact_method,
            instagramHandle: profile.instagram_handle,
            phone: profile.phone,
        });
        const refreshedInstagramUrl = getInstagramDmUrl({
            instagramUrl: settingsResult.data?.instagram_url ?? null,
        });
        const shouldUpdateMessage =
            refreshedMessageText !== existingPrompt.message_text;
        const shouldUpdateInstagramUrl =
            refreshedInstagramUrl !== null &&
            refreshedInstagramUrl !== existingPrompt.instagram_url;

        if (shouldUpdateMessage || shouldUpdateInstagramUrl) {
            const { data: refreshedPrompt, error: refreshError } =
                await supabase
                    .from("booking_inspo_prompts")
                    .update({
                        ...(shouldUpdateMessage
                            ? { message_text: refreshedMessageText }
                            : {}),
                        ...(shouldUpdateInstagramUrl
                            ? { instagram_url: refreshedInstagramUrl }
                            : {}),
                    })
                    .eq("id", existingPrompt.id)
                    .eq("user_id", user.id)
                    .select(
                        "id, booking_id, user_id, message_text, instagram_url, copied_at, opened_at, status, inspo_sent_at, reviewed_at",
                    )
                    .single()
                    .overrideTypes<InspoPromptRow>();

            if (refreshError) {
                console.error(
                    "[booking-inspo:refresh-instagram-url]",
                    refreshError,
                );
                return { prompt: mapPrompt(existingPrompt) };
            }

            return { prompt: mapPrompt(refreshedPrompt) };
        }

        return { prompt: mapPrompt(existingPrompt) };
    }

    const [profileResult, settingsResult] = await Promise.all([
        supabase
            .from("profiles")
            .select(
                "display_name, email, phone, instagram_handle, preferred_contact_method",
            )
            .eq("id", user.id)
            .maybeSingle()
            .overrideTypes<ProfileContactRow | null>(),
        supabase
            .from("booking_settings")
            .select("instagram_url")
            .eq("id", 1)
            .eq("active", true)
            .maybeSingle()
            .overrideTypes<SettingsRow | null>(),
    ]);

    if (profileResult.error) {
        console.error("[booking-inspo:profile]", profileResult.error);
        return {
            error: "We couldn't load your contact details. Please try again.",
        };
    }

    if (settingsResult.error) {
        console.error("[booking-inspo:settings]", settingsResult.error);
        return {
            error: "We couldn't load the Instagram handoff. Please try again.",
        };
    }

    const profile = profileResult.data;

    if (!profile) {
        return {
            error: "We couldn't load your contact details. Please try again.",
        };
    }

    const slot = getSlot(booking);
    const messageText = buildBookingInspoMessage({
        bookingReference: booking.booking_reference,
        startsAt: slot?.starts_at ?? null,
        displayName: profile.display_name,
        email: profile.email,
        preferredContactMethod: profile.preferred_contact_method,
        instagramHandle: profile.instagram_handle,
        phone: profile.phone,
    });
    const instagramUrl = getInstagramDmUrl({
        instagramUrl: settingsResult.data?.instagram_url ?? null,
    });

    // TODO: Add a unique DB constraint on (booking_id, user_id) for stronger duplicate protection.
    const { data: insertedPrompt, error: insertError } = await supabase
        .from("booking_inspo_prompts")
        .insert({
            booking_id: booking.id,
            user_id: user.id,
            message_text: messageText,
            instagram_url: instagramUrl,
            status: "pending",
        })
        .select(
            "id, booking_id, user_id, message_text, instagram_url, copied_at, opened_at, status, inspo_sent_at, reviewed_at",
        )
        .single()
        .overrideTypes<InspoPromptRow>();

    if (insertError) {
        console.error("[booking-inspo:insert]", insertError);
        return {
            error: "We couldn't prepare your inspo message. Please try again.",
        };
    }

    return { prompt: mapPrompt(insertedPrompt) };
}

export async function markBookingInspoCopied(
    promptId: string,
): Promise<BookingInspoActionResult> {
    const user = await getUser();

    if (!user) {
        return { error: "Please sign in before updating design inspo." };
    }

    const ownedPrompt = await getOwnedPrompt(promptId, user.id);

    if ("error" in ownedPrompt) {
        return { error: ownedPrompt.error };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
        .from("booking_inspo_prompts")
        .update({ copied_at: new Date().toISOString() })
        .eq("id", ownedPrompt.prompt.id)
        .eq("user_id", user.id)
        .select(
            "id, booking_id, user_id, message_text, instagram_url, copied_at, opened_at, status, inspo_sent_at, reviewed_at",
        )
        .single()
        .overrideTypes<InspoPromptRow>();

    if (error) {
        console.error("[booking-inspo:copied]", error);
        return { error: "We couldn't mark the message copied." };
    }

    return { prompt: mapPrompt(data) };
}

export async function markBookingInspoOpened(
    promptId: string,
): Promise<BookingInspoActionResult> {
    const user = await getUser();

    if (!user) {
        return { error: "Please sign in before updating design inspo." };
    }

    const ownedPrompt = await getOwnedPrompt(promptId, user.id);

    if ("error" in ownedPrompt) {
        return { error: ownedPrompt.error };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
        .from("booking_inspo_prompts")
        .update({ opened_at: new Date().toISOString() })
        .eq("id", ownedPrompt.prompt.id)
        .eq("user_id", user.id)
        .select(
            "id, booking_id, user_id, message_text, instagram_url, copied_at, opened_at, status, inspo_sent_at, reviewed_at",
        )
        .single()
        .overrideTypes<InspoPromptRow>();

    if (error) {
        console.error("[booking-inspo:opened]", error);
        return { error: "We couldn't mark Instagram opened." };
    }

    return { prompt: mapPrompt(data) };
}

export async function markBookingInspoSent(
    promptId: string,
): Promise<BookingInspoActionResult> {
    const user = await getUser();

    if (!user) {
        return { error: "Please sign in before updating design inspo." };
    }

    const ownedPrompt = await getOwnedPrompt(promptId, user.id);

    if ("error" in ownedPrompt) {
        return { error: ownedPrompt.error };
    }

    if (ownedPrompt.prompt.status === "reviewed") {
        return {
            success: "Design inspo has already been reviewed.",
            prompt: mapPrompt(ownedPrompt.prompt),
        };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
        .from("booking_inspo_prompts")
        .update({
            status: "sent",
            inspo_sent_at: new Date().toISOString(),
        })
        .eq("id", ownedPrompt.prompt.id)
        .eq("user_id", user.id)
        .neq("status", "reviewed")
        .select(
            "id, booking_id, user_id, message_text, instagram_url, copied_at, opened_at, status, inspo_sent_at, reviewed_at",
        )
        .single()
        .overrideTypes<InspoPromptRow>();

    if (error) {
        console.error("[booking-inspo:sent]", error);
        return { error: "We couldn't mark your inspo as sent." };
    }

    const admin = createAdminClient();
    const { error: eventError } = await admin.from("booking_events").insert({ booking_id: data.booking_id, actor_type: "client", actor_user_id: user.id, event_type: "design_inspo_sent", message: "Client marked design inspo as sent for studio review.", metadata: { promptId: data.id } });
    if (eventError) console.error("[booking-inspo:sent-event]", eventError);

    const adminEmail = getEmailConfig().adminNotificationEmail;
    if (adminEmail) {
        const { data: booking } = await admin.from("bookings").select("id, booking_reference, availability_slots:slot_id(starts_at, ends_at), profiles:user_id(display_name)").eq("id", data.booking_id).maybeSingle().overrideTypes<{ id: string; booking_reference: string; availability_slots: { starts_at: string; ends_at: string } | null; profiles: { display_name: string } | null } | null>();
        if (booking) {
            const appointment = booking.availability_slots?.starts_at ? formatStudioAppointmentDateTime(booking.availability_slots.starts_at) : "Not scheduled";
            const siteUrl = getAppBaseUrl();
            const template = appointmentStatusTemplate({ name: "Vee", reference: booking.booking_reference, status: "inspo ready", appointment, message: `${booking.profiles?.display_name ?? "A client"} marked their design inspo as sent.`, detailsUrl: siteUrl ? `${siteUrl}/admin/appointments/${booking.id}#design-inspo` : undefined });
            await sendTransactionalEmail({ to: { email: adminEmail, name: "Vee’s Nail Studio" }, ...template, notificationType: "admin_design_inspo_sent", bookingId: booking.id, userId: user.id });
        }
    }

    revalidatePath("/booking");

    return {
        success: "Inspo sent. The studio will review it with your booking.",
        prompt: mapPrompt(data),
    };
}
