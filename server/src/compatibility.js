// Intentionally playful scoring. Not a predictive or statistically validated model.
const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
export const SCORING_VERSION = 1;
export function normalize(degrees) { return ((degrees % 360) + 360) % 360; }
export function zodiac(degrees) { return SIGNS[Math.floor(normalize(degrees) / 30)]; }

export function alignment(a, b) {
  const ia = SIGNS.indexOf(a), ib = SIGNS.indexOf(b);
  if (ia < 0 || ib < 0) return null;
  const delta = Math.min((ia - ib + 12) % 12, (ib - ia + 12) % 12);
  return [96, 48, 77, 9, 91, 28, 43][delta];
}

export function gurlFor(score) {
  if (score >= 80) return 'gurl';
  if (score >= 60) return 'guurl';
  if (score >= 40) return 'guuurl';
  if (score >= 20) return 'guuuurl';
  return 'guuuuurl';
}

export function scoreCharts(you, them) {
  const factors = [
    { key: 'sun', label: 'Sun', weight: 0.35 },
    { key: 'moon', label: 'Moon', weight: 0.45 },
    { key: 'rising', label: 'Rising', weight: 0.20 },
  ].filter(f => you[f.key] && them[f.key] && !(f.key === 'moon' && (you.moonUncertain || them.moonUncertain)));
  const weightSum = factors.reduce((s, f) => s + f.weight, 0);
  if (!weightSum) throw new Error('Not enough chart data to compare');
  const breakdown = factors.map(f => ({ placement: f.label, score: alignment(you[f.key], them[f.key]), weight: f.weight / weightSum }));
  const score = Math.round(breakdown.reduce((s, f) => s + f.score * f.weight, 0));
  return { score, rating: gurlFor(score), breakdown, version: SCORING_VERSION,
    provisional: breakdown.length < 3,
    interpretation: score >= 80 ? 'The charts are getting along suspiciously well.' :
      score >= 60 ? 'There is potential here. Kaiser has questions, naturally.' :
      score >= 40 ? 'Some intriguing chemistry, some cosmic side-eye.' :
      score >= 20 ? 'The stars have requested a private conversation.' :
      'Kaiser needs a moment to process these placements.'
  };
}
