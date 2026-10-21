import { useMemo, useState } from 'react';
import { GLYPHS, SIGNS } from './astro.js';
import { BESTIARY, creatureKey } from './kaiser.js';
import { cardArtFor, finishedCardCount } from './cardArt.js';
import GlyphTrio from './GlyphTrio.jsx';

const ALL = Object.entries(BESTIARY).map(([key, v]) => ({ key, signs: key.split('-').map(s => SIGNS.findIndex(x => x.toUpperCase() === s)), ...v }));

export default function Menagerie({ activeSigns = null }) {
  const [q, setQ] = useState('');
  const [signs, setSigns] = useState(() => new Set());
  const [kind, setKind] = useState('All');
  const [shown, setShown] = useState(36);
  const hits = useMemo(() => {
    const ql = q.toLowerCase();
    return ALL.filter(c => (kind === 'All' || c.kind.startsWith(kind)) && [...signs].every(s => c.signs.includes(s)) && (!ql || `${c.name} ${c.reveal}`.toLowerCase().includes(ql)));
  }, [q, signs, kind]);
  const activeKey = activeSigns ? creatureKey(activeSigns) : null;
  const toggle = (i) => { const n = new Set(signs); n.has(i) ? n.delete(i) : n.add(i); setSigns(n); setShown(36); };

  return (
    <>
      <div className="mtools">
        <label htmlFor="msearch" hidden>Search creatures</label>
        <input type="search" id="msearch" placeholder="Search names and reveals" value={q} onChange={e => { setQ(e.target.value); setShown(36); }} />
        <div className="signchips" role="group" aria-label="Filter by sign">
          {SIGNS.map((s, i) => <button key={s} type="button" title={s} aria-label={s} aria-pressed={signs.has(i)} onClick={() => toggle(i)}>{GLYPHS[i]}</button>)}
        </div>
        <div className="kinds" role="group" aria-label="Filter by kind">
          {['All', 'Animal', 'Persona', 'Mythic'].map(k => <button key={k} type="button" className="chip-btn" aria-pressed={kind === k} onClick={() => { setKind(k); setShown(36); }}>{k}</button>)}
        </div>
        <span className="count">{hits.length} of 364 · {finishedCardCount} illustrated</span>
      </div>
      <div className="placement-legend" aria-label="Zodiac sign color key">
        <span><i className="legend-dot legend-sun" />Sun</span>
        <span><i className="legend-dot legend-moon" />Moon</span>
        <span><i className="legend-dot legend-rising" />Rising</span>
        <small>Archive entries have no fixed order: these colors label a sample Sun/Moon/Rising arrangement. Your own combination uses your actual placements.</small>
      </div>
      <div className="grid">
        {hits.slice(0, shown).map(c => {
          const art = cardArtFor(c.key);
          const displaySigns = c.key === activeKey ? activeSigns : c.signs;
          return (
            <details key={c.key}>
              <summary>
                <span className="num"><span>{c.id}{art ? ' · ILLUSTRATED' : ''}</span><GlyphTrio signs={displaySigns} /></span>
                <span className="nm">{c.name}</span>
                <span className="kd">{c.kind} · {c.pattern}</span>
                {art && <img className="menagerie-card-peek" src={art} alt="" loading="lazy" />}
              </summary>
              <div className="body">
                {art && <img className="menagerie-card-art" src={art} alt={`Finished bestiary card for ${c.name}`} loading="lazy" />}
                <p className="rv">{c.reveal}</p><p>{c.why}</p>
                <p className="mono" style={{ fontSize: '.72rem' }}>{c.signs.map(s => SIGNS[s]).join(' · ')}</p>
              </div>
            </details>
          );
        })}
      </div>
      {hits.length > shown && <button className="btn ghost more" type="button" onClick={() => setShown(s => s + 48)}>Show more</button>}
    </>
  );
}
