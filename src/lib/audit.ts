import "server-only";
import { headers } from "next/headers";
import type { PoolClient } from "@neondatabase/serverless";
import type { Profile } from "@/lib/auth/session";

/** Appends an audit record inside the caller's transaction, so it commits or rolls back with the change. */
export async function writeAudit(
  db: PoolClient,
  actor: Pick<Profile, "id" | "role">,
  entry: { action: string; entityType: string; entityId?: string; before?: unknown; after?: unknown },
) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  await db.query(
    `insert into audit_logs (actor_id, actor_role, action, entity_type, entity_id, before_data, after_data, ip, user_agent)
     values ($1, $2, $3, $4, $5, $6, $7, $8::inet, $9)`,
    [
      actor.id,
      actor.role,
      entry.action,
      entry.entityType,
      entry.entityId ?? null,
      entry.before === undefined ? null : JSON.stringify(entry.before),
      entry.after === undefined ? null : JSON.stringify(entry.after),
      ip && /^[0-9a-f:.]+$/i.test(ip) ? ip : null,
      h.get("user-agent")?.slice(0, 300) ?? null,
    ],
  );
}
