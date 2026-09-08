import { useEffect, useMemo, useState } from "react";
import { Logo, LogoMotion, Signet, Wordmark, animations, animationNames, sample, type AnimationName } from "@kreiseck/design/logo";
import fileUrl from "../../brand/kasseneck-logo.svg?url";

const SCENARIOS: Record<string, string> = {
  splash: "Splash / Start",
  exit: "Abgang",
  transition: "Übergang",
  loading: "Laden (Schleife)",
  waiting: "Warten (Schleife)",
  state: "Zustand",
  progress: "Fortschritt (von Hand)",
};

const load = (): string[] => {
  try { return JSON.parse(localStorage.getItem("kd-logo-keep") ?? "[]"); } catch { return []; }
};

export function App() {
  const [dark, setDark] = useState(false);
  const [rate, setRate] = useState(1);
  const [markOnly, setMarkOnly] = useState(false);
  const [diff, setDiff] = useState(false);
  const [kept, setKept] = useState<string[]>(load);
  const [replay, setReplay] = useState(0);
  // ?anim=rise&t=1 deep-links a scrub position.
  const params = useMemo(() => new URLSearchParams(location.search), []);
  const [scrubName, setScrubName] = useState<AnimationName>((params.get("anim") as AnimationName) || "heart");
  const [scrubT, setScrubT] = useState(Number(params.get("t") ?? 0.5));

  useEffect(() => { document.body.dataset.mode = dark ? "dark" : "light"; }, [dark]);
  useEffect(() => { try { localStorage.setItem("kd-logo-keep", JSON.stringify(kept)); } catch { /* ignore */ } }, [kept]);

  const ink = dark ? "#F6F8F8" : "#0F2B33";
  const accent = dark ? "#2E9E9B" : "#116B6B";
  const highlight = dark ? "#139E9B" : "#139E9B";
  const toggleKeep = (n: string) => setKept((k) => (k.includes(n) ? k.filter((x) => x !== n) : [...k, n]));
  const groups = useMemo(() => {
    const g: Record<string, AnimationName[]> = {};
    for (const n of animationNames) (g[animations[n].scenario] ??= []).push(n);
    return g;
  }, []);
  const scrubSample = sample(animations[scrubName], scrubT);

  return (
    <main>
      <h1>Kasseneck Logo als Code</h1>
      <p className="lead">Kein Asset, keine Schrift: Zeichen als 8×8-Zellen, Wortmarke als Umrisse. Alles aus <span className="mono">brand/kasseneck-logo.svg</span> und <span className="mono">brand/animations.json</span> gebaut.</p>

      <div className="bar">
        <label><input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} /> Dunkel</label>
        <label><input type="checkbox" checked={markOnly} onChange={(e) => setMarkOnly(e.target.checked)} /> Nur Zeichen</label>
        <label>Tempo <input type="range" min={0.1} max={2} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} /> <span className="mono">{rate.toFixed(1)}×</span></label>
        <button className="primary" onClick={() => setReplay((r) => r + 1)}>Alle neu abspielen</button>
        <span className="mono">behalten: {kept.length ? kept.join(", ") : "—"}</span>
      </div>

      <h2>Datei gegen Code</h2>
      <p className="lead">Oben die SVG-Datei der Marke, darunter die Komponente; „Differenz" legt die Komponente mit Differenz-Mischung über die Datei — bleibt alles schwarz, ist es dasselbe Bild.</p>
      <div className="stack">
        <div className="row"><div className="what">Datei (Umrisse)<br /><span className="mono">brand/kasseneck-logo.svg</span></div><img src={fileUrl} height={96} alt="" style={{ filter: dark ? "invert(1) hue-rotate(180deg)" : undefined }} /></div>
        <div className="row"><div className="what">Komponente<br /><span className="mono">&lt;Logo height=96&gt;</span></div><Logo height={96} ink={ink} accent={accent} /></div>
        <div className="row"><div className="what">Echte Schrift (Archivo 600, −1,5 %)<br /><span className="mono">zum Vergleich</span></div><span className="live" style={{ height: 96, gap: 42 }}><Signet size={96} ink={ink} accent={accent} /><span style={{ fontSize: 106, position: "relative", top: 4 }}>Kasseneck</span></span></div>
        <div className="row">
          <div className="what">Übereinander<br /><label><input type="checkbox" checked={diff} onChange={(e) => setDiff(e.target.checked)} /> Differenz</label></div>
          <div className={"overlay" + (diff ? " diff" : "")} style={{ background: diff ? "#fff" : undefined }}>
            <img src={fileUrl} height={96} alt="" />
            <div className="top"><Logo height={96} ink="#0F2B33" accent="#116B6B" /></div>
          </div>
        </div>
      </div>

      <h2>Größen</h2>
      <div className="ladder">
        {[16, 24, 32, 48, 64, 96, 144].map((s) => (
          <figure key={s}><Signet size={s} ink={ink} accent={accent} /><span className="mono">{s}</span></figure>
        ))}
        {[20, 28, 40, 64].map((h) => (
          <figure key={h}><Logo height={h} ink={ink} accent={accent} /><span className="mono">{h}</span></figure>
        ))}
        <figure><Wordmark height={40} ink={ink} accent={accent} /><span className="mono">Wortmarke 40</span></figure>
      </div>

      <h2>Animationen</h2>
      <p className="lead">Häkchen setzen bei allem, was bleiben soll — die Liste steht oben in der Leiste.</p>
      {Object.entries(groups).map(([scenario, names]) => (
        <section key={scenario}>
          <div className="tag" style={{ margin: "20px 0 8px" }}>{SCENARIOS[scenario] ?? scenario}</div>
          <div className="grid">
            {names.map((n) => (
              <Card key={n} name={n} ink={ink} accent={accent} highlight={highlight} rate={rate} markOnly={markOnly} replay={replay} kept={kept.includes(n)} onKeep={() => toggleKeep(n)} />
            ))}
          </div>
        </section>
      ))}

      <h2>Von Hand scrubben</h2>
      <div className="scrub">
        <div className="tools">
          <select value={scrubName} onChange={(e) => setScrubName(e.target.value as AnimationName)}>
            {animationNames.map((n) => <option key={n} value={n}>{animations[n].de} ({n})</option>)}
          </select>
          <input type="range" min={0} max={1} step={0.001} value={scrubT} onChange={(e) => setScrubT(Number(e.target.value))} style={{ width: 360 }} />
          <span className="mono">t = {scrubT.toFixed(3)} · {Math.round(scrubT * animations[scrubName].duration)} ms</span>
        </div>
        <div className="stage">
          {markOnly ? <Signet size={96} ink={ink} accent={accent} highlight={highlight} cells={scrubSample.cells} pixels={scrubSample.pixels} /> : <Logo height={96} ink={ink} accent={accent} highlight={highlight} cells={scrubSample.cells} glyphs={scrubSample.glyphs} pixels={scrubSample.pixels} />}
        </div>
      </div>

      <h2>Auswahl</h2>
      <div className="keep mono">{kept.length ? kept.map((n) => `${n} (${animations[n]?.de ?? "?"})`).join(" · ") : "Noch nichts behalten."}</div>
    </main>
  );
}

function Card({ name, ink, accent, highlight, rate, markOnly, replay, kept, onKeep }: { name: AnimationName; ink: string; accent: string; highlight: string; rate: number; markOnly: boolean; replay: number; kept: boolean; onKeep: () => void }) {
  const a = animations[name];
  const [key, setKey] = useState(0);
  const [loop, setLoop] = useState<boolean | undefined>(undefined);
  const [done, setDone] = useState(false);
  useEffect(() => { setDone(false); }, [key, replay]);
  return (
    <div className={"card" + (kept ? " kept" : "")}>
      <header>
        <b>{a.de}</b>
        <span className="mono">{name} · {a.duration} ms{a.loop ? " · Schleife" : ""}{done ? " · fertig" : ""}</span>
      </header>
      <div className={"stage" + (markOnly ? " mark" : "")}>
        <LogoMotion animation={name} height={markOnly ? 80 : 48} wordmark={!markOnly} ink={ink} accent={accent} highlight={highlight} rate={rate} loop={loop} playKey={`${key}-${replay}`} onDone={() => setDone(true)} />
      </div>
      <div className="tools">
        <button onClick={() => setKey((k) => k + 1)}>Abspielen</button>
        <label><input type="checkbox" checked={loop ?? a.loop} onChange={(e) => setLoop(e.target.checked)} /> Schleife</label>
        <label style={{ marginLeft: "auto" }}><input type="checkbox" checked={kept} onChange={onKeep} /> behalten</label>
      </div>
    </div>
  );
}
