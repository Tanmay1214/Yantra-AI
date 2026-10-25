// Original clock exhibit, retained at /wadokei.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  AudioLines,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Crosshair,
  Expand,
  Eye,
  Focus,
  Layers3,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Sun,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import WadokeiScene, { type ExhibitOptions } from "./WadokeiScene";
import {
  beatPeriod,
  makeSimulation,
  type Preset,
  type ViewMode,
} from "./mechanism";
import { byId, components, sources, tour } from "./inventory";
import "./styles.css";
import { MUSEUM } from "./museum";

declare global {
  interface Window {
    __wadokei?: {
      snapshot: () => Record<string, unknown>;
      select: (id: string) => void;
    };
  }
}
const modeNames: Record<ViewMode, string> = {
  exterior: "Exterior",
  interior: "Interior",
  xray: "X-ray",
  exploded: "Exploded",
  operating: "Operating",
};
const modeNotes: Record<ViewMode, string> = {
  exterior:
    "A complete instrument. Open its housing to follow the movement within.",
  interior:
    "The dial and shutters are removed. Every wheel, arbor and bridge remains in place.",
  xray: "Transparent housing reveals the movement in its assembled position.",
  exploded:
    "Components separate along assembly axes. Return to any view to reassemble.",
  operating:
    "Follow the gold components from the falling weight to the time display.",
};
function App() {
  const sim = useRef(makeSimulation()).current;
  const [options, setOptions] = useState<ExhibitOptions>({
    mode: "exterior",
    selected: null,
    isolate: false,
    labels: false,
    path: false,
    camera: { preset: "home", version: 0 },
  });
  const [tab, setTab] = useState("explore");
  const [ready, setReady] = useState(false);
  const [stats, setStats] = useState({ fps: 0, triangles: 0 });
  const [live, setLive] = useState({ ...sim });
  const [tourIndex, setTourIndex] = useState(0);
  const [audio, setAudio] = useState(false);
  const [help, setHelp] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [season, setSeason] = useState(12);
  const [calibration, setCalibration] = useState("Manual setting");
  const audioCtx = useRef<AudioContext | null>(null);
  const lastStrike = useRef(0);
  const stage = useRef<HTMLDivElement>(null);
  const select = useCallback(
    (id: string | null) =>
      setOptions((o) => ({ ...o, selected: id, isolate: false })),
    [],
  );
  const onReady = useCallback(() => setReady(true), []);
  const onMetrics = useCallback(
    (fps: number, triangles: number) => setStats({ fps, triangles }),
    [],
  );
  const camera = (preset: Preset) =>
    setOptions((o) => ({
      ...o,
      camera: { preset, version: o.camera.version + 1 },
    }));
  function mode(m: ViewMode) {
    setOptions((o) => ({
      ...o,
      mode: m,
      path: m === "operating",
      isolate: false,
      camera: { preset: "home", version: o.camera.version + 1 },
    }));
  }
  function ring() {
    const c = audioCtx.current;
    if (!c) return;
    void c.resume();
    [1, 2.03, 2.71, 4.09].forEach((multiple, i) => {
      const osc = c.createOscillator(),
        gain = c.createGain();
      osc.frequency.value = 620 * multiple;
      gain.gain.setValueAtTime(0.075 / (i + 1), c.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        c.currentTime + 2.7 - i * 0.3,
      );
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 3);
    });
  }
  function toggleSound() {
    if (!audioCtx.current) audioCtx.current = new AudioContext();
    void audioCtx.current.resume();
    setAudio((v) => !v);
  }
  function audition() {
    if (!audioCtx.current) audioCtx.current = new AudioContext();
    void audioCtx.current.resume();
    setAudio(true);
    sim.audition = 0.9;
    setTimeout(ring, 460);
  }
  useEffect(() => {
    const id = setInterval(() => {
      setLive({ ...sim });
      if (sim.strikes > lastStrike.current) {
        if (audio) ring();
        lastStrike.current = sim.strikes;
      }
    }, 80);
    return () => clearInterval(id);
  }, [audio]);
  useEffect(() => {
    window.__wadokei = {
      snapshot: () => ({
        ...sim,
        mode: options.mode,
        selected: options.selected,
        isolate: options.isolate,
        ready,
        stats,
      }),
      select,
    };
    return () => {
      delete window.__wadokei;
    };
  }, [options, ready, stats]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        sim.running = !sim.running;
      }
      if (e.key === "Escape") {
        setHelp(false);
        setOptions((o) => ({ ...o, isolate: false }));
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  function reset() {
    const radius = sim.radius,
      speed = sim.speed;
    Object.assign(sim, makeSimulation(), { radius, speed, running: false });
    lastStrike.current = 0;
    setLive({ ...sim });
    camera("home");
  }
  function stepTour(n: number) {
    const i = (n + tour.length) % tour.length;
    setTourIndex(i);
    setOptions((o) => ({
      ...o,
      selected: tour[i].id,
      isolate: false,
      path: true,
      mode: "operating",
      camera: { preset: "focus", version: o.camera.version + 1 },
    }));
  }
  function openTour() {
    setTab("tour");
    stepTour(0);
  }
  const selected = options.selected ? byId[options.selected] : null;
  const displayedHour = ["九", "八", "七", "六", "五", "四"][
    Math.floor((Math.abs(live.dial) / (Math.PI * 2)) * 12) % 6
  ];
  const evidenceSource = selected
    ? sources.find((s) => s.id === selected.source)
    : null;
  return (
    <div className={`museum ${fullscreen ? "expanded" : ""}`}>
      <header className="topbar">
        <a
          className="wordmark"
          href="/"
          aria-label={`Back to ${MUSEUM.name}`}
        >
          <span className="seal">時</span>
          <span>
            TOKI <small>{MUSEUM.name}</small>
          </span>
        </a>
        <div className="collection-nav">
          <span>THE HOROLOGY COLLECTION</span>
          <span className="nav-divider" /> <b>01</b>
          <span>/ 01</span>
        </div>
        <div className="top-actions">
          <button
            aria-label={audio ? "Mute sound" : "Enable sound"}
            title={audio ? "Mute sound" : "Enable sound"}
            onClick={toggleSound}
          >
            {audio ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <button
            aria-label="Exhibit help"
            title="Exhibit help"
            onClick={() => setHelp(true)}
          >
            <CircleHelp size={18} />
          </button>
          <button className="text-button" onClick={() => setTab("evidence")}>
            <BookOpen size={15} /> Exhibit notes
          </button>
        </div>
      </header>
      <main className="exhibit-layout">
        <section
          className="stage"
          ref={stage}
          aria-label="Interactive 3D Wadokei exhibit"
        >
          <div className="stage-heading">
            <div className="eyebrow">
              <span className="red-line" /> JAPAN · EDO PERIOD
            </div>
            <h1>
              Wadokei<span>和時計</span>
            </h1>
            <p>The shape of unequal time.</p>
            <span className="object-type">SINGLE-FOLIOT LANTERN CLOCK</span>
          </div>
          <div className="mode-switch" role="group" aria-label="View mode">
            {(Object.keys(modeNames) as ViewMode[]).map((m, i) => (
              <button
                key={m}
                data-testid={`mode-${m}`}
                className={options.mode === m ? "active" : ""}
                onClick={() => mode(m)}
              >
                <span className="mode-number">0{i + 1}</span>
                {modeNames[m]}
              </button>
            ))}
          </div>
          <div className="canvas-wrap" data-testid="scene" data-ready={ready}>
            <ErrorBoundary>
              <WadokeiScene
                sim={sim}
                options={options}
                onSelect={select}
                onReady={onReady}
                onMetrics={onMetrics}
              />
            </ErrorBoundary>
          </div>
          {!ready && (
            <div className="loading">
              <span className="loading-ring" />
              Preparing the movement…
            </div>
          )}
          <div className="stage-evidence">
            <span className="dot" /> EXPLANATORY RECONSTRUCTION
          </div>
          <div className="stage-tools">
            <button
              aria-label="Toggle component labels"
              className={options.labels ? "active" : ""}
              title="Component labels"
              onClick={() => setOptions((o) => ({ ...o, labels: !o.labels }))}
            >
              <span className="label-icon">Aa</span>
            </button>
            <button
              aria-label="Toggle power path"
              className={options.path ? "active" : ""}
              title="Highlight the power path"
              onClick={() => setOptions((o) => ({ ...o, path: !o.path }))}
            >
              <Layers3 size={17} />
            </button>
            <button
              aria-label="Expand viewport"
              title="Expand viewport"
              onClick={() => setFullscreen((v) => !v)}
            >
              <Maximize2 size={17} />
            </button>
          </div>
          <div className="camera-presets" aria-label="Camera presets">
            {(["front", "side", "rear", "top"] as Preset[]).map((p) => (
              <button
                key={p}
                data-testid={`camera-${p}`}
                onClick={() => camera(p)}
              >
                {p}
              </button>
            ))}
            <button
              aria-label="Reset camera"
              title="Reset camera"
              data-testid="camera-reset"
              onClick={() => camera("home")}
            >
              <RotateCcw size={14} />
            </button>
          </div>
          <div className="viewport-caption">
            <span className="caption-index">
              {String(
                Object.keys(modeNames).indexOf(options.mode) + 1,
              ).padStart(2, "0")}
            </span>
            <div>
              <strong>{modeNames[options.mode]} view</strong>
              <p>{modeNotes[options.mode]}</p>
            </div>
          </div>
          <div className="orbit-hint">
            <span>↔</span> DRAG TO ORBIT <i /> SCROLL TO ZOOM <i /> RIGHT-DRAG
            TO PAN
          </div>
          <div className="playback">
            <div className="playback-buttons">
              <button
                className="play-button"
                data-testid="play-pause"
                aria-label={live.running ? "Pause clock" : "Start clock"}
                onClick={() => {
                  sim.running = !sim.running;
                  setLive({ ...sim });
                }}
              >
                {live.running ? (
                  <Pause size={16} fill="currentColor" />
                ) : (
                  <Play size={16} fill="currentColor" />
                )}
                <span>{live.running ? "Pause" : "Run clock"}</span>
              </button>
              <button
                className="rewind"
                aria-label="Reset and rewind clock"
                title="Reset and rewind clock"
                data-testid="reset-clock"
                onClick={reset}
              >
                <RotateCcw size={17} />
              </button>
              <span className="toolbar-divider" />
              <label className="speed-label">
                SPEED{" "}
                <select
                  aria-label="Simulation speed"
                  value={live.speed}
                  onChange={(e) => {
                    sim.speed = Number(e.target.value);
                    setLive({ ...sim });
                  }}
                >
                  {[0.25, 1, 4, 12, 24].map((v) => (
                    <option key={v} value={v}>
                      {v}×
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="live-readings">
              <div>
                <span
                  className="live-dot"
                  style={{ opacity: live.running ? 1 : 0.3 }}
                />{" "}
                {live.running ? "MOVEMENT RUNNING" : "MOVEMENT PAUSED"}
              </div>
              <span className="reading">
                <small>BEAT</small>
                {beatPeriod(live.radius).toFixed(2)}
                <em>s</em>
              </span>
              <span className="reading">
                <small>DROP</small>
                {live.travel.toFixed(2)}
                <em>model u</em>
              </span>
              <span
                className="hour-reading"
                title="Current numbered hour in the illustrative model day"
              >
                {displayedHour}
              </span>
            </div>
          </div>
        </section>
        <aside className="sidebar">
          <nav className="panel-tabs" aria-label="Exhibit panels">
            <button
              className={tab === "explore" ? "active" : ""}
              onClick={() => setTab("explore")}
            >
              Explore
            </button>
            <button
              className={tab === "tour" ? "active" : ""}
              onClick={openTour}
            >
              How it works
            </button>
            <button
              className={tab === "evidence" ? "active" : ""}
              onClick={() => setTab("evidence")}
            >
              Evidence
            </button>
          </nav>
          <div className="panel-content">
            {tab === "explore" && (
              <>
                {!selected ? (
                  <div className="panel-intro">
                    <span className="eyebrow">THE INSTRUMENT</span>
                    <h2>
                      Time, released
                      <br />
                      one tooth at a time.
                    </h2>
                    <p>
                      A falling weight. A train of brass wheels. A balance that
                      turns motion into a measured rhythm.
                    </p>
                    <button
                      className="outline-cta"
                      onClick={() =>
                        mode(
                          options.mode === "interior" ? "exterior" : "interior",
                        )
                      }
                    >
                      <Layers3 size={16} />
                      {options.mode === "interior"
                        ? "Close the housing"
                        : "Reveal the movement"}
                      <ArrowRight size={16} />
                    </button>
                    <button className="tour-cta" onClick={openTour}>
                      Take a guided look <ArrowRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="inspector" data-testid="inspector">
                    <div className="inspector-top">
                      <span className="eyebrow">COMPONENT RECORD</span>
                      <button
                        aria-label="Clear selection"
                        onClick={() => select(null)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <span className="japanese-name">{selected.japanese}</span>
                    <h2>{selected.name}</h2>
                    <p>{selected.purpose}</p>
                    <div className="flow-record">
                      <div>
                        <ArrowDown size={12} />
                        <span>
                          <small>DRIVEN BY</small>
                          {selected.input}
                        </span>
                      </div>
                      <div>
                        <ArrowRight size={12} />
                        <span>
                          <small>DRIVES / SUPPORTS</small>
                          {selected.output}
                        </span>
                      </div>
                    </div>
                    {selected.motion && (
                      <div className="motion-state">
                        <span>
                          Current{" "}
                          {selected.motion === "weight"
                            ? "descent"
                            : "coordinate"}
                        </span>
                        <code>
                          {selected.motion === "weight"
                            ? live.travel.toFixed(3) + " u"
                            : (
                                ((live[
                                  selected.motion as keyof typeof live
                                ] as number) *
                                  180) /
                                Math.PI
                              ).toFixed(1) + "°"}
                        </code>
                      </div>
                    )}
                    <div className="inspector-actions">
                      <button
                        data-testid="focus-selected"
                        onClick={() => camera("focus")}
                      >
                        <Focus size={14} /> Focus
                      </button>
                      <button
                        data-testid="isolate-selected"
                        className={options.isolate ? "active" : ""}
                        onClick={() =>
                          setOptions((o) => ({ ...o, isolate: !o.isolate }))
                        }
                      >
                        <Eye size={14} />
                        {options.isolate ? "Show assembly" : "Isolate"}
                      </button>
                    </div>
                    <details className="part-evidence">
                      <summary>
                        Evidence & geometry <ChevronDown size={12} />
                      </summary>
                      <p>{selected.evidence}</p>
                      {evidenceSource && (
                        <a
                          href={evidenceSource.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {evidenceSource.title} ↗
                        </a>
                      )}
                    </details>
                  </div>
                )}
                <div className="component-tree">
                  <div className="section-label">
                    <span>COMPONENT INDEX</span>
                    <span>{components.length} GROUPS</span>
                  </div>
                  {[...new Set(components.map((c) => c.system))].map((s, i) => (
                    <details
                      key={s}
                      open={i === 2 || i === 3 || selected?.system === s}
                    >
                      <summary>
                        <span>
                          <i>{String(i + 1).padStart(2, "0")}</i>
                          {s}
                        </span>
                        <ChevronDown size={13} />
                      </summary>
                      <div>
                        {components
                          .filter((c) => c.system === s)
                          .map((c) => (
                            <button
                              key={c.id}
                              data-testid={`component-${c.id}`}
                              className={
                                options.selected === c.id ? "selected" : ""
                              }
                              onClick={() => select(c.id)}
                            >
                              <span className="tree-branch" />
                              {c.name}
                              <span className="tree-dot" />
                            </button>
                          ))}
                      </div>
                    </details>
                  ))}
                </div>
              </>
            )}
            {tab === "tour" && (
              <div className="tour-panel">
                <div className="eyebrow">FOLLOW THE POWER</div>
                <div className="tour-count">
                  <span>{String(tourIndex + 1).padStart(2, "0")}</span> / 06
                </div>
                <div className="tour-progress">
                  {tour.map((t, i) => (
                    <button
                      key={t.id}
                      aria-label={`Tour step ${i + 1}`}
                      className={
                        i === tourIndex ? "active" : i < tourIndex ? "done" : ""
                      }
                      onClick={() => stepTour(i)}
                    />
                  ))}
                </div>
                <h2>{tour[tourIndex].title}</h2>
                <p>{tour[tourIndex].text}</p>
                <div className="tour-buttons">
                  <button
                    aria-label="Previous tour step"
                    onClick={() => stepTour(tourIndex - 1)}
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    data-testid="next-tour"
                    onClick={() => stepTour(tourIndex + 1)}
                  >
                    {tourIndex === 5 ? "Start again" : "Next step"}
                    <ArrowRight size={16} />
                  </button>
                </div>
                <div className="power-path">
                  {["weight", "great", "escape", "foliot", "dial"].map(
                    (id, i) => (
                      <React.Fragment key={id}>
                        <button
                          className={tour[tourIndex].id === id ? "active" : ""}
                          onClick={() =>
                            stepTour(tour.findIndex((t) => t.id === id))
                          }
                        >
                          <span>0{i + 1}</span>
                          {byId[id].name.split(" ·")[0]}
                        </button>
                        {i < 4 && <ArrowDown size={13} />}
                      </React.Fragment>
                    ),
                  )}
                </div>
                <div className="note-card">
                  <span className="eyebrow">A TWO-WAY RELATIONSHIP</span>
                  <p>
                    The weight drives the train and gives the foliot its
                    impulses. The foliot’s motion controls when the escapement
                    releases the train.
                  </p>
                </div>
                <button
                  className="outline-cta"
                  onClick={() => {
                    setTab("explore");
                    setOptions((o) => ({
                      ...o,
                      camera: { preset: "home", version: o.camera.version + 1 },
                    }));
                  }}
                >
                  Explore on your own
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
            {tab === "evidence" && (
              <div className="evidence-panel">
                <span className="eyebrow">CONTEXT & PROVENANCE</span>
                <h2>
                  A clock for
                  <br />
                  the changing day.
                </h2>
                <p>
                  In Edo-period Japan, daylight and night were each divided into
                  six temporal hours. As the seasons changed, so did the length
                  of an hour.
                </p>
                <div className="day-night">
                  <span>
                    <Sun size={13} /> DAY · SIX HOURS
                  </span>
                  <span>☾ NIGHT · SIX HOURS</span>
                  <div
                    style={{
                      gridTemplateColumns: `${season}fr ${24 - season}fr`,
                    }}
                  >
                    <i />
                    <b />
                  </div>
                </div>
                <label className="range-label">
                  Daylight length <strong>{season} h</strong>
                </label>
                <input
                  aria-label="Illustrative daylight length"
                  type="range"
                  min="9"
                  max="15"
                  step=".5"
                  value={season}
                  onChange={(e) => setSeason(+e.target.value)}
                />
                <p className="small">
                  Illustrative seasonal comparison, not an astronomical
                  calculation. One day hour: {(season / 6).toFixed(2)} modern
                  hours; one night hour: {((24 - season) / 6).toFixed(2)}.
                </p>
                <div className="setting-buttons">
                  {["Day", "Night"].map((s, i) => (
                    <button
                      key={s}
                      onClick={() => {
                        sim.radius = Math.max(
                          0.32,
                          Math.min(
                            0.98,
                            (0.76 * (i ? 24 - season : season)) / 12,
                          ),
                        );
                        setCalibration(`${s} teaching setting`);
                        setLive({ ...sim });
                      }}
                    >
                      {s} weight setting
                    </button>
                  ))}
                </div>
                <p className="small">
                  These teaching presets reposition the one foliot manually. The
                  period curve is approximate. This exhibit has no automatic
                  day/night selector.
                </p>
                <div className="evidence-key">
                  <span>
                    <b className="evidence-dot documented" />
                    Documented principle
                  </span>
                  <p>
                    Weight power, single foliot, adjustable weights, bell,
                    rotating dial and fixed pointer.
                  </p>
                  <span>
                    <b className="evidence-dot inferred" />
                    Explanatory reconstruction
                  </span>
                  <p>
                    Estimated proportions, 48:12 → 40:10 → 36:10 gearing, crown
                    geometry, bearings and panel ornament.
                  </p>
                  <span>
                    <b className="evidence-dot designed" />
                    Exhibit design
                  </span>
                  <p>
                    Timber stand, simplified bell linkage, view modes, overlays
                    and seasonal presets. No historical dimensions or calibrated
                    accuracy are claimed.
                  </p>
                </div>
                <details open className="bibliography">
                  <summary>
                    Research sources <ChevronDown size={14} />
                  </summary>
                  {sources.map((s, i) => (
                    <a key={s.id} href={s.url} target="_blank" rel="noreferrer">
                      <span>0{i + 1}</span>
                      <div>
                        <strong>{s.title} ↗</strong>
                        <p>{s.detail}</p>
                      </div>
                    </a>
                  ))}
                </details>
                <details className="glossary">
                  <summary>
                    Mechanical glossary <ChevronDown size={14} />
                  </summary>
                  {[
                    ["Arbor", "A shaft carrying a wheel, pinion or drum."],
                    ["Pinion", "A small gear driven by a larger wheel."],
                    ["Verge", "The oscillating shaft carrying two pallets."],
                    [
                      "Escapement",
                      "The mechanism that releases and impulses the movement in alternating steps.",
                    ],
                    [
                      "Foliot",
                      "A weighted bar whose inertia affects the beat rate.",
                    ],
                    [
                      "Temporal hour",
                      "One sixth of daylight or one sixth of night.",
                    ],
                  ].map(([a, b]) => (
                    <p key={a}>
                      <strong>{a}</strong>
                      {b}
                    </p>
                  ))}
                </details>
              </div>
            )}
          </div>
          <div className="regulator-control">
            <div className="section-label">
              <span>REGULATE THE RHYTHM</span>
              <span className="tiny-kanji">棒天符</span>
            </div>
            <div className="regulator-heading">
              <h3>Foliot weights</h3>
              <span>
                {beatPeriod(live.radius).toFixed(2)}
                <small> s / beat</small>
              </span>
            </div>
            <div className="balance-diagram">
              <i style={{ left: `${50 - live.radius * 42}%` }} />
              <span />
              <b />
              <i style={{ left: `${50 + live.radius * 42}%` }} />
            </div>
            <input
              data-testid="foliot-slider"
              aria-label="Foliot weight distance"
              type="range"
              min=".32"
              max=".98"
              step=".01"
              value={live.radius}
              onChange={(e) => {
                sim.radius = +e.target.value;
                setLive({ ...sim });
                setCalibration("Manual setting");
              }}
            />
            <div className="range-extents">
              <span>CLOSER · FASTER</span>
              <span>FARTHER · SLOWER</span>
            </div>
            <p>
              Greater distance, greater inertia.
              <br />
              Move the weights and watch the beat change.
            </p>
            <span className="calibration">
              {calibration} · illustrative rate
            </span>
          </div>
        </aside>
      </main>
      <footer className="footer">
        <span>
          <span className="footer-seal">和</span> WADOKEI / OBJECT STUDY 001
        </span>
        <span>HISTORICAL PRINCIPLES · RECONSTRUCTED GEOMETRY</span>
        <span
          className="performance"
          title={`${stats.triangles.toLocaleString()} triangles per rendered frame`}
        >
          {ready ? <Check size={11} /> : null}
          {ready ? "3D LIVE" : "LOADING"}
          {stats.fps > 0 && ` · ${stats.fps} FPS`}
        </span>
      </footer>
      {help && (
        <div className="modal-scrim" onClick={() => setHelp(false)}>
          <section
            className="help-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="dialog-close"
              aria-label="Close help"
              onClick={() => setHelp(false)}
            >
              <X size={18} />
            </button>
            <span className="eyebrow">YOUR VISIT</span>
            <h2 id="help-title">Look closer.</h2>
            <p>
              Drag to orbit. Scroll to zoom. Right-drag to pan. Click a
              component or choose one from the index to inspect it. Focus moves
              the camera; Isolate hides other groups.
            </p>
            <p>
              The view tabs reveal, ghost or separate the housing. Space pauses
              the movement. Reset rewinds the weight and pauses the clock.
              Escape exits isolation.
            </p>
            <p>
              This is an accelerated kinematic teaching reconstruction. The gear
              ratios are exact within the model; historical timing, forces and
              strike counts are not reproduced.
            </p>
            <button
              className="outline-cta"
              onClick={() => {
                setHelp(false);
                openTour();
              }}
            >
              Follow the power
              <ArrowRight size={16} />
            </button>
            <button className="bell-audition" onClick={audition}>
              <AudioLines size={16} /> Audition the bell demonstration
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
class ErrorBoundary extends React.Component<
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
        The 3D scene could not start. Enable WebGL / hardware acceleration and
        reload this page.
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(<App />);
