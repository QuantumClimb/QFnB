import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envContent = fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf8');
const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);

const client = new pg.Client({ connectionString: match[1], ssl: { rejectUnauthorized: false } });

async function cleanup() {
  await client.connect();
  console.log("Cleaning duplicate seating area records...");

  await client.query(`
    DELETE FROM public.seating_areas s1
    USING public.seating_areas s2
    WHERE s1.name = s2.name
      AND s1.outlet_id = s2.outlet_id
      AND s1.created_at > s2.created_at;
  `);

  const seating = await client.query('SELECT id, name, capacity FROM public.seating_areas');
  console.log("Clean Seating Areas:", seating.rows);

  await client.end();
}

cleanup();
