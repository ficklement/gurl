// Client-side chart preview so the rings can spin the instant an input changes.
// The server (chart.js) stays the source of truth when the chart is saved.
// npm i astronomy-engine   (inside /srv/gurl/client)
import * as Astronomy from 'astronomy-engine';

export const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
// U+FE0E forces text (not emoji) presentation on iOS/Android
export const GLYPHS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'].map(g => g + '︎');

const D2R = Math.PI / 180, R2D = 180 / Math.PI;
export const norm = (x) => ((x % 360) + 360) % 360;
export const signOf = (lon) => Math.floor(norm(lon) / 30);
const jdOf = (d) => d.getTime() / 86400000 + 2440587.5;

export const sunLon = (d) => norm(Astronomy.SunPosition(d).elon);
export const moonLon = (d) => norm(Astronomy.EclipticGeoMoon(d).lon);

export function ascendant(date, latDeg, lonEastDeg) {
  const theta = norm(Astronomy.SiderealTime(date) * 15 + lonEastDeg) * D2R;
  const T = (jdOf(date) - 2451545.0) / 36525;
  const eps = (23.439291 - 0.0130042 * T) * D2R, phi = latDeg * D2R;
  return norm(Math.atan2(Math.cos(theta), -(Math.sin(theta) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) * R2D);
}

function tzOffsetMin(ms, tz) {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const p = {}; dtf.formatToParts(new Date(ms)).forEach(x => { p[x.type] = x.value; });
  return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - ms) / 60000;
}
export function zonedToUtc(y, mo, d, h, mi, tz) {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const off = tzOffsetMin(guess, tz);
  let utc = guess - off * 60000;
  const off2 = tzOffsetMin(utc, tz);
  if (off2 !== off) utc = guess - off2 * 60000;
  return new Date(utc);
}

export function fmtDeg(lon) {
  const within = norm(lon) % 30;
  let d = Math.floor(within), m = Math.round((within - d) * 60);
  if (m === 60) { d += 1; m = 0; }
  return `${d}°${String(m).padStart(2, '0')}′`;
}

/**
 * input: { date:'YYYY-MM-DD', time:'HH:MM'|'', tz?:'America/Phoenix', lat?, lon? }
 * -> { sun:{lon,sign,cusp?}, moon:{lon,sign,approx,alt?}, rising:{lon,sign}|null, utc }
 */
export function computeChart({ date, time, tz, lat, lon }) {
  const [y, mo, d] = date.split('-').map(Number);
  const zone = tz || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const hasTime = !!time;
  const [h, mi] = hasTime ? time.split(':').map(Number) : [12, 0];
  const at = zonedToUtc(y, mo, d, h, mi, zone);
  const sl = sunLon(at), ml = moonLon(at);
  const out = { sun: { lon: sl, sign: signOf(sl) }, moon: { lon: ml, sign: signOf(ml), approx: !hasTime }, rising: null, utc: at };
  if (!hasTime) {
    const start = zonedToUtc(y, mo, d, 0, 0, zone), end = zonedToUtc(y, mo, d, 23, 59, zone);
    const s0 = signOf(sunLon(start)), s1 = signOf(sunLon(end));
    if (s0 !== s1) out.sun.cusp = [s0, s1];
    const m0 = signOf(moonLon(start)), m1 = signOf(moonLon(end));
    if (m0 !== m1) out.moon.alt = [m0, m1];
  }
  if (hasTime && lat != null && lon != null) { const a = ascendant(at, lat, lon); out.rising = { lon: a, sign: signOf(a) }; }
  return out;
}

export const validDate = (v, max = new Date().toISOString().slice(0, 10)) =>
  /^\d{4}-\d{2}-\d{2}$/.test(v) && +v.slice(0, 4) >= 1900 && v <= max;
