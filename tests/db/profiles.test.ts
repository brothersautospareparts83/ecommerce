import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
beforeAll(() => client.connect());
afterAll(() => client.end());
beforeEach(() => client.query("begin"));
afterEach(() => client.query("rollback"));

async function asCustomer() {
  await client.query("reset role");
  await client.query("set local role app_customer");
}

describe("ensure_profile (first-login provisioning)", () => {
  it("creates a customer profile and a retail customer row", async () => {
    await asCustomer();
    const { rows } = await client.query("select * from ensure_profile('auth-1', 'new@test.local', ' New  Person ')");
    expect(rows[0].role).toBe("customer");
    expect(rows[0].email).toBe("new@test.local");
    expect(rows[0].full_name).toBe("New  Person");
    await client.query("reset role");
    const c = await client.query("select customer_type from customers where profile_id = $1", [rows[0].id]);
    expect(c.rows[0].customer_type).toBe("retail");
  });

  it("is idempotent: the same auth user always gets the same profile", async () => {
    await asCustomer();
    const a = await client.query("select id from ensure_profile('auth-2', 'two@test.local', 'Two')");
    const b = await client.query("select id from ensure_profile('auth-2', 'two@test.local', 'Two')");
    expect(a.rows[0].id).toBe(b.rows[0].id);
  });

  it("links an admin-created profile with the same email and keeps its role", async () => {
    await client.query("insert into profiles (email, full_name, role) values ('garage@test.local', 'Garage', 'staff')");
    await asCustomer();
    const { rows } = await client.query("select * from ensure_profile('auth-3', 'garage@test.local', 'Garage Owner')");
    expect(rows[0].auth_user_id).toBe("auth-3");
    expect(rows[0].role).toBe("staff");
  });

  it("never lets a login take over a profile already linked to someone else", async () => {
    await client.query("insert into profiles (auth_user_id, email, role) values ('auth-owner', 'boss@test.local', 'owner')");
    await asCustomer();
    // A different auth user claiming the same email must not inherit the owner profile.
    await expect(client.query("select * from ensure_profile('auth-attacker', 'boss@test.local', 'X')")).rejects.toThrow(/unique|duplicate/);
  });

  it("rejects an empty auth user id", async () => {
    await asCustomer();
    await expect(client.query("select * from ensure_profile('', 'a@b.c', 'A')")).rejects.toThrow(/auth user id required/);
  });
});
