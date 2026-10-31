"use client";

import { useActionState } from "react";
import { cn } from "@/lib/utils";

export interface FormState {
  ok: boolean;
  message: string;
}

/** A form bound to a server action that returns { ok, message }. Fields are passed as children. */
export function ActionForm({
  action,
  submitLabel,
  children,
  className,
  pendingLabel = "Saving…",
  variant = "primary",
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger";
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false, message: "" });
  return (
    <form action={formAction} className={cn("space-y-3", className)}>
      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            state.ok ? "border-emerald-500/40 bg-emerald-500/10" : "border-red-500/40 bg-red-500/10",
          )}
        >
          {state.message}
        </p>
      )}
      {children}
      <button
        type="submit"
        disabled={pending}
        className={cn(
          "h-10 cursor-pointer rounded-lg px-4 text-sm font-semibold transition disabled:opacity-60",
          variant === "primary" && "bg-accent text-accent-fg hover:brightness-110",
          variant === "secondary" && "border border-border hover:border-accent",
          variant === "danger" && "border border-red-500/50 text-red-700 hover:bg-red-500/10 dark:text-red-300",
        )}
      >
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}

export const adminInput =
  "h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm outline-none focus:border-accent";

export function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold text-muted">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
