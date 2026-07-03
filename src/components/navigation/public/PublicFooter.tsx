import Image from "next/image";
import Link from "next/link";
import { FiExternalLink, FiHeart, FiShield } from "react-icons/fi";

export default function PublicFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-border/60 bg-surface/95 px-5 py-10 sm:px-6 shadow-sm">
            <div className="mx-auto max-w-6xl">
                <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
                    {/* Brand */}
                    <div className="flex flex-col items-center md:items-start gap-3 rounded-2xl px-2 py-1.5">
                        <Link
                            href="/"
                            className="link-clean group inline-flex items-center gap-3 rounded-2xl"
                        >
                            <div className="relative h-12 w-12 overflow-hidden rounded-full border border-border shadow-sm">
                                <Image
                                    src="/logo.png"
                                    alt="Vee's Nail Studio"
                                    fill
                                    sizes="500px"
                                    className="object-cover"
                                />
                            </div>

                            <div>
                                <p className="text-sm font-semibold transition-colors group-hover:text-pink-main">
                                    Vee&apos;s Nail Studio
                                </p>
                                <p className="text-xs text-muted">
                                    Booking Portal
                                </p>
                            </div>
                        </Link>

                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
                            Request appointments, review services, accept
                            policies, and track your booking status from your
                            account.
                        </p>

                        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-pink-50 px-3 py-1.5 text-xs font-semibold text-pink-main">
                            <FiShield className="h-3.5 w-3.5" />
                            Secure appointment booking
                        </div>
                    </div>

                    {/* Quick links */}
                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            Booking
                        </p>

                        <div className="mt-4 flex flex-col items-start gap-2 text-sm">
                            <Link href="/signup" className="link-muted">
                                Create Account
                            </Link>

                            <Link href="/login" className="link-muted">
                                Sign In
                            </Link>

                            <Link href="/book" className="link-muted">
                                Start Booking
                            </Link>

                            <a
                                href="https://veenailstudio.ca"
                                target="_blank"
                                rel="noreferrer"
                                className="link-muted inline-flex items-center gap-1"
                            >
                                Main Website
                                <FiExternalLink className="h-3.5 w-3.5" />
                            </a>
                        </div>
                    </div>

                    {/* Legal */}
                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            Legal
                        </p>

                        <div className="mt-4 flex flex-col items-start gap-2 text-sm">
                            <Link
                                href="/privacy-policy"
                                className="link-muted"
                            >
                                Privacy Policy
                            </Link>

                            <a
                                href="/legal/terms-of-service.pdf"
                                target="_blank"
                                rel="noreferrer"
                                className="link-muted inline-flex items-center gap-1"
                            >
                                Terms of Service
                                <FiExternalLink className="h-3.5 w-3.5" />
                            </a>
                        </div>

                        <p className="mt-4 text-xs leading-relaxed text-muted">
                            By using the booking portal, clients agree to the
                            studio&apos;s booking policies and terms.
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 border-t border-border/60 pt-6 text-xs text-muted sm:flex-row items-center sm:justify-between">
                    <p>
                        © {currentYear}{" "}
                        <span className="font-semibold text-foreground">
                            Vee&apos;s Nail Studio
                        </span>
                        . All rights reserved.
                    </p>

                    <p className="inline-flex items-center gap-1">
                        Made with{" "}
                        <FiHeart className="h-3.5 w-3.5 text-pink-main" /> by{" "}
                        <a
                            href="https://motchi.ca"
                            target="_blank"
                            rel="noreferrer"
                            className="link-default font-semibold"
                        >
                            Motchi Websites
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
