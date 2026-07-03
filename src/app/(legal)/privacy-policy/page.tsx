import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
    title: "Privacy Policy",
    description:
        "How Vee's Nail Studio collects, uses, stores, protects, and shares personal information and Google user data.",
    path: "/privacy-policy",
    robots: {
        index: true,
        follow: true,
    },
});

const sections = [
    {
        title: "1. Scope",
        content: (
            <p>
                This Privacy Policy applies to the Vee&apos;s Nail Studio
                website at veenailstudio.ca, the booking portal at
                booking.veenailstudio.ca, client accounts, appointment
                services, booking-related emails, and the studio&apos;s Google
                Calendar integration.
            </p>
        ),
    },
    {
        title: "2. Information We Collect",
        content: (
            <>
                <h3>Account and contact information</h3>
                <p>
                    We may collect your name, email address, phone number,
                    account login information, profile image, provider
                    identifier, and optional profile details.
                </p>

                <h3>Booking and appointment information</h3>
                <p>
                    We collect appointment dates and times, selected services,
                    pricing options, design details, removal requests, notes,
                    cancellation requests, booking status, and appointment
                    history.
                </p>

                <h3>Deposit and payment-related information</h3>
                <p>
                    We may store the deposit amount, payment method, whether an
                    e-transfer was marked as sent or received, refund or credit
                    status, final amount due, and payment notes. We do not
                    intentionally collect full banking credentials through the
                    booking portal.
                </p>

                <h3>Technical information</h3>
                <p>
                    We may process IP addresses, device and browser
                    information, timestamps, security events, and operational
                    logs to run, secure, and improve the service.
                </p>
            </>
        ),
    },
    {
        title: "3. Google User Data",
        content: (
            <>
                <p>
                    If a client signs in with Google, we may receive basic
                    account information that Google makes available with
                    consent, such as the client&apos;s name, email address,
                    profile image, and Google account identifier. We use this
                    information only to authenticate the client and operate
                    their booking account.
                </p>

                <p>
                    An authorized studio administrator may separately connect a
                    Google account to the studio&apos;s calendar integration.
                    The integration requests permission to view the
                    administrator&apos;s calendar list and to create, update,
                    and delete events on a calendar the administrator selects.
                    We use this access only to list writable calendars and
                    synchronize Vee&apos;s Nail Studio availability and
                    appointment events.
                </p>

                <p>
                    For the calendar integration, we may store the connected
                    account&apos;s email address, selected calendar identifier
                    and name, an encrypted OAuth refresh token, identifiers for
                    events created or managed by the booking portal, and sync
                    status information. Short-lived access tokens are used to
                    call Google&apos;s APIs and are not intentionally stored in
                    our database.
                </p>

                <p>
                    The booking portal does not use Google user data for
                    advertising, credit decisions, data brokerage, or training
                    generalized artificial intelligence or machine learning
                    models. Our use and transfer of information received from
                    Google APIs adheres to the{" "}
                    <a
                        href="https://developers.google.com/terms/api-services-user-data-policy"
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-link underline underline-offset-4"
                    >
                        Google API Services User Data Policy
                    </a>
                    , including its Limited Use requirements.
                </p>
            </>
        ),
    },
    {
        title: "4. How We Use Information",
        content: (
            <ul>
                <li>Create, authenticate, and manage client accounts.</li>
                <li>
                    Process appointment requests, confirmations,
                    cancellations, rescheduling, deposits, credits, and
                    refunds.
                </li>
                <li>
                    Display appointment details and history to clients and
                    authorized studio administrators.
                </li>
                <li>
                    Send authentication, booking, reminder, cancellation, and
                    administrative emails.
                </li>
                <li>
                    Synchronize studio availability and appointments with the
                    studio&apos;s selected Google Calendar.
                </li>
                <li>
                    Maintain security, prevent fraud, troubleshoot errors, and
                    meet legal, tax, accounting, and dispute-resolution
                    obligations.
                </li>
            </ul>
        ),
    },
    {
        title: "5. Sharing and Disclosure",
        content: (
            <>
                <p>
                    We do not sell or rent personal information or Google user
                    data. We disclose information only as needed to provide and
                    secure the service, including to:
                </p>
                <ul>
                    <li>
                        Authorized Vee&apos;s Nail Studio administrators who
                        manage appointments.
                    </li>
                    <li>
                        Service providers that support hosting, database,
                        authentication, storage, email delivery, and security,
                        including Vercel, Supabase, and Brevo.
                    </li>
                    <li>
                        Google when a user chooses Google sign-in or an
                        administrator uses the Google Calendar integration.
                    </li>
                    <li>
                        Professional advisers, authorities, or other parties
                        where required by law or reasonably necessary to
                        protect legal rights and safety.
                    </li>
                </ul>
                <p>
                    Service providers process information on our behalf and
                    are not authorized by us to use it for unrelated purposes.
                </p>
            </>
        ),
    },
    {
        title: "6. Security",
        content: (
            <p>
                We use reasonable administrative, technical, and
                organizational safeguards, including encrypted connections,
                encryption of stored Google OAuth refresh tokens, role-based
                access controls, database row-level security, audit logging,
                and limiting administrative access to authorized users. No
                transmission or storage method is completely secure, so we
                cannot guarantee absolute security.
            </p>
        ),
    },
    {
        title: "7. Retention, Deletion, and Revoking Google Access",
        content: (
            <>
                <p>
                    We retain information only as long as reasonably necessary
                    for the purposes described in this policy and for legal,
                    accounting, security, operational, and dispute-resolution
                    requirements. Booking history, payment records, policy
                    acceptances, and audit records may be retained where
                    reasonably necessary for those purposes.
                </p>
                <p>
                    You may request access to, correction of, or deletion of
                    your personal information by emailing{" "}
                    <a
                        href="mailto:admin@motchi.ca"
                        className="font-semibold text-link underline underline-offset-4"
                    >
                        admin@motchi.ca
                    </a>
                    . We may need to verify your identity and may retain
                    information when required by law or for legitimate
                    security, accounting, or dispute-resolution needs.
                </p>
                <p>
                    A studio administrator can disconnect the calendar
                    integration in the booking portal. A Google user can also
                    revoke the app&apos;s access from their{" "}
                    <a
                        href="https://myaccount.google.com/connections"
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-link underline underline-offset-4"
                    >
                        Google Account connections
                    </a>
                    . When the integration is disconnected, the stored OAuth
                    token is deleted from the active integration record.
                </p>
            </>
        ),
    },
    {
        title: "8. Children",
        content: (
            <p>
                The booking portal is not intended for children to create
                accounts without appropriate consent. If we learn that we
                collected a child&apos;s information without appropriate
                consent, we will take reasonable steps to delete or restrict
                it where required.
            </p>
        ),
    },
    {
        title: "9. International Processing",
        content: (
            <p>
                Some service providers may process or store information
                outside Ontario or Canada. Information processed elsewhere may
                be subject to the laws of that jurisdiction.
            </p>
        ),
    },
    {
        title: "10. Changes to This Policy",
        content: (
            <p>
                We may update this Privacy Policy as our services or data
                practices change. We will publish the updated policy on this
                page with a revised effective date and provide additional
                notice where required.
            </p>
        ),
    },
    {
        title: "11. Contact",
        content: (
            <p>
                For privacy questions, requests, or concerns, contact
                Vee&apos;s Nail Studio at{" "}
                <a
                    href="mailto:admin@motchi.ca"
                    className="font-semibold text-link underline underline-offset-4"
                >
                    admin@motchi.ca
                </a>
                .
            </p>
        ),
    },
];

export default function PrivacyPolicyPage() {
    return (
        <>
            <header className="border-b border-border/60 bg-surface/95">
                <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-6">
                    <Link
                        href="/"
                        className="link-clean inline-flex items-center gap-3 rounded-xl"
                        aria-label="Vee's Nail Studio booking portal home"
                    >
                        <Image
                            src="/logo.png"
                            alt=""
                            width={40}
                            height={40}
                            className="rounded-full border border-border object-cover"
                        />
                        <span className="text-sm font-semibold">
                            Vee&apos;s Nail Studio
                        </span>
                    </Link>
                    <Link href="/" className="link-muted text-sm font-semibold">
                        Booking portal
                    </Link>
                </div>
            </header>

            <main className="min-h-screen bg-background px-5 py-12 text-foreground sm:px-6 sm:py-16">
                <article className="mx-auto max-w-4xl">
                    <header className="border-b border-border pb-8">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-pink-main">
                            Vee&apos;s Nail Studio Booking Portal
                        </p>
                        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                            Privacy Policy
                        </h1>
                        <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
                            How we collect, use, store, protect, and share
                            information for the Vee&apos;s Nail Studio website,
                            booking portal, and Google integrations.
                        </p>
                        <p className="mt-5 text-sm font-medium text-muted">
                            Effective date:{" "}
                            <time dateTime="2026-07-03">July 3, 2026</time>
                        </p>
                    </header>

                    <div className="space-y-10 py-10 text-base leading-8 text-muted">
                        <p>
                            This Privacy Policy explains the practices of
                            Vee&apos;s Nail Studio (&quot;Vee&apos;s,&quot;
                            &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
                            when you use our website, booking portal,
                            appointment services, email communications, and
                            related integrations.
                        </p>

                        {sections.map((section) => (
                            <section
                                key={section.title}
                                className="space-y-4 [&_h3]:pt-2 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_li]:pl-1 [&_li]:marker:text-pink-main [&_p]:max-w-none [&_ul]:list-disc [&_ul]:space-y-2"
                            >
                                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                                    {section.title}
                                </h2>
                                {section.content}
                            </section>
                        ))}
                    </div>
                </article>
            </main>
        </>
    );
}
