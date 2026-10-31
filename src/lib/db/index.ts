import "server-only";
import { Pool, type PoolClient } from "@neondatabase/serverless";

/**
 * Database access for server code (Server Components, Server Actions, Route Handlers).
 *
 * Uses the Neon serverless driver over the pooled connection, which suits Vercel/serverless
 * runtimes. Every call runs inside a transaction under a restricted Postgres role so that
 * Row Level Security applies:
 *   - "customer": visitors and signed-in customers (identity in app.user_id)
 *   - "staff":    admins and staff (app.user_role decides admin-only actions)
 */
export type DbSession =
  | { kind: "customer"; userId?: string }
  | { kind: "staff"; userId: string; role: "staff" | "admin" | "owner" };

let pool: Pool | undefined;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set. Add it to .env.local (see .env.example).");
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

export async function withDb<T>(session: DbSession, fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    // Role names are fixed literals, never user input.
    await client.query(session.kind === "staff" ? "set local role app_staff" : "set local role app_customer");
    await client.query("select set_config('app.user_id', $1, true), set_config('app.user_role', $2, true)", [
      session.userId ?? "",
      session.kind === "staff" ? session.role : "",
    ]);
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** Convenience for anonymous/public reads. */
export const asPublic = <T>(fn: (client: PoolClient) => Promise<T>) => withDb({ kind: "customer" }, fn);
