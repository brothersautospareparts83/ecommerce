import { asPublic } from "@/lib/db";

// Public, read-only check that the app can reach Neon under the restricted customer role.
export async function GET() {
  try {
    const result = await asPublic(async (db) => {
      const who = await db.query("select current_user as role");
      const cats = await db.query("select count(*)::int as n from categories");
      const prods = await db.query("select count(*)::int as n from products");
      return { role: who.rows[0].role, categories: cats.rows[0].n, visibleProducts: prods.rows[0].n };
    });
    return Response.json({ ok: true, ...result });
  } catch {
    return Response.json({ ok: false, error: "Database unavailable" }, { status: 503 });
  }
}
