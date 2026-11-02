"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { updateProfile, type ProfileFormState } from "./actions";

const inputCls = "h-12 w-full rounded-xl border border-border bg-bg px-4 text-sm outline-none focus:border-accent";

export function ProfileForm({ fullName, phone, language, email }: { fullName: string; phone: string; language: string; email: string }) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(updateProfile, { ok: false, message: "" });
  return (
    <form action={action} className="max-w-lg space-y-4">
      {state.message && (
        <p role={state.ok ? "status" : "alert"} className={`rounded-xl border px-4 py-3 text-sm ${state.ok ? "border-emerald-500/40 bg-emerald-500/10" : "border-red-500/40 bg-red-500/10"}`}>
          {state.message}
        </p>
      )}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">Email</label>
        <input id="email" value={email} readOnly className={`${inputCls} opacity-70`} />
      </div>
      <div>
        <label htmlFor="full_name" className="mb-1.5 block text-sm font-semibold">Full name</label>
        <input id="full_name" name="full_name" defaultValue={fullName} required minLength={2} maxLength={100} className={inputCls} />
      </div>
      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold">Phone (Tanzania)</label>
        <input id="phone" name="phone" defaultValue={phone} placeholder="0712 345 678" inputMode="tel" className={inputCls} />
      </div>
      <div>
        <label htmlFor="preferred_language" className="mb-1.5 block text-sm font-semibold">Language</label>
        <select id="preferred_language" name="preferred_language" defaultValue={language} className={inputCls}>
          <option value="en">English</option>
          <option value="sw">Kiswahili</option>
        </select>
      </div>
      <Button type="submit" size="lg" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
    </form>
  );
}
