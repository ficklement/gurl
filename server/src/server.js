import 'dotenv/config';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node';
import { auth } from './auth.js';
import { pool } from './db.js';
import { parseBirth, computeChart } from './chart.js';
import { scoreCharts } from './compatibility.js';
import geoTz from 'geo-tz/all';
const { find: findTimeZone } = geoTz;

const app = express();
app.set('trust proxy', 'loopback');
const port = Number(process.env.PORT) || 3001;
// Better Auth must receive the raw request; mount before express.json.
app.all('/api/auth/*', toNodeHandler(auth));
app.use(express.json({ limit: '20kb' }));
app.get('/api/health', (_req, res) => res.json({ ok: true }));

async function requireUser(req, res, next) {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session?.user) return res.status(401).json({ error: 'Please sign in.' });
    req.userId = session.user.id;
    next();
  } catch (err) { next(err); }
}

// Place search is throttled in the client and intended for deliberate queries.
const searchCache = new Map();
const placesLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many birthplace searches. Please try again in a minute.' },
});

app.get('/api/places', placesLimiter, async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 3 || q.length > 70) return res.status(400).json({ error: 'Enter at least three letters.' });
    const key = q.toLowerCase();
    if (searchCache.has(key)) return res.json(searchCache.get(key));
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.search = new URLSearchParams({ name: q, count: '7', language: 'en', format: 'json' }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Birthplace service unavailable');
    const data = await response.json();
    if (data.error) throw new Error(data.reason || 'Birthplace lookup failed');
    const places = (data.results || []).map(p => ({
      label: [p.name, p.admin1, p.country].filter(Boolean).join(', '),
      lat: Number(p.latitude), lng: Number(p.longitude), id: p.id,
      timezone: findTimeZone(Number(p.latitude), Number(p.longitude))[0],
    }));
    searchCache.set(key, places);
    if (searchCache.size > 250) searchCache.delete(searchCache.keys().next().value);
    res.json(places);
  } catch (err) { next(err); }
});

app.get('/api/chart', requireUser, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT birth_date::text AS "birthDate", birth_time AS "birthTime", time_known AS "birthTimeKnown", place, zone, placements, updated_at AS "updatedAt" FROM gurl_charts WHERE user_id=$1', [req.userId]);
    res.json(rows[0] || null);
  } catch (err) { next(err); }
});

app.put('/api/chart', requireUser, async (req, res, next) => {
  try {
    const birth = parseBirth(req.body);
    const placements = computeChart(birth);
    const { rows } = await pool.query(`
      INSERT INTO gurl_charts (user_id, birth_date, birth_time, time_known, place, zone, placements)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (user_id) DO UPDATE SET birth_date=$2,birth_time=$3,time_known=$4,place=$5,zone=$6,placements=$7,updated_at=now()
      RETURNING birth_date::text AS "birthDate",birth_time AS "birthTime",time_known AS "birthTimeKnown",place,zone,placements,updated_at AS "updatedAt"
    `, [req.userId, birth.birthDate, birth.birthTime, birth.birthTimeKnown, birth.place, birth.zone, placements]);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

app.get('/api/comparisons', requireUser, async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT id::text,nickname,birth_date::text AS "birthDate",birth_time AS "birthTime",time_known AS "birthTimeKnown",place,placements,score,rating,breakdown,interpretation,provisional,score_version AS "scoreVersion",created_at AS "createdAt" FROM gurl_comparisons WHERE user_id=$1 ORDER BY score DESC,created_at DESC LIMIT 500`, [req.userId]);
    res.json(rows);
  } catch (err) { next(err); }
});

app.post('/api/comparisons', requireUser, async (req, res, next) => {
  try {
    const nickname = String(req.body?.nickname || '').trim();
    if (!nickname || nickname.length > 80) return res.status(400).json({ error: 'Give this person a name (up to 80 characters).' });
    const { rows: own } = await pool.query('SELECT placements FROM gurl_charts WHERE user_id=$1', [req.userId]);
    if (!own.length) return res.status(409).json({ error: 'Save your own birth chart before comparing.' });
    const birth = parseBirth(req.body);
    const placements = computeChart(birth);
    const result = scoreCharts(own[0].placements, placements);
    const { rows } = await pool.query(`INSERT INTO gurl_comparisons
      (user_id,nickname,birth_date,birth_time,time_known,place,placements,score,rating,breakdown,interpretation,provisional,score_version)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING id::text,nickname,birth_date::text AS "birthDate",birth_time AS "birthTime",time_known AS "birthTimeKnown",place,placements,score,rating,breakdown,interpretation,provisional,score_version AS "scoreVersion",created_at AS "createdAt"`,
    [req.userId,nickname,birth.birthDate,birth.birthTime,birth.birthTimeKnown,birth.place,placements,result.score,result.rating,JSON.stringify(result.breakdown),result.interpretation,result.provisional,result.version]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

app.patch('/api/comparisons/:id', requireUser, async (req, res, next) => {
  try {
    const nickname = String(req.body?.nickname || '').trim();
    if (!nickname || nickname.length > 80) return res.status(400).json({ error: 'Enter a name of up to 80 characters.' });
    const { rows } = await pool.query('UPDATE gurl_comparisons SET nickname=$1 WHERE id=$2 AND user_id=$3 RETURNING id::text,nickname', [nickname,req.params.id,req.userId]);
    if (!rows.length) return res.status(404).json({ error: 'Reading not found.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});
app.delete('/api/comparisons/:id', requireUser, async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM gurl_comparisons WHERE id=$1 AND user_id=$2', [req.params.id,req.userId]);
    if (!rowCount) return res.status(404).json({ error: 'Reading not found.' });
    res.status(204).end();
  } catch (err) { next(err); }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  const badInput = ['Enter ', 'Select ', 'Birth ', 'This birth', 'Could not resolve', 'Not enough'].some(s => String(err.message).startsWith(s));
  res.status(badInput ? 400 : 500).json({ error: badInput ? err.message : 'Something went wrong. Please try again.' });
});
app.listen(port, '127.0.0.1', () => console.log(`gurl API listening on http://localhost:${port}`));
