import PublicNavbar from "@/components/navigation/public/PublicNavbar";
import PublicFooter from "@/components/navigation/public/PublicFooter";
import { getUser } from "@/features/auth/guards/get-user";
import DealsAnnouncementBanner from "@/features/deals/components/DealsAnnouncementBanner";
import { getActiveDeals } from "@/features/deals/data/deals";

export const revalidate = 0;

export default async function PublicLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const user = await getUser();
    const deals = await getActiveDeals(user?.id);

    const primaryHref = user ? "/book" : "/signup";
    const primaryLabel = user ? "Start Booking" : "Create Account";

    const secondaryHref = user ? "/dashboard" : "/login";
    const secondaryLabel = user ? "Dashboard" : "Sign In";

    return (
        <>
            <DealsAnnouncementBanner
                deals={deals}
                primaryHref={primaryHref}
                primaryLabel={primaryLabel}
                secondaryHref={secondaryHref}
                secondaryLabel={secondaryLabel}
            />

            <PublicNavbar
                primaryHref={primaryHref}
                primaryLabel={primaryLabel}
                secondaryHref={secondaryHref}
                secondaryLabel={secondaryLabel}
            />

            {children}

            <PublicFooter />
        </>
    );
}
