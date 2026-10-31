// Assigns a role to an existing user. Run by the business owner with database access.
// Usage: node --env-file=.env.local scripts/set-role.mjs <email> <customer|staff|admin|owner>
// The person must have registered on the website first. The change is written to the audit log.
import pg from "pg";

const [email, role] = process.argv.slice(2);
if (!email || !["customer", "staff", "admin", "owner"].includes(role)) {
  console.error("Usage: node --env-file=.env.local scripts/set-role.mjs <email> <customer|staff|admin|owner>");
  process.exit(1);
}

const db = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
await db.connect();
try {
  await db.query("begin");
  const cur = (await db.query("select id, role from profiles where email = $1 for update", [email])).rows[0];
  if (!cur) {
    console.error(`No profile for ${email}. Register on the website and sign in once first.`);
    await db.query("rollback");
    process.exit(2);
  }
  await db.query("update profiles set role = $1 where id = $2", [role, cur.id]);
  await db.query(
    "insert into audit_logs (actor_role, action, entity_type, entity_id, before_data, after_data) values ('database-owner', 'role.change', 'profile', $1, $2, $3)",
    [cur.id, JSON.stringify({ role: cur.role, email }), JSON.stringify({ role })],
  );
  await db.query("commit");
  console.log(`${email}: ${cur.role} -> ${role}`);
} finally {
  await db.end();
}
