import {
  BOUNDS,
  compare,
  outputs,
  patchConditions,
  profile,
  SOURCES,
  temperature,
  validateConditions,
  validateScenario,
  type Conditions,
  type Scenario,
} from "./environment.ts";
export interface GeometryContext {
  surfaceArea_m2: number | null;
  level_m: number;
  studyDepth_m: number;
  meshCount: number;
  source: string;
}
export interface AgentContext {
  conditions: Conditions;
  scenarios: Scenario[];
  geometry?: GeometryContext;
}
export const TOOL_NAMES = [
  "get_site_information",
  "get_simulation_state",
  "set_water_level",
  "set_environment_conditions",
  "sample_temperature",
  "compare_scenarios",
  "run_environment_simulation",
  "get_temperature_profile",
  "get_water_volume",
  "get_historical_sources",
] as const;
export function validateContext(value: unknown): AgentContext {
  const c = value as AgentContext;
  if (!c || !Array.isArray(c.scenarios) || c.scenarios.length > 8)
    throw new Error("Invalid agent context.");
  if (c.geometry) {
    const g = c.geometry;
    if (
      typeof g.source !== "string" ||
      g.source.length > 250 ||
      !Number.isInteger(g.meshCount) ||
      g.meshCount < 0 ||
      g.meshCount > 10000 ||
      !Number.isFinite(g.level_m) ||
      !Number.isFinite(g.studyDepth_m) ||
      g.studyDepth_m < 1 ||
      g.studyDepth_m > 40 ||
      (g.surfaceArea_m2 !== null &&
        (!Number.isFinite(g.surfaceArea_m2) ||
          g.surfaceArea_m2 < 0 ||
          g.surfaceArea_m2 > 1e8))
    )
      throw new Error("Invalid geometry context.");
  }
  return {
    conditions: validateConditions(c.conditions),
    scenarios: c.scenarios.map(validateScenario),
    geometry: c.geometry,
  };
}
export function executeTool(
  context: AgentContext,
  name: string,
  args: Record<string, unknown>,
) {
  if (!args || typeof args !== "object" || Array.isArray(args))
    throw new Error("Tool arguments must be an object.");
  let next = { ...context.conditions };
  let result: unknown;
  const state = (conditions: Conditions) => ({
    ...outputs(conditions),
    surfaceArea_m2:
      context.geometry &&
      context.geometry.level_m === conditions.waterLevel &&
      context.geometry.studyDepth_m === conditions.maxDepth
        ? context.geometry.surfaceArea_m2
        : null,
    geometry: context.geometry
      ? {
          ...context.geometry,
          provenance:
            "Browser-computed raster estimate with illustrative metre scale; recalculate after water/scale changes.",
        }
      : "No local geometry supplied",
  });
  const allowed: Record<string, string[]> = {
    get_site_information: [],
    get_simulation_state: [],
    set_water_level: ["level_m"],
    set_environment_conditions: Object.keys(BOUNDS),
    sample_temperature: ["depth_m", "location"],
    compare_scenarios: ["scenario_a", "scenario_b"],
    run_environment_simulation: Object.keys(BOUNDS),
    get_temperature_profile: [],
    get_water_volume: [],
    get_historical_sources: ["topic"],
  };
  if (!Object.hasOwn(allowed, name))
    throw new Error(`Unsupported tool: ${name}`);
  for (const key of Object.keys(args))
    if (!allowed[name].includes(key))
      throw new Error(`Unsupported argument: ${key}`);
  switch (name) {
    case "set_water_level":
      next = patchConditions(next, { waterLevel: args.level_m });
      result = state(next);
      break;
    case "set_environment_conditions":
      next = patchConditions(next, args);
      result = state(next);
      break;
    case "run_environment_simulation":
      result = state(patchConditions(next, args));
      break;
    case "get_simulation_state":
      result = state(next);
      break;
    case "get_temperature_profile":
      result = profile(next);
      break;
    case "sample_temperature": {
      if (Object.hasOwn(args, "location") && args.location !== "depth-column")
        throw new Error(
          "Only depth-column sampling is supported; site locations require geometry calibration.",
        );
      result = {
        temperature_C: temperature(next, args.depth_m as number),
        depth_m: args.depth_m,
        location: "depth-column",
        status: "simulated estimate",
      };
      break;
    }
    case "compare_scenarios": {
      const a = context.scenarios.find((s) => s.id === args.scenario_a),
        b = context.scenarios.find((s) => s.id === args.scenario_b);
      if (!a || !b) throw new Error("Both saved scenario IDs are required.");
      result = compare(a, b);
      break;
    }
    case "get_water_volume":
      result = {
        volume_m3: null,
        reason:
          "Unavailable: a surveyed basin or elevation-volume curve is required. Water elevation alone does not establish storage.",
      };
      break;
    case "get_site_information":
      result = {
        facts: SOURCES.slice(0, 2),
        geometry: SOURCES[2],
        liveObservations:
          "None. No live weather, groundwater or interior sensors are connected.",
      };
      break;
    case "get_historical_sources":
      if (
        args.topic !== undefined &&
        (typeof args.topic !== "string" || args.topic.length > 200)
      )
        throw new Error("Source topic must be a string up to 200 characters.");
      result = SOURCES;
      break;
  }
  return { name, args, result, conditions: next };
}
export const PLAN_SCHEMA = {
  type: "object",
  required: ["calls"],
  additionalProperties: false,
  properties: {
    calls: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: {
        type: "object",
        required: ["name", "args"],
        additionalProperties: false,
        properties: {
          name: { type: "string", enum: TOOL_NAMES },
          args: { type: "object" },
        },
      },
    },
  },
};
