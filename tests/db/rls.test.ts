import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import pg from "pg";

// Runs against the real Neon database. Every test happens inside a transaction that is
// rolled back, so no data is left behind.
const client = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });

let alice: string;
let bob: string;
let published: string;
let draft: string;

const owner = () => client.query("reset role");
async function as(role: "app_customer" | "app_staff", userId = "", userRole = "") {
  await client.query("reset role");
  await client.query(`set local role ${role}`);
  await client.query("select set_config('app.user_id', $1, true), set_config('app.user_role', $2, true)", [userId, userRole]);
}
/** Runs a statement expected to fail, without poisoning the surrounding transaction. */
async function failure(sql: string, params: unknown[] = []): Promise<string> {
  await client.query("savepoint s");
  try {
    await client.query(sql, params);
    await client.query("release savepoint s");
    return "";
  } catch (e) {
    await client.query("rollback to savepoint s");
    return (e as Error).message;
  }
}
const one = async <T = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
  (await client.query(sql, params)).rows[0] as T;

beforeAll(async () => {
  await client.connect();
});
afterAll(async () => {
  await client.end();
});

beforeEach(async () => {
  await client.query("begin");
  alice = (await one<{ id: string }>("insert into profiles (email, full_name) values ('alice@test.local','Alice') returning id")).id;
  bob = (await one<{ id: string }>("insert into profiles (email, full_name) values ('bob@test.local','Bob') returning id")).id;

  published = (await one<{ id: string }>(
    "insert into products (sku, slug, name, classification, price_tzs, cost_price_tzs) values ('T-PUB','t-pub','Test Published','aftermarket',10000,6000) returning id",
  )).id;
  await client.query(
    "insert into product_images (product_id, storage_path, url, kind, is_primary, verification_status) values ($1,'t/p.webp','https://example.test/p.webp','own_photo',true,'approved')",
    [published],
  );
  await client.query("update products set status='published' where id=$1", [published]);
  draft = (await one<{ id: string }>(
    "insert into products (sku, slug, name, classification, price_tzs) values ('T-DRAFT','t-draft','Test Draft','aftermarket',5000) returning id",
  )).id;

  for (const [pid, ref] of [[alice, "TEST-A"], [bob, "TEST-B"]] as const) {
    await client.query(
      "insert into orders (reference, profile_id, customer_name, phone, delivery_method, subtotal_tzs, total_tzs) values ($1,$2,'X','+255700000000','pickup',1000,1000)",
      [ref, pid],
    );
  }
});
afterEach(async () => {
  await client.query("rollback");
});

describe("reference data", () => {
  it("seeds 15 categories, 14 vehicle makers and 4 roles", async () => {
    await owner();
    expect(Number((await one("select count(*) c from categories")).c)).toBe(15);
    expect(Number((await one("select count(*) c from manufacturers")).c)).toBe(14);
    expect(Number((await one("select count(*) c from roles")).c)).toBe(4);
  });
});

describe("public catalog access", () => {
  it("visitors see published products only", async () => {
    await as("app_customer");
    const skus = (await client.query("select sku from products order by sku")).rows.map((r) => r.sku);
    expect(skus).toEqual(["T-PUB"]);
  });

  it("visitors cannot read stock quantities, only availability", async () => {
    await as("app_customer");
    expect(await failure("select quantity_on_hand from inventory")).toMatch(/permission denied/);
    expect(await failure("select * from inventory")).toMatch(/permission denied/);
    expect((await one("select product_in_stock($1) as s", [published])).s).toBe(false);
    await owner();
    await client.query("insert into inventory_movements (product_id, quantity_delta, reason) values ($1, 4, 'opening_stock')", [published]);
    await as("app_customer");
    expect((await one("select product_in_stock($1) as s", [published])).s).toBe(true);
    expect((await one("select product_in_stock($1) as s", [draft])).s).toBe(false);
  });

  it("visitors cannot read cost price", async () => {
    await as("app_customer");
    expect(await failure("select cost_price_tzs from products")).toMatch(/permission denied/);
    expect(await failure("select * from products")).toMatch(/permission denied/);
  });

  it("staff can read cost price and drafts", async () => {
    await as("app_staff", alice, "staff");
    const r = await one("select cost_price_tzs from products where sku='T-PUB'");
    expect(Number(r.cost_price_tzs)).toBe(6000);
    expect(Number((await one("select count(*) c from products where sku like 'T-%'")).c)).toBe(2);
  });

  it("unverified compatibility is hidden from customers", async () => {
    await owner();
    const make = (await one<{ id: string }>("select id from manufacturers where slug='toyota'")).id;
    const model = (await one<{ id: string }>("insert into vehicle_models (manufacturer_id,name,slug) values ($1,'TestModel','testmodel') returning id", [make])).id;
    const gen = (await one<{ id: string }>("insert into vehicle_generations (model_id,name,year_from) values ($1,'G1',2010) returning id", [model])).id;
    const veh = (await one<{ id: string }>("insert into vehicles (generation_id) values ($1) returning id", [gen])).id;
    await client.query("insert into vehicle_compatibility (product_id, vehicle_id, verified) values ($1,$2,false)", [published, veh]);
    await as("app_customer");
    expect(Number((await one("select count(*) c from vehicle_compatibility")).c)).toBe(0);
  });
});

describe("customer privacy", () => {
  it("customers see only their own orders", async () => {
    await as("app_customer", alice);
    const refs = (await client.query("select reference from orders")).rows.map((r) => r.reference);
    expect(refs).toEqual(["TEST-A"]);
  });

  it("visitors see no orders", async () => {
    await as("app_customer");
    expect(Number((await one("select count(*) c from orders")).c)).toBe(0);
  });

  it("customers cannot read or edit another profile", async () => {
    await as("app_customer", alice);
    expect((await client.query("select id from profiles")).rows.map((r) => r.id)).toEqual([alice]);
    const upd = await client.query("update profiles set full_name='Hacked' where id=$1", [bob]);
    expect(upd.rowCount).toBe(0);
  });

  it("customers cannot create orders directly or change prices", async () => {
    await as("app_customer", alice);
    expect(await failure("insert into orders (customer_name, phone, delivery_method, subtotal_tzs, total_tzs) values ('X','+255700000000','pickup',1,1)")).toMatch(/permission denied/);
    expect(await failure("update products set price_tzs = 1")).toMatch(/permission denied/);
  });

  it("customers cannot add addresses for someone else", async () => {
    await as("app_customer", alice);
    const msg = await failure(
      "insert into addresses (profile_id, full_name, phone, region, city) values ($1,'B','+255700000000','Dar es Salaam','Ilala')",
      [bob],
    );
    expect(msg).toMatch(/row-level security/);
  });

  it("customers cannot read audit logs, roles or integration settings", async () => {
    await as("app_customer", alice);
    expect(await failure("select * from audit_logs")).toMatch(/permission denied/);
    expect(await failure("select * from roles")).toMatch(/permission denied/);
    expect(await failure("select * from integration_settings")).toMatch(/permission denied/);
  });
});

describe("role assignment", () => {
  it("customers cannot make themselves admin", async () => {
    await as("app_customer", alice);
    expect(await failure("update profiles set role='admin' where id=$1", [alice])).toMatch(/permission denied/);
  });

  it("staff (non-admin) cannot change roles; admin can", async () => {
    await as("app_staff", alice, "staff");
    expect(await failure("update profiles set role='admin' where id=$1", [bob])).toMatch(/Only an admin or owner/);
    await as("app_staff", alice, "admin");
    const r = await client.query("update profiles set role='staff' where id=$1", [bob]);
    expect(r.rowCount).toBe(1);
  });
});

describe("inventory integrity", () => {
  it("quantity cannot be edited directly, only through movements", async () => {
    await owner();
    expect(await failure("update inventory set quantity_on_hand = 50 where product_id=$1", [published])).toMatch(/only change through inventory_movements/);
    await client.query("insert into inventory_movements (product_id, quantity_delta, reason, note) values ($1, 10, 'opening_stock', 'test')", [published]);
    const inv = await one("select quantity_on_hand from inventory where product_id=$1", [published]);
    expect(inv.quantity_on_hand).toBe(10);
    const mv = await one("select quantity_before, quantity_after from inventory_movements where product_id=$1", [published]);
    expect([mv.quantity_before, mv.quantity_after]).toEqual([0, 10]);
  });

  it("stock cannot go negative", async () => {
    await owner();
    await client.query("insert into inventory_movements (product_id, quantity_delta, reason) values ($1, 3, 'opening_stock')", [published]);
    expect(await failure("insert into inventory_movements (product_id, quantity_delta, reason) values ($1, -4, 'sale')", [published])).toMatch(/Insufficient stock/);
  });

  it("movement history is append-only", async () => {
    await owner();
    await client.query("insert into inventory_movements (product_id, quantity_delta, reason) values ($1, 3, 'opening_stock')", [published]);
    expect(await failure("update inventory_movements set quantity_delta = 99")).toMatch(/append-only/);
    expect(await failure("delete from inventory_movements")).toMatch(/append-only/);
  });

  it("staff record stock through movements but cannot edit quantity", async () => {
    await as("app_staff", alice, "staff");
    await client.query("insert into inventory_movements (product_id, quantity_delta, reason, created_by) values ($1, 7, 'purchase', $2)", [published, alice]);
    expect((await one("select quantity_on_hand q from inventory where product_id=$1", [published])).q).toBe(7);
    expect(await failure("update inventory set quantity_on_hand = 1 where product_id=$1", [published])).toMatch(/permission denied/);
  });
});

describe("product photography rules", () => {
  it("cannot publish without an approved real photo", async () => {
    await owner();
    expect(await failure("update products set status='published' where id=$1", [draft])).toMatch(/IMAGE REQUIRED/);
  });

  it("an illustrative image can never be approved", async () => {
    await owner();
    const msg = await failure(
      "insert into product_images (product_id, storage_path, url, kind, verification_status) values ($1,'x','https://example.test/x','illustrative','approved')",
      [draft],
    );
    expect(msg).toMatch(/illustrative_never_approved/);
  });

  it("rejecting the last approved photo demotes a published product", async () => {
    await owner();
    await client.query("update product_images set verification_status='rejected' where product_id=$1", [published]);
    expect((await one("select status from products where id=$1", [published])).status).toBe("image_required");
  });

  it("publishes once a real approved photo exists", async () => {
    await owner();
    await client.query(
      "insert into product_images (product_id, storage_path, url, kind, verification_status) values ($1,'d','https://example.test/d','manufacturer_photo','approved')",
      [draft],
    );
    await client.query("update products set status='published' where id=$1", [draft]);
    const r = await one("select status, published_at from products where id=$1", [draft]);
    expect(r.status).toBe("published");
    expect(r.published_at).not.toBeNull();
  });
});

describe("orders and payments", () => {
  it("order totals must add up", async () => {
    await owner();
    expect(await failure("insert into orders (customer_name, phone, delivery_method, subtotal_tzs, delivery_fee_tzs, total_tzs) values ('X','+255700000000','pickup',1000,500,1000)")).toMatch(/check constraint/);
  });

  it("phone numbers must be +255 format", async () => {
    await owner();
    expect(await failure("insert into orders (customer_name, phone, delivery_method, subtotal_tzs, total_tzs) values ('X','0700000000','pickup',1,1)")).toMatch(/check constraint/);
  });

  it("status changes are recorded in order history", async () => {
    await as("app_staff", alice, "staff");
    await client.query("update orders set status='confirmed' where reference='TEST-A'");
    const rows = (await client.query("select from_status, to_status from order_status_history h join orders o on o.id=h.order_id where o.reference='TEST-A' order by h.id")).rows;
    expect(rows).toEqual([
      { from_status: null, to_status: "pending" },
      { from_status: "pending", to_status: "confirmed" },
    ]);
  });

  it("a payment cannot be 'paid' without verification", async () => {
    await owner();
    const o = (await one<{ id: string }>("select id from orders where reference='TEST-A'")).id;
    expect(await failure("insert into payments (order_id, provider, amount_tzs, status) values ($1,'manual',1000,'paid')", [o])).toMatch(/check constraint/);
    await client.query("insert into payments (order_id, provider, amount_tzs, status, verified_at) values ($1,'manual',1000,'paid', now())", [o]);
  });

  it("customers can read their own payments only", async () => {
    await owner();
    for (const ref of ["TEST-A", "TEST-B"]) {
      const o = (await one<{ id: string }>("select id from orders where reference=$1", [ref])).id;
      await client.query("insert into payments (order_id, provider, amount_tzs) values ($1,'manual',1000)", [o]);
    }
    await as("app_customer", alice);
    expect(Number((await one("select count(*) c from payments")).c)).toBe(1);
  });
});

describe("audit log", () => {
  it("staff can append but not alter", async () => {
    await as("app_staff", alice, "admin");
    await client.query("insert into audit_logs (actor_id, actor_role, action, entity_type) values ($1,'admin','test','product')", [alice]);
    expect(await failure("update audit_logs set action='x'")).toMatch(/permission denied/);
    await owner();
    expect(await failure("delete from audit_logs")).toMatch(/append-only/);
  });
});

describe("part numbers", () => {
  it("normalizes and de-duplicates part numbers per product", async () => {
    await owner();
    await client.query("insert into oem_part_numbers (product_id, part_number, is_primary) values ($1,'04465-0K240',true)", [published]);
    const n = await one("select normalized from oem_part_numbers where product_id=$1", [published]);
    expect(n.normalized).toBe("044650K240");
    expect(await failure("insert into oem_part_numbers (product_id, part_number) values ($1,'04465 0k240')", [published])).toMatch(/unique/);
    const found = await client.query("select 1 from oem_part_numbers where product_id = $1 and normalized like $2", [published, "04465%"]);
    expect(found.rowCount).toBe(1);
  });
});
