import AdminAvailabilityPage from "@/features/admin/availability/components/AdminAvailabilityPage";
import { getAdminAvailabilityPageData } from "@/features/admin/availability/data/admin-availability";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
    title: "Admin Availability",
    description: "Manage appointment availability.",
    path: "/admin/availability",
    noIndex: true,
});

export default async function AdminAvailabilityRoute() {
    const data = await getAdminAvailabilityPageData();

    return (
        <AdminAvailabilityPage
            slots={data.slots}
            nowIso={new Date().toISOString()}
        />
    );
}
