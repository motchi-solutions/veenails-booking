import Link from "next/link";
import { FiExternalLink, FiCheck } from "react-icons/fi";

export default function FormCheckbox({
    id,
    name,
    required,
    value,
    onValueChange,
    checked,
    defaultChecked,
    onCheckedChange,
    children,
}: {
    id: string;
    name: string;
    required?: boolean;
    // legacy prop names kept for compatibility
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    // preferred prop names
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (value: boolean) => void;
    children?: React.ReactNode;
}) {
    return (
        <label
            htmlFor={id}
            className="flex items-start gap-3 rounded-2xl border border-border/50 bg-surface-2/50 p-3 text-xs leading-relaxed text-muted transition-colors duration-200 hover:bg-surface-2/70 sm:p-4 sm:text-sm"
        >
            <input
                id={id}
                name={name}
                type="checkbox"
                className="peer sr-only"
                aria-required={required ? "true" : undefined}
                checked={checked ?? value}
                defaultChecked={
                    checked === undefined && value === undefined
                        ? defaultChecked
                        : undefined
                }
                onChange={(e) => {
                    const next = e.target.checked;
                    onValueChange?.(next);
                    onCheckedChange?.(next);
                }}
            />

            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-transparent transition-all duration-150 peer-checked:border-pink-main peer-checked:bg-pink-main peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background">
                <FiCheck
                    className="h-4 w-4 transition-opacity duration-150"
                    aria-hidden="true"
                />
            </span>

            <span className="flex-1">
                {children ?? (
                    <>
                        I agree to the{" "}
                        <Link
                            href="/legal/terms-of-service.pdf"
                            target="_blank"
                            rel="noreferrer"
                            className="link-default inline-flex items-center gap-1 font-semibold"
                        >
                            <span>Terms of Service</span>
                            <FiExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Link>{" "}
                        and{" "}
                        <Link
                            href="/privacy-policy"
                            target="_blank"
                            rel="noreferrer"
                            className="link-default inline-flex items-center gap-1 font-semibold"
                        >
                            <span>Privacy Policy</span>
                            <FiExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Link>
                        . <span className="text-pink-main">*</span>
                    </>
                )}
            </span>
        </label>
    );
}
