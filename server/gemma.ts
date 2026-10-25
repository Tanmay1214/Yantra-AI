import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) loadEnvFile(envPath);
const API = "https://generativelanguage.googleapis.com/v1beta";
export const HOSTED_MODELS = ["gemma-4-26b-a4b-it", "gemma-4-31b-it"] as const;
export type Part = { text?: string; thought?: boolean; functionCall?: { name: string; args: Record<string, unknown>; id?: string }; functionResponse?: { name: string; response: unknown; id?: string } };
export interface GenerationRequest {
  systemInstruction: { parts: { text: string }[] };
  contents: { role: "user" | "model"; parts: Part[] }[];
  tools: { functionDeclarations: unknown[] }[];
  generationConfig: { temperature: number; maxOutputTokens: number; thinkingConfig: { thinkingLevel: string } };
}
export interface GenerationReply { candidates?: { content?: { role?: string; parts?: Part[] }; finishReason?: string }[] }
export class ProviderError extends Error { constructor(message: string, public status = 503, public retryAfterSeconds?: number) { super(message); } }
function apiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new ProviderError("Add GEMINI_API_KEY to the server's .env.local, then restart the guide service.");
  return key;
}
async function request(path: string, body?: unknown) {
  const key = apiKey();
  let response: Response | undefined;
  // Retry one transient transport/service failure. Never retry authentication or quota errors.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      response = await fetch(`${API}/${path}`, {
        method: body ? "POST" : "GET", headers: { "x-goog-api-key": key, "Content-Type": "application/json", Connection: "close" },
        ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(body ? 40000 : 10000),
      });
      if (attempt === 0 && [500, 502, 503, 504].includes(response.status)) { await response.body?.cancel(); await new Promise(r => setTimeout(r, 500)); continue; }
      break;
    } catch {
      if (attempt === 1) throw new ProviderError("The hosted Gemma service could not be reached after retrying. Your exhibit controls still work.");
      await new Promise(r => setTimeout(r, 500));
    }
  }
  if (!response) throw new ProviderError("Hosted Gemma is unavailable. Try again.");
  if (!response.ok) {
    // Never reflect upstream bodies, headers or credentials to the browser or logs.
    if ([400, 401, 403].includes(response.status)) throw new ProviderError("The Gemini API rejected the request. Check the server API key, model access and restrictions.", 502);
    if (response.status === 429) {
      const failure = await response.json().catch(() => ({})) as { error?: { details?: { retryDelay?: string }[] } };
      const delay = failure.error?.details?.find(d => d.retryDelay)?.retryDelay;
      const seconds = Number.parseFloat(delay ?? response.headers.get("retry-after") ?? "");
      const retry = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : undefined;
      throw new ProviderError(`Gemma's API quota is temporarily unavailable. ${retry ? `Try again in ${retry} seconds.` : "Wait a moment and try again, or check your project quota in AI Studio."} No controls were changed.`, 429, retry);
    }
    throw new ProviderError(`The hosted Gemma service is unavailable (HTTP ${response.status}). Try again.`, 502);
  }
  return response.json();
}
let discovered: { at: number; model: string; models: string[] } | null = null;
export async function discoverModels(refresh = false) {
  if (discovered && !refresh && Date.now() - discovered.at < 600000) return discovered;
  const data = await request("models?pageSize=1000") as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
  const models = (data.models ?? []).filter(m => m.supportedGenerationMethods?.includes("generateContent"))
    .map(m => m.name.replace(/^models\//, "")).filter(m => (HOSTED_MODELS as readonly string[]).includes(m));
  const preferred = process.env.GEMMA_MODEL || HOSTED_MODELS[0];
  if (!(HOSTED_MODELS as readonly string[]).includes(preferred)) throw new ProviderError("GEMMA_MODEL must identify a supported Gemma 4 model; Gemini models are not substituted.");
  if (!models.includes(preferred)) throw new ProviderError("The configured Gemma 4 model is not available for this API key.");
  discovered = { at: Date.now(), model: preferred, models };
  return discovered;
}
export async function generate(requestBody: GenerationRequest): Promise<GenerationReply> {
  const { model } = await discoverModels();
  return request(`models/${model}:generateContent`, requestBody);
}
