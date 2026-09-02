"use client";

import { ReactNode, useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { IoClose } from "react-icons/io5";
import { useClickAway } from "@/lib/hooks/use-click-away";

export default function ModalShell({
    title,
    description,
    children,
    onClose,
    size = "default",
}: {
    title?: string;
    description?: ReactNode;
    children: ReactNode;
    onClose: () => void;
    size?: "default" | "wide";
}) {
    const reduceMotion = useReducedMotion();
    const dialogRef = useRef<HTMLDivElement>(null);
    const [closing, setClosing] = useState(false);
    const requestClose = useCallback(() => {
        setClosing(true);
    }, []);

    useClickAway({
        ref: dialogRef,
        enabled: !closing,
        onClickAway: requestClose,
    });

    if (typeof document === "undefined") {
        return null;
    }

    return createPortal(
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: closing ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            onAnimationComplete={() => {
                if (closing) onClose();
            }}
        >
            <motion.div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                className={`mx-4 flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-lg sm:mx-0 ${size === "wide" ? "max-w-md lg:max-w-3xl" : "max-w-md"} ${closing ? "pointer-events-none" : ""}`}
                initial={
                    reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 24, scale: 0.97 }
                }
                animate={
                    closing
                        ? reduceMotion
                            ? { opacity: 0 }
                            : { opacity: 0, y: 16, scale: 0.98 }
                        : { opacity: 1, y: 0, scale: 1 }
                }
                exit={
                    reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 16, scale: 0.98 }
                }
                transition={{
                    duration: reduceMotion ? 0 : 0.22,
                    ease: [0.22, 1, 0.36, 1],
                }}
            >
                <div className="flex w-full shrink-0 items-start justify-between border-b border-border/50 px-6 py-5">
                    <div>
                        {title ? <h3 className="text-lg font-semibold">{title}</h3> : null}
                        {description ? <div className="mt-2 text-sm text-muted">{description}</div> : null}
                    </div>

                    <button
                        type="button"
                        aria-label="Close"
                        onClick={requestClose}
                        className="rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <IoClose className="h-5 w-5" />
                    </button>
                </div>

                <div className="min-h-0 overflow-y-auto overscroll-contain px-6 py-5">
                    {children}
                </div>
            </motion.div>
        </motion.div>,
        document.body,
    );
}
