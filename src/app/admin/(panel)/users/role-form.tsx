"use client";

import { useActionState } from "react";
import { changeRole, type RoleChangeState } from "./actions";

export function RoleForm({ profileId, role, disabled }: { profileId: string; role: string; disabled?: boolean }) {
  const [state, action, pending] = useActionState<RoleChangeState, FormData>(changeRole, { ok: false, message: "" });
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="profileId" value={profileId} />
      <select
        name="role"
        defaultValue={role}
        disabled={disabled || pending}
        aria-label="Role"
        className="h-9 rounded-lg border border-border bg-bg px-2 text-sm"
      >
        <option value="customer">Customer</option>
        <option value="staff">Staff</option>
        <option value="admin">Admin</option>
        <option value="owner">Owner</option>
      </select>
      <button
        type="submit"
        disabled={disabled || pending}
        className="h-9 rounded-lg border border-border px-3 text-sm font-semibold hover:border-accent disabled:opacity-50 cursor-pointer"
      >
        Save
      </button>
      {state.message && <span role="status" className={`text-xs ${state.ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{state.message}</span>}
    </form>
  );
}
