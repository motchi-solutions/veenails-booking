export default function TotalsRow({
    label,
    value,
    prominent = false,
}: {
    label: string;
    value: string;
    prominent?: boolean;
}) {
    return (
        <div className="mt-3 flex items-start justify-between gap-3 first:mt-0">
            <span
                className={
                    prominent
                        ? "min-w-0 break-words text-sm font-semibold text-foreground"
                        : "min-w-0 break-words text-sm text-muted"
                }
            >
                {label}
            </span>
            <span
                className={
                    prominent
                        ? "shrink-0 whitespace-nowrap text-right text-lg font-semibold tabular-nums text-foreground"
                        : "shrink-0 whitespace-nowrap text-right text-sm font-semibold tabular-nums text-foreground"
                }
            >
                {value}
            </span>
        </div>
    );
}
