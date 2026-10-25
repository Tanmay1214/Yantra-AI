import { executeTool, validateContext, type AgentContext } from "../heritage/agentTools.ts";
import { BOUNDS, SOURCES } from "../heritage/environment.ts";
import { beatPeriod, ESCAPE_RATIO, TRAIN, type Preset, type ViewMode } from "../mechanism.ts";
import { byId, components, sources, tour } from "../inventory.ts";

export type Exhibit = "chand-baori" | "wadokei";
export const WELL_MODES = ["Explore", "Water", "Temperature", "Cross-section", "Environmental", "Architecture"] as const;
export const WELL_CAMERAS = ["Overview", "Front", "Top", "Interior", "Lower levels"] as const;
export const CLOCK_MODES = ["exterior", "interior", "xray", "exploded", "operating"] as const;
export const CLOCK_CAMERAS = ["home", "front", "side", "rear", "top", "focus"] as const;
export interface WellContext extends AgentContext {
  view: { mode: typeof WELL_MODES[number]; camera: typeof WELL_CAMERAS[number] };
}
export interface ClockContext {
  mode: ViewMode; camera: Preset; selected: string | null; isolate: boolean; path: boolean;
  running: boolean; radius: number; speed: number; beats: number; travel: number; tourIndex: number;
  resetRequested?: boolean;
}
export type Context = WellContext | ClockContext;
export interface ToolResult { name: string; args: Record<string, unknown>; result: unknown; summary: string; changed: boolean }
export interface GuideReply {
  exhibit: Exhibit; model: string; explanation: string; results: ToolResult[];
  sources: { name: string; url: string }[];
}
export interface Turn { question: string; answer: string }

function record(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("Expected an object.");
  return v as Record<string, unknown>;
}
function oneOf<T extends string>(v: unknown, allowed: readonly T[], field: string): T {
  if (typeof v !== "string" || !allowed.includes(v as T)) throw new Error(`Unsupported ${field}.`);
  return v as T;
}
function number(v: unknown, min: number, max: number, field: string) {
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max) throw new Error(`${field} must be between ${min} and ${max}.`);
  return v;
}
function boolean(v: unknown, field: string) { if (typeof v !== "boolean") throw new Error(`${field} must be true or false.`); return v; }
function component(v: unknown) {
  if (typeof v !== "string" || !Object.hasOwn(byId, v)) throw new Error("Choose an existing component ID.");
  return v;
}
export function validateGuideContext(exhibit: Exhibit, value: unknown): Context {
  const c = record(value);
  if (exhibit === "chand-baori") {
    const view = record(c.view);
    return { ...validateContext(c), view: { mode: oneOf(view.mode, WELL_MODES, "view mode"), camera: oneOf(view.camera, WELL_CAMERAS, "camera") } };
  }
  return {
    mode: oneOf(c.mode, CLOCK_MODES, "view mode"), camera: oneOf(c.camera, CLOCK_CAMERAS, "camera"),
    selected: c.selected === null ? null : component(c.selected), isolate: boolean(c.isolate, "isolate"), path: boolean(c.path, "path"),
    running: boolean(c.running, "running"), radius: number(c.radius, .32, .98, "Foliot distance"),
    speed: number(c.speed, .25, 24, "Speed"), beats: number(c.beats, 0, 1e8, "Beats"),
    travel: number(c.travel, 0, 1.05, "Weight drop"), tourIndex: number(c.tourIndex, 0, tour.length - 1, "Tour step"),
  };
}

// The exact same bounded dispatch runs on the server and replays in the browser before applying changes.
export function executeGuideTool(exhibit: Exhibit, context: Context, name: string, value: unknown): { context: Context; tool: ToolResult } {
  const args = record(value);
  let next = structuredClone(context), result: unknown, summary = "", changed = false;
  const accepts = (fields: string[]) => { for (const k of Object.keys(args)) if (!fields.includes(k)) throw new Error(`Unsupported argument: ${k}`); };
  if (exhibit === "chand-baori") {
    const c = next as WellContext;
    if (name === "set_view_mode") {
      accepts(["mode"]); c.view.mode = oneOf(args.mode, WELL_MODES, "view mode"); changed = true; result = c.view; summary = `View: ${c.view.mode}.`;
    } else if (name === "set_camera_view") {
      accepts(["preset"]); c.view.camera = oneOf(args.preset, WELL_CAMERAS, "camera"); changed = true; result = c.view; summary = `Camera: ${c.view.camera}.`;
    } else {
      const output = executeTool(c, name, args);
      c.conditions = output.conditions; result = output.result;
      changed = name.startsWith("set_");
      if (name === "set_water_level") { c.view.mode = "Water"; summary = `Water elevation: ${c.conditions.waterLevel.toFixed(1)} m · illustrative datum.`; }
      else if (name === "set_environment_conditions") summary = `Conditions updated · outdoor ${c.conditions.outdoor.toFixed(1)} °C · observation ${c.conditions.sampleDepth.toFixed(1)} m.`;
      else if (name === "get_temperature_profile") {
        const p = result as { depth: number; temperature: number }[];
        summary = `Surface ${p[0].temperature.toFixed(1)} °C → bottom ${p.at(-1)!.temperature.toFixed(1)} °C · simulated estimate.`;
      } else if (name === "sample_temperature") {
        const r = result as { depth_m: number; temperature_C: number };
        summary = `${r.depth_m.toFixed(1)} m depth: ${r.temperature_C.toFixed(1)} °C · simulated estimate.`;
      } else if (name === "compare_scenarios") {
        const r = result as { delta: { water_m: number; selectedTemperature_C: number } };
        summary = `B − A: water ${r.delta.water_m.toFixed(1)} m · estimated air ${r.delta.selectedTemperature_C.toFixed(1)} °C. Compare sample depths.`;
      } else if (name === "get_water_volume") summary = "Water volume is not established by this model.";
      else if (name === "run_environment_simulation") {
        const r = result as { sampled_C: number; selectedDepth_m: number };
        summary = `Hypothetical estimate: ${r.sampled_C.toFixed(1)} °C at ${r.selectedDepth_m.toFixed(1)} m. Controls unchanged.`;
      } else if (name === "get_site_information" || name === "get_historical_sources") summary = "Source-backed context · model geometry and environmental estimates are distinguished.";
      else summary = `Current water ${c.conditions.waterLevel.toFixed(1)} m · outdoor ${c.conditions.outdoor.toFixed(1)} °C · user-configured inputs.`;
    }
  } else {
    const c = next as ClockContext;
    switch (name) {
      case "get_simulation_state":
        accepts([]); result = { ...c, beatPeriod_s: beatPeriod(c.radius), toothCounts: TRAIN, escapeGreatRatio: ESCAPE_RATIO,
          limits: "Illustrative kinematics and model units; no simulated forces or historical calibration." };
        summary = `${c.running ? "Running" : "Paused"} · beat ${beatPeriod(c.radius).toFixed(2)} s · weights ${c.radius.toFixed(2)} model units.`; break;
      case "set_view_mode":
        accepts(["mode"]); c.mode = oneOf(args.mode, CLOCK_MODES, "view mode"); c.path = c.mode === "operating"; c.isolate = false; c.camera = "home";
        changed = true; result = { mode: c.mode }; summary = `View: ${c.mode}.`; break;
      case "set_camera_view":
        accepts(["preset"]); c.camera = oneOf(args.preset, CLOCK_CAMERAS, "camera");
        if (c.camera === "focus" && !c.selected) throw new Error("Select a component before focusing.");
        changed = true; result = { camera: c.camera }; summary = `Camera: ${c.camera}.`; break;
      case "inspect_component": {
        accepts(["component_id", "isolate"]); c.selected = component(args.component_id); c.camera = "focus";
        if (c.mode === "exterior" && !["stand", "frame", "panels", "dial", "pointer", "weight"].includes(c.selected)) { c.mode = "interior"; c.path = false; }
        c.isolate = args.isolate === undefined ? false : boolean(args.isolate, "isolate"); changed = true;
        result = byId[c.selected]; summary = `Inspecting ${byId[c.selected].name}${c.isolate ? " · isolated" : ""}.`; break;
      }
      case "get_component_information":
        accepts(["component_id"]); result = byId[component(args.component_id ?? c.selected)];
        summary = (result as typeof components[number]).purpose; break;
      case "set_clock_running":
        accepts(["running"]); c.running = boolean(args.running, "running"); changed = true; result = { running: c.running };
        summary = c.running ? "Clock started · the weight, train and display run together." : "Clock paused · the connected movement is held."; break;
      case "reset_clock":
        accepts([]); c.running = false; c.resetRequested = true; c.beats = 0; c.travel = 0; c.camera = "home"; changed = true;
        result = { reset: true, paused: true }; summary = "Clock rewound and paused; regulator setting retained."; break;
      case "set_foliot_weights": {
        accepts(["distance"]); const before = beatPeriod(c.radius);
        c.radius = number(args.distance, .32, .98, "Foliot distance");
        c.isolate = false; c.selected = "sliders"; c.camera = "focus"; changed = true;
        result = { distance_model_units: c.radius, previousBeat_s: before, beatPeriod_s: beatPeriod(c.radius), approximation: "Illustrative inertia-based rate curve, not a force simulation." };
        summary = `Weights ${c.radius.toFixed(2)} model units · beat ${before.toFixed(2)} → ${beatPeriod(c.radius).toFixed(2)} s.`; break;
      }
      case "show_power_path":
        accepts(["step"]); c.tourIndex = number(args.step ?? 0, 0, tour.length - 1, "Tour step");
        if (!Number.isInteger(c.tourIndex)) throw new Error("Tour step must be an integer.");
        c.mode = "operating"; c.selected = tour[c.tourIndex].id; c.path = true; c.isolate = false; c.camera = "focus"; changed = true;
        result = { step: c.tourIndex, ...tour[c.tourIndex], path: tour.map(t => ({ component: t.id, purpose: t.text })) };
        summary = `Power path · ${tour[c.tourIndex].title}`; break;
      case "get_site_information":
        accepts([]); result = { variant: "Early single-foliot, weight-driven Japanese lantern clock", sources, components: components.map(({ id, name, system }) => ({ id, name, system })),
          limits: "Procedural explanatory reconstruction. No imported Wadokei scan, force simulation, automatic double-foliot switching or authentic strike train." };
        summary = "Single-foliot explanatory reconstruction · documented principles, reconstructed geometry."; break;
      case "get_historical_sources":
        accepts(["topic"]); if (args.topic !== undefined && (typeof args.topic !== "string" || args.topic.length > 200)) throw new Error("Invalid source topic.");
        result = sources; summary = "Historical references and reconstruction boundaries retrieved."; break;
      default: throw new Error(`Unsupported tool: ${name}`);
    }
  }
  return { context: next, tool: { name, args, result, summary, changed } };
}

const schema = (properties: Record<string, unknown> = {}, required = Object.keys(properties)) => ({ type: "OBJECT", properties, ...(required.length ? { required } : {}) });
const text = (description: string, values?: readonly string[]) => ({ type: "STRING", description, ...(values ? { enum: values } : {}) });
const numeric = (description: string) => ({ type: "NUMBER", description });
const tool = (name: string, description: string, parameters = schema()) => ({ name, description, parameters });
export function declarations(exhibit: Exhibit) {
  const common = [tool("get_simulation_state", "Read current verified state and numerical outputs."), tool("get_site_information", "Read source-backed facts, geometry provenance and limitations."),
    tool("get_historical_sources", "Retrieve the exhibit bibliography.", schema({ topic: text("Historical subject") }, []))];
  return exhibit === "chand-baori" ? [...common,
    tool("set_water_level", "Change illustrative water elevation, metres relative to study top 0 m. For relative requests use current state. Bounds -studyDepth to 0.", schema({ level_m: numeric("Absolute elevation in metres") })),
    tool("set_environment_conditions", "Change only environmental inputs explicitly requested. Values are hypothetical. Outdoor/deep/water temperatures °C, hour 0–24, solar 0–1, sampleDepth metres. No wind/humidity model.", schema(Object.fromEntries(Object.entries(BOUNDS).map(([k,v])=>[k,numeric(`${k}: ${v[0]} to ${v[1]}`)])), [])),
    tool("sample_temperature", "Read estimated air temperature at a depth in the supported study column.", schema({ depth_m: numeric("Depth metres, 0 to study depth"), location: text("Supported sampling column", ["depth-column"]) }, ["depth_m"])),
    tool("get_temperature_profile", "Read the deterministic depth-temperature estimates."),
    tool("compare_scenarios", "Compare two saved scenario IDs, preserving their inputs and model version.", schema({ scenario_a: text("Saved scenario A ID"), scenario_b: text("Saved scenario B ID") })),
    tool("run_environment_simulation", "Calculate a hypothetical condition change without changing scene controls.", schema(Object.fromEntries(Object.entries(BOUNDS).map(([k,v])=>[k,numeric(`${k}: ${v[0]} to ${v[1]}`)])), [])),
    tool("get_water_volume", "Explain why storage volume is unavailable; do not invent a historical volume."),
    tool("set_view_mode", "Show the requested environmental layer.", schema({ mode: text("View", WELL_MODES) })),
    tool("set_camera_view", "Move to a supported camera preset.", schema({ preset: text("Camera", WELL_CAMERAS) })),
  ] : [...common,
    tool("get_component_information", "Read a component's purpose, input/output and evidence. Use selected ID if omitted.", schema({ component_id: text("Existing component ID", components.map(c=>c.id)) }, [])),
    tool("inspect_component", "ACTION for show me / select / focus a component. Selects and focuses the actual part, automatically opening an exterior housing for internal parts. Also returns its purpose and evidence. The escapement wheel is component_id escape.", schema({ component_id: text("Existing component ID", components.map(c=>c.id)), isolate: { type: "BOOLEAN" } }, ["component_id"])),
    tool("set_view_mode", "Reveal the interior, xray, exploded assembly or highlighted operation.", schema({ mode: text("View", CLOCK_MODES) })),
    tool("set_camera_view", "Frame the object or selected component.", schema({ preset: text("Camera", CLOCK_CAMERAS) })),
    tool("set_clock_running", "Start or pause the connected clock movement.", schema({ running: { type: "BOOLEAN" } })),
    tool("reset_clock", "Rewind and pause the clock without changing regulator distance."),
    tool("set_foliot_weights", "Set symmetrical weights and focus them so the change is visible, clearing previous isolation. Farther generally slows the illustrative beat. Preserve current value for relative adjustments; range .32–.98 model units.", schema({ distance: numeric("Distance from pivot, model units .32 to .98") })),
    tool("show_power_path", "Show one of the six existing guided stages: weight, train, escapement, regulator, dial, bell. Omit step to start.", schema({ step: { type: "INTEGER", description: "Stage 0–5" } }, [])),
  ];
}
export function bibliography(exhibit: Exhibit) {
  return exhibit === "chand-baori" ? SOURCES.map(s=>({name:s.name,url:s.url})) : sources.map(s=>({name:s.title,url:s.url}));
}
export function fingerprint(exhibit: Exhibit, context: Context) {
  if (exhibit === "chand-baori") { const { conditions, scenarios, view } = context as WellContext; return JSON.stringify({ conditions, scenarios, view }); }
  const { beats, travel, resetRequested, ...controls } = context as ClockContext;
  return JSON.stringify(controls);
}
