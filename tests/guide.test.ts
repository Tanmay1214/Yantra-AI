import test from "node:test";
import assert from "node:assert/strict";
import { beatPeriod } from "../src/mechanism.ts";
import { DEFAULT } from "../src/heritage/environment.ts";
import { executeGuideTool, fingerprint, validateGuideContext, type ClockContext, type WellContext } from "../src/guide/tools.ts";
import { runGuide } from "../server/heritage-server.ts";

const clock: ClockContext = { mode: "exterior", camera: "home", selected: null, isolate: false, path: false, running: true, radius: .76, speed: 1, beats: 3, travel: .01, tourIndex: 0 };
const well: WellContext = { conditions: { ...DEFAULT }, scenarios: [], view: { mode: "Explore", camera: "Overview" } };

test("clock tool transaction selects a real mechanism without modifying the request", () => {
  const a = executeGuideTool("wadokei", clock, "set_view_mode", { mode: "interior" });
  const b = executeGuideTool("wadokei", a.context, "inspect_component", { component_id: "escape" });
  assert.equal((b.context as ClockContext).selected, "escape");
  assert.equal((b.context as ClockContext).camera, "focus");
  assert.equal((b.context as ClockContext).mode, "interior");
  assert.equal(clock.mode, "exterior"); assert.equal(clock.selected, null);
  assert.throws(() => executeGuideTool("wadokei", clock, "inspect_component", { component_id: "invented" }));
  assert.throws(() => executeGuideTool("wadokei", clock, "exec", { code: "anything" }));
});
test("foliot tools use the existing period curve, bounds and explicit model units", () => {
  const r = executeGuideTool("wadokei", clock, "set_foliot_weights", { distance: .95 });
  assert.equal((r.tool.result as any).beatPeriod_s, beatPeriod(.95));
  assert.ok((r.tool.result as any).beatPeriod_s > beatPeriod(clock.radius));
  assert.equal((r.context as ClockContext).selected, "sliders");
  assert.equal((r.context as ClockContext).isolate, false);
  for (const distance of [NaN, Infinity, -.2, 4, "0.95"]) assert.throws(() => executeGuideTool("wadokei", clock, "set_foliot_weights", { distance }));
  assert.throws(() => executeGuideTool("wadokei", clock, "set_foliot_weights", { distance: .9, command: "bad" }));
});
test("power tour, pause and reset return coherent bounded clock commands", () => {
  const tour = executeGuideTool("wadokei", clock, "show_power_path", { step: 3 });
  assert.equal((tour.context as ClockContext).selected, "foliot");
  assert.equal((tour.context as ClockContext).mode, "operating");
  assert.throws(() => executeGuideTool("wadokei", clock, "show_power_path", { step: 3.5 }));
  const paused = executeGuideTool("wadokei", clock, "set_clock_running", { running: false });
  assert.equal((paused.context as ClockContext).running, false);
  const reset = executeGuideTool("wadokei", clock, "reset_clock", {});
  assert.equal((reset.context as ClockContext).resetRequested, true);
  assert.equal((reset.context as ClockContext).running, false);
  assert.equal((reset.context as ClockContext).radius, clock.radius);
});
test("water actions reveal the surface; hypothetical calculations do not alter state", () => {
  const r = executeGuideTool("chand-baori", well, "set_water_level", { level_m: -18 });
  assert.equal((r.context as WellContext).conditions.waterLevel, -18);
  assert.equal((r.context as WellContext).view.mode, "Water");
  const whatIf = executeGuideTool("chand-baori", well, "run_environment_simulation", { outdoor: 43 });
  assert.equal((whatIf.context as WellContext).conditions.outdoor, 36);
  assert.equal(whatIf.tool.changed, false);
  assert.throws(() => executeGuideTool("chand-baori", well, "set_water_level", { level_m: 10 }));
});
test("stale-state fingerprint ignores animation frames but tracks manual controls", () => {
  assert.equal(fingerprint("wadokei", clock), fingerprint("wadokei", { ...clock, beats: 4, travel: .02 }));
  assert.notEqual(fingerprint("wadokei", clock), fingerprint("wadokei", { ...clock, radius: .9 }));
  assert.notEqual(fingerprint("chand-baori", well), fingerprint("chand-baori", { ...well, conditions: { ...DEFAULT, waterLevel: -18 } }));
  assert.throws(() => validateGuideContext("wadokei", { ...clock, radius: null }));
});
test("invented numerical prose is withheld; invalid downstream tools abort a whole native transaction", async () => {
  const r = await runGuide({ exhibit: "chand-baori", question: "Temperature?", context: well }, async () => ({ candidates: [{ content: { parts: [{ text: "It is measured at 999 degrees." }] } }] }));
  assert.ok(!r.explanation.includes("999"));
  let turn = 0;
  await assert.rejects(() => runGuide({ exhibit: "wadokei", question: "An action", context: clock }, async () => {
    turn++;
    return { candidates: [{ content: { parts: [{ functionCall: turn === 1 ? { name: "set_foliot_weights", args: { distance: .95 } } : { name: "execute_code", args: {} } }] } }] };
  }));
  assert.equal(clock.radius, .76);
});
