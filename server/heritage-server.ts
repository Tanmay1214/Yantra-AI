import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import {
  executeTool,
  PLAN_SCHEMA,
  TOOL_NAMES,
  validateContext,
} from "../src/heritage/agentTools.ts";
import { BOUNDS, SOURCES } from "../src/heritage/environment.ts";
const OLLAMA = "http://127.0.0.1:11434";
export async function discoverModels() {
  const response = await fetch(`${OLLAMA}/api/tags`, {
    signal: AbortSignal.timeout(3000),
  });
  if (!response.ok) throw new Error("Ollama model discovery failed.");
  const data = (await response.json()) as { models?: { name: string }[] };
  return (data.models ?? [])
    .map((m) => m.name)
    .filter((n) => /^gemma4(?::|$)/.test(n));
}
export async function runGuide(
  body: unknown,
  infer = async (request: unknown) => {
    const response = await fetch(`${OLLAMA}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(90000),
    });
    if (!response.ok)
      throw new Error(`Ollama inference failed (${response.status}).`);
    return response.json();
  },
) {
  const v = body as { question: string; model: string; context: unknown };
  if (
    !v ||
    typeof v.question !== "string" ||
    !v.question.trim() ||
    v.question.length > 2000 ||
    typeof v.model !== "string" ||
    !/^gemma4(?::[a-zA-Z0-9._-]+)?$/.test(v.model)
  )
    throw new Error("A question and an installed Gemma 4 tag are required.");
  const context = validateContext(v.context);
  const prompt = `You route requests for the Chand Baori environmental exhibit. Return ONLY a JSON object with calls, each containing name and args. Use only: ${TOOL_NAMES.join(", ")}.
Tool arguments: set_water_level {level_m:number}; set_environment_conditions or run_environment_simulation take partial conditions directly in args. sample_temperature {depth_m:number,location:"depth-column"}; compare_scenarios {scenario_a:id,scenario_b:id}; get_historical_sources {topic:string}. Other tools take {}.
Only use set tools for changes explicitly requested by the visitor. run_environment_simulation computes hypothetical outputs without changing controls. No filesystem, execution, weather, humidity, wind, live groundwater or historical water volume capability exists. For unsupported knowledge use get_site_information or get_historical_sources. Never invent calculated outputs. Bounds: ${JSON.stringify(BOUNDS)}. Current state: ${JSON.stringify(context)}. Sources: ${JSON.stringify(SOURCES)}.`;
  const generated = await infer({
    model: v.model,
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: v.question },
    ],
    format: PLAN_SCHEMA,
    stream: false,
    options: { temperature: 0, num_predict: 700, num_ctx: 8192 },
  });
  const plan = JSON.parse(generated.message?.content ?? "{}");
  if (
    !Array.isArray(plan.calls) ||
    plan.calls.length < 1 ||
    plan.calls.length > 4 ||
    Object.keys(plan).some((k) => k !== "calls")
  )
    throw new Error(
      "Gemma returned an unsupported plan; no changes were applied.",
    );
  const results = [];
  let current = context;
  for (const call of plan.calls) {
    if (
      !call ||
      typeof call.name !== "string" ||
      Object.keys(call).some((k) => k !== "name" && k !== "args")
    )
      throw new Error("Invalid tool request. No changes were applied.");
    const result = executeTool(current, call.name, call.args);
    results.push(result);
    current = { ...current, conditions: result.conditions };
  }
  return {
    model: v.model,
    results,
    conditions: current.conditions,
    sources: SOURCES,
    explanation:
      "Gemma selected the tools below. Numerical explanations come directly from validated results.",
  };
}
export const server = createServer(async (req, res) => {
  const send = (status: number, value: unknown) => {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(JSON.stringify(value));
  };
  if (
    req.headers.host &&
    !/^(localhost|127\.0\.0\.1):8787$/.test(req.headers.host)
  )
    return send(403, { error: "Loopback host required." });
  const origin = req.headers.origin;
  if (origin && !/^http:\/\/(127\.0\.0\.1|localhost):(5173|4173)$/.test(origin))
    return send(403, { error: "Local application origin required." });
  if (req.method === "GET" && req.url === "/api/heritage/status") {
    try {
      const models = await discoverModels();
      send(200, {
        connected: true,
        models,
        ready: models.length > 0,
        instructions: models.length
          ? "Select an installed Gemma 4 model."
          : "No Gemma 4 tag installed. Run: ollama pull gemma4:e2b",
      });
    } catch {
      send(200, {
        connected: false,
        ready: false,
        models: [],
        instructions:
          "Install Ollama from ollama.com/download, run ollama serve, then ollama pull gemma4:e2b. Retry connection.",
      });
    }
    return;
  }
  if (req.method !== "POST" || req.url !== "/api/heritage/guide")
    return send(404, { error: "Not found." });
  if (!req.headers["content-type"]?.startsWith("application/json"))
    return send(415, { error: "JSON required." });
  try {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (Buffer.byteLength(body) > 64000)
        throw new Error("Request too large.");
    }
    const parsed = JSON.parse(body);
    const models = await discoverModels();
    if (!models.includes(parsed.model))
      throw new Error("The requested Gemma 4 model is not installed.");
    send(200, await runGuide(parsed));
  } catch (error) {
    send(400, {
      error:
        error instanceof Error
          ? error.message
          : "Request failed. No changes applied.",
    });
  }
});
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  server.listen(8787, "127.0.0.1", () =>
    console.log("Heritage agent service: http://127.0.0.1:8787"),
  );
