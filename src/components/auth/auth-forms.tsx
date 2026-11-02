"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

const inputCls =
  "h-12 w-full rounded-xl border border-border bg-bg px-4 text-sm outline-none placeholder:text-muted focus:border-accent";

/** Only same-site paths are allowed as post-login destinations. */
function safeRedirect(value: string | null, fallback: string) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : fallback;
}

/** Full page load. A client-side push could reuse a router-cache entry made while signed out. */
function hardNavigate(path: string) {
  window.location.assign(path);
}

/** The SDK can throw (not just return) HTTP errors; map them to a clear message. */
function errorMessage(e: unknown, fallback: string): string {
  const o = e as { message?: string; status?: number; statusCode?: number; error?: { message?: string } } | null;
  const message = o?.error?.message ?? o?.message ?? "";
  if (o?.status === 401 || o?.statusCode === 401 || /invalid (email|password)/i.test(message)) return "Invalid email or password.";
  if (/already exists|already registered/i.test(message)) return "An account with this email already exists. Try signing in.";
  if (message && !/failed to fetch|network|load failed|fetch/i.test(message)) return message;
  return fallback;
}

function Field({ label, id, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">{label}</label>
      <input id={id} name={id} className={inputCls} {...props} />
    </div>
  );
}

function ErrorMessage({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
      {message}
    </p>
  ) : null;
}

export function LoginForm({ defaultRedirect = "/account" }: { defaultRedirect?: string }) {
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    try {
      const { error } = await authClient.signIn.email({
        email: String(form.get("email")).trim(),
        password: String(form.get("password")),
      });
      if (error) {
        setError(error.message || "Sign-in failed. Check your email and password.");
        return;
      }
      // Full page load: avoids a stale router-cache entry from when /account was prefetched signed-out.
      hardNavigate(safeRedirect(params.get("redirectTo"), defaultRedirect));
    } catch (e) {
      setError(errorMessage(e, "Could not reach the sign-in service. Please try again."));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
      <ErrorMessage message={error} />
      <Field label="Email" id="email" type="email" autoComplete="email" required />
      <Field label="Password" id="password" type="password" autoComplete="current-password" required />
      <div className="text-right text-sm"><Link href="/forgot-password" className="text-accent-text hover:underline">Forgot password?</Link></div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</Button>
      <p className="text-center text-sm text-muted">
        New customer? <Link href="/register" className="font-semibold text-accent-text hover:underline">Create an account</Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== String(form.get("confirm"))) return setError("Passwords do not match.");
    setPending(true);
    try {
      const { data, error } = await authClient.signUp.email({
        name: String(form.get("name")).trim(),
        email: String(form.get("email")).trim(),
        password,
      });
      if (error) {
        setError(error.message || "Could not create the account.");
        return;
      }
      if (data?.token || data?.user) {
        const session = await authClient.getSession();
        if (session.data?.user) {
          hardNavigate("/account");
          return;
        }
      }
      setNotice("Account created. Check your email to verify your address, then sign in.");
    } catch (e) {
      setError(errorMessage(e, "Could not reach the sign-up service. Please try again."));
    } finally {
      setPending(false);
    }
  }

  if (notice) return <p role="status" className="rounded-xl border border-border bg-surface-2 p-4 text-sm">{notice}</p>;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ErrorMessage message={error} />
      <Field label="Full name" id="name" autoComplete="name" required minLength={2} />
      <Field label="Email" id="email" type="email" autoComplete="email" required />
      <Field label="Password (8+ characters)" id="password" type="password" autoComplete="new-password" required minLength={8} />
      <Field label="Confirm password" id="confirm" type="password" autoComplete="new-password" required minLength={8} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Creating account…" : "Create account"}</Button>
      <p className="text-center text-sm text-muted">
        Already registered? <Link href="/login" className="font-semibold text-accent-text hover:underline">Sign in</Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const email = String(new FormData(e.currentTarget).get("email")).trim();
    try {
      const { error } = await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/reset-password` });
      // Same message whether or not the email exists, so accounts cannot be enumerated.
      if (error && error.status && error.status >= 500) setError("Could not send the reset email. Please try again.");
      else setSent(true);
    } catch {
      setError("Could not reach the service. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (sent) return <p role="status" className="rounded-xl border border-border bg-surface-2 p-4 text-sm">If an account exists for that email, a reset link is on its way.</p>;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ErrorMessage message={error} />
      <Field label="Email" id="email" type="email" autoComplete="email" required />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Sending…" : "Send reset link"}</Button>
      <p className="text-center text-sm text-muted"><Link href="/login" className="font-semibold text-accent-text hover:underline">Back to sign in</Link></p>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  if (!token) return <p role="alert" className="rounded-xl border border-border bg-surface-2 p-4 text-sm">This reset link is missing or has expired. <Link href="/forgot-password" className="font-semibold text-accent-text hover:underline">Request a new one</Link>.</p>;
  if (done) return <p role="status" className="rounded-xl border border-border bg-surface-2 p-4 text-sm">Password updated. <Link href="/login" className="font-semibold text-accent-text hover:underline">Sign in</Link>.</p>;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== String(form.get("confirm"))) return setError("Passwords do not match.");
    setPending(true);
    try {
      const { error } = await authClient.resetPassword({ newPassword: password, token: token! });
      if (error) setError(error.message || "This reset link is invalid or has expired.");
      else {
        setDone(true);
        router.refresh();
      }
    } catch {
      setError("Could not reach the service. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ErrorMessage message={error} />
      <Field label="New password (8+ characters)" id="password" type="password" autoComplete="new-password" required minLength={8} />
      <Field label="Confirm new password" id="confirm" type="password" autoComplete="new-password" required minLength={8} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Saving…" : "Set new password"}</Button>
    </form>
  );
}

export function SignOutButton({ className }: { className?: string }) {
  return (
    <Button
      variant="secondary"
      className={className}
      onClick={async () => {
        await authClient.signOut();
        hardNavigate("/");
      }}
    >
      Sign out
    </Button>
  );
}
