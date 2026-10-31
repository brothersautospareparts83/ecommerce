// End-to-end check of authentication against a RUNNING app and the real Neon Auth service.
// Usage: node --env-file=.env.local scripts/e2e-auth.mjs [baseUrl]
// Creates one throw-away test user and deletes it (and its profile) at the end.
import pg from "pg";

const BASE = process.argv[2] ?? "http://localhost:3101";
const email = `e2e-${Date.now()}@example.com`;
const password = "Test-pass-12345";
let cookies = {};
let failed = 0;

const jar = () => Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");
function store(res) {
  for (const line of res.headers.getSetCookie?.() ?? []) {
    const [pair] = line.split(";");
    const i = pair.indexOf("=");
    const k = pair.slice(0, i), v = pair.slice(i + 1);
    if (!v || /max-age=0/i.test(line)) delete cookies[k];
    else cookies[k] = v;
  }
}
async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    redirect: "manual",
    ...opts,
    headers: { origin: BASE, cookie: jar(), ...(opts.headers ?? {}) },
  });
  store(res);
  return res;
}
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  -> " + detail : ""}`);
  if (!ok) failed++;
}
const loc = (r) => r.headers.get("location") ?? "";

const db = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
await db.connect();

try {
  // 1. Signed out: protected areas redirect to login
  let r = await req("/account");
  check("signed-out /account redirects to /login", [302, 303, 307, 308].includes(r.status) && loc(r).includes("/login"), `${r.status} ${loc(r)}`);
  r = await req("/admin");
  check("signed-out /admin redirects to /login", [302, 303, 307, 308].includes(r.status) && loc(r).includes("/login"), `${r.status} ${loc(r)}`);
  r = await req("/admin/login");
  check("/admin/login is public", r.status === 200, String(r.status));
  for (const p of ["/login", "/register", "/forgot-password", "/reset-password"]) {
    r = await req(p);
    check(`${p} loads`, r.status === 200, String(r.status));
  }

  // 2. Sign up
  r = await req("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "E2E Tester", email, password }),
  });
  const signUp = await r.json().catch(() => ({}));
  check("sign-up succeeds", r.status === 200 && !!signUp.user, `${r.status} ${JSON.stringify(signUp).slice(0, 120)}`);

  // 3. Session + customer dashboard
  r = await req("/api/auth/get-session");
  const sess = await r.json().catch(() => null);
  check("session is restored from cookies", sess?.user?.email === email, sess?.user?.email ?? "no session");
  r = await req("/account");
  let html = await r.text();
  check("/account renders for the signed-in customer", r.status === 200 && html.includes("E2E"), String(r.status));
  for (const p of ["/account/orders", "/account/profile"]) {
    r = await req(p);
    check(`${p} renders`, r.status === 200, String(r.status));
  }

  // 4. Profile was provisioned with the customer role
  const prof = (await db.query("select id, role, auth_user_id from profiles where email = $1", [email])).rows[0];
  check("profile row created with role 'customer'", prof?.role === "customer", JSON.stringify(prof?.role));
  const cust = (await db.query("select customer_type from customers where profile_id = $1", [prof?.id])).rows[0];
  check("customers row created (retail)", cust?.customer_type === "retail");

  // 5. A customer cannot reach admin
  // The page shell streams first, so the redirect arrives as a meta-refresh / NEXT_REDIRECT in a 200 response.
  const redirectedTo = (t) => (t.match(/http-equiv="refresh" content="\d+;url=([^"]+)"/) ?? [])[1];
  for (const p of ["/admin", "/admin/users", "/admin/audit-logs"]) {
    r = await req(p);
    html = await r.text();
    check(`customer is redirected away from ${p}, with no admin data`, redirectedTo(html) === "/account" && !html.includes("Total products") && !html.includes("Audit logs</h1>") && !html.includes(email + "</p>"), `redirect=${redirectedTo(html)}`);
  }

  // 6. Staff reaches the dashboard but not user management
  await db.query("update profiles set role = 'staff' where id = $1", [prof.id]);
  r = await req("/admin");
  html = await r.text();
  check("staff can open /admin dashboard", r.status === 200 && html.includes("Total products"), String(r.status));
  r = await req("/admin/users");
  html = await r.text();
  check("staff is redirected away from /admin/users", redirectedTo(html) === "/admin" && !html.includes("Only the Owner can grant"), `redirect=${redirectedTo(html)}`);

  // 7. Admin can
  await db.query("update profiles set role = 'admin' where id = $1", [prof.id]);
  r = await req("/admin/users");
  html = await r.text();
  check("admin can open /admin/users", r.status === 200 && html.includes(email), String(r.status));
  r = await req("/admin/audit-logs");
  check("admin can open /admin/audit-logs", r.status === 200, String(r.status));
  await db.query("update profiles set role = 'customer' where id = $1", [prof.id]);

  // 8. Wrong password is rejected
  const saved = cookies;
  cookies = {};
  r = await req("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "wrong-password-1" }),
  });
  const bad = await r.json().catch(() => ({}));
  check("wrong password is rejected", r.status >= 400 && !!bad.message, `${r.status} ${bad.message}`);

  // 9. Sign in with the right password, then sign out
  r = await req("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  check("sign-in with correct password", r.status === 200, String(r.status));
  r = await req("/account");
  check("/account accessible after sign-in", r.status === 200, String(r.status));
  r = await req("/api/auth/sign-out", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
  check("sign-out succeeds", r.status === 200, String(r.status));
  cookies = {};
  r = await req("/account");
  check("after sign-out /account redirects to /login", [302, 303, 307, 308].includes(r.status) && loc(r).includes("/login"), `${r.status} ${loc(r)}`);
  void saved;
} finally {
  // Clean up the test user everywhere
  await db.query("delete from profiles where email = $1", [email]).catch(() => {});
  await db.query('delete from neon_auth."user" where email = $1', [email]).catch((e) => console.log("cleanup note:", e.message));
  const left = await db.query('select (select count(*) from profiles where email = $1) p, (select count(*) from neon_auth."user" where email = $1) u', [email]);
  console.log(`cleanup: profiles left ${left.rows[0].p}, auth users left ${left.rows[0].u}`);
  await db.end();
}

console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
