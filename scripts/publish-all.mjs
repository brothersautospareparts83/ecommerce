// Publishes every draft product (owner decision: list all parts now, add real photos later).
// Run: node --env-file=.env.local scripts/publish-all.mjs
import pg from "pg";
const client = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL });
await client.connect();
const before = await client.query("select status, count(*)::int n from products group by status order by status");
console.log("before", before.rows);
const r = await client.query("update products set status='published' where status='draft'");
console.log("published", r.rowCount);
await client.query("insert into audit_logs (actor_role, action, entity_type, after_data) values ('system','products.publish_all','product', $1)", [JSON.stringify({ count: r.rowCount, reason: 'owner decision: list all parts, photos later' })]);
const after = await client.query("select status, count(*)::int n, count(*) filter (where price_tzs > 0)::int priced from products group by status order by status");
console.log("after", after.rows);
await client.end();
