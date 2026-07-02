"use client";

import AppSelect from "@/components/shared/form/AppSelect";
import FormField from "@/components/shared/form/FormField";
import { formatNorthAmericanPhone } from "@/features/auth/validation/phone";
import {
    getAvailablePreferredContactMethods,
    normalizeInstagramHandle,
    type PreferredContactMethod,
} from "@/features/profile/validation/profile";

type ProfileDetailsFieldsProps = {
    displayName: string;
    onDisplayNameChange: (value: string) => void;
    phone: string;
    onPhoneChange: (value: string) => void;
    instagramHandle: string;
    onInstagramHandleChange: (value: string) => void;
    preferredContactMethod: PreferredContactMethod;
    onPreferredContactMethodChange: (value: PreferredContactMethod) => void;
};

export function isProfileDetailsValid({
    displayName,
    phone,
    instagramHandle,
    preferredContactMethod,
}: {
    displayName: string;
    phone: string;
    instagramHandle: string;
    preferredContactMethod: PreferredContactMethod;
}) {
    const normalizedInstagram = normalizeInstagramHandle(instagramHandle);
    const instagramValid =
        Boolean(normalizedInstagram) &&
        /^[a-z0-9._]{1,30}$/.test(normalizedInstagram ?? "");
    const contactPreferenceValid =
        preferredContactMethod === "email" ||
        (preferredContactMethod === "phone" && phone.trim().length > 0) ||
        (preferredContactMethod === "instagram" &&
            Boolean(normalizedInstagram));

    return (
        displayName.trim().length >= 2 &&
        instagramValid &&
        contactPreferenceValid
    );
}

export default function ProfileDetailsFields({
    displayName,
    onDisplayNameChange,
    phone,
    onPhoneChange,
    instagramHandle,
    onInstagramHandleChange,
    preferredContactMethod,
    onPreferredContactMethodChange,
}: ProfileDetailsFieldsProps) {
    const normalizedInstagram = normalizeInstagramHandle(instagramHandle);
    const availableContactMethods = getAvailablePreferredContactMethods({
        emailAvailable: true,
        phone,
        instagramHandle,
    });
    const showInstagramError =
        instagramHandle.length > 0 &&
        (!normalizedInstagram ||
            !/^[a-z0-9._]{1,30}$/.test(normalizedInstagram));

    return (
        <>
            <FormField
                id="displayName"
                name="displayName"
                label="Full name"
                type="text"
                autoComplete="name"
                required
                placeholder="Your name"
                value={displayName}
                onValueChange={onDisplayNameChange}
                enterKeyHint="next"
                enterBehavior="next"
            />

            <FormField
                id="phone"
                name="phone"
                label="Phone number"
                type="tel"
                autoComplete="tel"
                required={false}
                placeholder="(416) 123-4567"
                inputMode="tel"
                value={phone}
                onValueChange={(value) => {
                    const formattedPhone = formatNorthAmericanPhone(value);
                    onPhoneChange(formattedPhone);
                    if (
                        preferredContactMethod === "phone" &&
                        !formattedPhone.trim()
                    ) {
                        onPreferredContactMethodChange("email");
                    }
                }}
                enterKeyHint="next"
                enterBehavior="next"
                hintContent="Optional, but helpful if there is an issue with your appointment."
            />

            <FormField
                id="instagramHandle"
                name="instagramHandle"
                label="Instagram handle"
                type="text"
                autoComplete="off"
                required
                placeholder="e.g., vee.nailsstudio"
                value={instagramHandle}
                onValueChange={(value) => {
                    const normalizedValue = value.toLowerCase();
                    onInstagramHandleChange(normalizedValue);
                    if (
                        preferredContactMethod === "instagram" &&
                        !normalizeInstagramHandle(normalizedValue)
                    ) {
                        onPreferredContactMethodChange("email");
                    }
                }}
                enterKeyHint="next"
                enterBehavior="next"
                error={
                    showInstagramError
                        ? "Use lowercase letters, numbers, periods, or underscores only."
                        : undefined
                }
                hintContent="We use this to contact you about design inspiration and your appointment."
            />

            <AppSelect
                label="Preferred contact method"
                name="preferredContactMethod"
                required
                value={preferredContactMethod}
                onChange={(value) =>
                    onPreferredContactMethodChange(
                        value as PreferredContactMethod,
                    )
                }
                options={availableContactMethods.map((method) => ({
                    value: method,
                    label:
                        method === "email"
                            ? "Email"
                            : method === "phone"
                              ? "Phone"
                              : "Instagram",
                }))}
                helperText="Choose how the studio should contact you about appointments."
            />
        </>
    );
}
