/**
 * Gemini (Google Generative Language API) client — REST via fetch, no SDK.
 * Configured with GEMINI_API_KEY (free tier from https://aistudio.google.com/apikey).
 * Model overridable via GEMINI_MODEL (default gemini-2.0-flash).
 *
 * All failures surface as AiError with a stable `code` so the UI can show a
 * friendly message (e.g. rate-limited / not-configured) instead of breaking.
 */

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export type AiErrorCode = "not_configured" | "rate_limited" | "upstream" | "parse";

export class AiError extends Error {
  code: AiErrorCode;
  status: number;
  constructor(code: AiErrorCode, message: string, status = 500) {
    super(message);
    this.name = "AiError";
    this.code = code;
    this.status = status;
  }
}

export function aiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

type GenOpts = {
  system?: string;
  prompt: string;
  json?: boolean;
  temperature?: number;
};

export async function geminiGenerate(opts: GenOpts): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AiError("not_configured", "AI is not configured (missing GEMINI_API_KEY).", 503);

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.6,
      topP: 0.95,
      maxOutputTokens: 2048,
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };

  let res: Response;
  try {
    res = await fetch(ENDPOINT(MODEL), {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
      // Gemini can take a few seconds; route handlers allow it.
      cache: "no-store",
    });
  } catch {
    throw new AiError("upstream", "Could not reach the AI service.", 502);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    if (res.status === 429) {
      throw new AiError(
        "rate_limited",
        "Gemini quota exceeded. Enable the free tier / billing on your Google AI Studio project, then retry.",
        429
      );
    }
    if (res.status === 400 && /API key not valid/i.test(detail)) {
      throw new AiError("not_configured", "The Gemini API key is invalid.", 401);
    }
    throw new AiError("upstream", `AI request failed (${res.status}).`, 502);
  }

  const data = (await res.json().catch(() => null)) as
    | { candidates?: { content?: { parts?: { text?: string }[] } }[] }
    | null;
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p?.text ?? "").join("") ?? "";
  if (!text) throw new AiError("upstream", "The AI returned an empty response.", 502);
  return text.trim();
}

/** Generate and parse JSON. Strips ```json fences if the model adds them. */
export async function geminiJSON<T = unknown>(opts: GenOpts): Promise<T> {
  const raw = await geminiGenerate({ ...opts, json: true });
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Last resort: pull the first {...} or [...] block.
    const match = cleaned.match(/[[{][\s\S]*[\]}]/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        /* fall through */
      }
    }
    throw new AiError("parse", "The AI returned malformed JSON.", 502);
  }
}
