"use server";

import { headers } from "next/headers";
import { publicProducts } from "@/lib/catalog/public";
import { vehicleBrands } from "@/lib/categories";
import { site, showPrices } from "@/lib/site";
import { geminiReply, type AiTurn } from "@/lib/assistant-ai";

export type AssistantItem = { name: string; slug: string; sku: string; partNumber: string | null; priceTzs: number; imageUrl: string | null };
/** `order`: the customer sounds ready to buy. `handoff`: we have nothing to show, so a person should take over on WhatsApp. */
export type AssistantReply = { text: string; items: AssistantItem[]; vehicle: string | null; part: string | null; order: boolean; handoff: boolean };

const STOP = new Set(
  ("a an the for my your me i we you is are do does have has any need needs want wants looking look find show get buy price prices cost how much " +
    "what which of to on in at and or please pls hi hello part parts spare spares car cars gari sehemu kipuri vipuri nataka ninataka ninahitaji naomba " +
    "bei ya za gani kiasi ngapi una mna mnauza mnayo kwa na la wa cha vya ina iko ipo kuna naulizia order nunua nunue agiza kuagiza nitachukua chukua").split(" "),
);

const BUY = /\b(order|buy|purchase|take it|i will take|checkout|pay|nunua|nunue|nataka kununua|agiza|kuagiza|nitachukua|chukua|lipa)\b/i;

/**
 * Answers a customer's question from the real catalogue only: names, part numbers and prices come from the database.
 * It never guesses fitment: for a vehicle it shows parts by name and says the team confirms fitment with the chassis number.
 */
export async function askAssistant(raw: string, history: AiTurn[] = [], lang: "en" | "sw" = "en"): Promise<AssistantReply> {
  const tr = (en: string, sw: string) => (lang === "sw" ? sw : en);
  const message = String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, 200);
  const base = { items: [] as AssistantItem[], vehicle: null as string | null, part: null as string | null, order: false, handoff: false };
  if (!message) return { text: tr("Type a part name, a part number, or your car and the part you need.", "Andika jina la kipuri, namba ya kipuri, au gari lako na kipuri unachohitaji."), ...base };

  const lower = message.toLowerCase();
  if (/^(hi|hello|hey|mambo|habari|hujambo|salaam|salama|niaje|vipi)\b[\s!.?]*$/.test(lower)) {
    return { text: tr("Hello! Tell me the part you need (for example \"brake pad\", \"shock absorber\" or a part number) and your car if you like.", "Habari! Niambie kipuri unachohitaji (kwa mfano \"brake pad\", \"shock absorber\" au namba ya kipuri) na gari lako ukipenda."), ...base };
  }
  if (/^(thanks|thank you|asante|shukrani)\b/.test(lower)) return { text: tr("You are welcome. Add the parts you want to your order and finish on WhatsApp whenever you are ready.", "Karibu. Weka vipuri unavyotaka kwenye oda yako, kisha ukamilishe kwa WhatsApp ukiwa tayari."), ...base };
  if (/\b(deliver|delivery|usafirish|peleka|leta|shipping)\b/.test(lower)) {
    return { text: tr("We deliver, or you can collect from the shop in Kariakoo. The delivery fee depends on where you are and is confirmed with you on WhatsApp when you order.", "Tunafikisha, au unaweza kuchukua dukani Kariakoo. Gharama ya usafirishaji inategemea ulipo na tunakuthibitishia kwenye WhatsApp unapoagiza."), ...base };
  }
  if (/\b(where|location|address|wapi|mahali|kariakoo|duka liko)\b/.test(lower)) {
    return { text: tr(`${site.name} is in ${site.location}. Call ${site.phones.join(" or ")}.`, `${site.name} tuko ${site.location}. Piga ${site.phones.join(" au ")}.`), ...base };
  }

  const make = vehicleBrands.find((b) => new RegExp(`\\b${b.replace(/[-]/g, "[- ]")}\\b`, "i").test(message)) ?? null;
  const year = message.match(/\b(19[89]\d|20[0-3]\d)\b/)?.[1] ?? null;
  const vehicle = make ? `${make}${year ? ` ${year}` : ""}` : year;
  const order = BUY.test(message);

  const words = lower
    .replace(/[^a-z0-9À-ɏ\-/ .]/g, " ")
    .split(" ")
    .filter((w) => w && !STOP.has(w) && !(make && make.toLowerCase().split(/[- ]/).includes(w)) && w !== year);
  const part = words.join(" ").trim();
  if (!part) {
    return {
      text: order
        ? tr("Great. Press \"Add to order\" on the parts you want, then tap \"Finish on WhatsApp\". Or tell me which part you need.", "Vizuri. Bonyeza \"Weka kwenye oda\" kwenye vipuri unavyotaka, kisha \"Maliza kwa WhatsApp\". Au niambie kipuri unachohitaji.")
        : tr("Which part do you need? Type its name (for example \"clutch plate\") or its part number.", "Unahitaji kipuri gani? Andika jina lake (kwa mfano \"clutch plate\") au namba yake."),
      items: [], vehicle, part: null, order, handoff: false,
    };
  }

  const { items, total } = await publicProducts({ q: part, sort: "relevance", pageSize: 5 });
  const found: AssistantItem[] = items.map((p) => ({
    name: p.name, slug: p.slug, sku: p.sku, partNumber: p.partNumber, priceTzs: p.priceTzs, imageUrl: p.imageUrl,
  }));

  const lines: string[] = [];
  if (found.length) {
    lines.push(
      lang === "sw"
        ? `Nimepata bidhaa ${total} za "${part}". ${found.length === 1 ? "Hii ni moja" : `Hizi ni ${found.length} za kwanza`}:`
        : `I found ${total} item${total === 1 ? "" : "s"} for "${part}". Here ${found.length === 1 ? "is" : "are the first"} ${found.length}:`,
    );
  } else {
    lines.push(tr(`I could not find "${part}" in our catalogue. A person on WhatsApp can check for you: send the name, a photo or your chassis number.`, `Sijapata "${part}" kwenye orodha yetu. Mtu wa WhatsApp anaweza kukusaidia: tuma jina, picha au chassis number yako.`));
  }
  if (vehicle) {
    lines.push(tr(`For your ${vehicle}: I can only show parts by name here. Our team confirms the part fits your exact vehicle, using your chassis number, before you order.`, `Kwa ${vehicle} yako: naweza kukuonyesha vipuri kwa jina tu hapa. Timu yetu inathibitisha kipuri kinafaa gari lako kwa chassis number kabla ya kuagiza.`));
  }
  if (order && found.length) lines.push(tr("Press \"Add to order\" on the parts you want, then \"Finish on WhatsApp\".", "Bonyeza \"Weka kwenye oda\" kwenye vipuri unavyotaka, kisha \"Maliza kwa WhatsApp\"."));

  // With a GEMINI_API_KEY the answer is phrased by the model from these same matches; otherwise (or on any problem) the plain reply is used.
  const visitor = ((await headers()).get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  const ai = await geminiReply({
    visitor,
    message,
    history: (Array.isArray(history) ? history : []).slice(-6).map((t) => ({
      role: t.role === "assistant" ? ("assistant" as const) : ("user" as const),
      text: String(t.text ?? "").slice(0, 400),
    })),
    products: found.map((p) => ({ name: p.name, partNumber: p.partNumber, priceTzs: showPrices ? p.priceTzs : 0, sku: p.sku })),
    vehicle,
    knownNumbers: site.phones,
  });
  return { text: ai ?? lines.join("\n\n"), items: found, vehicle, part, order, handoff: found.length === 0 };
}
