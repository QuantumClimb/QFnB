import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read DATABASE_URL from .env
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
if (!match) {
  console.error("DATABASE_URL not found in .env");
  process.exit(1);
}

const connectionString = match[1];
console.log("Connecting to PostgreSQL database...");

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
  try {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL Database!");

    // Drop legacy/incompatible tables if present
    await client.query(`
      DROP TABLE IF EXISTS public.reservation_status_history CASCADE;
      DROP TABLE IF EXISTS public.reservations CASCADE;
    `);

    const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    console.log(`Found ${files.length} migration files.`);

    for (const file of files) {
      console.log(`Executing migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
      console.log(`✓ Applied ${file}`);
    }

    // Apply the Public Integration RPCs for Q RESTOBAR
    console.log("Applying Q RESTOBAR Public Integration RPCs...");
    const rpcSql = `
CREATE OR REPLACE FUNCTION public.create_public_reservation(
  p_org_slug TEXT DEFAULT 'lumina-group',
  p_outlet_slug TEXT DEFAULT 'lumina-klcc',
  p_guest_name TEXT DEFAULT 'Guest',
  p_guest_phone TEXT DEFAULT '',
  p_guest_email TEXT DEFAULT NULL,
  p_reservation_date DATE DEFAULT CURRENT_DATE,
  p_reservation_time TIME DEFAULT '19:00',
  p_party_size INT DEFAULT 2,
  p_seating_preference TEXT DEFAULT NULL,
  p_special_occasion TEXT DEFAULT NULL,
  p_special_requests TEXT DEFAULT NULL,
  p_external_reference TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_outlet_id UUID;
  v_guest_id UUID;
  v_reservation_id UUID;
  v_ref_no TEXT;
  v_token TEXT;
  v_clean_phone TEXT;
BEGIN
  -- 1. Resolve Organization ID
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE slug = p_org_slug OR id::text = p_org_slug
  LIMIT 1;

  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id FROM public.organizations ORDER BY created_at ASC LIMIT 1;
  END IF;

  IF v_org_id IS NULL THEN
    INSERT INTO public.organizations (name, slug)
    VALUES ('Lumina Group', 'lumina-group')
    RETURNING id INTO v_org_id;
  END IF;

  -- 2. Resolve Outlet ID
  SELECT id INTO v_outlet_id
  FROM public.outlets
  WHERE (slug = p_outlet_slug OR id::text = p_outlet_slug) AND organization_id = v_org_id
  LIMIT 1;

  IF v_outlet_id IS NULL THEN
    SELECT id INTO v_outlet_id FROM public.outlets WHERE organization_id = v_org_id ORDER BY created_at ASC LIMIT 1;
  END IF;

  IF v_outlet_id IS NULL THEN
    INSERT INTO public.outlets (organization_id, name, slug)
    VALUES (v_org_id, 'Lumina Restobar (KLCC)', 'lumina-klcc')
    RETURNING id INTO v_outlet_id;
  END IF;

  -- 3. Clean & Normalize Phone
  v_clean_phone := REGEXP_REPLACE(COALESCE(p_guest_phone, ''), '[^0-9+]', '', 'g');
  IF v_clean_phone = '' THEN
    v_clean_phone := '+60100000000';
  END IF;

  -- 4. Match or Create Guest Profile in CRM
  SELECT id INTO v_guest_id
  FROM public.guests
  WHERE organization_id = v_org_id
    AND (phone = v_clean_phone OR (p_guest_email IS NOT NULL AND email = p_guest_email))
  LIMIT 1;

  IF v_guest_id IS NULL THEN
    INSERT INTO public.guests (
      organization_id,
      first_name,
      last_name,
      phone,
      email,
      hospitality_notes
    ) VALUES (
      v_org_id,
      SPLIT_PART(p_guest_name, ' ', 1),
      COALESCE(NULLIF(SUBSTRING(p_guest_name FROM POSITION(' ' IN p_guest_name) + 1), ''), 'Guest'),
      v_clean_phone,
      p_guest_email,
      'Created via Q RESTOBAR Online Booking'
    )
    RETURNING id INTO v_guest_id;
  END IF;

  -- 5. Generate Reference & Security Token
  v_ref_no := COALESCE(p_external_reference, 'QRESTO-' || FLOOR(100000 + RANDOM() * 900000)::TEXT);
  v_token := md5(random()::text || clock_timestamp()::text);

  -- 6. Insert Reservation into Q F&B OS Master Table
  INSERT INTO public.reservations (
    organization_id,
    outlet_id,
    guest_id,
    guest_name,
    phone,
    email,
    reservation_date,
    reservation_time,
    party_size,
    status,
    booking_source,
    special_occasion,
    special_requests,
    external_reference,
    reservation_token
  ) VALUES (
    v_org_id,
    v_outlet_id,
    v_guest_id,
    p_guest_name,
    v_clean_phone,
    p_guest_email,
    p_reservation_date,
    p_reservation_time,
    p_party_size,
    'new',
    'q_restobar',
    p_special_occasion,
    p_special_requests,
    v_ref_no,
    v_token
  )
  RETURNING id INTO v_reservation_id;

  -- 7. Return JSON response
  RETURN jsonb_build_object(
    'success', true,
    'reservation_id', v_reservation_id,
    'reference_number', v_ref_no,
    'reservation_token', v_token,
    'status', 'new',
    'guest_id', v_guest_id,
    'message', 'Reservation submitted successfully to Q F&B OS.'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_reservation_status(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res RECORD;
BEGIN
  SELECT 
    r.id,
    r.guest_name,
    r.reservation_date,
    r.reservation_time,
    r.party_size,
    r.status,
    r.external_reference,
    o.name as outlet_name
  INTO v_res
  FROM public.reservations r
  LEFT JOIN public.outlets o ON o.id = r.outlet_id
  WHERE r.reservation_token = p_token OR r.id::text = p_token OR r.external_reference = p_token
  LIMIT 1;

  IF v_res IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Reservation not found');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'status', v_res.status,
    'guest_name', v_res.guest_name,
    'date', v_res.reservation_date,
    'time', v_res.reservation_time,
    'party_size', v_res.party_size,
    'outlet_name', v_res.outlet_name,
    'reference_number', v_res.external_reference
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_public_reservation TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_reservation_status TO anon, authenticated, service_role;
`;
    await client.query(rpcSql);
    console.log("✓ Applied Q RESTOBAR Public Integration RPC functions!");

    console.log("ALL MIGRATIONS AND RPCS APPLIED SUCCESSFULLY!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

runMigrations();
