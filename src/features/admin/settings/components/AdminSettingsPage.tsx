"use client";

import { updateBookingSettingsAction } from "@/features/admin/settings/actions/admin-settings";
import type { AdminBookingSettings } from "@/features/admin/settings/data/admin-settings";
import AdminPageHeader from "@/features/admin/components/AdminPageHeader";
import { useToast } from "@/components/shared/toast/ToastProvider";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { FiAlertCircle, FiCheckCircle, FiSave } from "react-icons/fi";

function settingsSignature(settings: AdminBookingSettings) {
    return new URLSearchParams([
        ["id", String(settings.id)],
        ["depositAmount", String(settings.deposit_amount)],
        ["bookingFeeRate", String(settings.booking_fee_rate)],
        ["bookingFeeMode", settings.booking_fee_mode],
        ["holdMinutes", String(settings.hold_minutes)],
        ["etransferEmail", settings.etransfer_email ?? ""],
        ["instagramUrl", settings.instagram_url ?? ""],
    ]).toString();
}

function formSignature(form: HTMLFormElement) {
    const values = [...new FormData(form).entries()]
        .filter((entry): entry is [string, string] => typeof entry[1] === "string")
        .map(([key, value]) => [key, value] as [string, string]);
    return new URLSearchParams(values).toString();
}

export default function AdminSettingsPage({
    settings,
}: {
    settings: AdminBookingSettings | null;
}) {
    const formRef = useRef<HTMLFormElement>(null);
    const savedSignature = useRef(
        settings ? settingsSignature(settings) : "",
    );
    const [dirty, setDirty] = useState(false);
    const [bookingFeeMode, setBookingFeeMode] = useState(
        settings?.booking_fee_mode ?? "included_in_price",
    );
    const [pending, startSaving] = useTransition();
    const toast = useToast();
    const router = useRouter();

    function detectChanges(form: HTMLFormElement) {
        setDirty(formSignature(form) !== savedSignature.current);
    }

    function saveSettings(formData: FormData) {
        startSaving(async () => {
            const result = await updateBookingSettingsAction(formData);
            if (result.error) {
                toast.error(result.error, "Settings not saved");
                return;
            }

            if (formRef.current) {
                savedSignature.current = formSignature(formRef.current);
            }
            setDirty(false);
            toast.success(result.success, "Settings saved");
            router.refresh();
        });
    }

    return (
        <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
            <AdminPageHeader
                eyebrow="Admin"
                title="Settings"
                description="Manage booking, priority access, payment, and client contact settings."
            />
            {settings ? (
                <form
                    ref={formRef}
                    action={saveSettings}
                    onChange={(event) => detectChanges(event.currentTarget)}
                    className="mt-6 grid gap-4 xl:grid-cols-2"
                >
                    <input type="hidden" name="id" value={settings.id} />
                    <label className="space-y-2">
                        <span className="label-text">Deposit amount</span>
                        <input
                            className="input-field"
                            name="depositAmount"
                            type="number"
                            step="0.01"
                            defaultValue={settings.deposit_amount}
                        />
                    </label>
                    <label className="space-y-2">
                        <span className="label-text">Booking fee rate</span>
                        <input
                            className="input-field"
                            name="bookingFeeRate"
                            type="number"
                            step="0.01"
                            min="1"
                            max="100"
                            defaultValue={settings.booking_fee_rate}
                        />
                    </label>
                    <label className="space-y-2">
                        <span className="label-text">Booking fee mode</span>
                        <select
                            className="input-field"
                            name="bookingFeeMode"
                            defaultValue={settings.booking_fee_mode}
                            onChange={(event) =>
                                setBookingFeeMode(
                                    event.target
                                        .value as AdminBookingSettings["booking_fee_mode"],
                                )
                            }
                        >
                            <option value="included_in_price">
                                Included in price (studio absorbs fee)
                            </option>
                            <option value="added_on_top">
                                Added separately to client total
                            </option>
                        </select>
                        <span className="block text-xs leading-relaxed text-muted">
                            {bookingFeeMode === "included_in_price"
                                ? "Clients see the appointment price only. The studio absorbs the booking fee."
                                : "The booking fee is shown separately and added to the client’s total."}
                        </span>
                    </label>
                    <label className="space-y-2">
                        <span className="label-text">Hold minutes</span>
                        <input
                            className="input-field"
                            name="holdMinutes"
                            type="number"
                            step="1"
                            min="1"
                            defaultValue={settings.hold_minutes}
                        />
                    </label>
                    <label className="space-y-2">
                        <span className="label-text">E-transfer email</span>
                        <input
                            className="input-field"
                            name="etransferEmail"
                            type="email"
                            defaultValue={settings.etransfer_email ?? ""}
                        />
                    </label>
                    <label className="space-y-2">
                        <span className="label-text">Instagram DM URL</span>
                        <input
                            className="input-field"
                            name="instagramUrl"
                            type="url"
                            defaultValue={settings.instagram_url ?? ""}
                        />
                        <span className="block text-xs text-muted">
                            Used for the arrival-details contact button shown to
                            confirmed clients.
                        </span>
                    </label>
                    <div className="mt-2 flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-end xl:col-span-2">
                        <p
                            className={`inline-flex items-center justify-end gap-2 text-sm font-medium ${
                                dirty ? "text-amber-700" : "text-muted"
                            }`}
                            role="status"
                            aria-live="polite"
                        >
                            {dirty ? (
                                <FiAlertCircle
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                            ) : (
                                <FiCheckCircle
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                            )}
                            {dirty ? "Unsaved changes" : "All changes saved"}
                        </p>
                        <button
                            type="submit"
                            className="btn-primary inline-flex min-w-38 items-center justify-center gap-2"
                            disabled={!dirty || pending}
                        >
                            <FiSave className="h-4 w-4" aria-hidden="true" />
                            {pending ? "Saving…" : "Save changes"}
                        </button>
                    </div>
                </form>
            ) : (
                <p className="mt-5 text-sm text-muted">
                    Booking settings are not configured yet.
                </p>
            )}
        </section>
    );
}
