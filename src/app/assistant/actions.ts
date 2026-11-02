"use server";

import { publicProducts } from "@/lib/catalog/public";
import { vehicleBrands } from "@/lib/categories";
import { headers } from "next/headers";
import { site } from "@/lib/site";
import { geminiReply, type AiTurn } from "@/lib/assistant-ai";

export type AssistantItem = { name: string; slug: string; sku: string; partNumber: string | null; priceTzs: number; imageUrl: string | null };
export type AssistantReply = { text: string; items: AssistantItem[]; vehicle: string | null; part: string | null };

const STOP = new Set(
  ("a an the for my your me i we you is are do does have has any need needs want wants looking look find show get buy price prices cost how much " +
    "what which of to on in at and or please pls hi hello part parts spare spares car cars gari sehemu kipuri vipuri nataka ninataka ninahitaji naomba " +
    "bei ya za gani kiasi ngapi una mna mnauza mnayo kwa na la wa cha vya ina iko ipo kuna naulizia").split(" "),
);

/**
 * Answers a customer's question from the real catalogue only: names, part numbers and prices come from the database.
 * It never guesses fitment: for a vehicle it shows parts by name and says the team confirms fitment with the chassis number.
 */
export async function askAssistant(raw: string, history: AiTurn[] = []): Promise<AssistantReply> {
  const message = String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, 200);
  const empty = { items: [], vehicle: null, part: null };
  if (!message) return { text: "Type a part name, a part number, or your car and the part you need.", ...empty };

  const lower = message.toLowerCase();
  if (/^(hi|hello|hey|mambo|habari|hujambo|salaam|salama|niaje|vipi)\b[\s!.?]*$/.test(lower)) {
    return { text: "Hello! Tell me the part you need (for example \"brake pad\", \"shock absorber\" or a part number) and your car if you like.", ...empty };
  }
  if (/^(thanks|thank you|asante|shukrani)\b/.test(lower)) return { text: "You are welcome. Send us a message on WhatsApp whenever you are ready to order.", ...empty };
  if (/\b(deliver|delivery|usafirish|peleka|leta|shipping)\b/.test(lower)) {
    return { text: "We deliver, or you can collect from the shop in Kariakoo. The delivery fee depends on where you are and is confirmed with you on WhatsApp when you order.", ...empty };
  }
  if (/\b(where|location|address|wapi|mahali|kariakoo|duka liko)\b/.test(lower)) {
    return { text: `${site.name} is in ${site.location}. Call or WhatsApp ${site.phones.join(" or ")}.`, ...empty };
  }

  const make = vehicleBrands.find((b) => new RegExp(`\\b${b.replace(/[-]/g, "[- ]")}\\b`, "i").test(message)) ?? null;
  const year = message.match(/\b(19[89]\d|20[0-3]\d)\b/)?.[1] ?? null;
  const vehicle = make ? `${make}${year ? ` ${year}` : ""}` : year;

  const words = lower
    .replace(/[^a-z0-9À-ɏ\-/ .]/g, " ")
    .split(" ")
    .filter((w) => w && !STOP.has(w) && !(make && make.toLowerCase().split(/[- ]/).includes(w)) && w !== year);
  const part = words.join(" ").trim();
  if (!part) {
    return { text: "Which part do you need? Type its name (for example \"clutch plate\") or its part number.", items: [], vehicle, part: null };
  }

  const { items, total } = await publicProducts({ q: part, sort: "relevance", pageSize: 5 });
  const found: AssistantItem[] = items.map((p) => ({
    name: p.name, slug: p.slug, sku: p.sku, partNumber: p.partNumber, priceTzs: p.priceTzs, imageUrl: p.imageUrl,
  }));

  const lines: string[] = [];
  if (found.length) {
    lines.push(`I found ${total} item${total === 1 ? "" : "s"} for "${part}". Here ${found.length === 1 ? "is" : "are the first"} ${found.length}:`);
  } else {
    lines.push(`I could not find "${part}" in our catalogue. Send us the name, number or a photo on WhatsApp and we will check for you.`);
  }
  if (vehicle) {
    lines.push(`For your ${vehicle}: I can only show parts by name here. Our team confirms the part fits your exact vehicle, using your chassis number, before you order.`);
  }
  // With a GEMINI_API_KEY the answer is phrased by the model from these same matches; otherwise (or on any problem) the plain reply is used.
  const visitor = ((await headers()).get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  const ai = await geminiReply({
    visitor,
    message,
    history: (Array.isArray(history) ? history : []).slice(-6).map((t) => ({
      role: t.role === "assistant" ? ("assistant" as const) : ("user" as const),
      text: String(t.text ?? "").slice(0, 400),
    })),
    products: found.map((p) => ({ name: p.name, partNumber: p.partNumber, priceTzs: p.priceTzs, sku: p.sku })),
    vehicle,
    knownNumbers: site.phones,
  });
  return { text: ai ?? lines.join("\n\n"), items: found, vehicle, part };
}
