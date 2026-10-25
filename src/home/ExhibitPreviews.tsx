import { useMemo, useState } from "react";
import WadokeiScene, { type ExhibitOptions } from "../WadokeiScene";
import HeritageScene from "../heritage/HeritageScene";
import { useMonumentAsset } from "../heritage/useMonumentAsset";
import { DEFAULT } from "../heritage/environment";
import { makeSimulation } from "../mechanism";

const noop = () => {};
const CLOCK_OPTIONS: ExhibitOptions = {
  mode: "exterior", selected: null, isolate: false, labels: false, path: false,
  camera: { preset: "home", version: 0 },
};
const WELL_PRESET = { name: "Overview", version: 0 } as const;

export function ClockPreview() {
  const [ready, setReady] = useState(false);
  const sim = useMemo(() => {
    const state = makeSimulation();
    // A quiet display model; the full exhibit owns operation and adjustment.
    state.running = false;
    return state;
  }, []);
  return <div className="archive-model" data-testid="clock-preview" data-ready={ready}>
    <WadokeiScene options={CLOCK_OPTIONS} sim={sim} onSelect={noop}
      onReady={() => setReady(true)} onMetrics={noop} />
    {!ready && <p className="archive-loading" role="status">Preparing the clock…</p>}
  </div>;
}

export function WellPreview() {
  const { asset, loading } = useMonumentAsset();
  return <div className="archive-model" data-testid="well-preview" data-ready={!!asset}>
    {asset && <HeritageScene asset={asset} conditions={DEFAULT} mode="Explore"
      preset={WELL_PRESET} onSelect={noop} onArea={noop} />}
    {!asset && <p className="archive-loading" role="status">
      {loading ? "Preparing the stepwell…" : "The stepwell preview is unavailable. You can still enter the exhibit to retry."}
    </p>}
  </div>;
}
