import { config } from 'dotenv';
config({ path: new URL('../../.env', import.meta.url) });
import pg from 'pg';
const { Pool } = pg;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
