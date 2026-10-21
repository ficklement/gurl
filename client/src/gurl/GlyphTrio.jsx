import { GLYPHS, SIGNS } from './astro.js';

// Colors match the existing orrery rings and the creature-reading panel.
const PLACEMENTS = [
  ['Sun', 'sun'],
  ['Moon', 'moon'],
  ['Rising', 'rising'],
];

export default function GlyphTrio({ signs, className = '' }) {
  if (!signs || signs.length !== 3) return null;
  const description = signs.map((sign, index) => `${PLACEMENTS[index][0]} ${SIGNS[sign]}`).join(', ');
  return (
    <span className={`sign-trio ${className}`} role="img" aria-label={description}>
      {signs.map((sign, index) => (
        <span key={index} className={`slot-glyph slot-${PLACEMENTS[index][1]}`} title={`${PLACEMENTS[index][0]}: ${SIGNS[sign]}`} aria-hidden="true">
          {GLYPHS[sign]}
        </span>
      ))}
    </span>
  );
}
