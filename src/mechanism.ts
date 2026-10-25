export const TAU = Math.PI * 2;
export const TRAIN = {
  great: 48,
  secondPinion: 12,
  second: 40,
  thirdPinion: 10,
  third: 36,
  escapePinion: 10,
  crown: 15,
  drumRadius: 0.22,
} as const;
export const ESCAPE_RATIO =
  -(TRAIN.great / TRAIN.secondPinion) *
  (TRAIN.second / TRAIN.thirdPinion) *
  (TRAIN.third / TRAIN.escapePinion);
export const MAX_DROP = 1.05;
export interface Simulation {
  beats: number;
  travel: number;
  escape: number;
  third: number;
  second: number;
  great: number;
  dial: number;
  foliot: number;
  hammer: number;
  strikes: number;
  running: boolean;
  radius: number;
  speed: number;
  audition: number;
}
export function makeSimulation(): Simulation {
  return {
    beats: 0,
    travel: 0,
    escape: 0,
    third: 0,
    second: 0,
    great: 0,
    dial: 0,
    foliot: 0.48,
    hammer: 0,
    strikes: 0,
    running: true,
    radius: 0.76,
    speed: 1,
    audition: 0,
  };
}
export function beatPeriod(radius: number) {
  return (
    0.94 * Math.sqrt((0.12 + 2 * radius * radius) / (0.12 + 2 * 0.76 * 0.76))
  );
}
const smooth = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};
export function poseAt(beats: number) {
  const whole = Math.floor(beats),
    phase = beats - whole;
  // One tooth per complete foliot oscillation, two alternate pallet releases.
  const metered = whole + smooth((phase - 0.74) / 0.25);
  const escape = (metered * Math.PI) / TRAIN.crown;
  const third = -escape / (TRAIN.third / TRAIN.escapePinion);
  const second = -third / (TRAIN.second / TRAIN.thirdPinion);
  const great = -second / (TRAIN.great / TRAIN.secondPinion);
  return {
    escape,
    third,
    second,
    great,
    dial: -great,
    travel: Math.abs(great) * TRAIN.drumRadius,
    foliot: 0.48 * Math.cos(Math.PI * beats),
  };
}
export function advance(sim: Simulation, delta: number) {
  if (!Number.isFinite(delta) || delta <= 0) return;
  const auditioning = sim.audition > 0;
  if (auditioning) {
    sim.audition = Math.max(0, sim.audition - Math.min(delta, 0.05));
    sim.hammer = Math.sin((sim.audition / 0.9) * Math.PI) * 0.7;
  }
  if (!sim.running) return;
  // Visibility changes reset the frame delta in the scene; clamp stalls too.
  const next =
    sim.beats + (Math.min(delta, 0.05) * sim.speed) / beatPeriod(sim.radius);
  const pose = poseAt(next);
  if (pose.travel >= MAX_DROP) {
    sim.running = false;
    return;
  }
  const priorHour = Math.floor((Math.abs(sim.dial) / TAU) * 12);
  Object.assign(sim, pose, { beats: next });
  const hour = Math.floor((Math.abs(sim.dial) / TAU) * 12);
  sim.strikes += Math.max(0, hour - priorHour);
  const hourProgress = ((Math.abs(sim.dial) / TAU) * 12) % 1;
  if (!auditioning)
    sim.hammer =
      hourProgress > 0.84
        ? Math.sin(((hourProgress - 0.84) / 0.16) * Math.PI) * 0.6
        : 0;
}
export type ViewMode =
  | "exterior"
  | "interior"
  | "xray"
  | "exploded"
  | "operating";
export type Preset = "home" | "front" | "side" | "rear" | "top" | "focus";
