import { useEffect, useRef } from 'react';
import { GLYPHS, SIGNS } from './astro.js';
import { ING, PALETTE, PORTRAIT, creatureFor } from './kaiser.js';
import { cardArtFor } from './cardArt.js';
import GlyphTrio from './GlyphTrio.jsx';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function Starfield({ signs }) {
  const cv = useRef(null);
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    c.width = r.width * dpr; c.height = r.height * dpr;
    const x = c.getContext('2d'); x.scale(dpr, dpr);
    let seed = signs[0] * 144 + signs[1] * 12 + signs[2] + 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(245,233,241,${0.15 + rnd() * 0.6})`; const s = rnd() * 1.4; x.fillRect(rnd() * r.width, rnd() * r.height, s, s); }
    const pts = Array.from({ length: 7 }, () => [r.width * (0.18 + rnd() * 0.64), r.height * (0.12 + rnd() * 0.4)]);
    x.strokeStyle = 'rgba(236,201,133,.45)'; x.lineWidth = 0.8; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(...p) : x.moveTo(...p)); x.stroke();
    pts.forEach(p => { x.fillStyle = '#ecc985'; x.beginPath(); x.arc(p[0], p[1], 1.8, 0, 7); x.fill(); });
  }, [signs.join()]);
  return <canvas ref={cv} aria-hidden="true" />;
}

/**
 * signs: [sun, moon, rising] indices, or null for the empty state.
 * artUrl: optional finished portrait (spreadsheet "Art file / link" column) — replaces the starfield placeholder.
 */
export default function CreatureCard({ signs, moonApprox = false, timeUnknown = false, artUrl }) {
  if (!signs) {
    return (
      <div className="empty-card">
        <strong>Still in the fitting room</strong>
        <span>{timeUnknown
          ? 'Kaiser names creatures from all three placements. Without a birth time there is no Rising, so this one waits for the hour.'
          : 'Fill in the fitting ticket above. The three rings have to line up before Kaiser names anything.'}</span>
      </div>
    );
  }
  const cr = creatureFor(signs);
  const sorted = [...signs].sort((a, b) => a - b);
  const counts = {}; signs.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
  const dom = +Object.keys(counts).sort((a, b) => counts[b] - counts[a] || (+b === signs[0]) - (+a === signs[0]))[0];
  const accent = PALETTE[ING[SIGNS[dom]].palette] || '#ff2e9a';
  const read = (s) => `${cap(ING[SIGNS[s]].drives)}. ${cap(ING[SIGNS[s]].shorthand)}.`;
  const [sun, moon, rising] = signs;
  const finishedArt = artUrl || cardArtFor(signs);

  return (
    <article className="creature" style={{ '--accent': accent }}>
      <div>
        <div className={`artframe${finishedArt ? ' artframe--finished' : ''}`}>
          <div className="inner">
            {finishedArt ? <img className="finished-card" src={finishedArt} alt={`Finished illustrated bestiary card: ${cr.name}`} />
              : <><Starfield signs={signs} /><div className="cap"><GlyphTrio signs={signs} className="trio" /><span className="soon">Portrait in production</span></div></>}
          </div>
        </div>
        <div className="plate">{cr.id} · {sorted.map(s => SIGNS[s]).join(' · ')}</div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="c-meta">
          <span className="badge">{cr.kind}</span>
          <span className="badge" style={{ '--accent': 'var(--brass-hi)' }}>{cr.pattern}</span>
          <span className="mono" style={{ fontSize: '.78rem', color: 'var(--ink-dim)' }}>{signs.map(s => ING[SIGNS[s]].element).join(' / ')}</span>
        </div>
        <h3 className="c-name">The <em>{cr.name.replace(/^The /, '')}</em></h3>
        <div className="verdict">
          <img src={PORTRAIT} alt="Kaiser peering over his glasses" />
          <div className="bubble"><p><b>Gurl.</b> {cr.reveal.replace(/^GURL\.\s*/, '')}</p></div>
        </div>
        <div className="reads">
          <div style={{ '--c': 'var(--amber)' }}><div className="k">Sun · core drive<b>{GLYPHS[sun]} {SIGNS[sun]}</b></div><div className="v">{read(sun)}</div></div>
          <div style={{ '--c': 'var(--cyan)' }}><div className="k">Moon · needs<b>{GLYPHS[moon]} {SIGNS[moon]}{moonApprox ? ' ≈' : ''}</b></div><div className="v">{read(moon)}</div></div>
          <div style={{ '--c': 'var(--pink)' }}><div className="k">Rising · the outfit<b>{GLYPHS[rising]} {SIGNS[rising]}</b></div><div className="v">{read(rising)}</div></div>
        </div>
        <p className="why">{cr.why}</p>
      </div>
    </article>
  );
}
