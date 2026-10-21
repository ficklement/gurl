import { useEffect, useRef, useState } from 'react';
import Orrery from './Orrery.jsx';
import KaiserBubble from './KaiserBubble.jsx';
import { computeChart, fmtDeg, GLYPHS, SIGNS, validDate } from './astro.js';
import { LINES, ING, HALL, creatureFor } from './kaiser.js';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Accepts Open-Meteo's shape ({results:[...]}) or a plain array from /api/places. */
function normalizePlaces(json) {
  const arr = Array.isArray(json) ? json : (json.results || json.places || []);
  return arr.map(x => ({
    name: x.name || x.label || '',
    admin1: x.admin1 || x.region || '',
    country: x.country_code || x.country || '',
    latitude: Number(x.latitude ?? x.lat),
    longitude: Number(x.longitude ?? x.lng),
    timezone: x.timezone || undefined,
    label: x.label || [x.name, x.admin1, x.country].filter(Boolean).join(', '),
  })).filter(p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
}
const fmtCoord = (p) => `${Math.abs(p.latitude).toFixed(2)}°${p.latitude >= 0 ? 'N' : 'S'} ${Math.abs(p.longitude).toFixed(2)}°${p.longitude >= 0 ? 'E' : 'W'}`;

async function defaultSave(payload) {
  if (!payload.place) {
    throw new Error('Select a birthplace before saving.');
  }

  const body = {
    birthDate: payload.date,
    birthTime: payload.time || '',
    birthTimeKnown: !payload.timeUnknown,
    place: {
      label: payload.place.label || payload.place.name,
      lat: payload.place.latitude,
      lng: payload.place.longitude,
    },
  };

  const response = await fetch('/api/chart', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.error || 'Unable to save your birth chart.');
  }

  return result;
}

/**
 * The hero: orrery + Kaiser + fitting ticket.
 * onChange({ chart, aligned, signs, input }) lifts state to the page (creature card, gurl-o-meter).
 * initial: optional saved chart input { date, time, timeUnknown, place } from GET /api/chart.
 */
export default function ChartStudio({ onChange, onSave = defaultSave, placesUrl = (q) => `/api/places?q=${encodeURIComponent(q)}`, initial, sound = false }) {
  const orrery = useRef(null);
  const seq = useRef(0);
  const [date, setDate] = useState(initial?.date || '');
  const [time, setTime] = useState(initial?.time || '');
  const [noTime, setNoTime] = useState(!!initial?.timeUnknown);
  const [place, setPlace] = useState(initial?.place || null);
  const [placeText, setPlaceText] = useState(initial?.place ? `${initial.place.name}${initial.place.admin1 ? ', ' + initial.place.admin1 : ''}` : '');
  const [results, setResults] = useState(null);
  const [active, setActive] = useState(-1);
  const [chart, setChart] = useState(null);
  const [aligned, setAligned] = useState(false);
  const [speech, setSpeech] = useState({ line: LINES.intro, mood: 'idle' });
  const [note, setNote] = useState('');
  const trigger = useRef(initial ? 'date' : null);

  // Debounce field edits so typing a year doesn't spin the Sun four times.
  const [committed, setCommitted] = useState({ date: initial?.date || '', time: initial?.time || '' });
  useEffect(() => { const t = setTimeout(() => { if (committed.date !== date) { trigger.current = 'date'; setCommitted(c => ({ ...c, date })); } }, 650); return () => clearTimeout(t); }, [date]);
  useEffect(() => { const t = setTimeout(() => { if (committed.time !== time) { trigger.current = time ? 'time' : 'notime'; setCommitted(c => ({ ...c, time })); } }, 700); return () => clearTimeout(t); }, [time]);

  // Recompute + choreograph rings whenever a committed input changes.
  useEffect(() => {
    const o = orrery.current; if (!o) return;
    const my = ++seq.current;
    const why = trigger.current;
    if (!validDate(committed.date)) {
      ['sun', 'moon', 'rising'].forEach(k => o.unsettle(k)); o.setAligned(false); setAligned(false); setChart(null);
      setSpeech({ line: LINES.intro, mood: 'idle' }); return;
    }
    const c = computeChart({ date: committed.date, time: noTime ? '' : committed.time, tz: place?.timezone, lat: place?.latitude, lon: place?.longitude });
    setChart(c);
    const moonReady = !!(committed.time || noTime);
    const jobs = {};
    jobs.sun = o.spinTo('sun', c.sun.lon, why === 'date' || !o.isSettled('sun') ? 'full' : 'adjust');
    if (moonReady) jobs.moon = o.spinTo('moon', c.moon.lon, ['date', 'time', 'notime'].includes(why) || !o.isSettled('moon') ? 'full' : 'adjust', { approx: c.moon.approx });
    else o.unsettle('moon');
    if (c.rising) {
      const full = why === 'place' || why === 'date' || !o.isSettled('rising');
      jobs.rising = why === 'time' && full
        ? new Promise(r => setTimeout(() => o.spinTo('rising', c.rising.lon, 'full').then(r), 450))
        : o.spinTo('rising', c.rising.lon, full ? 'full' : 'adjust');
    } else o.unsettle('rising', noTime);
    o.setAligned(false); setAligned(false);
    setSpeech(s => ({ ...s, mood: 'sideeye' }));

    Promise.all(Object.values(jobs)).then(() => {
      if (my !== seq.current) return;
      if (c.rising && moonReady) {
        o.setAligned(true); setAligned(true);
        const cr = creatureFor([c.sun.sign, c.moon.sign, c.rising.sign]);
        setSpeech({ line: `${LINES.rising(c.rising.sign)} ${cr.reveal}`, mood: 'delighted', cta: true });
        return;
      }
      if (why === 'date') setSpeech({ line: c.sun.cusp && !moonReady ? LINES.sunCusp(...c.sun.cusp) : `${LINES.sun(c.sun.sign)} ${moonReady ? LINES.askPlace : LINES.askTime}`, mood: 'talk' });
      else if (why === 'time') setSpeech({ line: `${LINES.moon(c.moon.sign)} ${place ? '' : LINES.askPlace}`, mood: 'flattered' });
      else if (why === 'notime') {
        const m = c.moon.alt ? LINES.moonCusp(c.moon.sign, c.moon.alt.find(x => x !== c.moon.sign)) : LINES.moonApprox(c.moon.sign);
        setSpeech({ line: `${m} ${place ? LINES.noTimeRising : LINES.askPlace}`, mood: 'sideeye' });
      } else if (why === 'place') setSpeech({ line: noTime ? LINES.noTimeRising : LINES.placeNeedsTime, mood: noTime ? 'unimpressed' : 'sideeye' });
    });
  }, [committed, noTime, place]);

  useEffect(() => {
    onChange?.({ chart, aligned, signs: chart?.rising && aligned ? [chart.sun.sign, chart.moon.sign, chart.rising.sign] : null, input: { date: committed.date, time: noTime ? '' : committed.time, timeUnknown: noTime, place } });
  }, [chart, aligned]);

  // Birthplace search
  useEffect(() => {
    if (place || placeText.trim().length < 3) { setResults(null); return; }
    const q = placeText.trim(), ctl = new AbortController();
    const t = setTimeout(async () => {
      try { const r = await fetch(placesUrl(q), { signal: ctl.signal, credentials: 'include' }); if (!r.ok) throw new Error(`Birthplace search failed (${r.status})`); const list = normalizePlaces(await r.json()); setResults(list); setActive(list.length ? 0 : -1); }
      catch (e) { if (e.name !== 'AbortError') setResults([]); }
    }, 260);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [placeText, place]);

  function choose(p) {
    setPlace(p); setPlaceText(`${p.name}${p.admin1 ? ', ' + p.admin1 : ''}`); setResults(null);
    trigger.current = 'place';
    if (!validDate(committed.date)) setSpeech({ line: LINES.placeFirst, mood: 'sideeye' });
  }
  function onPlaceKey(e) {
    if (!results?.length) return;
    if (e.key === 'ArrowDown') { setActive(a => Math.min(results.length - 1, a + 1)); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { setActive(a => Math.max(0, a - 1)); e.preventDefault(); }
    else if (e.key === 'Enter' && active >= 0) { choose(results[active]); e.preventDefault(); }
    else if (e.key === 'Escape') setResults(null);
  }
  async function submit(e) {
    e.preventDefault();
    if (!validDate(committed.date)) { setNote('Add a birth date first. Kaiser needs at least that.'); return; }
    try { await onSave({ date: committed.date, time: noTime ? null : committed.time || null, timeUnknown: noTime, place }); setNote('Saved to your journal.'); }
    catch (err) { setNote(err.message); }
  }
  function reset() {
    setDate(''); setTime(''); setNoTime(false); setPlace(null); setPlaceText(''); setNote('');
    trigger.current = 'date'; setCommitted({ date: '', time: '' });
  }

  const creature = aligned && chart?.rising ? creatureFor([chart.sun.sign, chart.moon.sign, chart.rising.sign]) : null;
  const row = (key, label, body, deg) => (
    <div className={`r-${key}`}><dt>{label}</dt><dd>{body}</dd><span className="deg">{deg || ''}</span></div>
  );
  const sign = (s, extra) => <span className="sign"><span className="glyph">{GLYPHS[s]}</span>{SIGNS[s]}{extra}</span>;
  const moonReady = !!(committed.time || noTime);

  return (
    <section className="hero" id="chart" style={{ '--hall': `url(${HALL})` }}>
      <div className="wrap">
        <div className="orrery-col">
          <Orrery ref={orrery} mood={speech.mood} sound={sound} />
          <dl className="readout">
            {row('sun', 'Sun', chart ? <>{sign(chart.sun.sign)}<span className="note">Core drive: {ING[SIGNS[chart.sun.sign]].drives}</span></> : <span className="pending">Waiting on a birth date</span>, chart && fmtDeg(chart.sun.lon))}
            {row('moon', 'Moon', chart && moonReady ? <>{sign(chart.moon.sign, chart.moon.approx ? ' ≈' : '')}<span className="note">Emotional needs: {ING[SIGNS[chart.moon.sign]].drives}</span>{chart.moon.alt && <span className="note">Could be {SIGNS[chart.moon.alt[0]]} or {SIGNS[chart.moon.alt[1]]} without a birth time</span>}</> : <span className="pending">Waiting on a birth time</span>, chart && moonReady && (chart.moon.approx ? '≈ ' : '') + fmtDeg(chart.moon.lon))}
            {row('rising', 'Rising', chart?.rising ? <>{sign(chart.rising.sign)}<span className="note">Presentation: {ING[SIGNS[chart.rising.sign]].drives}</span></> : <span className="pending">{noTime ? 'Needs a birth time' : place ? 'Waiting on a birth time' : 'Waiting on a birthplace'}</span>, chart?.rising && fmtDeg(chart.rising.lon))}
          </dl>
        </div>

        <div className="side-col">
          <KaiserBubble line={speech.line} mood={speech.mood}>
            {speech.cta && <a className="cta" href="#creature">See the full fitting</a>}
          </KaiserBubble>

          <form className="ticket" onSubmit={submit} autoComplete="off" noValidate>
            <div className="ticket-head"><h2>Fitting ticket</h2><span className="mono">No. {creature ? creature.id : '———'}</span></div>
            <div className="field f-sun">
              <label htmlFor="bdate">Birth date <span className="ring-tag">spins the Sun ring</span></label>
              <input type="date" id="bdate" min="1900-01-01" max={new Date().toISOString().slice(0, 10)} value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="field f-moon">
              <label htmlFor="btime">Birth time <span className="ring-tag">spins the Moon ring</span></label>
              <div className="row2">
                <input type="time" id="btime" value={time} disabled={noTime} onChange={e => { setTime(e.target.value); if (e.target.value) setNoTime(false); }} />
                <label className="check" htmlFor="notime"><input type="checkbox" id="notime" checked={noTime} onChange={e => { const v = e.target.checked; setNoTime(v); if (v) { setTime(''); setCommitted(c => ({ ...c, time: '' })); } trigger.current = v ? 'notime' : 'time'; }} /> I don't know it</label>
              </div>
            </div>
            <div className="field f-rising">
              <label htmlFor="bplace">Birthplace <span className="ring-tag">spins the Rising ring</span></label>
              <input type="text" id="bplace" role="combobox" aria-expanded={!!results} aria-controls="placeList" aria-autocomplete="list" placeholder="Start typing a city"
                value={placeText} onChange={e => { setPlace(null); setPlaceText(e.target.value); }} onKeyDown={onPlaceKey} onBlur={() => setTimeout(() => setResults(null), 120)} />
              {results && (
                <ul className="places" id="placeList" role="listbox">
                  {results.length === 0 && <li className="empty">{LINES.noPlace}</li>}
                  {results.map((p, i) => (
                    <li key={`${p.name}${p.latitude}`} role="option" aria-selected={i === active} onMouseDown={e => { e.preventDefault(); choose(p); }}>
                      <span>{p.name}{p.admin1 && `, ${p.admin1}`}{p.country && ` · ${p.country}`}</span><span className="meta">{fmtCoord(p)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="hint">{place ? `${fmtCoord(place)} · ${place.timezone}` : ''}</div>
            </div>
            <div className="actions">
              <button className="btn" type="submit">Save to my journal</button>
              <button className="btn ghost" type="button" onClick={reset}>Start over</button>
            </div>
            <p className="form-note">{note}</p>
          </form>
        </div>
      </div>
    </section>
  );
}
