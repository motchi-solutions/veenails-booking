"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { FiArrowLeft, FiCalendar, FiExternalLink } from "react-icons/fi";
import AppSelect from "@/components/shared/form/AppSelect";
import { useToast } from "@/components/shared/toast/ToastProvider";
import {
    createAdminAppointmentAction,
    type AdminCreateAppointmentState,
} from "@/features/admin/appointments/actions/admin-create-appointment";
import type {
    AdminCreateDesignTierOption,
    AdminCreateProfileOption,
    AdminCreateSettings,
    AdminCreateSlotOption,
} from "@/features/admin/appointments/data/admin-create-appointment";
import AdminPageHeader from "@/features/admin/components/AdminPageHeader";
import { formatMoney } from "@/features/admin/components/admin-formatters";
import { removalOptions, services } from "@/features/bookings/new-booking/config";
import type { BookingSelections, ServiceConfig, ServiceOption } from "@/features/bookings/new-booking/types";
import {
    buildServiceOptionLabel,
    calculateEstimate,
    getService,
    getServiceOption,
    isRemovalOnly,
    requiresDesignTier,
} from "@/features/bookings/new-booking/utils";
import { formatBookingDateTime } from "@/features/bookings/utils/booking-formatters";
import { calculateCheckoutPaymentPlan } from "@/features/bookings/utils/booking-ledger";

const initialState: AdminCreateAppointmentState = {
    error: "",
    success: "",
    messageId: "",
};

type ClientMode = "existing" | "external";

export default function AdminCreateAppointmentPage({
    profiles,
    slots,
    designTiers,
    settings,
    initialUserId = "",
}: {
    profiles: AdminCreateProfileOption[];
    slots: AdminCreateSlotOption[];
    designTiers: AdminCreateDesignTierOption[];
    settings: AdminCreateSettings;
    initialUserId?: string;
}) {
    const router = useRouter();
    const { error, success } = useToast();
    const [state, action, pending] = useActionState(
        createAdminAppointmentAction,
        initialState,
    );
    const [clientMode, setClientMode] = useState<ClientMode>(
        initialUserId ? "existing" : "external",
    );
    const [userId, setUserId] = useState(initialUserId);
    const [slotId, setSlotId] = useState("");
    const [removalId, setRemovalId] = useState<BookingSelections["removalId"]>("none");
    const [serviceId, setServiceId] = useState<ServiceConfig["id"] | null>("apres_gel_x");
    const [serviceOptionId, setServiceOptionId] = useState<string>("");
    const [designTierId, setDesignTierId] = useState<string>("");
    const [externalEmail, setExternalEmail] = useState("");
    const [externalInstagram, setExternalInstagram] = useState("");
    const [externalPreferredContact, setExternalPreferredContact] =
        useState<"" | "email" | "instagram">("");

    const selectedService = getService(serviceId);
    const serviceOptions = selectedService?.options ?? [];
    const selectedServiceOption = getServiceOption(
        selectedService,
        serviceOptionId,
    );
    const fullService = !isRemovalOnly(removalId);
    const designTierRequired =
        fullService && requiresDesignTier(selectedService);
    const selectedProfile = profiles.find((profile) => profile.id === userId);
    const selectedSlot = slots.find((slot) => slot.id === slotId);

    const selections: BookingSelections = {
        slotId: slotId || null,
        removalId,
        serviceId: fullService ? serviceId : null,
        serviceOptionGroupId: selectedServiceOption?.groupId ?? null,
        serviceOptionId: fullService ? serviceOptionId || null : null,
        designTierId: designTierRequired ? designTierId || null : null,
    };
    const estimate = calculateEstimate(selections, settings, designTiers);
    const paymentPlan = calculateCheckoutPaymentPlan({
        appointmentTotal: estimate.total,
        configuredDeposit: settings.depositAmount,
    });
    const externalContactOptions = [
        externalInstagram.trim()
            ? { value: "instagram" as const, label: "Instagram" }
            : null,
        externalEmail.trim()
            ? { value: "email" as const, label: "Email" }
            : null,
    ].filter(
        (
            option,
        ): option is { value: "email" | "instagram"; label: string } =>
            option !== null,
    );
    const effectiveExternalPreferredContact = externalContactOptions.some(
        (option) => option.value === externalPreferredContact,
    )
        ? externalPreferredContact
        : (externalContactOptions[0]?.value ?? "");

    useEffect(() => {
        if (!state.messageId) return;
        if (state.error) {
            error(state.error, "Appointment not created");
        }
        if (state.success) {
            success(state.success, "Appointment created");
            if (state.bookingId) {
                router.push(`/admin/appointments/${state.bookingId}`);
            } else {
                router.refresh();
            }
        }
    }, [error, router, state.bookingId, state.error, state.messageId, state.success, success]);

    function handleRemoval(nextRemovalId: string) {
        const typedRemovalId = nextRemovalId as BookingSelections["removalId"];
        setRemovalId(typedRemovalId);
        if (typedRemovalId === "removal_only") {
            setServiceId(null);
            setServiceOptionId("");
            setDesignTierId("");
        } else if (!serviceId) {
            setServiceId("apres_gel_x");
        }
    }

    function handleService(nextServiceId: string) {
        setServiceId(nextServiceId as ServiceConfig["id"]);
        setServiceOptionId("");
        setDesignTierId("");
    }

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                <Link
                    href="/admin/appointments"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-dark-green transition hover:text-pink-main"
                >
                    <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back to appointments
                </Link>
                <div className="mt-5">
                    <AdminPageHeader
                        eyebrow="Admin"
                        title="Create appointment"
                        description="Book for an existing customer or an external client without creating an account."
                    />
                </div>
            </section>

            <form action={action} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <input type="hidden" name="clientMode" value={clientMode} />
                <input type="hidden" name="userId" value={clientMode === "existing" ? userId : ""} />
                <input type="hidden" name="slotId" value={slotId} />
                <input type="hidden" name="removalId" value={removalId ?? ""} />
                <input type="hidden" name="serviceId" value={fullService ? serviceId ?? "" : ""} />
                <input type="hidden" name="serviceOptionId" value={fullService ? serviceOptionId : ""} />
                <input
                    type="hidden"
                    name="designTierId"
                    value={designTierRequired ? designTierId : ""}
                />

                <div className="space-y-6">
                    <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                        <h2 className="text-lg font-semibold text-foreground">Client</h2>
                        <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-background p-1">
                            {(["existing", "external"] as const).map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setClientMode(mode)}
                                    className={[
                                        "rounded-2xl px-4 py-2 text-sm font-semibold transition",
                                        clientMode === mode
                                            ? "bg-surface text-dark-green shadow-sm"
                                            : "text-muted hover:text-foreground",
                                    ].join(" ")}
                                >
                                    {mode === "existing" ? "Existing customer" : "External client"}
                                </button>
                            ))}
                        </div>

                        {clientMode === "existing" ? (
                            <div className="mt-5">
                                <AppSelect
                                    label="Customer"
                                    value={userId}
                                    onChange={setUserId}
                                    placeholder="Choose customer"
                                    required
                                    options={profiles.map((profile) => ({
                                        value: profile.id,
                                        label: `${profile.displayName} · ${profile.email}`,
                                    }))}
                                />
                                {selectedProfile ? (
                                    <p className="mt-2 text-sm text-muted">
                                        {selectedProfile.instagramHandle
                                            ? `@${selectedProfile.instagramHandle}`
                                            : "No Instagram on profile"}
                                    </p>
                                ) : null}
                            </div>
                        ) : (
                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <label className="block space-y-2">
                                    <span className="label-text">Client name</span>
                                    <input name="clientDisplayName" className="input-field" required placeholder="Client name" />
                                </label>
                                <label className="block space-y-2">
                                    <span className="label-text">Instagram handle</span>
                                    <input
                                        name="clientInstagramHandle"
                                        className="input-field"
                                        placeholder="client.handle"
                                        value={externalInstagram}
                                        onChange={(event) =>
                                            setExternalInstagram(event.target.value.toLowerCase())
                                        }
                                    />
                                </label>
                                <label className="block space-y-2">
                                    <span className="label-text">Email (optional)</span>
                                    <input
                                        name="clientEmail"
                                        type="email"
                                        className="input-field"
                                        placeholder="client@example.com"
                                        value={externalEmail}
                                        onChange={(event) => setExternalEmail(event.target.value)}
                                    />
                                </label>
                                <AppSelect
                                    label="Preferred contact"
                                    name="clientPreferredContactMethod"
                                    value={effectiveExternalPreferredContact}
                                    onChange={(value) =>
                                        setExternalPreferredContact(
                                            value as "" | "email" | "instagram",
                                        )
                                    }
                                    options={externalContactOptions}
                                    placeholder="Add contact details first"
                                    helperText="Add an email address or Instagram handle. Email reminders only send when email is available."
                                />
                            </div>
                        )}
                    </section>

                    <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                        <h2 className="text-lg font-semibold text-foreground">Appointment</h2>
                        <div className="mt-5 grid gap-4 xl:grid-cols-2">
                            <AppSelect
                                label="Open slot"
                                value={slotId}
                                onChange={setSlotId}
                                placeholder="Choose date and time"
                                required
                                options={slots.map((slot) => ({
                                    value: slot.id,
                                    label: formatBookingDateTime(slot.startsAt, slot.endsAt),
                                }))}
                            />
                            <AppSelect
                                label="Booking status"
                                name="bookingStatus"
                                defaultValue="confirmed"
                                options={[
                                    { value: "confirmed", label: "Confirmed" },
                                    { value: "requested", label: "Requested" },
                                ]}
                            />
                            <AppSelect
                                label="Deposit status"
                                name="depositStatus"
                                defaultValue="pending"
                                options={[
                                    { value: "pending", label: "Pending" },
                                    { value: "marked_sent", label: "Marked sent" },
                                    { value: "received", label: "Received" },
                                ]}
                            />
                        </div>
                    </section>

                    <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                        <h2 className="text-lg font-semibold text-foreground">Services</h2>
                        <div className="mt-5 grid gap-4 xl:grid-cols-2">
                            <AppSelect
                                label="Removal"
                                value={removalId ?? ""}
                                onChange={handleRemoval}
                                options={removalOptions.map((option) => ({
                                    value: option.id,
                                    label: `${option.summaryLabel} · ${formatMoney(option.price)}`,
                                }))}
                            />
                            <AppSelect
                                label="Service"
                                value={fullService ? serviceId ?? "" : ""}
                                onChange={handleService}
                                disabled={!fullService}
                                placeholder={fullService ? "Choose service" : "Removal only"}
                                options={services.map((service) => ({
                                    value: service.id,
                                    label: service.label,
                                }))}
                            />
                            <AppSelect
                                label="Service option"
                                value={fullService ? serviceOptionId : ""}
                                onChange={setServiceOptionId}
                                disabled={!fullService || !selectedService}
                                placeholder={fullService ? "Choose option" : "Not needed"}
                                options={(serviceOptions as readonly ServiceOption[]).map((option) => ({
                                    value: option.id,
                                    label: `${buildServiceOptionLabel(selectedService, option) ?? option.label} · ${formatMoney(option.price)}`,
                                }))}
                            />
                            {designTierRequired ? (
                                <AppSelect
                                    label="Design tier"
                                    value={designTierId}
                                    onChange={setDesignTierId}
                                    placeholder="Choose design tier"
                                    options={designTiers.map((tier) => ({
                                        value: tier.id,
                                        label: `${tier.label} · ${formatMoney(tier.price)}`,
                                    }))}
                                />
                            ) : null}
                        </div>
                    </section>
                </div>

                <aside className="h-fit rounded-3xl border border-border/60 bg-surface p-5 shadow-sm xl:sticky xl:top-6">
                    <div className="flex items-center gap-2 text-dark-green">
                        <FiCalendar aria-hidden="true" />
                        <h2 className="font-semibold">Preview</h2>
                    </div>
                    <div className="mt-5 space-y-3 text-sm">
                        <Summary label="Client" value={clientMode === "existing" ? selectedProfile?.displayName : "External client"} />
                        <Summary
                            label="Time"
                            value={
                                selectedSlot
                                    ? formatBookingDateTime(
                                          selectedSlot.startsAt,
                                          selectedSlot.endsAt,
                                      )
                                    : null
                            }
                        />
                        <div className="rounded-2xl bg-background p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                                Appointment details
                            </p>
                            <dl className="mt-2 divide-y divide-border/60">
                                <PreviewDetail
                                    label="Removal"
                                    value={estimate.removal?.summaryLabel}
                                    price={estimate.removal?.price}
                                />
                                {fullService ? (
                                    <>
                                        <PreviewDetail
                                            label="Service"
                                            value={estimate.service?.label}
                                        />
                                        <PreviewDetail
                                            label="Length / option"
                                            value={
                                                estimate.serviceOption
                                                    ? buildServiceOptionLabel(
                                                          estimate.service,
                                                          estimate.serviceOption,
                                                      )
                                                    : null
                                            }
                                            price={estimate.serviceOption?.price}
                                        />
                                        <PreviewDetail
                                            label="Design"
                                            value={
                                                designTierRequired
                                                    ? estimate.designTier?.label
                                                    : selectedService
                                                      ? "Chosen by nail technician"
                                                      : null
                                            }
                                            price={estimate.designTier?.price}
                                        />
                                    </>
                                ) : null}
                            </dl>
                        </div>
                    </div>
                    <div className="mt-5 rounded-2xl bg-background p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Estimated total</p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">{formatMoney(estimate.total)}</p>
                        <p className="mt-1 text-xs text-muted">
                            Deposit {formatMoney(paymentPlan.depositDue)}
                        </p>
                    </div>
                    <button type="submit" className="btn-primary mt-5 w-full" disabled={pending}>
                        {pending ? "Creating..." : "Create appointment"}
                    </button>
                    {state.bookingId ? (
                        <Link href={`/admin/appointments/${state.bookingId}`} className="btn-secondary mt-3 inline-flex w-full items-center justify-center gap-2">
                            View appointment <FiExternalLink aria-hidden="true" />
                        </Link>
                    ) : null}
                </aside>
            </form>
        </div>
    );
}

function Summary({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div className="rounded-2xl bg-background p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
            <p className="mt-1 font-semibold text-foreground">{value || "Not selected"}</p>
        </div>
    );
}

function PreviewDetail({
    label,
    value,
    price,
}: {
    label: string;
    value: string | null | undefined;
    price?: number;
}) {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 py-2.5 first:pt-1 last:pb-1">
            <dt className="text-xs font-medium text-muted">{label}</dt>
            {price !== undefined ? (
                <dd className="row-span-2 text-xs font-semibold text-muted">
                    {formatMoney(price)}
                </dd>
            ) : null}
            <dd className="min-w-0 font-semibold leading-snug text-foreground">
                {value || "Not selected"}
            </dd>
        </div>
    );
}
