import test from "node:test";
import assert from "node:assert/strict";
import {
  advance,
  beatPeriod,
  makeSimulation,
  MAX_DROP,
  poseAt,
  TRAIN,
} from "../src/mechanism.ts";
import { components, sources } from "../src/inventory.ts";
const near = (a: number, b: number, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) < tol, `${a} != ${b}`);
test("all three meshing pairs obey signed tooth-count ratios and dial motion-work is 1:1", () => {
  for (const b of [0.2, 0.9, 1.8, 6.9, 31.82, 200.95]) {
    const p = poseAt(b);
    near(p.second, (-p.great * 48) / 12);
    near(p.third, (-p.second * 40) / 10);
    near(p.escape, (-p.third * 36) / 10);
    near(p.dial, -p.great);
    near(p.travel, Math.abs(p.great) * TRAIN.drumRadius);
  }
});
test("crown locks for most of a beat and releases half a tooth per alternating pallet", () => {
  near(poseAt(0.1).escape, poseAt(0.7).escape);
  assert.ok(poseAt(0.9).escape > poseAt(0.7).escape);
  near(poseAt(2).escape - poseAt(0).escape, (Math.PI * 2) / 15);
  near(poseAt(1).foliot, -poseAt(0).foliot);
});
test("outward regulator weights slow the beat and changing radius does not jump the phase", () => {
  assert.ok(beatPeriod(0.98) > beatPeriod(0.32));
  const a = makeSimulation(),
    b = makeSimulation();
  a.radius = 0.32;
  b.radius = 0.98;
  for (let i = 0; i < 40; i++) {
    advance(a, 0.025);
    advance(b, 0.025);
  }
  assert.ok(a.beats > b.beats);
  const before = poseAt(a.beats);
  a.radius = 0.98;
  near(poseAt(a.beats).escape, before.escape);
});
test("pause freezes the full connected power chain; reset restores a wound state", () => {
  const s = makeSimulation();
  for (let i = 0; i < 200; i++) advance(s, 0.016);
  s.running = false;
  const before = { ...s };
  advance(s, 0.04);
  assert.deepEqual(s, before);
  Object.assign(s, makeSimulation());
  near(s.travel, 0);
  near(s.escape, 0);
  assert.equal(s.strikes, 0);
});
test("equal simulated duration is stable across frame rates; tab stalls are clamped", () => {
  const a = makeSimulation(),
    b = makeSimulation();
  for (let i = 0; i < 600; i++) advance(a, 1 / 60);
  for (let i = 0; i < 300; i++) advance(b, 1 / 30);
  near(a.beats, b.beats, 1e-10);
  near(a.escape, b.escape, 1e-8);
  const prior = a.beats;
  advance(a, 100);
  assert.ok(a.beats - prior < 0.06);
  advance(a, NaN);
  assert.ok(Number.isFinite(a.beats));
});
test("hour boundaries produce strikes from dial position and runout stops above the base", () => {
  const s = makeSimulation();
  s.speed = 24;
  for (let i = 0; i < 50000 && s.running; i++) advance(s, 0.05);
  assert.equal(s.running, false);
  assert.ok(s.travel <= MAX_DROP);
  assert.equal(s.strikes, Math.floor((Math.abs(s.dial) / Math.PI / 2) * 12));
  assert.ok(s.strikes > 0);
  assert.ok(2.1 - 0.63 - s.travel > 0.31);
});
test("every selectable component carries evidence, a source and explicit reconstruction status", () => {
  assert.equal(new Set(components.map((c) => c.id)).size, components.length);
  for (const c of components) {
    assert.ok(c.purpose && c.input && c.output && c.evidence);
    assert.ok(sources.some((s) => s.id === c.source));
    assert.equal(c.position.length, 3);
    assert.equal(c.explode.length, 3);
  }
});
