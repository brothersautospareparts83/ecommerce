import ExcelJS from "exceljs";

/**
 * Reads the owner's stock spreadsheet(s) and turns messy rows into clean product drafts.
 * Pure functions (no database): the same code is used by the command-line importer, the
 * admin upload screen and the tests. Nothing here invents data: anything missing, unclear or
 * suspicious is reported as a warning for the owner to review.
 */

export interface RawRow {
  sheet: string;
  rowNumber: number;
  description: string;
  partRaw: string;
  qty: number | null;
  qtyRaw: unknown;
  buyPrice: number | null;
  sellPrice: number | null;
  category: string;
  compat: string;
  store: string;
}

export interface SheetInfo {
  name: string;
  headerRow: number | null;
  columns: Record<string, string>;
  assumptions: string[];
  rowsRead: number;
}

export interface Warning {
  code: string;
  message: string;
}

export interface ProductDraft {
  key: string;
  name: string;
  partNumber: string | null;
  supplierReference: string | null;
  notes: string[];
  categorySlug: string | null;
  categoryRaw: string;
  sellPriceTzs: number;
  buyPriceTzs: number | null;
  sources: { sheet: string; rowNumber: number; store: string; qty: number }[];
  warnings: Warning[];
}

// ---------------------------------------------------------------- reading

const SYNONYMS: Record<string, RegExp[]> = {
  description: [/^description\.?$/i, /^item/i, /^product/i, /^maelezo/i, /^jina/i],
  part: [/^part\s*(no|id|number)\.?$/i, /^part$/i, /^oem/i],
  qty: [/^bal\.?$/i, /^qty\.?$/i, /^quantity$/i, /^idadi$/i],
  // "PRICE RMB" is treated as a BUYING price: on the owner's file its values match the buying prices of
  // the same parts on the other sheet and are far below their selling prices (see PROJECT_STATUS.md).
  buy: [/^b\/?price$/i, /^buying/i, /^cost/i, /^bei\s*ya\s*kununua/i, /^price\s*rmb$/i],
  sell: [/^s\/?price$/i, /^selling/i, /^price$/i, /^bei$/i],
  category: [/^category$/i, /^aina$/i],
  compat: [/^vehicle\s*compat/i, /^compat/i, /^gari$/i],
  store: [/^store\s*name$/i, /^store$/i],
};

function cellValue(v: ExcelJS.CellValue): unknown {
  if (v == null) return null;
  if (typeof v === "object") {
    const o = v as unknown as Record<string, unknown>;
    if ("error" in o) return null;
    if ("result" in o) return o.result ?? null;
    if ("richText" in o) return (o.richText as { text: string }[]).map((t) => t.text).join("");
    if ("text" in o) return o.text;
    if ("sharedFormula" in o || "formula" in o) return null;
    if (v instanceof Date) return v;
  }
  return v;
}

const text = (v: unknown) => (v == null ? "" : String(v).replace(/\s+/g, " ").trim());

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/[,\s]/g, "").replace(/^TSh/i, "");
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

export async function readWorkbook(path: string): Promise<{ sheets: SheetInfo[]; rows: RawRow[] }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const sheets: SheetInfo[] = [];
  const rows: RawRow[] = [];

  for (const ws of wb.worksheets) {
    const info: SheetInfo = { name: ws.name, headerRow: null, columns: {}, assumptions: [], rowsRead: 0 };
    sheets.push(info);

    // Find the header row: a row that has a DESCRIPTION cell and a PART cell.
    let header: Record<string, number> | null = null;
    const labels: Record<number, string> = {};
    for (let r = 1; r <= Math.min(ws.rowCount, 25) && !header; r++) {
      const cells = ws.getRow(r).values as ExcelJS.CellValue[];
      const texts = cells.map((c) => text(cellValue(c)));
      const hasDesc = texts.some((t) => SYNONYMS.description.some((re) => re.test(t)));
      const hasPart = texts.some((t) => SYNONYMS.part.some((re) => re.test(t)));
      if (!(hasDesc && hasPart)) continue;
      const map: Record<string, number> = {};
      for (const [field, res] of Object.entries(SYNONYMS)) {
        const col = texts.findIndex((t, i) => i > 0 && res.some((re) => re.test(t)));
        if (col > 0) {
          map[field] = col;
          info.columns[field] = `"${texts[col]}" (column ${col})`;
        }
      }
      header = map;
      info.headerRow = r;
      texts.forEach((t, i) => (labels[i] = t));
    }
    if (!header || !header.description) {
      info.assumptions.push("No recognisable header row (needs DESCRIPTION and PART columns): sheet skipped.");
      continue;
    }
    if (header.buy && /rmb/i.test(labels[header.buy])) {
      info.assumptions.push(
        `The price column is headed "${labels[header.buy]}". Its values match the BUYING prices of the same parts on the other sheet, so it is read as the buying price (admin-only). Owner must confirm.`,
      );
    }
    if (!header.sell) info.assumptions.push("No selling-price column: parts found only on this sheet have NO selling price until the owner sets one.");
    if (!header.category) info.assumptions.push("No category column: products are uncategorised for this sheet.");

    for (let r = (info.headerRow ?? 0) + 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const get = (field: string) => (header![field] ? cellValue(row.getCell(header![field]).value) : null);
      const description = text(get("description"));
      const partRaw = text(get("part"));
      const qtyRaw = get("qty");
      const buy = num(get("buy"));
      const sell = num(get("sell"));
      // Skip blank rows and total/sub-total lines.
      if (!description && !partRaw && qtyRaw == null && buy == null && sell == null) continue;
      if (/^(grand\s*)?total/i.test(description) || /^(grand\s*)?total/i.test(partRaw)) continue;
      info.rowsRead++;
      rows.push({
        sheet: ws.name,
        rowNumber: r,
        description,
        partRaw,
        qty: num(qtyRaw),
        qtyRaw,
        buyPrice: buy,
        sellPrice: sell,
        category: text(get("category")),
        compat: text(get("compat")),
        store: text(get("store")) || ws.name,
      });
    }
  }
  return { sheets, rows };
}

// ---------------------------------------------------------------- cleaning

const ACRONYMS = new Set([
  "ABS", "CV", "LH", "RH", "RR", "RL", "FR", "FL", "LF", "RF", "LR", "EGR", "ECU", "LED", "AC", "HID", "PTO",
  "VVT", "TPMS", "PCV", "DPF", "SRS", "4WD", "2WD", "4X4", "GWM", "BMW", "VW", "MG", "OEM", "LCD", "USB",
]);
const FIXES: Record<string, string> = { shockabsorber: "Shock Absorber", absorber: "Absorber" };

export function titleCase(input: string): string {
  return input
    .toLowerCase()
    .replace(/[a-z0-9]+/g, (w) => FIXES[w] ?? (ACRONYMS.has(w.toUpperCase()) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .replace(/\s+/g, " ")
    .trim();
}

export const normalizeKey = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Spreadsheet category words -> our category slugs. Anything not listed is reported, never guessed. */
export const CATEGORY_MAP: Record<string, string> = {
  "body parts": "body-parts",
  "engine parts": "engine-components",
  engine: "engine-components",
  "brake system": "brake-systems",
  "brake systems": "brake-systems",
  brakes: "brake-systems",
  suspension: "suspension-steering",
  "suspension and steering": "suspension-steering",
  "suspension & steering": "suspension-steering",
  steering: "suspension-steering",
  electrical: "electrical-components",
  "electrical parts": "electrical-components",
  "cooling system": "cooling-systems",
  cooling: "cooling-systems",
  transmission: "transmission-components",
  "transmission parts": "transmission-components",
  gearbox: "transmission-components",
  lighting: "lighting-systems",
  lights: "lighting-systems",
  filters: "oil-filters",
  "oil filters": "oil-filters",
  "air filters": "air-filters",
  fuel: "fuel-systems",
  "fuel system": "fuel-systems",
  bearings: "bearings-seals",
  seals: "bearings-seals",
  belts: "belts-hoses",
  hoses: "belts-hoses",
  interior: "interior-accessories",
  exterior: "exterior-accessories",
  accessories: "exterior-accessories",
};

export function splitPartReference(raw: string): { partNumber: string | null; supplierReference: string | null; note: string | null } {
  const [head, ...rest] = raw.split("=");
  const note = rest.join("=").replace(/\s+/g, " ").trim() || null;
  const candidate = head.replace(/\s+/g, " ").trim();
  const digits = (candidate.match(/\d/g) ?? []).length;
  // A real part number has a run of digits; words like "FOTON" or "BIG/SMALL" are notes, not numbers.
  if (digits >= 5) return { partNumber: candidate.toUpperCase(), supplierReference: null, note };
  return { partNumber: null, supplierReference: raw.trim() || null, note: null };
}

export function buildDrafts(rows: RawRow[]): { drafts: ProductDraft[]; rejected: { row: RawRow; reason: string }[] } {
  const rejected: { row: RawRow; reason: string }[] = [];
  const byKey = new Map<string, ProductDraft>();

  for (const row of rows) {
    if (!row.description) {
      rejected.push({ row, reason: "No description" });
      continue;
    }
    const name = titleCase(row.description.replace(/[.\s]+$/g, ""));
    const { partNumber, supplierReference, note } = splitPartReference(row.partRaw);
    const key = `${normalizeKey(partNumber ?? row.partRaw)}|${normalizeKey(name)}`;
    const warnings: Warning[] = [];

    let qty = 0;
    if (row.qty == null) {
      if (row.qtyRaw != null && row.qtyRaw !== "") warnings.push({ code: "qty_unreadable", message: `Quantity "${String(row.qtyRaw)}" is not a number; stock left at 0` });
    } else if (row.qty < 0 || !Number.isInteger(row.qty)) {
      warnings.push({ code: "qty_invalid", message: `Quantity ${row.qty} is negative or not a whole number; stock left at 0` });
    } else qty = row.qty;

    const catRaw = row.category;
    const categorySlug = catRaw ? CATEGORY_MAP[catRaw.toLowerCase()] ?? null : null;
    if (catRaw && !categorySlug) warnings.push({ code: "category_unmapped", message: `Category "${catRaw}" has no matching category` });
    if (!catRaw) warnings.push({ code: "category_missing", message: "No category given" });

    const sell = row.sellPrice != null && row.sellPrice > 0 ? Math.round(row.sellPrice) : 0;
    if (!sell) warnings.push({ code: "price_missing", message: "No selling price" });
    const buy = row.buyPrice != null && row.buyPrice > 0 ? Math.round(row.buyPrice) : null;
    if (buy && sell && buy > sell) warnings.push({ code: "buy_above_sell", message: `Buying price ${buy} is higher than selling price ${sell}` });
    if (!partNumber) warnings.push({ code: "no_part_number", message: supplierReference ? `No usable part number (reference "${supplierReference}")` : "No part number" });

    const notes = [note, row.compat && `Supplier note (not verified): ${row.compat}`].filter(Boolean) as string[];
    const source = { sheet: row.sheet, rowNumber: row.rowNumber, store: row.store, qty };

    const existing = byKey.get(key);
    if (existing) {
      existing.sources.push(source);
      existing.warnings.push({ code: "duplicate_merged", message: `Also listed at ${row.sheet} row ${row.rowNumber}; quantities added together` });
      if (sell && existing.sellPriceTzs && sell !== existing.sellPriceTzs) existing.warnings.push({ code: "price_conflict", message: `Selling price differs (${existing.sellPriceTzs} vs ${sell} at ${row.sheet} row ${row.rowNumber}); first kept` });
      if (buy && existing.buyPriceTzs && buy !== existing.buyPriceTzs) existing.warnings.push({ code: "cost_conflict", message: `Buying price differs (${existing.buyPriceTzs} vs ${buy} at ${row.sheet} row ${row.rowNumber}); first kept` });
      if (!existing.sellPriceTzs && sell) existing.sellPriceTzs = sell;
      if (!existing.buyPriceTzs && buy) existing.buyPriceTzs = buy;
      for (const n of notes) if (!existing.notes.includes(n)) existing.notes.push(n);
      continue;
    }
    byKey.set(key, {
      key,
      name,
      partNumber,
      supplierReference,
      notes,
      categorySlug,
      categoryRaw: catRaw,
      sellPriceTzs: sell,
      buyPriceTzs: buy,
      sources: [source],
      warnings,
    });
  }
  return { drafts: [...byKey.values()], rejected };
}

export function describeDraft(d: ProductDraft): string | null {
  const parts: string[] = [];
  if (d.supplierReference) parts.push(`Supplier reference: ${d.supplierReference}`);
  for (const n of d.notes) parts.push(n.startsWith("Supplier note") ? n : `Listing note: ${n}`);
  return parts.length ? parts.join(". ") : null;
}
