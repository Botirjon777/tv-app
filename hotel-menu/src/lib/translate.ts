import Anthropic from "@anthropic-ai/sdk";
import { LANGS, LANG_LABEL, type Lang, type I18nText } from "./i18n";

// Auto-translation of menu text via the Claude API.
//
// Admin enters one language; we translate into the others so guests see the
// menu in en / ru / uz. If ANTHROPIC_API_KEY is unset (or the call fails) we
// fall back to copying the source text — the app keeps working, untranslated.
//
// Model defaults to claude-opus-4-8; override with TRANSLATION_MODEL (e.g.
// claude-haiku-4-5) to trade quality for cost/latency.

const MODEL = process.env.TRANSLATION_MODEL || "claude-opus-4-8";

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

export function translationAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

type Fields = Record<string, string>;

// Translate the given fields from `sourceLang` into all supported languages.
// Returns, per field, an I18nText map covering every Lang (source included).
export async function translateFields(
  fields: Fields,
  sourceLang: Lang
): Promise<Record<string, I18nText>> {
  const keys = Object.keys(fields).filter((k) => fields[k]?.trim());

  // Always seed every result with the source text (also the no-key fallback).
  const result: Record<string, I18nText> = {};
  for (const key of Object.keys(fields)) {
    result[key] = {};
    for (const lang of LANGS) result[key][lang] = fields[key] ?? "";
  }

  const targets = LANGS.filter((l) => l !== sourceLang);
  const client = getClient();
  if (!client || keys.length === 0 || targets.length === 0) {
    return result;
  }

  const langList = targets.map((l) => `"${l}" (${LANG_LABEL[l]})`).join(", ");
  const shape = `{ ${keys
    .map((k) => `"${k}": { ${targets.map((l) => `"${l}": "…"`).join(", ")} }`)
    .join(", ")} }`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system:
        "You translate text for a hotel restaurant menu. Translate accurately and naturally into each requested language, keeping the tone concise and appetizing as on a real menu. Preserve meaning; do not add commentary. Keep product/brand names that have no natural translation as-is. Respond with ONLY a JSON object, no markdown fences, no extra text.",
      messages: [
        {
          role: "user",
          content: `Source language: ${LANG_LABEL[sourceLang]}.\nTranslate each field into these languages: ${langList}.\nRespond with exactly this JSON shape:\n${shape}\n\nFields to translate:\n${JSON.stringify(
            Object.fromEntries(keys.map((k) => [k, fields[k]])),
            null,
            2
          )}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    let text = textBlock && "text" in textBlock ? textBlock.text.trim() : "";
    // Strip accidental markdown fences.
    text = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(text) as Record<string, Record<string, string>>;

    for (const key of keys) {
      for (const lang of targets) {
        const value = parsed?.[key]?.[lang];
        if (typeof value === "string" && value.trim()) {
          result[key][lang] = value;
        }
      }
    }
  } catch (err) {
    console.warn("[translate] falling back to source text:", err);
  }

  return result;
}
