"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/features/auth/guards/get-user";
import type {
    DesignTier,
    ServiceConfig,
    ServiceOption,
} from "@/features/bookings/new-booking/types";
import {
    buildServiceOptionLabel,
    calculateEstimate,
    getRemovalOption,
    getService,
    getServiceOption,
    isReviewReady,
    requiresDesignTier,
} from "@/features/bookings/new-booking/utils";
import { isAvailableCredit } from "@/features/credits/lib/credits";
import {
    isBookingCheckoutDraft,
    type BookingCheckoutDraft,
} from "@/lib/booking/checkout-draft";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BookingCheckoutActionState } from "@/features/bookings/checkout/types";
import type { Database } from "@/types/supabase";
import { appointmentStatusTemplate } from "@/features/notifications/email/templates/appointment-status-template";
import { sendTransactionalEmail } from "@/lib/email/brevo";
import { getAppBaseUrl, getEmailConfig } from "@/lib/email/config";
import { calculateCheckoutPaymentPlan } from "@/features/bookings/utils/booking-ledger";
import { buildBookingServiceLineItems } from "@/features/bookings/utils/booking-line-items";
import { formatStudioAppointmentDateTime } from "@/lib/utils/studio-time";

type BookingSettingsRow = Pick<
    Database["public"]["Tables"]["booking_settings"]["Row"],
    | "deposit_amount"
    | "booking_fee_mode"
    | "booking_fee_rate"
    | "hold_minutes"
    | "etransfer_email"
    | "instagram_url"
>;

type DesignTierRow = Pick<
    Database["public"]["Tables"]["design_tiers"]["Row"],
    "id" | "name" | "description" | "price"
>;

type PolicyRow = Pick<
    Database["public"]["Tables"]["policies"]["Row"],
    "id" | "title" | "description"
>;

type UserCreditRow = Pick<
    Database["public"]["Tables"]["user_credits"]["Row"],
    "id" | "amount" | "active" | "expires_at" | "used_at" | "created_at"
>;

type CheckoutProfileRow = Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "display_name" | "email" | "is_regular"
>;

type CreditReversal =
    | {
          id: string;
          kind: "update";
          amount: number;
          active: boolean;
          used_at: string | null;
      }
    | { id: string; kind: "amount"; amount: number };

const BOOKING_REFERENCE_PREFIX = "VEE";
const BOOKING_REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const BOOKING_REFERENCE_LENGTH = 6;
const BOOKING_REFERENCE_MAX_ATTEMPTS = 10;
const ACTIVE_SLOT_BOOKING_STATUSES = [
    "held",
    "requested",
    "confirmed",
    "cancellation_requested",
] as const;

function slotStatusForBooking(
    status: (typeof ACTIVE_SLOT_BOOKING_STATUSES)[number],
): Database["public"]["Enums"]["slot_status"] {
    if (status === "confirmed" || status === "cancellation_requested") {
        return "confirmed";
    }

    return status;
}

async function reconcileSlotWithActiveBooking(
    admin: ReturnType<typeof createAdminClient>,
    slotId: string,
) {
    const { data: activeBooking, error } = await admin
        .from("bookings")
        .select("id, status")
        .eq("slot_id", slotId)
        .in("status", ACTIVE_SLOT_BOOKING_STATUSES)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .overrideTypes<{
            id: string;
            status: (typeof ACTIVE_SLOT_BOOKING_STATUSES)[number];
        } | null>();

    if (error) throw error;
    if (!activeBooking) return false;

    const { error: syncError } = await admin
        .from("availability_slots")
        .update({
            status: slotStatusForBooking(
                activeBooking.status as (typeof ACTIVE_SLOT_BOOKING_STATUSES)[number],
            ),
        })
        .eq("id", slotId);

    if (syncError) throw syncError;
    return true;
}

function postgresErrorCode(error: unknown) {
    return error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";
}

function nextMessageId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function state(
    input: Omit<BookingCheckoutActionState, "messageId">,
): BookingCheckoutActionState {
    return {
        ...input,
        messageId: nextMessageId(),
    };
}

function getFormString(formData: FormData, key: string) {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

function parseDraft(rawValue: string): BookingCheckoutDraft | null {
    if (!rawValue) {
        return null;
    }

    try {
        const parsed = JSON.parse(rawValue) as unknown;
        return isBookingCheckoutDraft(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

function generateReferenceCode(length = BOOKING_REFERENCE_LENGTH) {
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);

    return Array.from(values)
        .map(
            (value) =>
                BOOKING_REFERENCE_ALPHABET.charAt(
                    value % BOOKING_REFERENCE_ALPHABET.length,
                ),
        )
        .join("");
}

async function generateBookingReference(
    admin: ReturnType<typeof createAdminClient>,
) {
    for (
        let attempt = 0;
        attempt < BOOKING_REFERENCE_MAX_ATTEMPTS;
        attempt += 1
    ) {
        const bookingReference = `${BOOKING_REFERENCE_PREFIX}-${generateReferenceCode()}`;

        const { data, error } = await admin
            .from("bookings")
            .select("id")
            .eq("booking_reference", bookingReference)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            return bookingReference;
        }
    }

    throw new Error(
        "Unable to generate a unique booking reference after multiple attempts.",
    );
}

function buildCheckoutEventServiceMetadata({
    service,
    serviceOption,
}: {
    service: ServiceConfig | null;
    serviceOption: ServiceOption | null;
}) {
    if (!service || !serviceOption) {
        return {
            service: null,
            serviceOption: null,
        };
    }

    return {
        service: service.label,
        serviceOption: buildServiceOptionLabel(service, serviceOption),
    };
}

function compareCreditRows(a: UserCreditRow, b: UserCreditRow) {
    const aExpiry = a.expires_at
        ? new Date(a.expires_at).getTime()
        : Number.POSITIVE_INFINITY;
    const bExpiry = b.expires_at
        ? new Date(b.expires_at).getTime()
        : Number.POSITIVE_INFINITY;

    if (aExpiry !== bExpiry) {
        return aExpiry - bExpiry;
    }

    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

async function applyCreditAmount({
    admin,
    bookingId,
    userId,
    creditAmount,
}: {
    admin: ReturnType<typeof createAdminClient>;
    bookingId: string;
    userId: string;
    creditAmount: number;
}) {
    if (creditAmount <= 0) {
        return { reversals: [] as CreditReversal[], appliedAmount: 0 };
    }

    const { data: creditRows, error: creditsError } = await admin
        .from("user_credits")
        .select("id, amount, active, expires_at, used_at, created_at")
        .eq("user_id", userId)
        .overrideTypes<UserCreditRow[]>();

    if (creditsError) {
        throw creditsError;
    }

    const availableCredits = (creditRows ?? [])
        .filter((credit) => isAvailableCredit(credit))
        .sort(compareCreditRows);

    const totalAvailable = availableCredits.reduce(
        (total, credit) => total + Number(credit.amount ?? 0),
        0,
    );

    if (creditAmount > totalAvailable) {
        throw new Error("Requested credit amount exceeds available credit.");
    }

    const reversals: CreditReversal[] = [];
    let remaining = creditAmount;

    try {
        for (const credit of availableCredits) {
            if (remaining <= 0) {
                break;
            }

            const currentAmount = Number(credit.amount ?? 0);

            if (currentAmount <= remaining + 0.00001) {
                const now = new Date().toISOString();
                const { error } = await admin
                    .from("user_credits")
                    .update({
                        active: false,
                        used_at: now,
                    })
                    .eq("id", credit.id);

                if (error) {
                    throw error;
                }

                reversals.push({
                    id: credit.id,
                    kind: "update",
                    amount: currentAmount,
                    active: credit.active,
                    used_at: credit.used_at,
                });

                remaining = Math.max(0, remaining - currentAmount);
            } else {
                const nextAmount =
                    Math.round((currentAmount - remaining) * 100) / 100;
                const { error } = await admin
                    .from("user_credits")
                    .update({ amount: nextAmount })
                    .eq("id", credit.id);

                if (error) {
                    throw error;
                }

                reversals.push({
                    id: credit.id,
                    kind: "amount",
                    amount: currentAmount,
                });

                remaining = 0;
            }
        }

        if (remaining > 0) {
            throw new Error(
                "Requested credit amount could not be fully applied.",
            );
        }

        const { error: paymentError } = await admin
            .from("booking_payments")
            .insert({
                booking_id: bookingId,
                user_id: userId,
                payment_type: "credit",
                method: "account_credit",
                amount: creditAmount,
                status: "completed",
                paid_at: new Date().toISOString(),
                notes: "Client applied account credit during checkout.",
            });

        if (paymentError) {
            throw paymentError;
        }

        return {
            reversals,
            appliedAmount: creditAmount,
        };
    } catch (error) {
        await Promise.allSettled(
            reversals.map((credit) => {
                if (credit.kind === "update") {
                    return admin
                        .from("user_credits")
                        .update({
                            amount: credit.amount,
                            active: credit.active,
                            used_at: credit.used_at,
                        })
                        .eq("id", credit.id);
                }

                return admin
                    .from("user_credits")
                    .update({ amount: credit.amount })
                    .eq("id", credit.id);
            }),
        );

        throw error;
    }
}

async function cleanupFailedBooking(
    admin: ReturnType<typeof createAdminClient>,
    bookingId: string | null,
    slotId: string,
) {
    if (bookingId) {
        await Promise.allSettled([
            admin
                .from("booking_policy_acceptances")
                .delete()
                .eq("booking_id", bookingId),
            admin.from("booking_events").delete().eq("booking_id", bookingId),
            admin.from("booking_payments").delete().eq("booking_id", bookingId),
            admin
                .from("booking_line_items")
                .delete()
                .eq("booking_id", bookingId),
        ]);

        await admin.from("bookings").delete().eq("id", bookingId);
    }

    const stillClaimed = await reconcileSlotWithActiveBooking(admin, slotId);

    if (!stillClaimed) {
        await admin
            .from("availability_slots")
            .update({ status: "available" })
            .eq("id", slotId)
            .eq("status", "requested");
    }
}

export async function submitBookingCheckout(
    _prevState: BookingCheckoutActionState,
    formData: FormData,
): Promise<BookingCheckoutActionState> {
    const user = await getUser();

    if (!user) {
        return state({
            error: "Please sign in before confirming your deposit.",
        });
    }

    const draft = parseDraft(getFormString(formData, "draft"));
    const depositConfirmed = getFormString(formData, "depositConfirmed");
    const policiesConfirmed = getFormString(formData, "policiesConfirmed");
    const messageConfirmed = getFormString(formData, "messageConfirmed");
    const creditAmount = Number(getFormString(formData, "creditAmount") || 0);

    if (!draft) {
        return state({
            error: "Your booking selections were not found. Please start booking again.",
        });
    }

    if (
        depositConfirmed !== "true" ||
        policiesConfirmed !== "true" ||
        messageConfirmed !== "true"
    ) {
        return state({
            error: "Please confirm all checkboxes before sending your booking request.",
        });
    }

    if (!isReviewReady(draft)) {
        return state({
            error: "Your booking selections are incomplete. Please start again.",
        });
    }

    const removal = getRemovalOption(draft.removalId);
    const service = getService(draft.serviceId);
    const serviceOption = getServiceOption(service, draft.serviceOptionId);
    const designTierRequired =
        draft.removalId !== "removal_only" && requiresDesignTier(service);

    if (!removal) {
        return state({
            error: "Your removal selection is no longer valid. Please start again.",
        });
    }

    if (draft.removalId !== "removal_only" && (!service || !serviceOption)) {
        return state({
            error: "Your selected service is no longer valid. Please review your booking again.",
        });
    }

    const admin = createAdminClient();

    const [settingsResult, designTiersResult, policiesResult] =
        await Promise.all([
            admin
                .from("booking_settings")
                .select(
                    "deposit_amount, booking_fee_mode, booking_fee_rate, hold_minutes, etransfer_email, instagram_url",
                )
                .eq("id", 1)
                .eq("active", true)
                .maybeSingle()
                .overrideTypes<BookingSettingsRow | null>(),

            designTierRequired
                ? admin
                      .from("design_tiers")
                      .select("id, name, description, price")
                      .eq("active", true)
                      .overrideTypes<DesignTierRow[]>()
                : Promise.resolve({
                      data: [] as DesignTierRow[],
                      error: null,
                  }),

            admin
                .from("policies")
                .select("id, title, description")
                .eq("active", true)
                .eq("policy_type", "booking")
                .overrideTypes<PolicyRow[]>(),
        ]);

    if (settingsResult.error) {
        console.error("[bookings:checkout.settings]", settingsResult.error);

        return state({
            error: "We couldn't load booking settings. Please try again.",
        });
    }

    if (designTiersResult.error) {
        console.error(
            "[bookings:checkout.design-tiers]",
            designTiersResult.error,
        );

        return state({
            error: "We couldn't validate your design tier. Please try again.",
        });
    }

    if (policiesResult.error) {
        console.error("[bookings:checkout.policies]", policiesResult.error);

        return state({
            error: "We couldn't verify the booking policies. Please try again.",
        });
    }

    const settings = settingsResult.data;

    if (!settings) {
        return state({
            error: "Checkout is unavailable because booking settings are missing.",
        });
    }

    const designTiers: DesignTier[] = (designTiersResult.data ?? []).map(
        (tier) => ({
            id: tier.id,
            label: tier.name,
            description: tier.description ?? undefined,
            price: Number(tier.price ?? 0),
            imageSrc: null,
            imageAlt: `${tier.name} design tier preview`,
        }),
    );

    const selectedDesignTier =
        draft.designTierId && designTierRequired
            ? ((designTiersResult.data ?? []).find(
                  (tier) => tier.id === draft.designTierId,
              ) ?? null)
            : null;

    if (designTierRequired && !selectedDesignTier) {
        return state({
            error: "Your selected design tier is no longer available. Please review your booking again.",
        });
    }

    const normalizedSettings = {
        depositAmount: Number(settings.deposit_amount ?? 0),
        bookingFeeMode: settings.booking_fee_mode,
        bookingFeeRate: Number(settings.booking_fee_rate ?? 0),
        holdMinutes: Number(settings.hold_minutes ?? 0),
    } as const;

    const estimate = calculateEstimate(draft, normalizedSettings, designTiers);
    const paymentPlan = calculateCheckoutPaymentPlan({
        appointmentTotal: estimate.total,
        configuredDeposit: normalizedSettings.depositAmount,
        creditAmount,
    });
    const bookingReference = await generateBookingReference(admin);
    const holdExpiresAt = new Date(
        Date.now() + normalizedSettings.holdMinutes * 60_000,
    ).toISOString();

    const lineItems = buildBookingServiceLineItems({
        selections: draft,
        designTier: selectedDesignTier,
    });

    if (!lineItems || lineItems.length === 0) {
        return state({
            error: "Your booking does not include any valid services. Please review your selections.",
        });
    }

    let bookingId: string | null = null;
    let creditReversals: CreditReversal[] = [];

    const slotId = draft.slotId;

    if (!slotId) {
        return state({
            error: "Please select an appointment time before checking out.",
        });
    }

    if (!Number.isFinite(creditAmount) || creditAmount < 0) {
        return state({
            error: "Please enter a valid credit amount.",
        });
    }

    if (creditAmount > paymentPlan.maxCreditAmount) {
        return state({
            error: "Your credit amount leaves less than the required deposit. Review the updated payment summary.",
        });
    }

    try {
        const alreadyClaimed = await reconcileSlotWithActiveBooking(
            admin,
            slotId,
        );

        if (alreadyClaimed) {
            return state({
                error: "This appointment time was already booked. Please choose another available time.",
            });
        }

        const { data: bookingProfile, error: profileError } = await admin
            .from("profiles")
            .select("display_name, email, is_regular")
            .eq("id", user.id)
            .maybeSingle()
            .overrideTypes<CheckoutProfileRow | null>();

        if (profileError) {
            throw profileError;
        }

        const { data: lockedSlot, error: lockError } = await admin
            .from("availability_slots")
            .update({ status: "requested" })
            .eq("id", slotId)
            .eq("status", "available")
            .eq("active", true)
            .or(
                bookingProfile?.is_regular
                    ? "regulars_first.eq.true,regulars_first.eq.false"
                    : `regulars_first.eq.false,public_access_at.lte.${new Date().toISOString()}`,
            )
            .select("id, starts_at, ends_at, regulars_first, public_access_at")
            .maybeSingle()
            .overrideTypes<{ id: string; starts_at: string; ends_at: string | null; regulars_first: boolean; public_access_at: string } | null>();

        if (lockError) {
            throw lockError;
        }

        if (!lockedSlot) {
            return state({
                error: "This appointment time is no longer available.",
            });
        }

        if (
            !bookingProfile?.is_regular &&
            lockedSlot.regulars_first &&
            new Date(lockedSlot.public_access_at).getTime() > Date.now()
        ) {
            await admin
                .from("availability_slots")
                .update({ status: "available" })
                .eq("id", slotId)
                .eq("status", "requested");

            return state({
                error: "This appointment time is not available yet.",
            });
        }

        const { data: booking, error: bookingError } = await admin
            .from("bookings")
            .insert({
                booking_reference: bookingReference,
                user_id: user.id,
                slot_id: slotId,
                status: "requested",
                hold_expires_at: holdExpiresAt,
                deposit_amount: paymentPlan.depositDue,
                deposit_status: "marked_sent",
                booking_fee_rate: normalizedSettings.bookingFeeRate,
                booking_fee_mode: normalizedSettings.bookingFeeMode,
                final_total: 0,
                client_notes: null,
            })
            .select("id")
            .single();

        if (bookingError) {
            throw bookingError;
        }

        bookingId = booking.id;

        const lineItemsToInsert = lineItems.map((item) => ({
            ...item,
            booking_id: booking.id,
            added_by: user.id,
        }));

        const { error: lineItemError } = await admin
            .from("booking_line_items")
            .insert(lineItemsToInsert);

        if (lineItemError) {
            throw lineItemError;
        }

        const { error: paymentError } = await admin
            .from("booking_payments")
            .insert({
                booking_id: booking.id,
                user_id: user.id,
                payment_type: "deposit",
                method: "etransfer",
                amount: paymentPlan.depositDue,
                status: "marked_sent",
                notes: "Client confirmed e-Transfer deposit was sent during checkout.",
            });

        if (paymentError) {
            throw paymentError;
        }

        if ((policiesResult.data ?? []).length > 0) {
            const { error: policyAcceptanceError } = await admin
                .from("booking_policy_acceptances")
                .insert(
                    (policiesResult.data ?? []).map((policy) => ({
                        booking_id: booking.id,
                        policy_id: policy.id,
                        title_snapshot: policy.title,
                        description_snapshot: policy.description ?? "",
                    })),
                );

            if (policyAcceptanceError) {
                throw policyAcceptanceError;
            }
        }

        if (creditAmount > 0) {
            const creditApplication = await applyCreditAmount({
                admin,
                bookingId: booking.id,
                userId: user.id,
                creditAmount,
            });

            creditReversals = creditApplication.reversals;
        }

        const { error: eventError } = await admin
            .from("booking_events")
            .insert({
                booking_id: booking.id,
                actor_type: "client",
                actor_user_id: user.id,
                event_type: "booking_requested",
                message:
                    "Client submitted booking request and marked deposit as sent.",
                metadata: {
                    slotId,
                    startsAt: lockedSlot.starts_at,
                    endsAt: lockedSlot.ends_at,
                    removal: removal.label,
                    ...buildCheckoutEventServiceMetadata({
                        service:
                            draft.removalId === "removal_only" ? null : service,
                        serviceOption:
                            draft.removalId === "removal_only"
                                ? null
                                : serviceOption,
                    }),
                    design: service
                        ? requiresDesignTier(service)
                            ? selectedDesignTier?.name ?? null
                            : "Technician-designed freestyle set"
                        : null,
                    depositAmount: paymentPlan.depositDue,
                    creditAmount: creditAmount > 0 ? creditAmount : null,
                    estimatedSubtotal: estimate.subtotal,
                    estimatedBookingFee: estimate.bookingFee,
                    estimatedTotal: estimate.total,
                },
            });

        if (eventError) {
            throw eventError;
        }

        const appointment = formatStudioAppointmentDateTime(
            lockedSlot.starts_at,
        );
        const siteUrl = getAppBaseUrl();
        const adminEmail = getEmailConfig().adminNotificationEmail;
        const template = appointmentStatusTemplate({ name: bookingProfile?.display_name ?? "Client", reference: bookingReference, status: "requested", appointment, message: "Your booking request was submitted and your deposit was marked as sent.", detailsUrl: siteUrl ? `${siteUrl}/booking/${bookingReference}` : undefined });
        await sendTransactionalEmail({
            to: {
                email: bookingProfile?.email ?? null,
                name: bookingProfile?.display_name,
            },
            bcc: adminEmail
                ? [{ email: adminEmail, name: "Vee's Nail Studio" }]
                : undefined,
            ...template,
            notificationType: "booking_requested",
            bookingId: booking.id,
            userId: user.id,
        });

        revalidatePath("/booking");
        revalidatePath("/book");
        revalidatePath("/dashboard");
        revalidatePath("/credits");

        return state({
            success:
                "Your booking request has been received and your deposit is marked as sent.",
            bookingId: booking.id,
            bookingReference,
            startsAt: lockedSlot.starts_at,
            endsAt: lockedSlot.ends_at,
            depositAmount: paymentPlan.depositDue,
        });
    } catch (error) {
        console.error("[bookings:checkout.submit]", error);

        if (creditReversals.length > 0) {
            await Promise.allSettled(
                creditReversals.map((credit) => {
                    if (credit.kind === "update") {
                        return admin
                            .from("user_credits")
                            .update({
                                amount: credit.amount,
                                active: credit.active,
                                used_at: credit.used_at,
                            })
                            .eq("id", credit.id);
                    }

                    return admin
                        .from("user_credits")
                        .update({ amount: credit.amount })
                        .eq("id", credit.id);
                }),
            );
        }

        try {
            await cleanupFailedBooking(admin, bookingId, slotId);
        } catch (cleanupError) {
            console.error("[bookings:checkout.cleanup]", cleanupError);
        }

        if (postgresErrorCode(error) === "23505") {
            return state({
                error: "This appointment time was already booked. Please choose another available time.",
            });
        }

        return state({
            error: "We couldn't send your booking request right now. Please try again.",
        });
    }
}
