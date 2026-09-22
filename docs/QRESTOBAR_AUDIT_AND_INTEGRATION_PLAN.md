# Q RESTOBAR — Codebase Audit & Shared Backend Integration Plan

**Audit Date:** 2026-09-19
**Audited:** D:\QUANTUM CLIMB - PROJECTS\QBar&Restaurant (read-only, no modifications made)
**Target:** Plan for shared Supabase operational backend between Q RESTOBAR and Q F&B

---

## PART 1 — Q RESTOBAR CODEBASE AUDIT

---

### 1.1 Technology Stack

| Property | Value |
|---|---|
| Project name | qbar-restaurant |
| Version | 1.0.0 |
| Framework | React 18 + TypeScript |
| Bundler | Vite 5 |
| Routing | React Router v6 |
| Styling | Tailwind CSS 3 + custom luxury palette |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| ORM | Prisma Client (present but not primary runtime path) |
| Supabase | @supabase/supabase-js ^2.116.0 |
| Deployment | Vercel (vercel.json present) |

---

### 1.2 Supabase Configuration

**Answer: YES — Q RESTOBAR has Supabase configured and has its own dedicated Supabase project.**

Evidence:

| File | Content |
|---|---|
| `.env` | Contains `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRETKEY`, `SUPABASE_PASSWORD`, `SUPABASE_JWT_SECRET_KEY`, `DATABASE_URL`, `DIRECT_URL` |
| `src/services/supabaseClient.ts` | Creates Supabase client from `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` |
| `prisma/schema.prisma` | Points to `DATABASE_URL` and `DIRECT_URL` — both are Supabase PostgreSQL connection strings |
| `supabase/schema.sql` | Production-ready PostgreSQL schema |
| `supabase/seed.sql` | Seed data for menu, settings, promotions |

**Critical finding:** Q RESTOBAR has a separate, independent Supabase project with its own database. This is the primary issue to resolve in the integration plan.

**Current operational mode:** The `.env` has `VITE_DEMO_MODE` set. The application falls back to `localStorage` when `VITE_DEMO_MODE=true` or Supabase credentials are absent. Both modes are supported through the service layer abstraction.

---

### 1.3 Existing Database Schema (Q RESTOBAR Supabase Project)

The Q RESTOBAR Supabase project has the following tables:

#### `menu_categories`
| Column | Type |
|---|---|
| id | VARCHAR(50) PK |
| label | VARCHAR(100) |
| description | TEXT |
| display_order | INT |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

#### `menu_items`
| Column | Type |
|---|---|
| id | VARCHAR(100) PK |
| name | VARCHAR(150) |
| category_id | FK → menu_categories |
| price | DECIMAL(10,2) |
| description | TEXT |
| image_url | TEXT |
| spicy_level | SMALLINT |
| is_vegetarian | BOOLEAN |
| is_chefs_pick | BOOLEAN |
| is_available | BOOLEAN |
| allergens | TEXT[] |
| pairing_recommendation | TEXT |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

#### `promotions`
| Column | Type |
|---|---|
| id | VARCHAR(100) PK |
| title | VARCHAR(150) |
| slug | VARCHAR(100) UNIQUE |
| tagline | VARCHAR(255) |
| description | TEXT |
| schedule | VARCHAR(150) |
| timeframe | VARCHAR(50) |
| image_url | TEXT |
| image_position | VARCHAR(50) |
| badge | VARCHAR(50) |
| terms | TEXT[] |
| pricing_highlights | VARCHAR(100) |
| cta_text | VARCHAR(50) |
| is_active | BOOLEAN |
| priority | INT |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

#### `restaurant_settings`
| Column | Type |
|---|---|
| id | VARCHAR(100) PK |
| name | VARCHAR(100) |
| secondary_name | VARCHAR(100) |
| tagline | VARCHAR(255) |
| secondary_tagline | VARCHAR(255) |
| location_area | VARCHAR(150) |
| address_line1 | VARCHAR(255) |
| address_line2 | VARCHAR(255) |
| city | VARCHAR(100) |
| postcode | VARCHAR(20) |
| phone | VARCHAR(50) |
| whatsapp | VARCHAR(50) |
| email | VARCHAR(150) |
| opening_hours_display | VARCHAR(255) |
| opening_hours_weekday | VARCHAR(255) |
| opening_hours_weekend | VARCHAR(255) |
| dress_code | VARCHAR(255) |
| announcement_bar_text | TEXT |
| announcement_bar_active | BOOLEAN |
| google_maps_embed_url | TEXT |
| instagram_url | TEXT |
| facebook_url | TEXT |
| tiktok_url | TEXT |
| updated_at | TIMESTAMPTZ |

#### `reservations`
| Column | Type | Notes |
|---|---|---|
| id | VARCHAR(100) PK | UUID |
| reference_number | VARCHAR(20) UNIQUE | e.g. QRESTO-82914 |
| full_name | VARCHAR(150) | |
| email | VARCHAR(255) | |
| phone | VARCHAR(50) | |
| date | DATE | |
| time | VARCHAR(10) | HH:MM string |
| guest_count | SMALLINT | 1–20 |
| seating_preference | seating_preference_enum | indoor, outdoor, chefs-table |
| occasion | occasion_type_enum | casual, birthday, anniversary, business, date-night, celebration, other |
| special_requests | TEXT | |
| consent | BOOLEAN | |
| status | reservation_status_enum | new, contacted, confirmed, seated, completed, cancelled |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Enums present:**
- `reservation_status_enum`: new, contacted, confirmed, seated, completed, cancelled
- `seating_preference_enum`: indoor, outdoor, chefs-table
- `occasion_type_enum`: casual, birthday, anniversary, business, date-night, celebration, other

---

### 1.4 Existing Reservation Data

**Demo/seed reservations are present in `src/data/initialReservations.ts`** — 6 sample records (Tan Sri Dato Farhan, Melissa Chong, David Lee, Siti Nurhaliza binti Kamarudin, Michael Wong, Rachel Lim).

These are **demo fixture records, not production customer data**. They use in-memory IDs (`res-101` through `res-106`) and relative dates. They are not authoritative booking records.

**Production data status:** The live Supabase project may or may not have real reservation records depending on whether `VITE_DEMO_MODE=false` has been deployed. The `.env` contains `VITE_DEMO_MODE` — its value determines whether the live Supabase project has been receiving real bookings. This must be verified before any migration is attempted.

---

### 1.5 Guest / Customer Tables

**Answer: NO dedicated guest profile table exists in Q RESTOBAR.**

Guest information is captured only within the `reservations` table (full_name, email, phone, occasion, special_requests). There is no separate `guests`, `customers`, or `profiles` table. There is no guest history, visit count, or CRM layer.

---

### 1.6 Offers / Experiences Tables

**Answer: NO dedicated experiences table exists in Q RESTOBAR.**

Experiences in Q RESTOBAR are implemented as:
- `promotions` table — CMS-managed promotional offers (Weekend Brunch, Ladies Night, Live DJ events, etc.)
- UI components: `FlavorMatchmaker`, `GoldenPerkWheel`, `ZoneVibePicker`, `LiveAvailabilityTicker` — interactive widgets that append experience/package notes into the reservation form's `special_requests` field via URL query parameters

There is no structured `experiences` table with typed add-ons linkable to reservations.

---

### 1.7 Authentication Configuration

**Current state: Temporary demo auth gate — NOT production-ready.**

| Layer | Implementation |
|---|---|
| Admin CMS | Client-side demo password gate (`VITE_DEMO_ADMIN_PASSWORD` in `.env`) |
| Supabase Auth | Configured but optional — falls back to demo session if Supabase auth fails |
| Guest booking | No auth required — reservations submitted anonymously (`FOR INSERT WITH CHECK (true)`) |

The README explicitly states:
> "This demo password gate is strictly for temporary client showcase and must be replaced with Supabase Auth, RBAC, and RLS prior to production."

This is a significant finding. The Admin CMS in Q RESTOBAR is not secured to production standards.

---

### 1.8 Existing API / RPC / Edge Functions

**Answer: NONE.**

No Supabase Edge Functions exist in the Q RESTOBAR project. There is no `supabase/functions/` directory. All operations go through the Supabase JS client directly from the browser using the anon key.

**Security implication:** The current RLS policies include `FOR ALL USING (true) WITH CHECK (true)` — this means ANY anonymous user can read, write, update, and delete all records. This is appropriate only for demo mode and is a critical production security gap.

---

### 1.9 Availability Logic

**Answer: NO server-side availability calculation exists.**

The reservation form uses a hardcoded array of time strings:

```typescript
const AVAILABLE_TIMES = [
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '17:30', '18:00', '18:30', '19:00', '19:30', '20:00',
  '20:30', '21:00', '21:30', '22:00', '22:30'
];
```

No table capacity checking, no conflict detection, no occupancy awareness. Two guests could theoretically book the same table at the same time and both submissions would succeed.

---

### 1.10 CMS / Content Data Summary

The following are **Q RESTOBAR website content** items — not operational restaurant data:

| Data | Table | Nature |
|---|---|---|
| Menu categories | `menu_categories` | Website CMS content |
| Menu items | `menu_items` | Website CMS content |
| Promotions | `promotions` | Website marketing content |
| Restaurant settings | `restaurant_settings` | Website CMS config |

These are **website-specific content** and do not need to be migrated to the Q F&B operational backend. They serve the guest-facing display only.

---

## PART 2 — DATABASE COMPARISON

---

### 2.1 Schema Comparison: Q RESTOBAR vs Q F&B

| Domain | Q RESTOBAR Supabase | Q F&B Supabase | Overlap |
|---|---|---|---|
| Organizations (multi-tenant) | None | `organizations` table | None in Q RESTOBAR |
| Outlets | None | `outlets` table | None in Q RESTOBAR |
| Staff / Auth | Demo password gate only | `profiles`, `organization_members`, `outlet_members` | None |
| Reservations | `reservations` table (flat, simple) | Planned in Phase 3C (richer schema) | Partial field overlap |
| Guests / CRM | None | Planned in Phase 3G | None |
| Availability | Hardcoded time array | Planned in Phase 3D (calculated) | None |
| Menu / Menu items | `menu_categories`, `menu_items` | Not planned (out of MVP scope) | None — different owners |
| Promotions | `promotions` table | `offers`, `experiences` planned (Phase 3H) | Conceptual overlap only |
| Settings | `restaurant_settings` | Outlet-level settings planned (Phase 3J) | Partial conceptual overlap |

---

### 2.2 Q RESTOBAR Reservation Schema vs Q F&B Planned Reservation Schema

| Q RESTOBAR field | Q F&B planned field | Migration action |
|---|---|---|
| `id` (VARCHAR UUID) | `id` (UUID) | Preserve — reformat type |
| `reference_number` | `external_reference` | Preserve as legacy reference |
| `full_name` | `guest_name` (denormalised) | Map directly |
| `email` | `guest_id` → `guests.email` | Create guest record, link |
| `phone` | `guest_id` → `guests.phone` | Create guest record, link |
| `date` | `reservation_date` | Map directly |
| `time` | `reservation_time` | Map directly |
| `guest_count` | `party_size` | Map directly |
| `seating_preference` | `seating_area_id` | Map preference to seating_area if areas created |
| `occasion` | `special_occasion` | Map enum values |
| `special_requests` | `guest_notes` | Map directly |
| `consent` | Not planned (implied) | Can be stored or dropped |
| `status` | `status` (extended enum) | Map + extend (add `arrived`, `no_show`) |
| `created_at` | `created_at` | Preserve |
| `updated_at` | `updated_at` | Preserve |
| — | `outlet_id` | Assign to the Q RESTOBAR outlet record |
| — | `booking_source` | Set to `q_restobar` for all migrated records |
| — | `created_by` | Set to system/concierge profile or NULL |

---

## PART 3 — CRITICAL FINDINGS

---

### Finding 1: Two Separate Supabase Projects

Q RESTOBAR has its own independent Supabase project.
Q F&B has its own independent Supabase project (Phase 3A).

These are two separate PostgreSQL databases with completely different schemas. They currently share no data.

**This is the root cause of the integration problem.**

---

### Finding 2: Q RESTOBAR RLS Policies Are Open

Current Q RESTOBAR RLS policies allow all operations from any caller:

```sql
CREATE POLICY "Allow full access on reservations"
ON public.reservations FOR ALL USING (true) WITH CHECK (true);
```

This means any browser tab can read, modify, or delete any reservation without authentication. This is intentional for demo mode but is a production security risk.

---

### Finding 3: No Real-Time Sync Exists

Q RESTOBAR does not subscribe to any Supabase Realtime channel. Reservation updates from any source (staff changing status in the current admin panel) are not pushed to other clients.

---

### Finding 4: Availability Is Not Real

Availability in Q RESTOBAR is a hardcoded time slot array. It has no relationship to actual table occupancy, confirmed reservations, or operational state.

---

### Finding 5: No Experience / Add-On Schema

Experiences in Q RESTOBAR are passed as free-text strings in `special_requests`. They are not structured records linkable to a reservation. The Q F&B `experiences` and `reservation_addons` tables planned in Phase 3H will be entirely new.

---

### Finding 6: No Guest Profile History

Q RESTOBAR captures guest name, email, and phone per reservation but does not build persistent guest profiles. Each reservation is a standalone record. No CRM exists.

---

### Finding 7: Demo Data Only — No Confirmed Production Records

The Q RESTOBAR reservation records in `initialReservations.ts` are demo fixture data with test names, relative dates, and synthetic IDs. These are not real customer records and do not need migration. Real production records (if any) would be in the live Supabase project — their existence must be verified before any migration.

---

### Finding 8: Menu and Promotions Are Website CMS Content

The `menu_items`, `menu_categories`, `promotions`, and `restaurant_settings` tables in Q RESTOBAR are website CMS content that serves the guest-facing display. These are NOT operational restaurant data. They should NOT be migrated to Q F&B.

Q F&B does not plan to manage menu content in its MVP. Menu remains in Q RESTOBAR's own database.

---

## PART 4 — INTEGRATION PLAN

---

### Architecture Decision: Shared Q F&B Backend

**Recommended approach:** Q F&B becomes the single operational Supabase backend. Q RESTOBAR connects to it for operational data only — through Edge Functions and RPCs. Q RESTOBAR retains its own Supabase project for website CMS content (menu, promotions, settings).

```
Q RESTOBAR Supabase Project (retained)         Q F&B Supabase Project (authoritative)
─────────────────────────────────────          ──────────────────────────────────────
menu_categories      ← stays here             organizations
menu_items           ← stays here             outlets
promotions           ← stays here             profiles + members
restaurant_settings  ← stays here             reservations         ← new home
                                              guests               ← new
                                              seating_areas        ← new
                                              restaurant_tables    ← new
                                              waitlist             ← new
                                              experiences          ← new (replaces promotions for ops)
                                              orders               ← new
```

Q RESTOBAR connects to Q F&B operational backend through:
- Edge Functions (public, validated, no service key in browser)
- Read-only public RPCs where appropriate
- Supabase Realtime subscriptions for status updates (scoped to guest's own reservation token)

---

### Phase A — Prepare Q F&B Operational Backend (During Phases 3C–3H)

No Q RESTOBAR changes during this phase.

1. Build Q F&B Phases 3C (Reservations), 3D (Floor/Tables), 3E (Queue), 3G (Guests), 3H (Offers/Experiences) as per roadmap.
2. Ensure the Q F&B reservation schema includes all fields needed to accept Q RESTOBAR bookings.
3. Add `outlet_id` assignment for the Q RESTOBAR physical outlet (Lumina Restobar KLCC or equivalent).
4. Add `booking_source = q_restobar` enum value (already planned).
5. Design `experiences` table with `is_public` flag so staff controls what Q RESTOBAR displays.

---

### Phase B — Build Integration Layer (Phase 3K)

Build the five Edge Functions in the Q F&B Supabase project:

1. `public-availability` — Q RESTOBAR calls this to get real time slots
2. `public-create-reservation` — Q RESTOBAR submits bookings here
3. `public-reservation-status` — Q RESTOBAR polls/displays reservation status
4. `public-waitlist` — Q RESTOBAR allows guests to join queue
5. `public-experiences` — Q RESTOBAR fetches publicly visible experiences

Full specification: `docs/INTEGRATION_ARCHITECTURE.md`

---

### Phase C — Q RESTOBAR Migration (Phase 3K, after Edge Functions validated)

Scope of changes to Q RESTOBAR (QBar&Restaurant project):

#### 3K.1 — Remove Independent Reservation Storage

Replace the current `reservationService.ts` Supabase write path (which writes to Q RESTOBAR's own `reservations` table) with a call to Q F&B's `public-create-reservation` Edge Function.

**What changes in Q RESTOBAR:**
- `ReservationForm.tsx` calls Q F&B Edge Function URL instead of Supabase client directly
- `reservationService.ts` create() method updated
- Q RESTOBAR no longer owns reservation records

**What stays the same in Q RESTOBAR:**
- Form UI (ReservationForm component)
- Validation (Zod schema)
- Success modal (ReservationSuccessModal)
- Reference number display (returned from Q F&B Edge Function response)

#### 3K.2 — Replace Hardcoded Availability

Replace `AVAILABLE_TIMES` array in `ReservationForm.tsx` with a fetch call to Q F&B `public-availability` Edge Function.

**What changes in Q RESTOBAR:**
- Available time slots fetched from Q F&B based on outlet + date + party size
- Loading state added while fetching slots
- Slot display becomes dynamic

#### 3K.3 — Connect Experience Selection

Replace URL-parameter experience notes with structured experience selection from Q F&B `public-experiences` Edge Function.

**What changes in Q RESTOBAR:**
- Experience selection fetches from Q F&B (filtered: active + is_public only)
- Selected experience ID passed in reservation payload (not as free text)

#### 3K.4 — Reservation Status Polling

Add reservation status check using Q F&B `public-reservation-status` Edge Function. Guests can check status using their reservation token.

#### 3K.5 — Q RESTOBAR Admin Panel (Reservations)

The current Q RESTOBAR admin panel at `/admin` shows reservations from Q RESTOBAR's own Supabase project. After migration, reservations will live in Q F&B.

**Options (to be decided in Phase 3K):**

**Option A — Remove reservation management from Q RESTOBAR admin**
Staff manages reservations entirely in Q F&B. Q RESTOBAR admin panel retains only menu, promotions, and settings management.

**Option B — Display-only reservation list in Q RESTOBAR admin**
Q RESTOBAR admin shows a read-only list by polling Q F&B `public-reservation-status` or a restricted admin-facing API. Status changes are made in Q F&B.

**Recommendation: Option A.** The Q RESTOBAR admin panel was always intended as a temporary demo CMS. Reservation management belongs in Q F&B. Retain Q RESTOBAR admin for menu + promotions + settings only.

#### 3K.6 — Supabase Realtime for Guest Status

Q RESTOBAR can subscribe to reservation status changes using a scoped Supabase Realtime channel in the Q F&B project, using the guest's `reservation_token` as the channel filter. This allows the guest's confirmation page to update live when staff confirms the booking.

---

### Phase D — Data Migration (if production reservation data exists)

**Pre-condition:** Verify whether Q RESTOBAR's live Supabase project contains real production reservation records (`VITE_DEMO_MODE=false` must have been active for real data to exist).

If real production reservations exist:

1. Export Q RESTOBAR reservations from Q RESTOBAR Supabase project
2. Transform field names (guest_count → party_size, seating_preference → seating_area lookup, etc.)
3. Create guest records in Q F&B `guests` table for each unique phone number
4. Insert reservations into Q F&B `reservations` table with:
   - `booking_source = 'q_restobar'`
   - `outlet_id` = the Q RESTOBAR outlet's ID in Q F&B
   - `external_reference` = original `reference_number`
   - `guest_id` = matched or newly created guest record
5. Verify record count matches
6. Archive Q RESTOBAR reservation table (do not delete — retain as fallback)

If only demo data exists (no production records):
- No migration required
- Q F&B starts fresh with clean operational data

---

## PART 5 — DATA OWNERSHIP AFTER INTEGRATION

| Data | Owner After Integration | Accessible To Q RESTOBAR? |
|---|---|---|
| Reservations | Q F&B | Yes — submit (write), status (read own) |
| Availability | Q F&B | Yes — filtered public view |
| Guests / CRM | Q F&B | No — operational only |
| Queue / Waitlist | Q F&B | Yes — submit, read own position |
| Experiences (operational) | Q F&B | Yes — publicly flagged only |
| Table states | Q F&B | No |
| Orders | Q F&B | No |
| Staff / Roles | Q F&B | No |
| Menu items | Q RESTOBAR | Guest display only |
| Promotions | Q RESTOBAR | Guest display only |
| Restaurant settings | Q RESTOBAR | Guest display only |
| Site theme / brand | Q RESTOBAR | Guest display only |

---

## PART 6 — SECURITY REMEDIATION REQUIRED IN Q RESTOBAR

Before Q RESTOBAR goes to production (separate from integration work):

| Issue | Severity | Action |
|---|---|---|
| Demo password gate for admin | Critical | Replace with Supabase Auth + RLS |
| Open RLS policies (`USING (true)`) | Critical | Replace with proper auth-gated policies |
| `VITE_DEMO_ADMIN_PASSWORD` in `.env` | Critical | Remove before production deploy |
| `SUPABASE_SECRETKEY` present in `.env` (server-side key) | Critical | Ensure never used in client-side code |
| Anonymous can delete any reservation | Critical | Restrict with RLS to authenticated users only |

These security issues are in the Q RESTOBAR project and must be remediated before Phase 3K integration. They are independent of the Q F&B integration work.

---

## PART 7 — INTEGRATION READINESS CHECKLIST

### Q F&B Must Complete Before Integration

- [ ] Phase 3C: Reservations module stable (including `outlet_id`, `booking_source`, `external_request_id`, `reservation_token`)
- [ ] Phase 3D: Floor + Tables + availability calculation stable
- [ ] Phase 3E: Queue / Waitlist stable
- [ ] Phase 3G: Guest Profiles + phone deduplication stable
- [ ] Phase 3H: Experiences with `is_public` flag stable
- [ ] Edge Functions scaffolded in `supabase/functions/`
- [ ] At least one outlet record created in Q F&B for Q RESTOBAR's physical location

### Q RESTOBAR Must Complete Before Integration

- [ ] Admin authentication replaced with Supabase Auth (remove demo password gate)
- [ ] RLS policies updated to proper authenticated access
- [ ] Production reservation data audited (determine if migration is needed)
- [ ] `reservationService.ts` refactored to call Q F&B Edge Functions
- [ ] Hardcoded availability replaced with Q F&B availability API
- [ ] Experience URL params replaced with structured Q F&B experience API

---

## PART 8 — WHAT DOES NOT CHANGE

The following Q RESTOBAR elements are unaffected by integration:

- All theme components (MidnightEmber, UrbanNeon, HeritageSpice, BotanicalBistro)
- Menu display (`menuService.ts` → Q RESTOBAR Supabase `menu_items`)
- Promotions display (`promotionService.ts` → Q RESTOBAR Supabase `promotions`)
- Restaurant settings display (`settingsService.ts` → Q RESTOBAR Supabase `restaurant_settings`)
- All visual components, hero sections, gallery, contact page
- WhatsApp button and links
- Google Calendar / ICS file generation (can stay on confirmation screen)
- Vercel deployment configuration

---

## PART 9 — IMMEDIATE RECOMMENDED ACTIONS (Before Phase 3K)

Do NOT start these yet. Document only.

1. **Verify** whether Q RESTOBAR live Supabase project has real production reservation records. Check by connecting to the Q RESTOBAR Supabase project dashboard (not code) and checking the `reservations` table row count.

2. **Preserve** Q RESTOBAR's current Supabase project. Do not delete or alter its tables. It will continue serving menu, promotions, and settings for the Q RESTOBAR website after integration.

3. **Record** the Q RESTOBAR Supabase project URL and ensure it remains accessible during Phase 3K transition.

4. **Plan** the Q RESTOBAR outlet record in Q F&B: when Phase 3C is built, create the organization and outlet records that correspond to the physical Q RESTOBAR venue (Q-RESTOBAR, Pavilion Gallery, Kuala Lumpur).

5. **Do not** change any Q RESTOBAR code until Phase 3K begins and Q F&B APIs are validated.

---

End of Q RESTOBAR Audit & Integration Plan v1.0.0
