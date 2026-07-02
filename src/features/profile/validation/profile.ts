import { isValidEmail } from "@/features/auth/validation/email";
import {
    getPasswordErrorMessage,
    isValidPassword,
} from "@/features/auth/validation/password";
import {
    isCompleteNorthAmericanPhone,
    normalizeNorthAmericanPhone,
} from "@/features/auth/validation/phone";
import type { Enums } from "@/types/supabase";

export type PreferredContactMethod = Enums<"preferred_contact_method">;

export const preferredContactMethods = [
    "email",
    "phone",
    "instagram",
] as const satisfies PreferredContactMethod[];

export function getAvailablePreferredContactMethods({
    email,
    emailAvailable = Boolean(email?.trim()),
    phone,
    instagramHandle,
}: {
    email?: string | null;
    emailAvailable?: boolean;
    phone?: string | null;
    instagramHandle?: string | null;
}) {
    return preferredContactMethods.filter((method) => {
        if (method === "email") return emailAvailable;
        if (method === "phone") return Boolean(phone?.trim());
        return Boolean(normalizeInstagramHandle(instagramHandle ?? ""));
    });
}

export function validateDisplayName(value: string) {
    const displayName = value.trim();

    if (!displayName) {
        return "Please enter your name.";
    }

    if (displayName.length < 2) {
        return "Name must be at least 2 characters.";
    }

    if (displayName.length > 80) {
        return "Name must be 80 characters or less.";
    }

    return null;
}

export function validateProfilePhone(value: string) {
    const phone = value.trim();

    if (!phone) {
        return null;
    }

    if (!isCompleteNorthAmericanPhone(phone)) {
        return "Please enter a valid 10-digit phone number.";
    }

    return null;
}

export function normalizeProfilePhone(value: string) {
    const phone = value.trim();

    if (!phone) {
        return null;
    }

    return normalizeNorthAmericanPhone(phone);
}

export function normalizeInstagramHandle(value: string) {
    const handle = value.trim().replace(/^@+/, "").toLowerCase();

    return handle || null;
}

export function validateInstagramHandle(value: string) {
    const handle = normalizeInstagramHandle(value);

    if (!handle) {
        return "Instagram handle is required.";
    }

    if (handle.length > 30 || !/^[a-z0-9._]+$/.test(handle)) {
        return "Use lowercase letters, numbers, periods, or underscores only.";
    }

    return null;
}

export function parsePreferredContactMethod(value: string) {
    return preferredContactMethods.includes(value as PreferredContactMethod)
        ? (value as PreferredContactMethod)
        : null;
}

export function validateContactPreference({
    preferredContactMethod,
    phone,
    instagramHandle,
}: {
    preferredContactMethod: PreferredContactMethod | null;
    phone: string | null;
    instagramHandle: string | null;
}) {
    if (!preferredContactMethod) {
        return "Choose your preferred contact method.";
    }

    if (preferredContactMethod === "phone" && !phone) {
        return "Please add a phone number or choose a different preferred contact method.";
    }

    if (preferredContactMethod === "instagram" && !instagramHandle) {
        return "Please add your Instagram handle or choose a different preferred contact method.";
    }

    return null;
}

export function validateProfileEmail(value: string, currentEmail?: string) {
    const email = value.trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
        return "Enter a valid email address.";
    }

    if (currentEmail && email === currentEmail.trim().toLowerCase()) {
        return "New email must be different from your current email.";
    }

    return null;
}

export function validateProfilePassword(value: string) {
    return getPasswordErrorMessage(value);
}

export { isValidEmail, isValidPassword };
