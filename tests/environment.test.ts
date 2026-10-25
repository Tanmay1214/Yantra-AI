import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  DEFAULT,
  MODEL_VERSION,
  advanceEnvironment,
  compare,
  outputs,
  patchConditions,
  profile,
  temperature,
  type Scenario,
} from "../src/heritage/environment.ts";
import { executeTool } from "../src/heritage/agentTools.ts";
import {
  basinMask,
  inspectAsset,
  rasterize,
} from "../src/heritage/assetGeometry.ts";
import { runGuide } from "../server/heritage-server.ts";
test("thermal boundary, depth chart and outdoor sensitivity share one deterministic profile", () => {
  const p = profile(DEFAULT);
  assert.equal(p[0].temperature, temperature(DEFAULT, 0));
  assert.equal(p.at(-1)!.temperature, temperature(DEFAULT, DEFAULT.maxDepth));
  const hotter = patchConditions(DEFAULT, { outdoor: 43 });
  assert.ok(temperature(hotter, 12) > temperature(DEFAULT, 12));
  assert.ok(temperature(DEFAULT, 24) > DEFAULT.deep);
  assert.ok(temperature(DEFAULT, 24) < temperature(DEFAULT, 0));
  assert.equal(
    outputs(DEFAULT).sampled_C,
    temperature(DEFAULT, DEFAULT.sampleDepth),
  );
  assert.deepEqual(profile(DEFAULT), profile({ ...DEFAULT }));
});
test("water changes do not invent thermal coupling, volume or area", () => {
  const higher = patchConditions(DEFAULT, { waterLevel: -5 });
  assert.equal(temperature(higher, 12), temperature(DEFAULT, 12));
  assert.equal(outputs(higher).volume_m3, null);
  assert.equal(outputs(higher).surfaceArea_m2, null);
  assert.equal(outputs(higher).waterColumn_m, 19);
});
test("finite physical bounds, extra fields, sample limits and datum bounds are validated", () => {
  for (const patch of [
    { waterLevel: 2 },
    { waterLevel: -30 },
    { outdoor: NaN },
    { lengthScale: 0 },
    { sampleDepth: 25 },
    { wind: 5 },
  ])
    assert.throws(() => patchConditions(DEFAULT, patch));
  assert.throws(() => temperature(DEFAULT, -1));
  assert.throws(() => temperature(DEFAULT, NaN));
  assert.equal(
    temperature({ ...DEFAULT, outdoor: 15, solar: 0 }, 24) > 15,
    true,
  );
});
test("hypothetical level ramp uses elapsed days, clamps boundaries, and has no hidden flow terms", () => {
  const c = { ...DEFAULT, levelRate: 0.2 };
  const a = advanceEnvironment(c, 5),
    b = advanceEnvironment(advanceEnvironment(c, 2), 3);
  assert.ok(Math.abs(a.waterLevel - b.waterLevel) < 1e-12);
  assert.equal(a.waterLevel, -15);
  assert.equal(a.elapsedDays, 5);
  assert.equal(
    advanceEnvironment({ ...DEFAULT, levelRate: 2 }, 100).waterLevel,
    0,
  );
  assert.throws(() => advanceEnvironment(c, -1));
});
test("scenario comparisons retain versioned inputs and reject incompatible snapshots", () => {
  const a: Scenario = {
    id: "a",
    name: "A",
    savedAt: "2026-10-25",
    modelVersion: MODEL_VERSION,
    conditions: { ...DEFAULT },
  };
  const b = {
    ...a,
    id: "b",
    conditions: { ...DEFAULT, waterLevel: -10, outdoor: 42 },
  };
  const result = compare(a, b);
  assert.equal(result.delta.water_m, 6);
  assert.equal(result.delta.outdoor_C, 6);
  assert.equal(a.conditions.waterLevel, -16);
  assert.throws(() => compare(a, { ...b, modelVersion: "unknown" }));
});
test("approved tools execute and validate results without mutating their input context", () => {
  const ctx = { conditions: { ...DEFAULT }, scenarios: [] };
  const r = executeTool(ctx, "set_water_level", { level_m: -18 });
  assert.equal(r.conditions.waterLevel, -18);
  assert.equal(ctx.conditions.waterLevel, -16);
  assert.throws(() => executeTool(ctx, "set_water_level", { level_m: 2 }));
  assert.throws(() => executeTool(ctx, "exec", { code: "bad" }));
  assert.throws(() =>
    executeTool(ctx, "sample_temperature", {
      depth_m: 5,
      location: "invented-gallery",
    }),
  );
  assert.equal(
    (
      executeTool(ctx, "sample_temperature", { depth_m: 5 }).result as {
        temperature_C: number;
      }
    ).temperature_C,
    temperature(DEFAULT, 5),
  );
});
test("geometry area is labelled and withheld after water changes; invalid source arguments fail",()=>{
  const ctx={conditions:{...DEFAULT},scenarios:[],geometry:{surfaceArea_m2:183,level_m:DEFAULT.waterLevel,studyDepth_m:DEFAULT.maxDepth,meshCount:3,source:'authorised source glTF'}};
  assert.equal((executeTool(ctx,'get_simulation_state',{}).result as {surfaceArea_m2:number}).surfaceArea_m2,183);
  assert.equal((executeTool(ctx,'set_water_level',{level_m:-12}).result as {surfaceArea_m2:null}).surfaceArea_m2,null);
  assert.throws(()=>executeTool(ctx,'get_historical_sources',{topic:42}));
});
test("agent orchestration validates a mocked model plan and is atomic on invalid calls", async () => {
  const context = { conditions: { ...DEFAULT }, scenarios: [] };
  const reply = await runGuide(
    { question: "Lower water two metres", model: "gemma4:e2b", context },
    async () => ({
      message: {
        content: JSON.stringify({
          calls: [
            { name: "set_water_level", args: { level_m: -18 } },
            { name: "get_temperature_profile", args: {} },
          ],
        }),
      },
    }),
  );
  assert.equal(reply.conditions.waterLevel, -18);
  assert.equal(reply.results.length, 2);
  assert.equal(context.conditions.waterLevel, -16);
  await assert.rejects(() =>
    runGuide(
      { question: "Invalid", model: "gemma4:e2b", context },
      async () => ({
        message: {
          content: JSON.stringify({
            calls: [
              { name: "set_water_level", args: { level_m: -17 } },
              { name: "set_water_level", args: { level_m: 5 } },
            ],
          }),
        },
      }),
    ),
  );
});
test("source-triangle raster encloses a basin, excludes walls and rejects open boundaries", () => {
  const group = new THREE.Group();
  function box(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
  ) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial(),
    );
    m.position.set(x, y, z);
    group.add(m);
  }
  box(10, 1, 10, 0, -10, 0);
  box(1, 10, 10, -4.5, -4.5, 0);
  box(1, 10, 10, 4.5, -4.5, 0);
  box(8, 10, 1, 0, -4.5, -4.5);
  box(8, 10, 1, 0, -4.5, 4.5);
  const field = rasterize(group, 32);
  const mask = basinMask(field, -4);
  assert.ok(mask.length > 0);
  assert.ok(mask.every((i) => i % 32 > 2 && i % 32 < 29));
  assert.equal(basinMask(field, 2).length, 0);
  const info = inspectAsset(group, "synthetic-test-only");
  assert.equal(info.meshes.length, 5);
  assert.ok(info.triangles > 0);
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
});
