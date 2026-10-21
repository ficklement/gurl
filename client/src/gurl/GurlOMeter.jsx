import { SIGNS } from './astro.js';
import { FACES, VERDICTS, creatureFor } from './kaiser.js';
import { cardArtFor } from './cardArt.js';
import GlyphTrio from './GlyphTrio.jsx';

/**
 * Map whatever compatibility.js returns onto the five verdicts.
 * Default assumes a 0–100 score where higher is better; change the cut points
 * to match the thresholds in server/src/compatibility.js.
 */
export function levelFromScore(score, cuts = [80, 60, 40, 20]) {
  const i = cuts.findIndex(c => score >= c);
  return i === -1 ? 4 : i;
}

function Party({ who, signs, children }) {
  const cr = signs && creatureFor(signs);
  const art = signs && cardArtFor(signs);
  return (
    <div className="party">
      <span className="who">{who}</span>
      {children}
      {cr && <>
        {art && <img className="party-art" src={art} alt={`Illustrated card: ${cr.name}`} loading="lazy" />}
        <span className="nm">{cr.name}</span>
        <GlyphTrio signs={signs} className="trio" />
        <span className="mono" style={{ fontSize: '.72rem', color: 'var(--ink-faint)' }}>☉ {SIGNS[signs[0]]} · ☽ {SIGNS[signs[1]]} · ↑ {SIGNS[signs[2]]}</span>
      </>}
    </div>
  );
}

/** level: 0 (gurl) … 4 (guuuuurl). onPreview lets a design review click through every verdict. */
export default function GurlOMeter({ you, them, themName = 'Them', level, onPreview, partnerPicker }) {
  const v = VERDICTS[level];
  return (
    <div className="meter" style={{ '--vcol': v.col }}>
      <Party who="You" signs={you} />
      <div className="dial">
        <div className="face"><img src={FACES[v.face]} alt="Kaiser's reaction" /></div>
        <div className="vword">{v.word}</div>
        <p className="vline">{v.line}</p>
        {onPreview && (
          <div className="scale" role="group" aria-label="Preview each verdict">
            {VERDICTS.map((x, i) => <button key={x.word} type="button" style={{ '--vcol': x.col }} aria-pressed={i === level} onClick={() => onPreview(i)}>{x.word}</button>)}
          </div>
        )}
      </div>
      <Party who={themName} signs={them}>{partnerPicker}</Party>
    </div>
  );
}
