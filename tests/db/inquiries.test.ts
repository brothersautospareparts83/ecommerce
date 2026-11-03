import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import pg from "pg";

// Runs against the real database inside a transaction that is rolled back after every test (nothing is kept).
const client = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
beforeAll(() => client.connect());
afterAll(() => client.end());
beforeEach(() => client.query("begin"));
afterEach(() => client.query("rollback"));

const failure = async (sql: string, params: unknown[] = []) => {
  await client.query("savepoint s");
  try {
    await client.query(sql, params);
    return null;
  } catch (e) {
    return (e as Error).message;
  } finally {
    await client.query("rollback to savepoint s");
  }
};

describe("contact inquiries", () => {
  it("a visitor can submit through submit_inquiry but cannot read inquiries back", async () => {
    await client.query("set local role app_customer");
    const r = await client.query("select submit_inquiry($1, $2, $3, $4) as id", ["Test Visitor", "+255712345678", null, "Do you have brake pads?"]);
    expect(r.rows[0].id).toMatch(/^[0-9a-f-]{36}$/);
    expect(await failure("select * from inquiries")).toMatch(/permission denied/);
    expect(await failure("insert into inquiries (name, phone, message) values ('x', '+255712345678', 'hello there')")).toMatch(/permission denied/);
  });

  it("rejects a bad phone, a missing name and a too-short message", async () => {
    await client.query("set local role app_customer");
    expect(await failure("select submit_inquiry('Test', '0712', null, 'long enough message')")).toMatch(/INVALID PHONE/);
    expect(await failure("select submit_inquiry('', '+255712345678', null, 'long enough message')")).toMatch(/NAME REQUIRED/);
    expect(await failure("select submit_inquiry('Test', '+255712345678', null, 'hi')")).toMatch(/MESSAGE REQUIRED/);
  });

  it("staff can read and mark inquiries handled", async () => {
    await client.query("set local role app_customer");
    await client.query("select submit_inquiry('Test Visitor', '+255712345678', null, 'Do you have brake pads?')");
    await client.query("reset role");
    await client.query("set local role app_staff");
    const rows = (await client.query("select status from inquiries where name = 'Test Visitor'")).rows;
    expect(rows.length).toBeGreaterThan(0);
    await client.query("update inquiries set status = 'handled' where name = 'Test Visitor'");
    expect((await client.query("select count(*)::int n from inquiries where name = 'Test Visitor' and status = 'handled'")).rows[0].n).toBe(1);
  });
});
