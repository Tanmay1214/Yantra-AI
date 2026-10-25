export const MODEL_VERSION = "chand-empirical-1.0";
export const ASSET_URL =
  "https://sketchfab.com/3d-models/chand-baori-0fec124478454f74be29a9bd3e5534b8";
export const SOURCES = [
  {
    name: "Rajasthan Tourism · Chand Baori",
    url: "https://www.tourism.rajasthan.gov.in/content/rajasthan-tourism/en/tourist-destinations/chand-baori.html",
    detail:
      "Rajasthan Tourism attributes Chand Baori to King Chanda in the ninth century. Paired stairways descend on three sides; a pavilion with galleries occupies the fourth. The site served water conservation and social use.",
  },
  {
    name: "Ministry of Tourism · Abhaneri",
    url: "https://utsav.gov.in/view-event/abhaneri-festival-2",
    detail:
      "Abhaneri is known for early medieval monuments, including Chand Baori and Harshat Mata Temple.",
  },
  {
    name: "siddharthbandhu · Chand Baori",
    url: ASSET_URL,
    detail:
      "MagicaVoxel architectural interpretation. CC BY 4.0. Digital geometry is not a measured survey; the creator’s cooling claim is not a thermal calibration.",
  },
  {
    name: "Parmar & Mishra · Passive cooling in stepwells",
    url: "https://journal.hep.com.cn/foar/EN/10.1016/j.foar.2024.03.014",
    detail:
      "Research on architectural passive-cooling principles in Indian stepwells. Consulted for general context; its reported dimensions and temperature ranges do not calibrate this artistic asset or the demonstration equation.",
  },
  {
    name: "Sharmin et al. · ICUC12 stepwell microclimate study",
    url: "https://meetingorganizer.copernicus.org/ICUC12/ICUC12-1020.html",
    detail:
      "Conference research combining environmental measurements and thermal-comfort surveys in Jodhpur. A different location; its observations are not Chand Baori sensor records.",
  },
];
export interface Conditions {
  waterLevel: number;
  outdoor: number;
  deep: number;
  lengthScale: number;
  solar: number;
  solarGain: number;
  hour: number;
  waterTemperature: number;
  sampleDepth: number;
  maxDepth: number;
  levelRate: number;
  elapsedDays: number;
}
export const BOUNDS: Record<keyof Conditions, readonly [number, number]> = {
  waterLevel: [-40, 0],
  outdoor: [-10, 55],
  deep: [0, 45],
  lengthScale: [0.5, 30],
  solar: [0, 1],
  solarGain: [0, 12],
  hour: [0, 24],
  waterTemperature: [0, 45],
  sampleDepth: [0, 40],
  maxDepth: [1, 40],
  levelRate: [-2, 2],
  elapsedDays: [0, 365],
};
export const DEFAULT: Conditions = {
  waterLevel: -16,
  outdoor: 36,
  deep: 26,
  lengthScale: 8,
  solar: 0.6,
  solarGain: 4,
  hour: 14,
  waterTemperature: 25,
  sampleDepth: 12,
  maxDepth: 24,
  levelRate: 0,
  elapsedDays: 0,
};
export const PRESETS: Record<string, Conditions> = {
  "Baseline study": { ...DEFAULT },
  "Low water": { ...DEFAULT, waterLevel: -21 },
  "High water": { ...DEFAULT, waterLevel: -8 },
  "Hot summer · hypothetical": {
    ...DEFAULT,
    outdoor: 43,
    deep: 28,
    solar: 1,
    hour: 13,
  },
  "Cool season · hypothetical": {
    ...DEFAULT,
    outdoor: 24,
    deep: 25,
    solar: 0.3,
    hour: 10,
  },
  "Hypothetical drought": {
    ...DEFAULT,
    waterLevel: -18,
    outdoor: 41,
    levelRate: -0.15,
  },
  "Hypothetical replenishment": { ...DEFAULT, waterLevel: -20, levelRate: 0.2 },
};
export function validateConditions(value: unknown): Conditions {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Conditions must be an object.");
  const v = value as Record<string, unknown>;
  for (const key of Object.keys(v))
    if (!Object.hasOwn(BOUNDS, key))
      throw new Error(`Unsupported condition: ${key}`);
  for (const [key, [min, max]] of Object.entries(BOUNDS)) {
    if (
      typeof v[key] !== "number" ||
      !Number.isFinite(v[key]) ||
      (v[key] as number) < min ||
      (v[key] as number) > max
    )
      throw new Error(`${key} must be a finite number from ${min} to ${max}.`);
  }
  if ((v.waterLevel as number) < -(v.maxDepth as number))
    throw new Error("Water elevation is below the study bottom.");
  if ((v.sampleDepth as number) > (v.maxDepth as number))
    throw new Error("Sample depth exceeds the study domain.");
  return { ...v } as unknown as Conditions;
}
export function patchConditions(c: Conditions, patch: unknown) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch))
    throw new Error("Expected an object of conditions.");
  return validateConditions({ ...c, ...patch });
}
export function surfaceTemperature(c: Conditions) {
  return (
    c.outdoor +
    c.solarGain *
      c.solar *
      Math.max(0, Math.cos(((c.hour - 12) * Math.PI) / 12))
  );
}
export function temperature(c: Conditions, depth: number) {
  if (!Number.isFinite(depth) || depth < 0 || depth > c.maxDepth)
    throw new Error("Sample depth is outside the study domain.");
  return (
    c.deep + (surfaceTemperature(c) - c.deep) * Math.exp(-depth / c.lengthScale)
  );
}
export function profile(c: Conditions) {
  return Array.from({ length: 49 }, (_, i) => {
    const depth = (c.maxDepth * i) / 48;
    return { depth, elevation: -depth, temperature: temperature(c, depth) };
  });
}
export function outputs(c: Conditions) {
  return {
    modelVersion: MODEL_VERSION,
    provenance: "hypothetical inputs / simulated estimates",
    waterElevation_m: c.waterLevel,
    waterColumn_m: c.maxDepth + c.waterLevel,
    studyBottom_m: -c.maxDepth,
    volume_m3: null,
    surfaceArea_m2: null,
    volumeReason:
      "No surveyed basin geometry or elevation-volume curve is available.",
    surface_C: surfaceTemperature(c),
    sampled_C: temperature(c, c.sampleDepth),
    selectedDepth_m: c.sampleDepth,
    lower_C: temperature(c, c.maxDepth),
    upperLowerDifference_C: surfaceTemperature(c) - temperature(c, c.maxDepth),
    configuredWater_C: c.waterTemperature,
    waterAirDifference_C: c.waterTemperature - temperature(c, -c.waterLevel),
    profile: profile(c),
    inputs: { ...c },
  };
}
export function advanceEnvironment(c: Conditions, days: number): Conditions {
  if (!Number.isFinite(days) || days < 0 || days > 365)
    throw new Error("Elapsed step must be 0–365 days.");
  const dt = Math.min(days, 365 - c.elapsedDays);
  return {
    ...c,
    elapsedDays: c.elapsedDays + dt,
    waterLevel: Math.max(
      -c.maxDepth,
      Math.min(0, c.waterLevel + c.levelRate * dt),
    ),
  };
}
export interface Scenario {
  id: string;
  name: string;
  modelVersion: string;
  savedAt: string;
  conditions: Conditions;
}
export function validateScenario(v: unknown): Scenario {
  const s = v as Scenario;
  if (
    !s ||
    typeof s.id !== "string" ||
    typeof s.name !== "string" ||
    s.name.length > 80 ||
    typeof s.savedAt !== "string" ||
    s.modelVersion !== MODEL_VERSION
  )
    throw new Error("Unsupported scenario or model version.");
  return { ...s, conditions: validateConditions(s.conditions) };
}
export function compare(a: Scenario, b: Scenario) {
  validateScenario(a);
  validateScenario(b);
  const x = outputs(a.conditions),
    y = outputs(b.conditions);
  return {
    a: { name: a.name, ...x },
    b: { name: b.name, ...y },
    delta: {
      water_m: y.waterElevation_m - x.waterElevation_m,
      outdoor_C: b.conditions.outdoor - a.conditions.outdoor,
      selectedTemperature_C: y.sampled_C - x.sampled_C,
      upperLowerDifference_C:
        y.upperLowerDifference_C - x.upperLowerDifference_C,
    },
    note: "B minus A; each snapshot preserves its own sample depth and inputs.",
  };
}
