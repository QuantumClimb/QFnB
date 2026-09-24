import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
const client = new pg.Client({ connectionString: match[1], ssl: { rejectUnauthorized: false } });

async function verify() {
  await client.connect();
  const orgs = await client.query('SELECT id, name, slug FROM public.organizations');
  const outlets = await client.query('SELECT id, name, slug FROM public.outlets');
  const seating = await client.query('SELECT id, name, capacity FROM public.seating_areas');
  const tables = await client.query('SELECT id, table_number, capacity FROM public.restaurant_tables');
  const exp = await client.query('SELECT id, title, base_price FROM public.experiences');

  console.log("Live Organizations:", orgs.rows);
  console.log("Live Outlets:", outlets.rows);
  console.log("Live Seating Areas:", seating.rows);
  console.log("Live Restaurant Tables:", tables.rows.length, "tables");
  console.log("Live Experiences:", exp.rows);

  await client.end();
}

verify();
