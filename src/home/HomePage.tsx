import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { ArrowDown, ArrowRight, ArrowUpRight, MoveUpRight } from "lucide-react";
import { EXHIBIT_PATHS, MUSEUM } from "../museum";
import "./home.css";

const ClockPreview = lazy(() => import("./ExhibitPreviews").then(m => ({ default: m.ClockPreview })));
const WellPreview = lazy(() => import("./ExhibitPreviews").then(m => ({ default: m.WellPreview })));

class PreviewBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed
      ? <p className="archive-loading" role="status">3D preview unavailable on this device. The exhibit notes are still available inside.</p>
      : this.props.children;
  }
}

function Preview({ kind }: { kind: "clock" | "well" }) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { rootMargin: "160px" });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={host} className={`archive-preview archive-preview-${kind}`}
    role="region" aria-label={`${kind === "clock" ? "Wadokei" : "Chand Baori"} 3D preview`}>
    <div className="archive-preview-meta"><span>{kind === "clock" ? "01 / MECHANISMS" : "02 / WATER ARCHITECTURE"}</span><span>LIVE 3D STUDY</span></div>
    <PreviewBoundary>
      <Suspense fallback={<p className="archive-loading" role="status">Preparing the collection…</p>}>
        {visible && (kind === "clock" ? <ClockPreview /> : <WellPreview />)}
      </Suspense>
    </PreviewBoundary>
    <span className="archive-orbit-note"><span aria-hidden="true">↔</span> Drag to look around</span>
    <span className="archive-specimen" aria-hidden="true">{kind === "clock" ? "FIG. 01" : "FIG. 02"}</span>
  </div>;
}

function ArchiveMark() {
  return <svg className="archive-mark" width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
    <path d="M2 2h30v30H2zM8 8h18v18H8zM14 14h6v6h-6zM2 2l12 12m6 6 12 12M32 2 20 14M14 20 2 32" stroke="currentColor" strokeWidth=".8" />
  </svg>;
}

function HomePage() {
  const isHome = location.pathname.replace(/\/+$/, "") === "";
  return <div className="archive-page">
    <a className="archive-skip" href="#main-content">Skip to content</a>
    <header className="archive-header">
      <a className="archive-wordmark" href="/" aria-label={`${MUSEUM.name} home`}><ArchiveMark /><span>{MUSEUM.name}</span></a>
      <span className="archive-header-note">HISTORICAL INGENUITY, EXPLORED.</span>
      <nav aria-label="Museum navigation"><a href="/#collection">The collection <span>02</span></a><a href="/#approach">Our approach <ArrowUpRight size={14} /></a></nav>
    </header>
    {isHome ? <main id="main-content">
      <section className="archive-introduction" aria-labelledby="archive-title">
        <div><p className="archive-kicker">AN OPEN INVITATION TO LOOK CLOSER</p>
          <h1 id="archive-title">The past is<br />still in <em>motion.</em></h1>
        </div>
        <div className="archive-intro-note"><span className="archive-small-rule" />
          <p>{MUSEUM.descriptor}</p>
          <p className="archive-muted">Step inside a mechanism. Descend into architecture. Discover the ideas that make them work.</p>
          <a className="archive-text-link" href="#collection">Explore the collection <ArrowDown size={16} /></a>
        </div>
      </section>

      <section id="collection" className="archive-collection" aria-labelledby="collection-title">
        <div className="archive-section-heading"><h2 id="collection-title">The collection</h2><p>TWO STUDIES IN HUMAN INGENUITY <span aria-hidden="true">↙</span></p></div>
        <div className="archive-exhibits">
          <article className="archive-exhibit archive-clock">
            <Preview kind="clock" />
            <div className="archive-exhibit-caption"><div><p className="archive-kicker">JAPAN · TIME & MECHANISM</p><h3><a href={EXHIBIT_PATHS.wadokei}>Wadokei</a></h3><p>A world of motion,<br />one measured moment at a time.</p></div>
              <a className="archive-entry" href={EXHIBIT_PATHS.wadokei} aria-label="Enter Wadokei exhibit"><MoveUpRight size={23} /><span>Enter exhibit</span></a>
            </div>
            <p className="archive-exhibit-detail">Open the housing, separate the assembly and follow the path from falling weight to turning dial.</p>
            <div className="archive-exhibit-footer"><span>INTERACTIVE MECHANICAL RECONSTRUCTION</span><span>01</span></div>
          </article>
          <article className="archive-exhibit archive-well">
            <Preview kind="well" />
            <div className="archive-exhibit-caption"><div><p className="archive-kicker">ABHANERI, INDIA · WATER & ARCHITECTURE</p><h3><a href={EXHIBIT_PATHS.chandBaori}>Chand Baori</a></h3><p>An architecture of descent.<br />An invitation to experiment.</p></div>
              <a className="archive-entry" href={EXHIBIT_PATHS.chandBaori} aria-label="Enter Chand Baori exhibit"><MoveUpRight size={23} /><span>Enter exhibit</span></a>
            </div>
            <p className="archive-exhibit-detail">Move the waterline, investigate estimated temperatures at depth and compare conditions in an environmental study.</p>
            <div className="archive-exhibit-footer"><span>INTERACTIVE ENVIRONMENTAL STUDY</span><span>02</span></div>
          </article>
        </div>
      </section>

      <section id="approach" className="archive-approach" aria-labelledby="approach-title">
        <div className="archive-approach-intro"><p className="archive-kicker">MORE THAN SOMETHING TO LOOK AT</p><h2 id="approach-title">History, with<br />room for curiosity.</h2><p>These exhibits bring historical ideas into view through models you can explore and experiments you can repeat.</p><span className="archive-approach-symbol" aria-hidden="true">↗</span></div>
        <div className="archive-principles">
          <div><span>01</span><section><h3>Look beneath the surface.</h3><p>Rotate an object, reveal its construction and see how individual parts belong to a larger system.</p></section></div>
          <div><span>02</span><section><h3>Change something. Follow the result.</h3><p>Adjust a regulator or a water level. Use the exhibit’s controls to investigate how its model responds.</p></section></div>
          <div><span>03</span><section><h3>Know what you’re looking at.</h3><p>Historical evidence, reconstructed geometry and simulated estimates are labelled separately. These are explanatory models, with their assumptions in view.</p></section></div>
        </div>
      </section>

      <section className="archive-reading" aria-labelledby="reading-title"><p className="archive-kicker" id="reading-title">FOLLOW THE EVIDENCE</p><p>Every study begins with a source.<br /><span>Find detailed references and model limitations inside each exhibit.</span></p><div><a href="https://www.jcwa.or.jp/en/etc/wadokei.html" target="_blank" rel="noreferrer">Japanese timekeeping <ArrowUpRight size={14} /><small>Japan Clock & Watch Association</small></a><a href="https://www.tourism.rajasthan.gov.in/content/rajasthan-tourism/en/tourist-destinations/chand-baori.html" target="_blank" rel="noreferrer">Chand Baori <ArrowUpRight size={14} /><small>Rajasthan Tourism</small></a></div></section>
    </main> : <main id="main-content" className="archive-not-found"><p className="archive-kicker">A PATH OUTSIDE THE COLLECTION</p><h1>Nothing on display here.</h1><p>This address doesn’t match an exhibit.</p><a href="/" className="archive-text-link">Return to the archive <ArrowRight size={16} /></a></main>}
    <footer className="archive-footer"><a className="archive-footer-name" href="/">{MUSEUM.name}<span>A continuing study of how things work.</span></a><div><a href={EXHIBIT_PATHS.wadokei}>Wadokei <ArrowUpRight size={12} /></a><a href={EXHIBIT_PATHS.chandBaori}>Chand Baori <ArrowUpRight size={12} /></a></div><p>Independent educational project.<br />Chand Baori model by <a href="https://sketchfab.com/3d-models/chand-baori-0fec124478454f74be29a9bd3e5534b8" target="_blank" rel="noreferrer">siddharthbandhu</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a><br />Presentation materials adapted; original geometry retained.</p></footer>
  </div>;
}

createRoot(document.getElementById("root")!).render(<HomePage />);
