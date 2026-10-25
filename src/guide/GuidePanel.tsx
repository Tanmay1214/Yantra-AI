import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, LoaderCircle, Send } from "lucide-react";
import { bibliography, executeGuideTool, fingerprint, validateGuideContext, type Context, type Exhibit, type GuideReply, type Turn, type ToolResult } from "./tools";
import "./guide.css";

interface Props { exhibit: Exhibit; getContext: () => Context; onApply: (context: Context, reply: GuideReply) => void }
interface Message { question: string; reply?: GuideReply; error?: string }
export function GuidePanel({ exhibit, getContext, onApply }: Props) {
  const [status, setStatus] = useState({ ready: false, model: "", instructions: "Connecting to hosted Gemma…" });
  const [question, setQuestion] = useState(""), [messages, setMessages] = useState<Message[]>([]), [busy, setBusy] = useState(false);
  const latest = useRef({ getContext, onApply }); latest.current = { getContext, onApply };
  const alive = useRef(true), pending = useRef(false), abort = useRef<AbortController | null>(null), end = useRef<HTMLDivElement>(null);
  async function connect() {
    try {
      const r = await fetch("/api/heritage/status", { signal: AbortSignal.timeout(26000) });
      if (!r.ok) throw new Error();
      const s = await r.json(); if (alive.current) setStatus(s);
    } catch { if (alive.current) setStatus({ ready: false, model: "", instructions: "Guide service unavailable. Start npm run dev, or npm run agent alongside preview. All exhibit controls still work." }); }
  }
  useEffect(() => {
    alive.current = true; void connect();
    return () => { alive.current = false; abort.current?.abort(); };
  }, []);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [messages, busy]);
  async function ask(text = question) {
    if (!text.trim() || pending.current || !status.ready) return;
    pending.current = true; setBusy(true); setQuestion("");
    const context = validateGuideContext(exhibit, latest.current.getContext());
    const before = fingerprint(exhibit, context);
    const history: Turn[] = messages.filter(m => m.reply).slice(-6).map(m => ({ question: m.question, answer: m.reply!.explanation }));
    setMessages(old => [...old.slice(-5), { question: text.trim() }]);
    const controller = new AbortController(); abort.current = controller;
    const timeout = setTimeout(() => controller.abort(), 140000);
    try {
      const r = await fetch("/api/heritage/guide", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exhibit, question: text.trim(), context, history }), signal: controller.signal });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "The hosted guide is unavailable.");
      if (!alive.current) return;
      if (before !== fingerprint(exhibit, validateGuideContext(exhibit, latest.current.getContext()))) throw new Error("You changed the controls while Gemma was thinking. Nothing from this reply was applied; ask again.");
      if (data.exhibit !== exhibit || !Array.isArray(data.results) || data.results.length > 9 || typeof data.explanation !== "string") throw new Error("Invalid guide response. No changes were applied.");
      // Replay the complete transaction locally before touching live controls.
      let next = context;
      const verified: ToolResult[] = data.results.map((t: { name: string; args: unknown }) => { const step = executeGuideTool(exhibit, next, t.name, t.args); next = step.context; return step.tool; });
      const reply: GuideReply = { ...data, results: verified, sources: bibliography(exhibit) };
      if (verified.some(t => t.changed)) latest.current.onApply(next, reply);
      setMessages(old => old.map((m, i) => i === old.length - 1 ? { ...m, reply } : m));
    } catch (e) {
      if (alive.current) setMessages(old => old.map((m, i) => i === old.length - 1 ? { ...m, error: controller.signal.aborted ? "The guide took too long. No changes were applied; try again." : e instanceof Error ? e.message : "Guide unavailable." } : m));
    } finally { clearTimeout(timeout); pending.current = false; if (alive.current) setBusy(false); }
  }
  const prompts = exhibit === "wadokei"
    ? ["Open the clock and show me the escapement.", "Move the foliot weights outward to 0.95 and explain the change.", "Walk me through the power path."]
    : ["Lower the water by two metres.", "Is it cooler at the bottom?", "Compare my two saved scenarios."];
  return <section className="yantra-guide" aria-label="Gemma museum guide">
    <div className="yg-heading"><span className="yg-kicker">ASK YANTRA</span><h3>A little curiosity.<br />A closer understanding.</h3></div>
    <div className={`yg-connection ${status.ready ? "yg-connected" : ""}`}><span aria-hidden="true" />{status.ready ? "Gemma 4 · hosted API" : "Guide unavailable"}<button type="button" onClick={() => void connect()} aria-label="Retry guide connection">Retry</button></div>
    {!status.ready && <p className="yg-note" role="status">{status.instructions}</p>}
    {!messages.length && <><p className="yg-intro">Ask about what you see, or change the experiment in your own words.</p><div className="yg-suggestions">{prompts.map(q => <button key={q} disabled={!status.ready || busy} onClick={() => void ask(q)}>{q}<ArrowUpRight size={13} /></button>)}</div></>}
    <div className="yg-messages" aria-live="polite" aria-busy={busy}>
      {messages.map((m, i) => <article key={i}><p className="yg-question">{m.question}</p>
        {m.error && <p className="yg-error" role="alert">{m.error}</p>}
        {m.reply && <><p className="yg-answer">{m.reply.explanation}</p>
          <div className="yg-verified" aria-label="Verified tool results">{m.reply.results.filter((t, j) => j > 0 || m.reply!.results.length === 1).map((t,j) => <p key={j}><Check size={12} /><span>{t.summary}</span></p>)}</div>
          {m.reply.results.some(t => t.changed) && <p className="yg-applied">Changes applied to the exhibit.</p>}
          <details className="yg-evidence"><summary>Sources & tool details</summary><small>{m.reply.model} · Gemini API</small>{m.reply.sources.map(s => <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.name}<ArrowUpRight size={11} /></a>)}<pre>{JSON.stringify(m.reply.results.map(({ name, args, result }) => ({ name, args, result })), null, 2)}</pre></details>
        </>}
      </article>)}
      {busy && <p className="yg-working" role="status"><LoaderCircle size={14} />Gemma is checking the exhibit and its tools…</p>}
      <div ref={end} />
    </div>
    <form className="yg-form" onSubmit={e => { e.preventDefault(); void ask(); }}><label className="yg-sr-only" htmlFor={`guide-${exhibit}`}>Ask the museum guide</label><textarea id={`guide-${exhibit}`} aria-label="Ask the museum guide" placeholder={exhibit === "wadokei" ? "Ask about a part, or change the clock…" : "Ask about water, depth or a scenario…"} rows={2} maxLength={2000} value={question} disabled={busy} onChange={e => setQuestion(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void ask(); } }} /><button type="submit" disabled={!status.ready || busy || !question.trim()}><Send size={14} />Ask Gemma</button></form>
    <p className="yg-note">Gemma explains. Verified tools calculate and change the exhibit. Explanatory models; no live measurements.</p>
  </section>;
}
