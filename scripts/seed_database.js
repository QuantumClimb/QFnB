import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
if (!match) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: match[1],
  ssl: { rejectUnauthorized: false }
});

async function seedDatabase() {
  try {
    await client.connect();
    console.log("Seeding live operational data into Supabase...");

    // 1. Organization
    const orgRes = await client.query(`
      INSERT INTO public.organizations (name, slug, status, country_code, default_timezone, default_currency)
      VALUES ('Lumina Group', 'lumina-group', 'active', 'MY', 'Asia/Kuala_Lumpur', 'MYR')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `);
    const orgId = orgRes.rows[0].id;
    console.log(`✓ Organization created: Lumina Group (${orgId})`);

    // 2. Outlet
    const outletRes = await client.query(`
      INSERT INTO public.outlets (organization_id, name, slug, address_line1, city, country, phone, timezone, status)
      VALUES ($1, 'Lumina Restobar (KLCC)', 'lumina-klcc', 'Level 5, Suria KLCC, Persiaran Petronas', 'Kuala Lumpur', 'Malaysia', '+60321688888', 'Asia/Kuala_Lumpur', 'active')
      ON CONFLICT (organization_id, slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `, [orgId]);
    const outletId = outletRes.rows[0].id;
    console.log(`✓ Outlet created: Lumina Restobar KLCC (${outletId})`);

    // 3. Outlet Settings
    const settingsJson = {
      hotel: { hotelModeEnabled: false, roomChargeEnabled: false, vipTaggingEnabled: true },
      reservations: { defaultTurnaroundMinutes: 90, autoCancelMinutes: 15 },
      floor: { cleaningBufferMinutes: 15 },
      restaurant: { name: 'Lumina Restobar (KLCC)' }
    };

    await client.query(`
      INSERT INTO public.outlet_settings (organization_id, outlet_id, settings_json)
      VALUES ($1, $2, $3)
      ON CONFLICT (outlet_id) DO NOTHING;
    `, [orgId, outletId, JSON.stringify(settingsJson)]);
    console.log(`✓ Outlet settings initialized.`);

    // 4. Seating Areas
    const mainArea = await client.query(`
      INSERT INTO public.seating_areas (organization_id, outlet_id, name, description, capacity, display_order)
      VALUES ($1, $2, 'Main Dining Hall', 'Spacious central dining room', 40, 1)
      RETURNING id;
    `, [orgId, outletId]);
    const mainAreaId = mainArea.rows[0].id;

    const terraceArea = await client.query(`
      INSERT INTO public.seating_areas (organization_id, outlet_id, name, description, capacity, display_order)
      VALUES ($1, $2, 'VIP Terrace', 'Outdoor balcony with Petronas Twin Towers view', 20, 2)
      RETURNING id;
    `, [orgId, outletId]);
    const terraceAreaId = terraceArea.rows[0].id;

    const barArea = await client.query(`
      INSERT INTO public.seating_areas (organization_id, outlet_id, name, description, capacity, display_order)
      VALUES ($1, $2, 'Chef Counter & Bar', 'High-top seating and cocktail bar', 12, 3)
      RETURNING id;
    `, [orgId, outletId]);
    const barAreaId = barArea.rows[0].id;
    console.log(`✓ 3 Seating Areas created.`);

    // 5. Tables
    const tablesData = [
      { label: 'T-01', area: mainAreaId, cap: 4, min: 2, shape: 'square' },
      { label: 'T-02', area: mainAreaId, cap: 4, min: 2, shape: 'square' },
      { label: 'T-03', area: mainAreaId, cap: 4, min: 2, shape: 'square' },
      { label: 'T-04', area: mainAreaId, cap: 6, min: 4, shape: 'rectangle' },
      { label: 'T-05', area: mainAreaId, cap: 6, min: 4, shape: 'rectangle' },
      { label: 'V-01', area: terraceAreaId, cap: 6, min: 2, shape: 'booth' },
      { label: 'V-02', area: terraceAreaId, cap: 6, min: 2, shape: 'booth' },
      { label: 'B-01', area: barAreaId, cap: 2, min: 1, shape: 'round' },
      { label: 'B-02', area: barAreaId, cap: 2, min: 1, shape: 'round' },
    ];

    for (const t of tablesData) {
      await client.query(`
        INSERT INTO public.restaurant_tables (organization_id, outlet_id, seating_area_id, table_number, capacity, minimum_party_size, maximum_party_size, shape, status)
        VALUES ($1, $2, $3, $4, $5, $6, $5, $7, 'available')
        ON CONFLICT (outlet_id, table_number) DO NOTHING;
      `, [orgId, outletId, t.area, t.label, t.cap, t.min, t.shape]);
    }
    console.log(`✓ 9 Restaurant Tables created across seating areas.`);

    // 6. Experiences / Offers
    const experiencesData = [
      {
        title: 'Birthday Celebration Package',
        slug: 'birthday-package',
        desc: 'Customized birthday cake, champagne toast, and balloon decoration.',
        cat: 'celebration',
        price: 150.00
      },
      {
        title: 'Chef Omakese Tasting Menu',
        slug: 'chef-omakase',
        desc: '7-course curated pairing by Head Chef Kelvin.',
        cat: 'tasting',
        price: 280.00
      },
      {
        title: 'Romantic Sunset Dining',
        slug: 'romantic-sunset',
        desc: 'Prime terrace table setup with candle decoration & sparkling wine.',
        cat: 'romantic',
        price: 220.00
      }
    ];

    for (const exp of experiencesData) {
      await client.query(`
        INSERT INTO public.experiences (organization_id, outlet_id, title, slug, description, category, status, base_price, currency_code, is_public)
        VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, 'MYR', true)
        ON CONFLICT DO NOTHING;
      `, [orgId, outletId, exp.title, exp.slug, exp.desc, exp.cat, exp.price]);
    }
    console.log(`✓ 3 Public Dining Experiences seeded.`);

    console.log("SEEDING COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await client.end();
  }
}

seedDatabase();
