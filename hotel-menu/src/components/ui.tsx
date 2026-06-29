"use client";

import { cn } from "@/lib/utils";
import { Check, ChevronDown, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/* ---------------------------------- Button --------------------------------- */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const variants: Record<string, string> = {
    primary:
      "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm",
    secondary: "bg-slate-900 text-white hover:bg-slate-800",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
    outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  };
  const sizes: Record<string, string> = {
    sm: "h-9 px-3 text-sm rounded-lg",
    md: "h-11 px-4 text-sm rounded-xl",
    lg: "h-14 px-6 text-base rounded-2xl",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

/* ---------------------------------- Badge ---------------------------------- */

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}

/* --------------------------------- Spinner --------------------------------- */

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn("h-6 w-6 animate-spin text-brand-600", className)} />
  );
}

export function CenteredSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
      <Spinner />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

/* ----------------------------- Form fields --------------------------------- */

// Shared field styling. Light by default (admin/manager); the `dark:` variants
// kick in on the client guest pages (Tailwind `dark` class on <html>), so the
// same components work across all three surfaces.
const FIELD =
  "w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-brand-900";

export const Input = ({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(FIELD, "h-11", className)} {...props} />
);

export const Textarea = ({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cn(FIELD, "py-2", className)} {...props} />
);

// Native select styled like the other fields (keeps the browser's caret).
export const Select = ({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={cn(FIELD, "h-11", className)} {...props}>
    {children}
  </select>
);

export function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300",
        className
      )}
    >
      {children}
    </label>
  );
}

// Checkbox / radio with an optional label, sharing the brand accent color.
type ToggleProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: React.ReactNode;
};

export function Checkbox({ label, className, ...props }: ToggleProps) {
  const input = (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 flex-shrink-0 accent-brand-600 disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
  if (!label) return input;
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-zinc-200">
      {input}
      {label}
    </label>
  );
}

export function Radio({ label, className, ...props }: ToggleProps) {
  const input = (
    <input
      type="radio"
      className={cn(
        "h-4 w-4 flex-shrink-0 accent-brand-600 disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
  if (!label) return input;
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-zinc-200">
      {input}
      {label}
    </label>
  );
}

/* --------------------------------- Dropdown -------------------------------- */

export type DropdownOption<T extends string> = {
  value: T;
  label: string; // shown in the open list
  triggerLabel?: string; // shown on the closed trigger (defaults to label)
};

// Reusable popover select. Auto-themes via the `dark` class strategy. Closes on
// outside-click and Escape. Generic over the option value type.
export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  align = "start",
  label,
  className,
  buttonClassName,
}: {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  align?: "start" | "end";
  label?: string;
  className?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-bold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
          buttonClassName
        )}
      >
        {current?.triggerLabel ?? current?.label ?? value}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition", open && "rotate-180")}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          className={cn(
            "absolute z-50 mt-1 min-w-[9rem] overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-xl dark:border-zinc-800 dark:bg-zinc-900",
            align === "end" ? "right-0" : "left-0"
          )}
        >
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition",
                  o.value === value
                    ? "bg-zinc-100 font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-white"
                    : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
                )}
              >
                {o.label}
                {o.value === value && (
                  <Check className="h-4 w-4 text-brand-500" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------------------------- Modal ---------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg animate-slide-up rounded-t-3xl bg-white text-slate-900 shadow-2xl dark:bg-zinc-900 dark:text-zinc-100 sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-2.5 py-2.5 dark:border-zinc-800 lg:px-5 lg:py-5">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-2.5 py-2.5 lg:px-5 lg:py-5">{children}</div>
        {footer && (
          <div className="border-t border-slate-100 px-2.5 py-2.5 dark:border-zinc-800 lg:px-5 lg:py-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- EmptyState ------------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
      {icon && <div className="text-slate-300">{icon}</div>}
      <h3 className="text-base font-semibold text-slate-700">{title}</h3>
      {description && (
        <p className="max-w-xs text-sm text-slate-400">{description}</p>
      )}
      {action}
    </div>
  );
}
