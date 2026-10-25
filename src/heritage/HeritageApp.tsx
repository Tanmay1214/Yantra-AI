import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Box,
  Check,
  ChevronRight,
  Compass,
  Droplets,
  Layers,
  MessageCircle,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  Send,
  SlidersHorizontal,
  Thermometer,
  X,
} from "lucide-react";
import HeritageScene, {
  type CameraPreset,
  type Selection,
  type ViewMode,
  thermalRGB,
} from "./HeritageScene";
import {
  ASSET_URL,
  BOUNDS,
  DEFAULT,
  MODEL_VERSION,
  PRESETS,
  SOURCES,
  advanceEnvironment,
  compare,
  outputs,
  patchConditions,
  profile,
  temperature,
  validateScenario,
  type Conditions,
  type Scenario,
} from "./environment";
import { useMonumentAsset } from "./useMonumentAsset";
import "./heritage.css";
import { MUSEUM, EXHIBIT_PATHS } from "../museum";
const fmt = (v: number) => v.toFixed(1);
const modes: ViewMode[] = [
  "Explore",
  "Water",
  "Temperature",
  "Cross-section",
  "Environmental",
  "Architecture",
];
const modeIcons = [
  Compass,
  Droplets,
  Thermometer,
  Layers,
  SlidersHorizontal,
  BookOpen,
];
function scenario(name: string, conditions: Conditions): Scenario {
  return {
    id: crypto.randomUUID(),
    name,
    conditions: { ...conditions },
    modelVersion: MODEL_VERSION,
    savedAt: new Date().toISOString(),
  };
}
function initialScenarios() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("chand-scenarios-v1") || "null",
    );
    if (Array.isArray(saved) && saved.length >= 2 && saved.length <= 8)
      return saved.map(validateScenario);
  } catch {}
  return [
    scenario("Baseline study", DEFAULT),
    scenario("Hot summer", PRESETS["Hot summer · hypothetical"]),
  ];
}
function Range({
  label,
  unit = "",
  value,
  min,
  max,
  step = 0.1,
  onChange,
  testId,
}: {
  label: string;
  unit?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
  testId?: string;
}) {
  const [draft, setDraft] = useState(String(value)),
    [error, setError] = useState("");
  useEffect(() => {
    setDraft(String(Number(value.toFixed(3))));
    setError("");
  }, [value]);
  const commit = () => {
    const n = Number(draft);
    if (!draft.trim() || !Number.isFinite(n) || n < min || n > max) {
      setError(`Enter ${min} to ${max} ${unit}`);
      return;
    }
    setError("");
    onChange(n);
  };
  return (
    <label className="range-control">
      <span>
        {label}
        <span className="number-wrap">
          <input
            aria-label={`${label} value`}
            type="number"
            min={min}
            max={max}
            step={step}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
            }}
          />
          {unit}
        </span>
      </span>
      <input
        data-testid={testId}
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {error && <small role="alert">{error}</small>}
    </label>
  );
}
function TemperatureChart({
  conditions,
  comparison,
}: {
  conditions: Conditions;
  comparison?: Conditions;
}) {
  const paths = (c: Conditions) =>
    profile(c)
      .map(
        (p, i) =>
          `${i ? "L" : "M"}${38 + ((p.temperature + 10) / 70) * 244},${22 + (p.depth / c.maxDepth) * 164}`,
      )
      .join(" ");
  return (
    <svg
      className="profile-chart"
      viewBox="0 0 310 224"
      role="img"
      aria-label="Simulated temperature versus depth profile"
    >
      <defs>
        <linearGradient id="thermal">
          <stop stopColor="#2994bf" />
          <stop offset="50%" stopColor="#e8cd4d" />
          <stop offset="100%" stopColor="#e84b26" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line
            x1="38"
            x2="282"
            y1={22 + 164 * f}
            y2={22 + 164 * f}
            stroke="#ffffff14"
          />
          <text x="30" y={26 + 164 * f} textAnchor="end">
            {fmt(conditions.maxDepth * f)}
          </text>
        </g>
      ))}
      {[0, 15, 30, 45, 60].map((t) => (
        <text
          key={t}
          x={38 + ((t + 10) / 70) * 244}
          y="204"
          textAnchor="middle"
        >
          {t}°
        </text>
      ))}
      <path
        d={paths(conditions)}
        fill="none"
        stroke="#d6ba7f"
        strokeWidth="2.5"
      />
      {comparison && (
        <path
          d={paths(comparison)}
          fill="none"
          stroke="#70c5c2"
          strokeDasharray="5 4"
          strokeWidth="2"
        />
      )}
      <circle
        cx={
          38 +
          ((temperature(conditions, conditions.sampleDepth) + 10) / 70) * 244
        }
        cy={22 + (conditions.sampleDepth / conditions.maxDepth) * 164}
        r="4"
        fill="#f5dec0"
      />
      <text x="38" y="12">
        Depth · m
      </text>
      <text x="228" y="220">
        Temperature · °C
      </text>
    </svg>
  );
}
function Heatmap({ c }: { c: Conditions }) {
  return (
    <div
      className="vertical-heatmap"
      aria-label="Computed vertical temperature field"
    >
      {profile(c).map((p, i) => {
        const rgb = thermalRGB(p.temperature).map((x) => Math.round(x * 255));
        return (
          <div
            key={i}
            style={{ background: `rgb(${rgb.join(",")})` }}
            title={`${fmt(p.depth)} m: ${fmt(p.temperature)} °C`}
          />
        );
      })}
    </div>
  );
}
interface GuideResult {
  model: string;
  explanation: string;
  conditions: Conditions;
  results: {
    name: string;
    args: unknown;
    result: unknown;
    conditions: Conditions;
  }[];
}
function VerifiedResult({ value }: { value: unknown }) {
  const v = value as Record<string, unknown>;
  if (
    Array.isArray(value) &&
    value.length &&
    typeof value[0].temperature === "number"
  ) {
    const top = value[0],
      bottom = value[value.length - 1];
    return (
      <p className="verified-answer">
        Estimated air is {fmt(top.temperature)} °C at {fmt(top.depth)} m and{" "}
        {fmt(bottom.temperature)} °C at {fmt(bottom.depth)} m. The difference is{" "}
        {fmt(top.temperature - bottom.temperature)} °C. These are outputs of the
        configured depth model, not site measurements. The profile approaches
        the chosen deep asymptote; solar gain affects the surface boundary.
      </p>
    );
  }
  if (v && typeof v.sampled_C === "number")
    return (
      <p className="verified-answer">
        Water elevation: {fmt(v.waterElevation_m as number)} m. At{" "}
        {fmt(v.selectedDepth_m as number)} m depth, estimated air is{" "}
        {fmt(v.sampled_C)} °C. Top-to-bottom difference:{" "}
        {fmt(v.upperLowerDifference_C as number)} °C. Water temperature is
        independently configured at {fmt(v.configuredWater_C as number)} °C. No
        storage volume has been established.
      </p>
    );
  if (v && typeof v.temperature_C === "number")
    return (
      <p className="verified-answer">
        At {fmt(v.depth_m as number)} m depth, the model estimates{" "}
        {fmt(v.temperature_C)} °C. This is a simulated estimate in the depth
        column.
      </p>
    );
  if (v && typeof v.reason === "string")
    return <p className="verified-answer">{v.reason}</p>;
  if (v?.facts)
    return (
      <div className="verified-answer">
        {SOURCES.slice(0, 2).map((s) => (
          <p key={s.url}>{s.detail}</p>
        ))}
        <p>
          No live environmental observations are connected. Environmental inputs
          are hypothetical.
        </p>
      </div>
    );
  if (v?.delta) {
    const d = v.delta as Record<string, number>;
    return (
      <p className="verified-answer">
        B minus A: water {fmt(d.water_m)} m; outdoor temperature{" "}
        {fmt(d.outdoor_C)} °C; selected-depth air {fmt(d.selectedTemperature_C)}{" "}
        °C. Compare the preserved sample depths before interpreting this
        difference.
      </p>
    );
  }
  return (
    <p className="verified-answer">
      Sources are listed below. Their historical descriptions do not calibrate
      the environmental model.
    </p>
  );
}
function HeritageApp() {
  const [c, setC] = useState<Conditions>({ ...DEFAULT }),
    [baseline, setBaseline] = useState<Conditions>({ ...DEFAULT }),
    [presetName, setPresetName] = useState("Baseline study");
  const [mode, setMode] = useState<ViewMode>("Explore"),
    [camera, setCamera] = useState({
      name: "Overview" as CameraPreset,
      version: 0,
    });
  const [tab, setTab] = useState<
      "Conditions" | "Compare" | "Guide" | "Evidence"
    >("Conditions"),
    [running, setRunning] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null),
    [area, setArea] = useState<number | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>(initialScenarios),
    [scenarioName, setScenarioName] = useState("My experiment"),
    [a, setA] = useState(0),
    [b, setB] = useState(1);
  const [status, setStatus] = useState<{
      ready: boolean;
      models: string[];
      instructions: string;
    }>({
      ready: false,
      models: [],
      instructions: "Checking local Gemma service…",
    }),
    [model, setModel] = useState("");
  const [question, setQuestion] = useState(""),
    [messages, setMessages] = useState<
      { question: string; response?: GuideResult; error?: string }[]
    >([]),
    [asking, setAsking] = useState(false),
    [notice, setNotice] = useState("");
  const {
    asset,
    info,
    status: assetStatus,
    loading: assetLoading,
  } = useMonumentAsset();
  const revision = useRef(0);
  const result = outputs(c);
  const setConditions = useCallback((next: Conditions) => {
    revision.current++;
    setC(next);
  }, []);
  function change(key: keyof Conditions, value: number) {
    try {
      const patch: Partial<Conditions> = { [key]: value };
      if (key === "maxDepth") {
        patch.sampleDepth = Math.min(c.sampleDepth, value);
        patch.waterLevel = Math.max(c.waterLevel, -value);
      }
      setConditions(patchConditions(c, patch));
      setRunning(false);
      setNotice("");
    } catch (e) {
      setNotice(String(e));
    }
  }
  function choosePreset(name: string) {
    setPresetName(name);
    setConditions({ ...PRESETS[name] });
    setBaseline({ ...PRESETS[name] });
    setRunning(false);
  }
  const onArea = useCallback((v: number | null) => setArea(v), []);
  function pick(s: Selection) {
    setSelection(s);
    if (-s.elevation >= 0 && -s.elevation <= c.maxDepth)
      change("sampleDepth", -s.elevation);
  }
  async function connect() {
    try {
      const r = await fetch("/api/heritage/status");
      if (!r.ok) throw new Error();
      const s = await r.json();
      setStatus(s);
      setModel(s.models?.[0] ?? "");
    } catch {
      setStatus({
        ready: false,
        models: [],
        instructions:
          "Local agent service is unavailable. Start the app with npm run dev, or run npm run agent alongside production preview.",
      });
    }
  }
  useEffect(() => {
    void connect();
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("chand-scenarios-v1", JSON.stringify(scenarios));
    } catch {
      setNotice(
        "Browser storage unavailable. Scenarios remain available for this session.",
      );
    }
  }, [scenarios]);
  useEffect(() => {
    if (!running) return;
    let prior = performance.now();
    const timer = setInterval(() => {
      const now = performance.now(),
        days = Math.min((now - prior) / 1000, 0.2);
      prior = now;
      revision.current++;
      setC((old) => advanceEnvironment(old, days));
    }, 100);
    const stop = () => {
      prior = performance.now();
    };
    document.addEventListener("visibilitychange", stop);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", stop);
    };
  }, [running]);
  useEffect(() => {
    if (
      c.elapsedDays >= 365 ||
      (c.waterLevel === 0 && c.levelRate > 0) ||
      (c.waterLevel === -c.maxDepth && c.levelRate < 0)
    )
      setRunning(false);
  }, [c]);
  useEffect(() => {
    const w = window as unknown as { __chand?: () => unknown };
    w.__chand = () => ({
      conditions: c,
      outputs: outputs(c),
      mode,
      assetLoaded: !!asset,
      scenarios,
      area,
    });
    return () => {
      delete w.__chand;
    };
  }, [c, mode, asset, scenarios, area]);
  async function ask(text = question) {
    if (!text.trim() || asking) return;
    setQuestion("");
    setAsking(true);
    setRunning(false);
    const rev = revision.current;
    setMessages((old) => [...old, { question: text }]);
    try {
      const r = await fetch("/api/heritage/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          model,
          context: {
            conditions: c,
            scenarios,
            geometry: {
              surfaceArea_m2: area,
              level_m: c.waterLevel,
              studyDepth_m: c.maxDepth,
              meshCount: info?.meshes.length ?? 0,
              source: info?.file ?? "Missing local asset",
            },
          },
        }),
        signal: AbortSignal.timeout(95000),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Guide unavailable.");
      if (rev !== revision.current)
        throw new Error(
          "Controls changed while Gemma was thinking. The stale result was discarded; ask again.",
        );
      const validated = patchConditions(c, data.conditions);
      setConditions(validated);
      setMessages((old) =>
        old.map((m, i) =>
          i === old.length - 1 ? { ...m, response: data } : m,
        ),
      );
    } catch (e) {
      setMessages((old) =>
        old.map((m, i) =>
          i === old.length - 1
            ? {
                ...m,
                error: e instanceof Error ? e.message : "Guide request failed.",
              }
            : m,
        ),
      );
    } finally {
      setAsking(false);
    }
  }
  const comp =
    scenarios[a] && scenarios[b] ? compare(scenarios[a], scenarios[b]) : null;
  function save() {
    if (scenarios.length >= 8) {
      setNotice("Eight scenario slots are full. Remove a snapshot first.");
      return;
    }
    setScenarios((old) => [
      ...old,
      scenario(scenarioName.trim().slice(0, 80) || "Experiment", c),
    ]);
    setNotice("Scenario saved with inputs and model version.");
  }
  return (
    <div className="heritage-app">
      <header className="museum-header">
        <a className="brand" href="/" aria-label={`Back to ${MUSEUM.name}`}>
          <span className="brand-mark">य</span>
          <span>
            {MUSEUM.name}<span className="brand-sub">BACK TO THE COLLECTION</span>
          </span>
        </a>
        <nav>
          <span className="collection-indicator">
            COLLECTION 02 / WATER ARCHITECTURE
          </span>
          <a href={EXHIBIT_PATHS.wadokei}>
            Wadokei exhibit <ArrowUpRight size={13} />
          </a>
        </nav>
        <button onClick={() => setTab("Evidence")}>
          <span className="status-dot" />
          Illustrative study
        </button>
      </header>
      <main className="exhibit-layout">
        <section
          className="exhibit-stage"
          aria-label="Chand Baori interactive scene"
        >
          <div className="stage-title">
            <p className="eyebrow">ABHANERI, RAJASTHAN · INDIA</p>
            <h1>
              Chand Baori<span>Water, stone & climate.</span>
            </h1>
            <p>A descent into the architecture of water.</p>
          </div>
          <div className="scene-container" data-testid="heritage-scene">
            <SceneError>
              <HeritageScene
                asset={asset}
                conditions={c}
                mode={mode}
                preset={camera}
                onSelect={pick}
                onArea={onArea}
              />
            </SceneError>
          </div>
          {!asset && (
            <div className="missing-monument" data-testid="missing-asset">
              <Box size={33} strokeWidth={1} />
              <span className="eyebrow">
                {assetLoading ? "LOADING THE EXHIBIT" : "MODEL UNAVAILABLE"}
              </span>
              <h2>
                {assetLoading
                  ? "Bringing Chand Baori into view."
                  : "The monument could not load."}
              </h2>
              <p role="status">{assetStatus}</p>
              {!assetLoading && (
                <button className="primary" onClick={() => location.reload()}>
                  <RotateCcw size={14} />
                  Reload exhibit
                </button>
              )}
              <small>
                The colour column is an analytical depth scale, not a
                reconstruction of Chand Baori.
              </small>
            </div>
          )}
          <div className="camera-tools">
            {(
              [
                "Overview",
                "Front",
                "Top",
                "Interior",
                "Lower levels",
              ] as CameraPreset[]
            ).map((name) => (
              <button
                key={name}
                aria-label={`Camera ${name}`}
                onClick={() =>
                  setCamera((old) => ({ name, version: old.version + 1 }))
                }
              >
                {name === "Overview" ? <RotateCcw size={13} /> : null}
                {name}
              </button>
            ))}
          </div>
          {(mode === "Temperature" || mode === "Environmental") && (
            <div className="scene-legend">
              <span>SIMULATED AIR · °C</span>
              <div />
              <p>
                <span>15°</span>
                <span>32.5°</span>
                <span>50°</span>
              </p>
            </div>
          )}
          {mode === "Architecture" && !selection && (
            <div className="selection-card architecture-note">
              <span className="eyebrow">
                HISTORICAL CONTEXT · RAJASTHAN TOURISM
              </span>
              <h3>Access follows the water.</h3>
              <p>
                Paired stairways descend on three sides. A pavilion and
                galleries occupy the fourth. Source-surface markers sample this
                artistic model; they do not establish an archaeological survey.
              </p>
              <a href={SOURCES[0].url} target="_blank" rel="noreferrer">
                Read the historical source <ArrowUpRight size={11} />
              </a>
            </div>
          )}
          {selection && (
            <div className="selection-card">
              <button
                aria-label="Close inspection"
                onClick={() => setSelection(null)}
              >
                <X size={13} />
              </button>
              <span className="eyebrow">MODEL GEOMETRY · SELECTED SURFACE</span>
              <h3>{selection.name}</h3>
              <p>
                Elevation {fmt(selection.elevation)} m ·{" "}
                {selection.elevation <= 0 && selection.elevation >= -c.maxDepth
                  ? `${fmt(temperature(c, -selection.elevation))} °C estimated air`
                  : "Outside the air-study domain"}
              </p>
              <small>
                {selection.elevation < c.waterLevel ? "Below" : "Above"}{" "}
                simulated waterline. Mesh names describe the asset; they do not
                establish historical component names.
              </small>
            </div>
          )}
          <div
            className="view-modes"
            role="group"
            aria-label="Visualisation modes"
          >
            {modes.map((m, i) => {
              const Icon = modeIcons[i];
              return (
                <button
                  key={m}
                  data-testid={`view-${m}`}
                  aria-pressed={mode === m}
                  className={mode === m ? "active" : ""}
                  onClick={() => setMode(m)}
                >
                  <Icon size={15} />
                  <span>{m}</span>
                </button>
              );
            })}
          </div>
          <div className="stage-foot">
            <span>
              <span className="status-dot" />
              {asset
                ? `${info?.meshes.length} source meshes · ${info?.triangles.toLocaleString()} triangles`
                : "Geometry pending · environmental study available"}
              <a
                className="asset-credit"
                href={ASSET_URL}
                target="_blank"
                rel="noreferrer"
              >
                Chand Baori by siddharthbandhu · CC BY 4.0
              </a>
            </span>
            <span>DRAG TO ORBIT · SCROLL TO ZOOM · RIGHT-DRAG TO PAN</span>
          </div>
        </section>
        <aside className="study-panel">
          <div className="panel-heading">
            <span className="eyebrow">EXPLORE THE RELATIONSHIPS</span>
            <h2>Your environmental study</h2>
            <p>Change an input. Follow the evidence.</p>
          </div>
          <div className="panel-tabs" role="tablist">
            {(["Conditions", "Compare", "Guide", "Evidence"] as const).map(
              (t) => (
                <button
                  role="tab"
                  key={t}
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ),
            )}
          </div>
          <div className="panel-scroll">
            {tab === "Conditions" && (
              <>
                <label className="field-label">
                  HYPOTHETICAL SCENARIO
                  <select
                    aria-label="Environmental scenario"
                    value={presetName}
                    onChange={(e) => choosePreset(e.target.value)}
                  >
                    {Object.keys(PRESETS).map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <div className="section-heading">
                  <Droplets size={17} />
                  <h3>Water elevation</h3>
                  <span>USER INPUT</span>
                </div>
                <div className="large-reading" data-testid="water-reading">
                  {fmt(c.waterLevel)}
                  <span>m</span>
                  <small>relative to study top, 0 m</small>
                </div>
                <Range
                  label="Water elevation"
                  unit="m"
                  min={-c.maxDepth}
                  max={0}
                  value={c.waterLevel}
                  onChange={(v) => change("waterLevel", v)}
                />
                <div className="inline-buttons">
                  <button
                    aria-label="Lower water by one metre"
                    onClick={() =>
                      change(
                        "waterLevel",
                        Math.max(-c.maxDepth, c.waterLevel - 1),
                      )
                    }
                  >
                    <ArrowDown size={13} />1 m
                  </button>
                  <button
                    aria-label="Raise water by one metre"
                    onClick={() =>
                      change("waterLevel", Math.min(0, c.waterLevel + 1))
                    }
                  >
                    <ArrowUp size={13} />1 m
                  </button>
                  <button
                    onClick={() => {
                      setConditions({ ...baseline });
                      setRunning(false);
                    }}
                  >
                    <RotateCcw size={13} />
                    Reset scenario
                  </button>
                </div>
                <div className="water-gauge">
                  <span
                    style={{
                      width: `${(1 + c.waterLevel / c.maxDepth) * 100}%`,
                    }}
                  />
                </div>
                <p className="fine-print">
                  Relative column indicator, not a volume fraction. Δ baseline{" "}
                  {fmt(c.waterLevel - baseline.waterLevel)} m.
                </p>
                <dl className="metric-list">
                  <div>
                    <dt>Column above study bottom</dt>
                    <dd>{fmt(result.waterColumn_m)} m</dd>
                  </div>
                  <div>
                    <dt>Raster surface area</dt>
                    <dd>
                      {area === null
                        ? "Unavailable"
                        : `≈ ${area.toFixed(0)} m²*`}
                    </dd>
                  </div>
                  <div>
                    <dt>Stored volume</dt>
                    <dd>Not established</dd>
                  </div>
                </dl>
                {!asset && (
                  <p className="callout">
                    Water remains a numerical scenario until the actual model is
                    loaded. No basin shape or cubic-metre value is assumed.
                  </p>
                )}
                {asset && area === null && (
                  <p className="callout">
                    No enclosed basin mask exists at this elevation. The water
                    surface is hidden to prevent spill outside the supported
                    geometry.
                  </p>
                )}
                <div className="section-heading">
                  <Thermometer size={17} />
                  <h3>Air & shade</h3>
                  <span>ESTIMATES</span>
                </div>
                <Range
                  label="Outdoor air"
                  unit="°C"
                  min={-10}
                  max={55}
                  value={c.outdoor}
                  onChange={(v) => change("outdoor", v)}
                />
                <Range
                  label="Time of day"
                  unit="h"
                  min={0}
                  max={24}
                  step={0.5}
                  value={c.hour}
                  onChange={(v) => change("hour", v)}
                />
                <Range
                  label="Solar exposure"
                  unit="fraction"
                  min={0}
                  max={1}
                  step={0.05}
                  value={c.solar}
                  onChange={(v) => change("solar", v)}
                />
                <Range
                  label="Observation depth"
                  unit="m"
                  min={0}
                  max={c.maxDepth}
                  value={c.sampleDepth}
                  onChange={(v) => change("sampleDepth", v)}
                />
                <div className="zone-buttons">
                  {[
                    ["Upper", 0.15],
                    ["Middle", 0.5],
                    ["Lower", 0.85],
                    ["Near water", -c.waterLevel / c.maxDepth],
                  ].map(([name, f]) => (
                    <button
                      key={name}
                      onClick={() =>
                        change("sampleDepth", Number(f) * c.maxDepth)
                      }
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <div className="temperature-result">
                  <Heatmap c={c} />
                  <div>
                    <span>AT {fmt(c.sampleDepth)} m DEPTH</span>
                    <strong data-testid="temperature-reading">
                      {fmt(result.sampled_C)}
                      <small>°C</small>
                    </strong>
                    <p>
                      Simulated estimate · Δ top to bottom{" "}
                      {fmt(result.upperLowerDifference_C)} °C
                    </p>
                  </div>
                </div>
                <TemperatureChart conditions={c} />
                <details>
                  <summary>
                    Model parameters & time experiment{" "}
                    <ChevronRight size={13} />
                  </summary>
                  <Range
                    label="Deep asymptote"
                    unit="°C"
                    min={0}
                    max={45}
                    value={c.deep}
                    onChange={(v) => change("deep", v)}
                  />
                  <Range
                    label="Characteristic depth L"
                    unit="m"
                    min={0.5}
                    max={30}
                    value={c.lengthScale}
                    onChange={(v) => change("lengthScale", v)}
                  />
                  <Range
                    label="Surface solar gain"
                    unit="°C"
                    min={0}
                    max={12}
                    value={c.solarGain}
                    onChange={(v) => change("solarGain", v)}
                  />
                  <Range
                    label="Study depth / scale"
                    unit="m"
                    min={1}
                    max={40}
                    value={c.maxDepth}
                    onChange={(v) => change("maxDepth", v)}
                  />
                  <Range
                    label="Independent water temperature"
                    unit="°C"
                    min={0}
                    max={45}
                    value={c.waterTemperature}
                    onChange={(v) => change("waterTemperature", v)}
                  />
                  <Range
                    label="Hypothetical level rate"
                    unit="m/day"
                    min={-2}
                    max={2}
                    value={c.levelRate}
                    onChange={(v) => change("levelRate", v)}
                  />
                  <div className="inline-buttons">
                    <button onClick={() => setRunning(!running)}>
                      {running ? <Pause size={13} /> : <Play size={13} />}{" "}
                      {running ? "Pause" : "Run level ramp"}
                    </button>
                    <button
                      onClick={() => setConditions(advanceEnvironment(c, 1))}
                    >
                      +1 day
                    </button>
                  </div>
                  <p className="fine-print">
                    Elapsed {fmt(c.elapsedDays)} days. One animation second =
                    one scenario day. h(t+Δt) = clamp(h + rate × Δt). This
                    prescribed elevation ramp does not model rainfall, flow or
                    groundwater.
                  </p>
                </details>
              </>
            )}
            {tab === "Compare" && (
              <>
                <span className="eyebrow">REPRODUCIBLE SNAPSHOTS</span>
                <h3>Compare two possibilities.</h3>
                <p className="muted">
                  Each snapshot keeps its full inputs and {MODEL_VERSION}.
                  Colours: A gold, B teal.
                </p>
                <div className="save-row">
                  <input
                    aria-label="Scenario name"
                    maxLength={80}
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                  />
                  <button onClick={save}>
                    <Save size={14} />
                    Save
                  </button>
                </div>
                <div className="compare-selectors">
                  {[
                    ["A", a, setA],
                    ["B", b, setB],
                  ].map(([label, index, set]) => (
                    <label key={String(label)}>
                      {String(label)}
                      <select
                        aria-label={`Scenario ${label}`}
                        value={Number(index)}
                        onChange={(e) =>
                          (set as typeof setA)(Number(e.target.value))
                        }
                      >
                        {scenarios.map((s, i) => (
                          <option key={s.id} value={i}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                {comp && (
                  <>
                    <TemperatureChart
                      conditions={scenarios[a].conditions}
                      comparison={scenarios[b].conditions}
                    />
                    <table className="comparison-table">
                      <thead>
                        <tr>
                          <th>Estimate / input</th>
                          <th>A</th>
                          <th>B</th>
                          <th>B − A</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Water · m</td>
                          <td>{fmt(comp.a.waterElevation_m)}</td>
                          <td>{fmt(comp.b.waterElevation_m)}</td>
                          <td>{fmt(comp.delta.water_m)}</td>
                        </tr>
                        <tr>
                          <td>Outdoor · °C</td>
                          <td>{fmt(scenarios[a].conditions.outdoor)}</td>
                          <td>{fmt(scenarios[b].conditions.outdoor)}</td>
                          <td>{fmt(comp.delta.outdoor_C)}</td>
                        </tr>
                        <tr>
                          <td>Selected air · °C</td>
                          <td>{fmt(comp.a.sampled_C)}</td>
                          <td>{fmt(comp.b.sampled_C)}</td>
                          <td>{fmt(comp.delta.selectedTemperature_C)}</td>
                        </tr>
                        <tr>
                          <td>Sample depth · m</td>
                          <td>{fmt(comp.a.selectedDepth_m)}</td>
                          <td>{fmt(comp.b.selectedDepth_m)}</td>
                          <td>—</td>
                        </tr>
                        <tr>
                          <td>Top−bottom · °C</td>
                          <td>{fmt(comp.a.upperLowerDifference_C)}</td>
                          <td>{fmt(comp.b.upperLowerDifference_C)}</td>
                          <td>{fmt(comp.delta.upperLowerDifference_C)}</td>
                        </tr>
                        <tr>
                          <td>Water volume</td>
                          <td colSpan={3}>Not established</td>
                        </tr>
                        <tr>
                          <td>Surface area</td>
                          <td colSpan={3}>
                            Only current loaded-geometry raster available
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p className="fine-print">
                      {comp.note} Charts show relative depth; review each domain
                      depth if different.
                    </p>
                    <div className="inline-buttons">
                      <button
                        onClick={() => {
                          setConditions({ ...scenarios[a].conditions });
                          setBaseline({ ...scenarios[a].conditions });
                          setRunning(false);
                          setMode("Environmental");
                        }}
                      >
                        Apply A to scene
                      </button>
                      <button
                        onClick={() => {
                          setConditions({ ...scenarios[b].conditions });
                          setBaseline({ ...scenarios[b].conditions });
                          setRunning(false);
                          setMode("Environmental");
                        }}
                      >
                        Apply B to scene
                      </button>
                    </div>
                  </>
                )}
                <div className="snapshot-list">
                  {scenarios.map((s, i) => (
                    <article key={s.id}>
                      <span>
                        <strong>{s.name}</strong>
                        <small>
                          {s.modelVersion} · {s.savedAt.slice(0, 10)}
                        </small>
                      </span>
                      <details>
                        <summary>Inputs</summary>
                        <pre>{JSON.stringify(s.conditions, null, 2)}</pre>
                      </details>
                      {scenarios.length > 2 && (
                        <button
                          aria-label={`Remove ${s.name}`}
                          onClick={() => {
                            setScenarios((old) =>
                              old.filter((_, j) => i !== j),
                            );
                            setA(0);
                            setB(1);
                          }}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              </>
            )}
            {tab === "Guide" && (
              <>
                <div className="section-heading">
                  <MessageCircle size={18} />
                  <h3>Ask Yantra</h3>
                  <span>LOCAL GEMMA 4</span>
                </div>
                <div className={`connection ${status.ready ? "online" : ""}`}>
                  <span className="status-dot" />
                  {status.ready ? "Gemma 4 available" : "Gemma 4 offline"}
                  <button onClick={() => void connect()}>Retry</button>
                </div>
                <p className="fine-print">{status.instructions}</p>
                {status.models.length > 0 && (
                  <select
                    aria-label="Gemma model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  >
                    {status.models.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                )}
                <div className="suggested-questions">
                  {[
                    "Lower the water by two metres.",
                    "Is it cooler at the bottom?",
                    "Which values are measured?",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setQuestion(q);
                        if (status.ready) void ask(q);
                      }}
                    >
                      {q}
                      <ArrowUpRight size={12} />
                    </button>
                  ))}
                </div>
                <div className="guide-messages" aria-live="polite">
                  {messages.map((m, i) => (
                    <article key={i}>
                      <p className="visitor-question">{m.question}</p>
                      {m.error && <p className="callout">{m.error}</p>}
                      {m.response && (
                        <>
                          <small>Executed locally · {m.response.model}</small>
                          <p>{m.response.explanation}</p>
                          {m.response.results.map((r, j) => (
                            <div className="tool-result" key={j}>
                              <span className="tool-status">
                                <Check size={13} />
                                {r.name}
                              </span>
                              <VerifiedResult value={r.result} />
                              <p className="fine-print">
                                {r.name.startsWith("set_")
                                  ? "Controls changed to the returned state."
                                  : "Read-only calculation / source lookup."}
                              </p>
                              <details>
                                <summary>Inspect tool result</summary>
                                <pre>{JSON.stringify(r.result, null, 2)}</pre>
                              </details>
                            </div>
                          ))}
                          <div className="source-links">
                            {SOURCES.map((s) => (
                              <a
                                key={s.url}
                                href={s.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {s.name}
                                <ArrowUpRight size={11} />
                              </a>
                            ))}
                          </div>
                        </>
                      )}
                    </article>
                  ))}
                  {asking && (
                    <p>
                      Gemma is selecting tools; arguments will be validated
                      before any change…
                    </p>
                  )}
                </div>
                <form
                  className="guide-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void ask();
                  }}
                >
                  <textarea
                    aria-label="Ask the local guide"
                    maxLength={2000}
                    placeholder="Ask about water, shade or the evidence…"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                  <button
                    className="primary"
                    disabled={!status.ready || asking || !question.trim()}
                  >
                    <Send size={14} />
                    Ask Gemma
                  </button>
                </form>
                <p className="fine-print">
                  Gemma chooses approved tools. Numerical answers are rendered
                  from deterministic tool results. No generated numerical prose
                  is accepted.
                </p>
              </>
            )}
            {tab === "Evidence" && (
              <>
                <span className="eyebrow">EVIDENCE & ASSUMPTIONS</span>
                <h3>A model you can question.</h3>
                <div className="evidence-key">
                  <p>
                    <b>Historical fact</b> Source-backed descriptions of
                    Abhaneri and its criss-cross stairs.
                  </p>
                  <p>
                    <b>Model geometry</b> The creator’s voxel interpretation;
                    not a survey.{" "}
                    {asset
                      ? "Local source geometry is loaded."
                      : "Local asset has not been supplied."}
                  </p>
                  <p>
                    <b>User input</b> All environmental settings and the
                    metres-per-model scaling.
                  </p>
                  <p>
                    <b>Simulated estimate</b> Air profile, depth samples and
                    level ramp.
                  </p>
                  <p>
                    <b>Live observation</b> None. No weather, interior sensor or
                    groundwater feed is connected.
                  </p>
                </div>
                <h3>Thermal model</h3>
                <div className="equation">
                  T(z) = Tdeep + (Ts − Tdeep)e<sup>−z/L</sup>
                  <br />
                  Ts = Tout + G · E · max(0, cos(π(h−12)/12))
                </div>
                <p>
                  z is positive downward from the study top. G is a configurable
                  maximum solar temperature increment, E is exposure fraction, h
                  is clock hour and L is the depth scale. These are
                  demonstration parameters, not Chand Baori measurements. The
                  model can predict warmer depths under cool surface conditions.
                </p>
                <p>
                  Water temperature is configured independently. Changing the
                  water level does not cool the air model. The near-water sample
                  simply moves to a different depth.
                </p>
                <h3>Geometry & water boundary</h3>
                <p>
                  The aged-stone finish adds procedural grain, roughness and
                  fine relief to the source palette regions. Muted soil,
                  vegetation and mineral colours are an artistic surface
                  treatment, not scanned or authenticated historical textures.
                </p>
                <p>
                  With an asset loaded, the highest point becomes 0 m. Its
                  lowest exposed central surface is mapped to the user-selected
                  study depth using a uniform scale. This preserves proportions
                  but is an illustrative calibration. A top-envelope raster and
                  enclosed flood fill approximate a contained water footprint.
                  Roofs can occlude cavities; open or unsupported basins are
                  rejected.
                </p>
                <p>
                  Raster area is conditional on that scale. No storage volume,
                  historical waterline or measured fill fraction is claimed.
                  Cross-section clips a copy of the model; source geometry stays
                  intact.
                </p>
                <div className="source-links">
                  {SOURCES.map((s) => (
                    <a
                      key={s.url}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>
                        {s.name}
                        <small>{s.detail}</small>
                      </span>
                      <ArrowUpRight size={14} />
                    </a>
                  ))}
                </div>
                <p className="fine-print">
                  Asset: “Chand Baori” by siddharthbandhu, CC BY 4.0.{" "}
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Licence
                  </a>
                  . Rendering overlays and scale changes are exhibit additions.
                  Cooling claims in the asset description are not adopted as
                  measured results.
                </p>
              </>
            )}
            {notice && (
              <p className="notice" role="status">
                {notice}
              </p>
            )}
          </div>
          <footer className="panel-footer">
            <span>HYPOTHETICAL · {MODEL_VERSION}</span>
            <button onClick={() => setTab("Evidence")}>
              Model notes <ArrowUpRight size={12} />
            </button>
          </footer>
        </aside>
      </main>
    </div>
  );
}
class SceneError extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="gpu-error">
        The 3D scene could not start. Enable WebGL/hardware acceleration.
        Environmental controls remain available.
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(<HeritageApp />);
