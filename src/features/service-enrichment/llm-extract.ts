import type { ExtractedServiceDraft } from "./extract-from-text";
import { taxonomyForPrimaryService } from "./category-taxonomies";

type LlmServiceItem = {
  name?: string;
  category?: string;
};

/**
 * Optional LLM refine. Uses OPENAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY.
 * Returns [] when no key is configured.
 */
export async function extractServicesWithLlm(
  text: string,
  primaryService?: string | null,
): Promise<ExtractedServiceDraft[]> {
  const clipped = text.replace(/\s+/g, " ").trim().slice(0, 6000);
  if (!clipped) return [];

  const taxonomy = taxonomyForPrimaryService(primaryService);
  const allowed = taxonomy.map((t) => t.name);
  const prompt = `Extract beauty services offered by this business.
Only return services from this exact list: ${allowed.join(", ")}.
Return JSON array of {"name":"...","category":"..."}.
If unsure, return [].

Business text:
${clipped}`;

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();

  let raw = "";
  if (openaiKey) {
    raw = await callOpenAi(openaiKey, prompt);
  } else if (geminiKey) {
    raw = await callGemini(geminiKey, prompt);
  } else {
    return [];
  }

  return parseLlmServices(raw, primaryService);
}

async function callOpenAi(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Respond with JSON object {"services":[{"name":"...","category":"..."}]}',
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error(`OpenAI failed (${response.status})`);
  }
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return payload.choices?.[0]?.message?.content ?? "";
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const model =
    process.env.GOOGLE_GENERATIVE_MODEL?.trim() || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`Gemini failed (${response.status})`);
  }
  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

function parseLlmServices(
  raw: string,
  primaryService?: string | null,
): ExtractedServiceDraft[] {
  if (!raw.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const items: LlmServiceItem[] = Array.isArray(parsed)
    ? (parsed as LlmServiceItem[])
    : Array.isArray((parsed as { services?: unknown }).services)
      ? ((parsed as { services: LlmServiceItem[] }).services)
      : [];

  const byName = new Map(
    taxonomyForPrimaryService(primaryService).map((t) => [
      t.name.toLowerCase(),
      t,
    ]),
  );
  const out: ExtractedServiceDraft[] = [];
  for (const item of items) {
    const name = item.name?.trim();
    if (!name) continue;
    const template = byName.get(name.toLowerCase());
    if (!template) continue;
    out.push({
      category: template.category,
      name: template.name,
      durationMinutes: template.durationMinutes,
      priceFrom: template.priceFrom,
      matchedKeywords: ["llm"],
    });
  }
  return out;
}
