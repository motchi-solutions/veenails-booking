import AdminSettingsPage from "@/features/admin/settings/components/AdminSettingsPage";
import AdminEmailTestCard from "@/features/admin/settings/components/AdminEmailTestCard";
import AdminInvoiceTestCard from "@/features/admin/settings/components/AdminInvoiceTestCard";
import { getAdminBookingSettings } from "@/features/admin/settings/data/admin-settings";
import { buildMetadata } from "@/lib/seo/metadata";
import GoogleCalendarSettingsCard from "@/features/integrations/google-calendar/components/GoogleCalendarSettingsCard";
import { getGoogleCalendarSettingsData } from "@/features/integrations/google-calendar/data/integration";

export const metadata = buildMetadata({
    title: "Admin Settings",
    description: "Manage booking settings.",
    path: "/admin/settings",
    noIndex: true,
});

export default async function AdminSettingsRoute({
    searchParams,
}: {
    searchParams: Promise<{ googleCalendar?: string | string[] }>;
}) {
    const params = await searchParams;
    const [settings, googleCalendar] = await Promise.all([
        getAdminBookingSettings(),
        getGoogleCalendarSettingsData(),
    ]);
    const callbackResult = Array.isArray(params.googleCalendar)
        ? params.googleCalendar[0]
        : params.googleCalendar;

    return (
        <div className="space-y-8">
            <AdminSettingsPage settings={settings} />
            <GoogleCalendarSettingsCard
                key={googleCalendar.calendarId ?? "unselected"}
                integration={googleCalendar}
                callbackResult={callbackResult}
            />
            <AdminEmailTestCard />
            <AdminInvoiceTestCard />
        </div>
    );
}
