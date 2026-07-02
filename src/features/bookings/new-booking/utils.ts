import { bookingSteps, removalOptions, services } from "@/features/bookings/new-booking/config";
import type {
    AvailableAppointmentSlot,
    BookingEstimate,
    BookingSelections,
    BookingSettingsSummary,
    DesignTier,
    NewBookingStep,
    ServiceConfig,
    ServiceOption,
} from "@/features/bookings/new-booking/types";
import {
    getUserTimeZone,
} from "@/lib/utils/studio-time";

const userTimeZone = getUserTimeZone();

const fullDateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: userTimeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: userTimeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: userTimeZone,
    hour: "numeric",
    minute: "2-digit",
});

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: userTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

function getUserDateKey(value: string) {
    const parts = Object.fromEntries(
        dateKeyFormatter
            .formatToParts(new Date(value))
            .filter((part) => part.type !== "literal")
            .map((part) => [part.type, part.value]),
    );

    return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getRemovalOption(removalId: BookingSelections["removalId"]) {
    return (
        removalOptions.find((option) => option.id === removalId) ?? null
    );
}

export function getService(serviceId: BookingSelections["serviceId"]) {
    return services.find((service) => service.id === serviceId) ?? null;
}

export function getServiceOption(
    service: ServiceConfig | null,
    serviceOptionId: BookingSelections["serviceOptionId"],
) {
    if (!service) {
        return null;
    }

    return (
        service.options.find((option) => option.id === serviceOptionId) ?? null
    );
}

export function getServiceOptionGroups(service: ServiceConfig | null) {
    if (!service) {
        return [];
    }

    const groups = new Map<string, string>();

    for (const option of service.options) {
        if (option.groupId && option.groupLabel) {
            groups.set(option.groupId, option.groupLabel);
        }
    }

    return Array.from(groups.entries()).map(([id, label]) => ({ id, label }));
}

export function getDesignTier(
    designTierId: BookingSelections["designTierId"],
    designTiers: readonly DesignTier[],
) {
    return designTiers.find((tier) => tier.id === designTierId) ?? null;
}

export function isRemovalOnly(removalId: BookingSelections["removalId"]) {
    return removalId === "removal_only";
}

export function isFullServiceBooking(selections: BookingSelections) {
    return Boolean(
        selections.removalId && !isRemovalOnly(selections.removalId),
    );
}

export function requiresDesignTier(service: ServiceConfig | null | undefined) {
    return service?.requiresDesignTier === true;
}

export function isReviewReady(selections: BookingSelections) {
    if (!selections.slotId || !selections.removalId) {
        return false;
    }

    if (isRemovalOnly(selections.removalId)) {
        return true;
    }

    const service = getService(selections.serviceId);

    return Boolean(
        service &&
            selections.serviceOptionId &&
            (!requiresDesignTier(service) || selections.designTierId),
    );
}

export function getReachableSteps(selections: BookingSelections) {
    return {
        time: true,
        removal: Boolean(selections.slotId),
        service: isFullServiceBooking(selections),
        design: Boolean(
            isFullServiceBooking(selections) &&
                selections.serviceId &&
                selections.serviceOptionId &&
                requiresDesignTier(getService(selections.serviceId)),
        ),
        review: isReviewReady(selections),
    } satisfies Record<NewBookingStep, boolean>;
}

export function canOpenStep(
    step: NewBookingStep,
    selections: BookingSelections,
) {
    if (step === "time") {
        return true;
    }

    return getReachableSteps(selections)[step];
}

export function getStepStatus(
    step: NewBookingStep,
    activeStep: NewBookingStep,
    selections: BookingSelections,
) {
    if (activeStep === step) {
        return "current";
    }

    const completed = {
        time: Boolean(selections.slotId),
        removal: Boolean(selections.removalId),
        service: Boolean(selections.serviceId && selections.serviceOptionId),
        design: Boolean(
            selections.serviceId &&
                (!requiresDesignTier(getService(selections.serviceId)) ||
                    selections.designTierId),
        ),
        review: isReviewReady(selections),
    } satisfies Record<NewBookingStep, boolean>;

    if (completed[step]) {
        return "complete";
    }

    if (
        (isRemovalOnly(selections.removalId) &&
            (step === "service" || step === "design")) ||
        (step === "design" &&
            Boolean(selections.serviceId) &&
            !requiresDesignTier(getService(selections.serviceId)))
    ) {
        return "skipped";
    }

    return "upcoming";
}

export function buildServiceOptionLabel(
    service: ServiceConfig | null,
    serviceOption: ServiceOption | null,
) {
    if (!service || !serviceOption) {
        return null;
    }

    if (service.id === "freestyle") {
        return serviceOption.label;
    }

    if (serviceOption.groupLabel) {
        return `${serviceOption.groupLabel} · ${serviceOption.label}`;
    }

    return serviceOption.label;
}

export function normalizeBookingFeeRate(rate: number | null | undefined) {
    const numericRate = Number(rate ?? 0);

    if (!Number.isFinite(numericRate) || numericRate <= 0) {
        return 0;
    }

    return numericRate < 1 ? roundCurrency(numericRate * 100) : numericRate;
}

export function calculateEstimate(
    selections: BookingSelections,
    settings: BookingSettingsSummary,
    designTiers: readonly DesignTier[],
): BookingEstimate {
    const removal = getRemovalOption(selections.removalId);
    const service = getService(selections.serviceId);
    const serviceOption = getServiceOption(service, selections.serviceOptionId);
    const designTier =
        isFullServiceBooking(selections) && requiresDesignTier(service)
            ? getDesignTier(selections.designTierId, designTiers)
            : null;

    const subtotal =
        (removal?.price ?? 0) +
        (serviceOption?.price ?? 0) +
        (designTier?.price ?? 0);

    const bookingFeeIncluded =
        settings?.bookingFeeMode === "included_in_price";
    const bookingFeeRate = normalizeBookingFeeRate(settings?.bookingFeeRate);
    const rawBookingFee =
        settings && bookingFeeRate > 0
            ? roundCurrency((subtotal * bookingFeeRate) / 100)
            : 0;
    const bookingFee = bookingFeeIncluded ? 0 : rawBookingFee;
    const total = subtotal + bookingFee;

    return {
        subtotal,
        bookingFee,
        bookingFeeIncluded,
        total,
        removal,
        service,
        serviceOption,
        designTier,
    };
}

export function getDepositNote(settings: BookingSettingsSummary) {
    if (!settings || settings.depositAmount <= 0) {
        return null;
    }

    return `A $${settings.depositAmount.toFixed(2)} deposit is collected at checkout.`;
}

export function getHoldNote(settings: BookingSettingsSummary) {
    if (!settings || settings.holdMinutes <= 0) {
        return null;
    }

    return `Selected availability is typically held for ${settings.holdMinutes} minutes once checkout begins.`;
}

export function formatSlotDate(value: string) {
    return fullDateFormatter.format(new Date(value));
}

export function formatSlotShortDate(value: string) {
    return shortDateFormatter.format(new Date(value));
}

export function formatSlotTime(value: string | null) {
    if (!value) {
        return "";
    }

    return timeFormatter.format(new Date(value));
}

export function formatSlotTimeRange(slot: AvailableAppointmentSlot) {
    return slot.endsAt
        ? `${formatSlotTime(slot.startsAt)} - ${formatSlotTime(slot.endsAt)}`
        : formatSlotTime(slot.startsAt);
}

export function isSlotBookable(slot: AvailableAppointmentSlot | null | undefined) {
    return slot?.availability === "available";
}

export function groupSlotsByDay(slots: AvailableAppointmentSlot[]) {
    const groups = new Map<
        string,
        {
            key: string;
            label: string;
            slots: AvailableAppointmentSlot[];
        }
    >();

    for (const slot of slots) {
        const key = getUserDateKey(slot.startsAt);

        if (!groups.has(key)) {
            groups.set(key, {
                key,
                label: formatSlotDate(slot.startsAt),
                slots: [],
            });
        }

        groups.get(key)?.slots.push(slot);
    }

    return Array.from(groups.values()).map((group) => ({
        ...group,
        slots: group.slots
            .slice()
            .sort(
                (a, b) =>
                    new Date(a.startsAt).getTime() -
                    new Date(b.startsAt).getTime(),
            ),
    }));
}

export function getSelectionSummary(
    selections: BookingSelections,
    slots: AvailableAppointmentSlot[],
    designTiers: readonly DesignTier[],
) {
    const slot =
        slots.find(
            (item) => item.id === selections.slotId && isSlotBookable(item),
        ) ?? null;
    const removal = getRemovalOption(selections.removalId);
    const service = getService(selections.serviceId);
    const serviceOption = getServiceOption(service, selections.serviceOptionId);
    const designTier = requiresDesignTier(service)
        ? getDesignTier(selections.designTierId, designTiers)
        : null;

    return {
        slot,
        removal,
        service,
        serviceOption,
        designTier,
    };
}

export function getStepNumber(step: NewBookingStep) {
    return bookingSteps.findIndex((item) => item.id === step) + 1;
}

export function getVisibleBookingSteps(selections: BookingSelections) {
    const service = getService(selections.serviceId);

    return bookingSteps.filter(
        (step) =>
            step.id !== "design" ||
            !service ||
            requiresDesignTier(service),
    );
}

function roundCurrency(value: number) {
    return Math.round(value * 100) / 100;
}
