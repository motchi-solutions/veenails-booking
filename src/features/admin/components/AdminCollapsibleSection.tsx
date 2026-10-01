"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { FiChevronDown } from "react-icons/fi";

export default function AdminCollapsibleSection({
    title,
    count,
    displayedCount,
    showAllHref,
    defaultOpen = true,
    children,
}: {
    title: string;
    count: number;
    displayedCount?: number;
    showAllHref?: string;
    defaultOpen?: boolean;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const id = useId();

    return (
        <section className="min-w-0 rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <h2 className="min-w-0 flex-1">
                    <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={id}
                        onClick={() => setOpen((value) => !value)}
                        className="flex w-full items-center justify-between gap-3 rounded-lg text-left text-lg font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-green/40 focus-visible:ring-offset-4"
                    >
                        <span>{title} <span className="whitespace-nowrap text-sm font-normal tabular-nums text-muted">({displayedCount !== undefined ? `${displayedCount} of ${count}` : count})</span></span>
                        <FiChevronDown aria-hidden="true" className={`h-5 w-5 shrink-0 text-muted transition-transform duration-300 ease-in-out motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
                    </button>
                </h2>
                {showAllHref ? (
                    <Link href={showAllHref} aria-label={`Show all ${title.toLowerCase()}`} className="shrink-0 rounded text-sm font-semibold text-dark-green underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-green/40">
                        Show all
                    </Link>
                ) : null}
            </div>
            <div
                id={id}
                aria-hidden={!open}
                inert={!open}
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
                <div className="min-h-0 overflow-hidden">
                    <div className="pt-3">{children}</div>
                </div>
            </div>
        </section>
    );
}
