"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/features/auth/guards/get-user";
import { getBookingReferenceHref } from "@/features/bookings/utils/booking-formatters";
import {
    canEditBookingOnline,
    canRequestCancellation,
} from "@/features/bookings/utils/booking-status";
import {
    buildServiceOptionLabel,
    calculateEstimate,
    getRemovalOption,
    getService,
    getServiceOption,
    getServiceOptionGroups,
    isRemovalOnly,
    requiresDesignTier,
} from "@/features/bookings/new-booking/utils";
import type {
    BookingCancellationActionState,
    BookingEditActionState,
    RefundMethod,
} from "@/features/bookings/types/bookings";
import { cancellationTemplate } from "@/features/notifications/email/templates/cancellation-template";
import { getAppBaseUrl, getEmailConfig } from "@/lib/email/config";
import { sendTransactionalEmail } from "@/lib/email/brevo";
import type {
    BookingSelections,
    DesignTier,
} from "@/features/bookings/new-booking/types";
import type { Database } from "@/types/supabase";
import { buildBookingServiceLineItems } from "@/features/bookings/utils/booking-line-items";
import { formatStudioAppointmentDateTime } from "@/lib/utils/studio-time";

type DesignTierRow = Pick<
    Database["public"]["Tables"]["design_tiers"]["Row"],
    "id" | "name" | "description" | "price"
>;

function revalidateBookingPaths(bookingReference: string) {
    const detailsHref = getBookingReferenceHref(bookingReference);

    revalidatePath(detailsHref);
    revalidatePath(`${detailsHref}/edit`);
}

const refundMethods = [
    "no_refund",
    "account_credit",
] as const satisfies RefundMethod[];

function nextMessageId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function state(input: Omit<BookingCancellationActionState, "messageId">) {
    return {
        ...input,
        messageId: nextMessageId(),
    };
}

function editState(input: Omit<BookingEditActionState, "messageId">) {
    return {
        ...input,
        messageId: nextMessageId(),
    };
}

function getFormString(formData: FormData, key: string) {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

function mapDesignTiers(rows: DesignTierRow[]): DesignTier[] {
    return rows.map((tier) => ({
        id: tier.id,
        label: tier.name,
        description: tier.description ?? undefined,
        price: Number(tier.price ?? 0),
        imageSrc: null,
        imageAlt: `${tier.name} design tier preview`,
    }));
}

function parseBookingSelections(formData: FormData): BookingSelections {
    const removalId = getFormString(formData, "removalId");
    const serviceId = getFormString(formData, "serviceId");
    const serviceOptionGroupId = getFormString(
        formData,
        "serviceOptionGroupId",
    );
    const serviceOptionId = getFormString(formData, "serviceOptionId");
    const designTierId = getFormString(formData, "designTierId");

    return {
        slotId: null,
        removalId: removalId
            ? (removalId as BookingSelections["removalId"])
            : null,
        serviceId: serviceId
            ? (serviceId as BookingSelections["serviceId"])
            : null,
        serviceOptionGroupId: serviceOptionGroupId || null,
        serviceOptionId: serviceOptionId || null,
        designTierId: designTierId || null,
    };
}

async function getOwnedEditableBooking(bookingId: string, userId: string) {
    const supabase = await createClient();

    const { data: booking, error } = await supabase
        .from("bookings")
        .select(
            "id, booking_reference, user_id, status, slot_id, booking_fee_mode, booking_fee_rate, availability_slots:slot_id(starts_at, ends_at)",
        )
        .eq("id", bookingId)
        .eq("user_id", userId)
        .maybeSingle()
        .overrideTypes<{
            id: string;
            booking_reference: string;
            user_id: string;
            status: Database["public"]["Enums"]["booking_status"];
            slot_id: string | null;
            booking_fee_mode: Database["public"]["Enums"]["fee_mode"];
            booking_fee_rate: number;
            availability_slots:
                | { starts_at: string; ends_at: string | null }
                | { starts_at: string; ends_at: string | null }[]
                | null;
        } | null>();

    if (error) {
        console.error("[bookings:edit.booking]", error);
        return { error: "We couldn't verify this booking. Please try again." };
    }

    if (!booking) {
        return { error: "We couldn't find a booking you can edit." };
    }

    const slot = Array.isArray(booking.availability_slots)
        ? (booking.availability_slots[0] ?? null)
        : booking.availability_slots;

    if (!canEditBookingOnline(booking.status, slot?.starts_at ?? null)) {
        return {
            error: "This appointment can no longer be edited online.",
        };
    }

    return {
        booking: {
            ...booking,
            startsAt: slot?.starts_at ?? null,
            endsAt: slot?.ends_at ?? null,
        },
    };
}

export async function updateBookingServices(
    _prevState: BookingEditActionState,
    formData: FormData,
): Promise<BookingEditActionState> {
    const user = await getUser();

    if (!user) {
        return editState({
            error: "Please sign in before editing your appointment.",
        });
    }

    const bookingId = getFormString(formData, "bookingId");

    if (!bookingId) {
        return editState({ error: "Choose a booking before saving changes." });
    }

    const bookingResult = await getOwnedEditableBooking(bookingId, user.id);

    if ("error" in bookingResult) {
        return editState({ error: bookingResult.error });
    }

    const selections = parseBookingSelections(formData);
    const removal = getRemovalOption(selections.removalId);
    const service = getService(selections.serviceId);
    const serviceOption = getServiceOption(service, selections.serviceOptionId);

    if (!removal) {
        return editState({ error: "Choose a valid removal option." });
    }

    if (!isRemovalOnly(selections.removalId) && (!service || !serviceOption)) {
        return editState({ error: "Choose a valid service option." });
    }

    const serviceOptionGroups = getServiceOptionGroups(service);

    if (
        !isRemovalOnly(selections.removalId) &&
        serviceOptionGroups.length > 0 &&
        !selections.serviceOptionGroupId
    ) {
        return editState({ error: "Choose a valid service length." });
    }

    if (
        !isRemovalOnly(selections.removalId) &&
        serviceOption?.groupId &&
        serviceOption.groupId !== selections.serviceOptionGroupId
    ) {
        return editState({
            error: "Choose a service option that matches the selected length.",
        });
    }

    const admin = createAdminClient();

    const { data: designTierRows, error: designTierError } =
        !isRemovalOnly(selections.removalId) && requiresDesignTier(service)
            ? await admin
                  .from("design_tiers")
                  .select("id, name, description, price")
                  .eq("active", true)
                  .overrideTypes<DesignTierRow[]>()
            : { data: [] as DesignTierRow[], error: null };

    if (designTierError) {
        console.error("[bookings:edit.design-tiers]", designTierError);
        return editState({
            error: "We couldn't validate your design tier. Please try again.",
        });
    }

    const selectedDesignTier =
        !isRemovalOnly(selections.removalId) &&
        requiresDesignTier(service) &&
        selections.designTierId
            ? ((designTierRows ?? []).find(
                  (tier) => tier.id === selections.designTierId,
              ) ?? null)
            : null;

    if (
        !isRemovalOnly(selections.removalId) &&
        requiresDesignTier(service) &&
        !selectedDesignTier
    ) {
        return editState({ error: "Choose a valid design tier." });
    }

    const nextLineItems = buildBookingServiceLineItems({
        selections,
        designTier: selectedDesignTier,
    });

    if (!nextLineItems || nextLineItems.length === 0) {
        return editState({
            error: "Choose at least one valid service or removal option.",
        });
    }

    const { booking } = bookingResult;
    const rowsToInsert = nextLineItems.map((item) => ({
        ...item,
        booking_id: booking.id,
        added_by: user.id,
    }));

    const estimate = calculateEstimate(
        selections,
        {
            depositAmount: 0,
            bookingFeeMode: booking.booking_fee_mode,
            bookingFeeRate: Number(booking.booking_fee_rate ?? 0),
            holdMinutes: 0,
        },
        mapDesignTiers(designTierRows ?? []),
    );

    const now = new Date().toISOString();
    const editableTypes = ["service", "design_tier", "removal"] as const;

    const { error: removeError } = await admin
        .from("booking_line_items")
        .update({
            active: false,
            removed_at: now,
            removed_by: user.id,
        })
        .eq("booking_id", booking.id)
        .eq("active", true)
        .in("item_type", editableTypes);

    if (removeError) {
        console.error("[bookings:edit.remove-line-items]", removeError);
        return editState({
            error: "We couldn't update your services. Please try again.",
        });
    }

    const { error: insertError } = await admin
        .from("booking_line_items")
        .insert(rowsToInsert);

    if (insertError) {
        console.error("[bookings:edit.insert-line-items]", insertError);
        await admin
            .from("booking_line_items")
            .update({
                active: true,
                removed_at: null,
                removed_by: null,
            })
            .eq("booking_id", booking.id)
            .eq("removed_at", now)
            .eq("removed_by", user.id)
            .in("item_type", editableTypes);

        return editState({
            error: "We couldn't save your service changes. Please try again.",
        });
    }

    const { error: eventError } = await admin.from("booking_events").insert({
        booking_id: booking.id,
        actor_type: "client",
        actor_user_id: user.id,
        event_type: "booking_services_updated",
        message: "Client updated appointment services.",
        metadata: {
            removal: removal.label,
            service: isRemovalOnly(selections.removalId)
                ? null
                : service?.label,
            serviceOption: isRemovalOnly(selections.removalId)
                ? null
                : buildServiceOptionLabel(service, serviceOption),
            design: service
                ? requiresDesignTier(service)
                    ? selectedDesignTier?.name ?? null
                    : "Technician-designed freestyle set"
                : null,
            estimatedSubtotal: estimate.subtotal,
            estimatedBookingFee: estimate.bookingFee,
            estimatedTotal: estimate.total,
        },
    });

    if (eventError) {
        console.error("[bookings:edit.event]", eventError);
    }

    revalidatePath("/booking");
    revalidateBookingPaths(booking.booking_reference);
    revalidatePath("/dashboard");

    return editState({
        success:
            "Service changes saved. Your estimated total updated automatically.",
    });
}

export async function requestBookingDateChange(
    _prevState: BookingEditActionState,
    formData: FormData,
): Promise<BookingEditActionState> {
    const user = await getUser();

    if (!user) {
        return editState({
            error: "Please sign in before requesting a date change.",
        });
    }

    const bookingId = getFormString(formData, "bookingId");
    const slotId = getFormString(formData, "slotId");

    if (!bookingId || !slotId) {
        return editState({
            error: "Choose an appointment time before sending the request.",
        });
    }

    const bookingResult = await getOwnedEditableBooking(bookingId, user.id);

    if ("error" in bookingResult) {
        return editState({ error: bookingResult.error });
    }

    const admin = createAdminClient();

    const { data: profile } = await admin
        .from("profiles")
        .select("is_regular")
        .eq("id", user.id)
        .maybeSingle()
        .overrideTypes<{ is_regular: boolean } | null>();

    const { data: requestedSlot, error: slotError } = await admin
        .from("availability_slots")
        .select("id, starts_at, ends_at, regulars_first, public_access_at")
        .eq("id", slotId)
        .eq("active", true)
        .eq("status", "available")
        .or(
            profile?.is_regular
                ? "regulars_first.eq.true,regulars_first.eq.false"
                : `regulars_first.eq.false,public_access_at.lte.${new Date().toISOString()}`,
        )
        .maybeSingle()
        .overrideTypes<{
            id: string;
            starts_at: string;
            ends_at: string | null;
            regulars_first: boolean;
            public_access_at: string;
        } | null>();

    if (slotError) {
        console.error("[bookings:edit.request-date.slot]", slotError);
        return editState({
            error: "We couldn't validate that appointment time. Please try again.",
        });
    }

    if (!requestedSlot) {
        return editState({
            error: "That appointment time is no longer available.",
        });
    }

    if (
        !profile?.is_regular &&
        requestedSlot.regulars_first &&
        new Date(requestedSlot.public_access_at).getTime() > Date.now()
    ) {
        return editState({
            error: "That appointment time is not available yet.",
        });
    }

    const { booking } = bookingResult;
    const { error: eventError } = await admin.from("booking_events").insert({
        booking_id: booking.id,
        actor_type: "client",
        actor_user_id: user.id,
        event_type: "date_change_requested",
        message: "Client requested a date/time change for studio approval.",
        metadata: {
            currentSlotId: booking.slot_id,
            currentStartsAt: booking.startsAt,
            currentEndsAt: booking.endsAt,
            requestedSlotId: requestedSlot.id,
            requestedStartsAt: requestedSlot.starts_at,
            requestedEndsAt: requestedSlot.ends_at,
        },
    });

    if (eventError) {
        console.error("[bookings:edit.request-date.event]", eventError);
        return editState({
            error: "We couldn't send the date change request. Please try again.",
        });
    }

    revalidateBookingPaths(booking.booking_reference);

    return editState({
        success: "Date change request sent. The studio will review it.",
    });
}

export async function requestBookingCancellation(
    _prevState: BookingCancellationActionState,
    formData: FormData,
): Promise<BookingCancellationActionState> {
    const user = await getUser();

    if (!user) {
        return state({
            error: "Please sign in before requesting a cancellation.",
        });
    }

    const bookingId = getFormString(formData, "bookingId");
    const reasonInput = getFormString(formData, "reason");
    const reason = reasonInput || "No additional message provided.";
    const requestedRefundMethod = getFormString(
        formData,
        "requestedRefundMethod",
    );

    if (!bookingId) {
        return state({
            error: "Choose a booking before requesting cancellation.",
        });
    }

    if (!(refundMethods as readonly string[]).includes(requestedRefundMethod)) {
        return state({
            error: "Choose how you would prefer any refund handled.",
        });
    }

    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select(
            "id, booking_reference, user_id, status, profiles:user_id(display_name, email), availability_slots:slot_id(starts_at, ends_at)",
        )
        .eq("id", bookingId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (bookingError) {
        console.error("[bookings:requestCancellation.booking]", bookingError);
        return state({
            error: "We couldn't verify this booking. Please try again.",
        });
    }

    if (!booking) {
        return state({ error: "We couldn't find a booking you can cancel." });
    }

    if (!canRequestCancellation(booking.status)) {
        return state({
            error: "This booking is not eligible for a cancellation request.",
        });
    }

    const { data: duplicateRequest, error: duplicateError } = await supabase
        .from("cancellation_requests")
        .select("id")
        .eq("booking_id", booking.id)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

    if (duplicateError) {
        console.error(
            "[bookings:requestCancellation.duplicate]",
            duplicateError,
        );
        return state({
            error: "We couldn't check existing cancellation requests. Please try again.",
        });
    }

    if (duplicateRequest) {
        return state({
            success: "Your cancellation request is already pending review.",
        });
    }

    const { error: insertError } = await admin
        .from("cancellation_requests")
        .insert({
            booking_id: booking.id,
            user_id: user.id,
            reason,
            requested_refund_method: requestedRefundMethod as RefundMethod,
            status: "pending",
        });

    if (insertError) {
        console.error("[bookings:requestCancellation.insert]", insertError);
        return state({
            error: "We couldn't submit the cancellation request. Please try again.",
        });
    }

    const { error: updateError } = await admin
        .from("bookings")
        .update({ status: "cancellation_requested" })
        .eq("id", booking.id)
        .eq("user_id", user.id);

    if (updateError) {
        console.error(
            "[bookings:requestCancellation.status-sync]",
            updateError,
        );
        await admin
            .from("cancellation_requests")
            .delete()
            .eq("booking_id", booking.id)
            .eq("user_id", user.id)
            .eq("status", "pending");

        return state({
            error: "We couldn't update the booking status right now. Please try again.",
        });
    }

    const { error: eventError } = await admin.from("booking_events").insert({
        booking_id: booking.id,
        actor_type: "client",
        actor_user_id: user.id,
        event_type: "cancellation_requested",
        message: "Client requested cancellation.",
        metadata: {
            requestedRefundMethod,
            reason: reasonInput || null,
        },
    });

    if (eventError) {
        console.error("[bookings:requestCancellation.event]", eventError);
    }

    revalidatePath("/booking");
    revalidateBookingPaths(booking.booking_reference);
    revalidatePath("/dashboard");

    const typedBooking = booking as typeof booking & {
        profiles?: { display_name: string; email: string } | null;
        availability_slots?: {
            starts_at: string;
            ends_at: string | null;
        } | null;
    };
    const appointment = typedBooking.availability_slots?.starts_at
        ? formatStudioAppointmentDateTime(
              typedBooking.availability_slots.starts_at,
          )
        : "Not scheduled";
    const outcome =
        requestedRefundMethod === "account_credit"
            ? "Convert deposit to credit"
            : "No refund needed";
    const siteUrl = getAppBaseUrl();
    const adminEmail = getEmailConfig().adminNotificationEmail;
    const template = cancellationTemplate({
        name: typedBooking.profiles?.display_name ?? "Client",
        reference: booking.booking_reference,
        heading: "Cancellation request received",
        appointment,
        reason,
        outcome,
        message: "Your cancellation request was sent to the studio for review.",
        detailsUrl: siteUrl
            ? `${siteUrl}/booking/${booking.booking_reference}`
            : undefined,
    });
    await sendTransactionalEmail({
        to: {
            email: typedBooking.profiles?.email ?? null,
            name: typedBooking.profiles?.display_name,
        },
        bcc: adminEmail
            ? [{ email: adminEmail, name: "Vee's Nail Studio" }]
            : undefined,
        ...template,
        notificationType: "cancellation_request_submitted",
        bookingId: booking.id,
        userId: user.id,
    });

    return state({
        success:
            "Cancellation request submitted. The studio will review your request.",
    });
}
