import 'dotenv/config';
import { pool } from '../src/db.js';
await pool.query(`
CREATE TABLE IF NOT EXISTS gurl_charts (
  user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  birth_date date NOT NULL,
  birth_time text,
  time_known boolean NOT NULL,
  place jsonb NOT NULL,
  zone text NOT NULL,
  placements jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS gurl_comparisons (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  birth_date date NOT NULL,
  birth_time text,
  time_known boolean NOT NULL,
  place jsonb NOT NULL,
  placements jsonb NOT NULL,
  score integer NOT NULL,
  rating text NOT NULL,
  breakdown jsonb NOT NULL,
  interpretation text NOT NULL,
  provisional boolean NOT NULL DEFAULT false,
  score_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gurl_comparisons_user_score ON gurl_comparisons (user_id, score DESC, created_at DESC);
`);
console.log('gurl application tables are ready.');
await pool.end();
