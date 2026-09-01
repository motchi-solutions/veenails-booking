"use client";

import { useRef, useState } from "react";
import { FiChevronDown, FiEye, FiEyeOff } from "react-icons/fi";

import FieldHintToggle from "@/components/shared/form/FieldHintToggle";
import { formatNorthAmericanPhone } from "@/features/auth/validation/phone";

type BaseFieldProps = {
    id: string;
    name: string;
    label: string;
    hintContent?: React.ReactNode;
    hintTitle?: string;
    hintDefaultOpen?: boolean;
    hintCollapsible?: boolean;
    error?: string;
    required?: boolean;
    className?: string;
    autoComplete?: string;
    labelAction?: React.ReactNode;
    enterKeyHint?:
        | "enter"
        | "done"
        | "go"
        | "next"
        | "previous"
        | "search"
        | "send";
    enterBehavior?: "next" | "submit";
};

type InputFieldProps = BaseFieldProps & {
    fieldType?: "input";
    type?: "text" | "email" | "tel" | "password" | "number";
    placeholder?: string;
    minLength?: number;
    min?: number | string;
    max?: number | string;
    step?: number | string;
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
    value?: string;
    onValueChange?: (value: string) => void;
};

type SelectFieldProps = BaseFieldProps & {
    fieldType: "select";
    placeholder?: string;
    options: {
        label: string;
        value: string;
    }[];
};

type FormFieldProps = InputFieldProps | SelectFieldProps;

export default function FormField(props: FormFieldProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [hintOpen, setHintOpen] = useState(props.hintDefaultOpen ?? false);

    const inputRef = useRef<HTMLInputElement | null>(null);

    const togglePasswordVisibility = () => {
        setShowPassword((value) => !value);

        window.requestAnimationFrame(() => {
            inputRef.current?.focus({ preventScroll: true });
        });
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let value = event.target.value;

        if (props.fieldType !== "select" && props.type === "tel") {
            value = formatNorthAmericanPhone(value);
            event.target.value = value;
        }

        if (props.fieldType !== "select") {
            props.onValueChange?.(value);
        }
    };

    const hintId = props.hintContent ? `${props.id}-inline-hint` : undefined;
    const errorId = props.error ? `${props.id}-error` : undefined;

    const describedBy = [hintId, errorId].filter(Boolean).join(" ");

    return (
        <div className={`space-y-2 ${props.className ?? ""}`}>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <label htmlFor={props.id} className="label-text text-sm lg:text-base">
                        {props.label}
                        {props.required ? (
                            <span
                                className="ml-1 text-pink-main"
                                aria-hidden="true"
                            >
                                *
                            </span>
                        ) : null}
                    </label>

                    {props.hintContent &&
                    hintId &&
                    props.hintCollapsible !== false ? (
                        <FieldHintToggle
                            open={hintOpen}
                            onClick={() => setHintOpen((value) => !value)}
                            controlsId={hintId}
                            title={props.hintTitle}
                        />
                    ) : null}
                </div>

                {props.labelAction ? props.labelAction : null}
            </div>

            {props.hintContent && hintId ? (
                props.hintCollapsible === false ? (
                    <div
                        id={hintId}
                        className="rounded-md px-2 py-1 text-xs leading-tight text-muted opacity-90 sm:text-xs"
                    >
                        {props.hintContent}
                    </div>
                ) : (
                    <div
                        id={hintId}
                        className={`grid transition-all duration-200 ease-out ${
                            hintOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                        }`}
                    >
                        <div className="overflow-hidden">
                            <div className="rounded-md px-2 py-1 text-xs leading-tight text-muted opacity-80 sm:text-xs">
                                {props.hintContent}
                            </div>
                        </div>
                    </div>
                )
            ) : null}

            {props.fieldType === "select" ? (
                <div className="relative">
                    <select
                        id={props.id}
                        name={props.name}
                        required={props.required}
                        aria-describedby={describedBy || undefined}
                        aria-invalid={Boolean(props.error)}
                        data-enter-behavior={props.enterBehavior}
                        className="input-field appearance-none pr-11"
                        defaultValue=""
                    >
                        {props.placeholder ? (
                            <option value="" disabled>
                                {props.placeholder}
                            </option>
                        ) : null}

                        {props.options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                </div>
            ) : (
                <div className="relative">
                    {props.type === "tel" ? (
                        <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-base font-medium text-muted">
                            +1
                        </span>
                    ) : null}

                    <input
                        ref={inputRef}
                        id={props.id}
                        name={props.name}
                        type={
                            props.type === "password"
                                ? showPassword
                                    ? "text"
                                    : "password"
                                : props.type === "tel"
                                  ? "tel"
                                  : (props.type ?? "text")
                        }
                        value={props.value}
                        onChange={handleInputChange}
                        autoComplete={props.autoComplete}
                        required={props.required}
                        placeholder={props.placeholder}
                        minLength={props.minLength}
                        min={props.min}
                        max={props.max}
                        step={props.step}
                        inputMode={
                            props.inputMode ??
                            (props.type === "email"
                                ? "email"
                                : props.type === "tel"
                                  ? "tel"
                                  : undefined)
                        }
                        enterKeyHint={props.enterKeyHint}
                        aria-describedby={describedBy || undefined}
                        aria-invalid={Boolean(props.error)}
                        data-enter-behavior={props.enterBehavior}
                        className={[
                            "input-field",
                            props.type === "password" ? "pr-12" : "",
                            props.type === "tel" ? "pl-12" : "",
                        ].join(" ")}
                    />

                    {props.type === "password" ? (
                        <button
                            type="button"
                            aria-pressed={showPassword}
                            onMouseDown={(event) => event.preventDefault()}
                            onTouchStart={(event) => event.preventDefault()}
                            onClick={togglePasswordVisibility}
                            aria-label={
                                showPassword ? "Hide password" : "Show password"
                            }
                            className="absolute right-3 top-1/2 flex h-9 w-9 touch-manipulation -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                            {showPassword ? (
                                <FiEye className="h-4 w-4" />
                            ) : (
                                <FiEyeOff className="h-4 w-4" />
                            )}
                        </button>
                    ) : null}
                </div>
            )}

            {props.error && errorId ? (
                <p id={errorId} className="text-xs text-danger">
                    {props.error}
                </p>
            ) : null}
        </div>
    );
}
