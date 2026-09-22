# Q F&B Operational Modules - Future Database Schema Planning

**Version:** 0.5.0 - Revised September 2026 (Phase 3G Guest Profiles + CRM Intelligence)
**Status:** Planning & Local Migrations Document.

---

## Phase 3A Foundation (Exists in Supabase Project)
- `profiles`, `organizations`, `organization_members`, `outlets`, `outlet_members`, `organization_invites`

---

## Phase 3C & 3C.1 Foundation (Local Migration `20260919000004_phase3c_reservations_schema.sql`)
- `seating_areas`, `reservations`, `reservation_status_history`, `reservation_status_enum`, `booking_source_enum`, `deposit_status_enum`

---

## Phase 3D & 3D.1 - Floor & Tables (Local Migrations `20260919000005_phase3d_floor_tables.sql` and `20260919000006_phase3d1_floor_integrity.sql`)

### Custom Enums

```sql
CREATE TYPE table_status_enum AS ENUM (
  'available', 'reserved', 'arriving', 'seated', 'ordering',
  'dining', 'bill_requested', 'cleaning', 'blocked'
);

CREATE TYPE table_shape_enum AS ENUM (
  'round', 'square', 'rectangle', 'booth', 'bar'
);
```

### `restaurant_tables`

| Column | Type | Constraints / Notes |
|---|---|---|
| id | UUID PK | `gen_random_uuid()` |
| organization_id | UUID FK -> organizations.id | Multi-tenant isolation |
| outlet_id | UUID FK -> outlets.id | Outlet scoping |
| seating_area_id | UUID FK -> seating_areas.id | Dining zone assignment |
| table_number | VARCHAR(20) | e.g. 'T01', 'B-03', 'PDR-1' (Unique per outlet) |
| display_name | TEXT | e.g. 'Window Booth', 'Chef Counter Station' |
| capacity | INT | `CHECK (capacity > 0)` |
| minimum_party_size | INT | `CHECK (minimum_party_size > 0)` |
| maximum_party_size | INT | `CHECK (maximum_party_size >= minimum_party_size AND maximum_party_size <= capacity)` |
| shape | table_shape_enum | 'round', 'square', 'rectangle', 'booth', 'bar' |
| position_x | INT | 2D X coordinate on canvas |
| position_y | INT | 2D Y coordinate on canvas |
| width | INT | Render width in px (default 80) |
| height | INT | Render height in px (default 80) |
| rotation | INT | Orientation angle in degrees (default 0) |
| status | table_status_enum | Real-time floor status (default 'available') |
| is_active | BOOLEAN | Table active in floor plan (default TRUE) |
| is_combinable | BOOLEAN | Suitable for table combination (default TRUE) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

### `table_state_history`

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | `gen_random_uuid()` |
| organization_id | UUID FK -> organizations.id | Multi-tenant audit isolation |
| outlet_id | UUID FK -> outlets.id | Outlet audit isolation |
| table_id | UUID FK -> restaurant_tables.id | Target table |
| old_status | table_status_enum | Nullable (initial setup) |
| new_status | table_status_enum | Transitioned state |
| reservation_id | UUID FK -> reservations.id | Nullable (active booking reference) |
| changed_by | UUID FK -> profiles.id | Nullable for automated actions |
| changed_at | TIMESTAMPTZ | DEFAULT NOW() |
| note | TEXT | Operational audit note |

---

## Phase 3E - Queue & Waitlist Engine (Local Migration `20260919000007_phase3e_waitlist.sql`)

### Custom Enums

```sql
CREATE TYPE waitlist_status_enum AS ENUM (
  'waiting', 'notified', 'arrived', 'table_preparing',
  'ready', 'seated', 'cancelled', 'no_response'
);

CREATE TYPE waitlist_source_enum AS ENUM (
  'staff', 'walk_in', 'q_restobar', 'website',
  'whatsapp', 'hotel_concierge', 'other'
);
```

### `waitlist_entries`

| Column | Type | Constraints / Notes |
|---|---|---|
| id | UUID PK | `gen_random_uuid()` |
| organization_id | UUID FK -> organizations.id | Multi-tenant isolation |
| outlet_id | UUID FK -> outlets.id | Outlet scoping |
| guest_id | UUID | Nullable CRM reference (links to `guests.id` in Phase 3G) |
| guest_name | TEXT NOT NULL | Guest / party contact name |
| phone | TEXT NOT NULL | Phone / WhatsApp number |
| whatsapp | TEXT | Nullable WhatsApp contact |
| email | TEXT | Nullable guest email |
| party_size | INT NOT NULL | `CHECK (party_size > 0)` |
| preferred_seating_area_id | UUID FK -> seating_areas.id | ON DELETE SET NULL |
| quoted_wait_minutes | INT NOT NULL | Host quoted wait (default 15) |
| estimated_wait_minutes | INT NOT NULL | Deterministic estimate (default 15) |
| status | waitlist_status_enum | Operational status (default 'waiting') |
| queue_number | TEXT NOT NULL | Display sequence (e.g. '#01') |
| notes | TEXT | Seating preferences & special notes |
| special_occasion | TEXT | e.g. 'Birthday', 'Anniversary' |
| dietary_requirements | TEXT[] | e.g. `['Vegetarian', 'No Pork']` |
| allergies | TEXT[] | e.g. `['Peanuts', 'Shellfish']` |
| priority_tags | TEXT[] | `['VIP', 'HOTEL_GUEST', 'ACCESSIBILITY', 'FAMILY', 'SPECIAL_OCCASION']` |
| source | waitlist_source_enum | 'walk_in', 'hotel_concierge', 'q_restobar', etc. |
| joined_at | TIMESTAMPTZ NOT NULL | DEFAULT NOW() |
| notified_at | TIMESTAMPTZ | Paging notification timestamp |
| arrived_at | TIMESTAMPTZ | Guest check-in timestamp |
| seated_at | TIMESTAMPTZ | Seating timestamp |
| cancelled_at | TIMESTAMPTZ | Cancellation / No-response timestamp |
| assigned_table_id | UUID FK -> restaurant_tables.id | ON DELETE SET NULL |
| reservation_id | UUID FK -> reservations.id | ON DELETE SET NULL |
| guest_status_token | TEXT NOT NULL UNIQUE | `encode(gen_random_bytes(16), 'hex')` |
| created_by | UUID FK -> profiles.id | Nullable staff creator |
| created_at | TIMESTAMPTZ NOT NULL | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ NOT NULL | DEFAULT NOW() |

### `waitlist_status_history`

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | `gen_random_uuid()` |
| organization_id | UUID FK -> organizations.id | Multi-tenant audit isolation |
| outlet_id | UUID FK -> outlets.id | Outlet audit isolation |
| waitlist_entry_id | UUID FK -> waitlist_entries.id | Target queue entry |
| old_status | waitlist_status_enum | Nullable (initial entry) |
| new_status | waitlist_status_enum | Transitioned status |
| changed_by | UUID FK -> profiles.id | Nullable for automated transitions |
| changed_at | TIMESTAMPTZ | DEFAULT NOW() |
| note | TEXT | Operational audit note |

### Database Integrity Triggers (Local)
1. `check_waitlist_preferred_area_consistency`: Enforces `preferred_seating_area_id` matches entry `org_id` and `outlet_id`.
2. `check_waitlist_assigned_table_consistency`: Enforces `assigned_table_id` matches entry `org_id` and `outlet_id`.
3. `check_waitlist_reservation_consistency`: Enforces `reservation_id` matches entry `org_id` and `outlet_id`.
4. `check_waitlist_status_history_consistency`: Enforces status history records match the parent entry's org and outlet.

---

## Phase 3E.1 Queue / Waitlist Integrity Hardening Rules (Local Migration `20260919000008_phase3e1_waitlist_integrity.sql`)

1. **`has_outlet_access()` Standardized Signature**:
   Fixed RLS policies to call the 3-parameter helper `public.has_outlet_access(auth.uid(), organization_id, outlet_id)`.
2. **`pgcrypto` Extension Registration**:
   Guaranteed `CREATE EXTENSION IF NOT EXISTS "pgcrypto"` is executed for cryptographic default `encode(gen_random_bytes(16), 'hex')`.
3. **`guest_status_token` Constraint**:
   Enforces `NOT NULL` and `UNIQUE` constraints database-side.
4. **Status Transition Trigger (`check_waitlist_status_transition`)**:
   Prevents terminal `seated` entries from being modified, and prevents direct transition of `cancelled`/`no_response` entries to `seated`/`ready` without explicit reactivation.

---

## Phase 3F - Orders, Order Items & Service Routing (Local Migration `20260919000009_phase3f_orders.sql`)

### Custom Enums

```sql
CREATE TYPE order_status_enum AS ENUM (
  'open', 'sent', 'in_progress', 'ready',
  'partially_served', 'served', 'completed', 'cancelled'
);

CREATE TYPE order_item_status_enum AS ENUM (
  'draft', 'sent', 'accepted', 'preparing',
  'ready', 'served', 'cancelled'
);

CREATE TYPE course_type_enum AS ENUM (
  'drinks', 'starter', 'main', 'side', 'dessert', 'other'
);

CREATE TYPE service_station_enum AS ENUM (
  'kitchen', 'bar', 'dessert', 'service'
);
```

### `orders`

| Column | Type | Constraints / Notes |
|---|---|---|
| id | UUID PK | `gen_random_uuid()` |
| organization_id | UUID FK -> organizations.id | Multi-tenant isolation |
| outlet_id | UUID FK -> outlets.id | Outlet scoping |
| table_id | UUID FK -> restaurant_tables.id | ON DELETE SET NULL |
| reservation_id | UUID FK -> reservations.id | ON DELETE SET NULL |
| waitlist_entry_id | UUID FK -> waitlist_entries.id | ON DELETE SET NULL |
| guest_name | TEXT | Display guest name |
| order_number | TEXT NOT NULL | e.g. 'ORD-101' |
| status | order_status_enum | Operational status (default 'open') |
| opened_by | UUID FK -> profiles.id | Staff opener |
| assigned_staff_id | UUID FK -> profiles.id | Assigned server |
| opened_at | TIMESTAMPTZ NOT NULL | DEFAULT NOW() |
| sent_at | TIMESTAMPTZ | Sent to station timestamp |
| completed_at | TIMESTAMPTZ | Completion timestamp |
| cancelled_at | TIMESTAMPTZ | Cancellation timestamp |
| notes | TEXT | Service instructions |
| created_at | TIMESTAMPTZ NOT NULL | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ NOT NULL | DEFAULT NOW() |

### `order_items`

| Column | Type | Constraints / Notes |
|---|---|---|
| id | UUID PK | `gen_random_uuid()` |
| organization_id | UUID FK -> organizations.id | Multi-tenant isolation |
| outlet_id | UUID FK -> outlets.id | Outlet scoping |
| order_id | UUID FK -> orders.id | ON DELETE CASCADE |
| item_name | TEXT NOT NULL | Dish / beverage name |
| menu_item_id | TEXT | Reference menu item ID |
| unit_price | NUMERIC(10,2) | Default 0.00 (preview subtotal) |
| quantity | INT NOT NULL | `CHECK (quantity > 0)` |
| seat_number | INT | Optional guest seat allocation (1-8) |
| course | course_type_enum | 'drinks', 'starter', 'main', 'dessert', etc. |
| destination_station | service_station_enum | 'kitchen', 'bar', 'dessert', 'service' |
| status | order_item_status_enum | Operational item status (default 'draft') |
| modifiers | TEXT[] | e.g. `['Bone Marrow Jus', 'Extra Truffle']` |
| cooking_preference | TEXT | e.g. 'Medium Rare' |
| allergy_notes | TEXT[] | e.g. `['PEANUT ALLERGY', 'SHELLFISH']` |
| special_instructions | TEXT | Chef / Bartender notes |
| created_by | UUID FK -> profiles.id | Nullable staff creator |
| sent_at | TIMESTAMPTZ | Sent timestamp |
| started_at | TIMESTAMPTZ | Preparation start timestamp |
| ready_at | TIMESTAMPTZ | Ready on pass timestamp |
| served_at | TIMESTAMPTZ | Served to table timestamp |
| created_at | TIMESTAMPTZ NOT NULL | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ NOT NULL | DEFAULT NOW() |

### `order_item_status_history`

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | `gen_random_uuid()` |
| organization_id | UUID FK -> organizations.id | Multi-tenant audit isolation |
| outlet_id | UUID FK -> outlets.id | Outlet audit isolation |
| order_item_id | UUID FK -> order_items.id | Target line item |
| old_status | order_item_status_enum | Nullable (initial draft) |
| new_status | order_item_status_enum | Transitioned item state |
| changed_by | UUID FK -> profiles.id | Nullable for automated actions |
| changed_at | TIMESTAMPTZ | DEFAULT NOW() |
| note | TEXT | Operational audit note |

### Database Integrity Triggers (Local - Phase 3F & 3F.1)
1. `check_order_table_consistency`: Enforces `table_id` matches order `org_id` and `outlet_id`.
2. `check_order_reservation_consistency`: Enforces `reservation_id` matches order `org_id` and `outlet_id`.
3. `check_order_waitlist_consistency`: Enforces `waitlist_entry_id` matches order `org_id` and `outlet_id`.
4. `check_order_staff_consistency`: Enforces `opened_by` and `assigned_staff_id` have valid outlet access via `has_outlet_access()`.
5. `check_order_item_order_consistency`: Enforces `order_id` matches item `org_id` and `outlet_id`.
6. `check_order_item_history_consistency`: Enforces item history matches parent tenant scope.
7. `validate_order_item_status_transition`: Prevents mutations on terminal states (`served`, `cancelled`) and enforces valid transition order.
8. `update_order_derived_status`: Computes aggregate order status (`open`, `sent`, `in_progress`, `ready`, `partially_served`, `served`) based on all constituent items.

### Constraints & Indexes (Phase 3F.1)
1. `uq_active_order_per_table`: Partial unique index `ON orders (table_id) WHERE status NOT IN ('completed', 'cancelled') AND table_id IS NOT NULL` preventing multiple active orders for the same table.
2. `fk_order_items_parent_composite`: Composite foreign key `FOREIGN KEY (order_id, organization_id, outlet_id) REFERENCES orders(id, organization_id, outlet_id) ON DELETE CASCADE`.
3. `fk_order_item_history_parent_composite`: Composite foreign key `FOREIGN KEY (order_item_id, organization_id, outlet_id) REFERENCES order_items(id, organization_id, outlet_id) ON DELETE CASCADE`.
4. `status`: Uses canonical `pending` as the default column value on `order_items`.

---

## Phase 3G - Guest Profiles & CRM Intelligence (Local Migration `20260919000011_phase3g_guests.sql`)

### `guests` (Organization-Scoped Guest Directory)

| Column | Type | Constraints / Notes |
|---|---|---|
| id | UUID PK | `gen_random_uuid()` |
| organization_id | UUID FK -> organizations.id | Multi-tenant organization scope |
| first_name | TEXT NOT NULL | Guest given name |
| last_name | TEXT NOT NULL | Guest family name |
| display_name | TEXT GENERATED | `first_name || ' ' || last_name` |
| primary_phone | VARCHAR(50) | Normalized phone number |
| whatsapp_number | VARCHAR(50) | WhatsApp contact number |
| email | VARCHAR(255) | Lowercased email address |
| is_vip | BOOLEAN NOT NULL | Default `FALSE` |
| vip_tier | VARCHAR(50) | e.g. 'Regular', 'VIP', 'VVIP', 'Chairman' |
| company_name | TEXT | Corporate affiliation |
| designation | TEXT | Job title |
| birthday_month | INT | 1-12 |
| birthday_day | INT | 1-31 |
| anniversary_date | DATE | Wedding / Milestone anniversary |
| dietary_requirements | TEXT[] | e.g. `['HALAL', 'VEGAN', 'KETO']` |
| allergies | TEXT[] | Life-safety alerts e.g. `['PEANUTS', 'SHELLFISH', 'CELIAC']` |
| seating_preferences | TEXT[] | e.g. `['Booth', 'Corner', 'Quiet area', 'High table']` |
| preferred_table_ids | UUID[] | Frequent table favorites |
| preferred_seating_area_ids | UUID[] | Preferred dining zones |
| operational_notes | TEXT | Staff notes (service style, water pref) |
| tags | TEXT[] | Informational tags e.g. `['WINE_LOVER', 'VEGETARIAN']` |
| marketing_email_opt_in | BOOLEAN NOT NULL | Explicit patron consent (Default `FALSE`) |
| marketing_whatsapp_opt_in | BOOLEAN NOT NULL | Explicit patron consent (Default `FALSE`) |
| marketing_sms_opt_in | BOOLEAN NOT NULL | Explicit patron consent (Default `FALSE`) |
| total_visits | INT NOT NULL | Default 0 |
| total_cancellations | INT NOT NULL | Default 0 |
| total_no_shows | INT NOT NULL | Default 0 |
| first_visited_at | TIMESTAMPTZ | Initial visit timestamp |
| last_visited_at | TIMESTAMPTZ | Most recent completed visit |
| created_by | UUID FK -> profiles.id | Nullable staff profile |
| created_at | TIMESTAMPTZ NOT NULL | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ NOT NULL | DEFAULT NOW() |

### `guest_visits` (Outlet-Scoped Hospitality Visit History)

| Column | Type | Constraints / Notes |
|---|---|---|
| id | UUID PK | `gen_random_uuid()` |
| organization_id | UUID FK -> organizations.id | Multi-tenant organization scope |
| outlet_id | UUID FK -> outlets.id | Physical outlet scope |
| guest_id | UUID FK -> guests.id | ON DELETE CASCADE |
| reservation_id | UUID FK -> reservations.id | Nullable booking origin |
| waitlist_entry_id | UUID FK -> waitlist_entries.id | Nullable walk-in waitlist origin |
| order_id | UUID FK -> orders.id | Nullable linked dining order |
| table_id | UUID FK -> restaurant_tables.id | Table occupied during visit |
| visit_date | DATE NOT NULL | Date of visit |
| arrival_time | TIMESTAMPTZ | Guest arrival timestamp |
| departure_time | TIMESTAMPTZ | Guest departure timestamp |
| party_size | INT NOT NULL | Guests seated |
| visit_rating | INT | Optional hospitality rating (1-5) |
| staff_notes | TEXT | Specific service observation |
| created_at | TIMESTAMPTZ NOT NULL | DEFAULT NOW() |

### Foreign Key Migrations to `guests.id` (Phase 3G)
1. `reservations.guest_id`: Added foreign key `REFERENCES public.guests(id) ON DELETE SET NULL`.
2. `waitlist_entries.guest_id`: Added foreign key `REFERENCES public.guests(id) ON DELETE SET NULL`.
3. `orders.guest_id`: Added foreign key `REFERENCES public.guests(id) ON DELETE SET NULL`.

### Database Integrity Triggers (Phase 3G)
1. `trg_normalize_guest_contact`: Automatically trims, standardizes to E.164-style, and lowercases `primary_phone`, `whatsapp_number`, and `email` on insert/update.
2. `trg_check_guest_visit_tenant`: Ensures `guest_id` in `guest_visits` belongs to the identical `organization_id`.
3. `trg_check_reservation_guest_tenant`: Ensures `guest_id` in `reservations` matches the reservation's `organization_id`.
4. `trg_check_waitlist_guest_tenant`: Ensures `guest_id` in `waitlist_entries` matches the waitlist entry's `organization_id`.
5. `trg_check_order_guest_tenant`: Ensures `guest_id` in `orders` matches the order's `organization_id`.

---

## Phase 3H - Offers & Experiences Engine (Local Migration `20260920000012_phase3h_offers_experiences.sql`)

### `experiences` (Hospitality Dining Packages & Tasting Menus)

| Column | Type | Constraints / Notes |
|---|---|---|
| id | UUID PK | `gen_random_uuid()` |
| organization_id | UUID FK -> organizations.id | Multi-tenant organization scope |
| outlet_id | UUID FK -> outlets.id | Nullable: `NULL` = Org-wide catalogue, `UUID` = Outlet-specific |
| title | TEXT NOT NULL | Package display title |
| slug | TEXT NOT NULL | URL/Identifier slug |
| short_description | TEXT | Concise menu highlight |
| description | TEXT | Detailed course breakdown and culinary notes |
| category | TEXT NOT NULL | `CHECK (category IN ('celebration', 'romantic', 'private_dining', 'tasting', 'wine', 'live_entertainment', 'corporate', 'family', 'seasonal', 'other'))` |
| status | TEXT NOT NULL | `CHECK (status IN ('draft', 'active', 'paused', 'expired', 'archived'))` (Default `'draft'`) |
| is_public | BOOLEAN NOT NULL | `TRUE` = publicly bookable; `FALSE` = staff internal only |
| is_featured | BOOLEAN NOT NULL | Display highlight flag (Default `FALSE`) |
| minimum_party_size | INT NOT NULL | `CHECK (minimum_party_size > 0)` (Default 1) |
| maximum_party_size | INT NOT NULL | `CHECK (maximum_party_size >= minimum_party_size)` (Default 6) |
| duration_minutes | INT | `CHECK (duration_minutes IS NULL OR duration_minutes > 0)` |
| base_price | NUMERIC(10,2) | Hospitality pricing metadata; `CHECK (base_price IS NULL OR base_price >= 0)` |
| currency_code | TEXT NOT NULL | Default `'MYR'` |
| preferred_seating_area_id | UUID FK -> seating_areas.id | ON DELETE SET NULL |
| valid_from | TIMESTAMPTZ | Start of seasonal availability |
| valid_until | TIMESTAMPTZ | End of availability; `CHECK (valid_until >= valid_from)` |
| booking_lead_minutes | INT | Minimum lead advance notice required |
| guest_terms | TEXT | Dining policies & dietary advance notice terms |
| internal_notes | TEXT | Staff table preparation and pacing instructions |
| image_url | TEXT | Marketing/display visual asset reference |
| created_by | UUID FK -> profiles.id | Nullable staff profile |
| created_at | TIMESTAMPTZ NOT NULL | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ NOT NULL | DEFAULT NOW() |

### `experience_addons` (Celebration & Hospitality Enhancers)

| Column | Type | Constraints / Notes |
|---|---|---|
| id | UUID PK | `gen_random_uuid()` |
| organization_id | UUID FK -> organizations.id | Multi-tenant organization scope |
| outlet_id | UUID FK -> outlets.id | Nullable: `NULL` = Org-wide |
| experience_id | UUID FK -> experiences.id | Nullable: `NULL` = General add-on; `UUID` = Package exclusive |
| name | TEXT NOT NULL | e.g. 'Artisanal Birthday Cake', 'Rose Petal Decor' |
| description | TEXT | Inclusions & specifications |
| category | TEXT NOT NULL | `CHECK (category IN ('food', 'beverage', 'decor', 'celebration', 'personalization', 'service', 'other'))` |
| price | NUMERIC(10,2) | Hospitality metadata; `CHECK (price IS NULL OR price >= 0)` |
| currency_code | TEXT NOT NULL | Default `'MYR'` |
| is_public | BOOLEAN NOT NULL | Publicly visible toggle |
| is_active | BOOLEAN NOT NULL | Active in service intake |
| maximum_quantity | INT | `CHECK (maximum_quantity IS NULL OR maximum_quantity > 0)` |
| created_at | TIMESTAMPTZ NOT NULL | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ NOT NULL | DEFAULT NOW() |

### `offers` (Promotional Perks & Hospitality Benefits)

| Column | Type | Constraints / Notes |
|---|---|---|
| id | UUID PK | `gen_random_uuid()` |
| organization_id | UUID FK -> organizations.id | Multi-tenant organization scope |
| outlet_id | UUID FK -> outlets.id | Nullable: `NULL` = Org-wide |
| title | TEXT NOT NULL | Benefit headline |
| short_description | TEXT | Summary perk |
| description | TEXT | Full terms |
| status | TEXT NOT NULL | `CHECK (status IN ('draft', 'active', 'paused', 'expired', 'archived'))` |
| is_public | BOOLEAN NOT NULL | Publicly visible toggle |
| is_featured | BOOLEAN NOT NULL | Featured perk highlight |
| valid_from | TIMESTAMPTZ | Start date |
| valid_until | TIMESTAMPTZ | Expiry date; `CHECK (valid_until >= valid_from)` |
| experience_id | UUID FK -> experiences.id | Nullable linked dining package |
| eligibility_notes | TEXT | Staff redemption criteria (e.g. Min 2 guests, seated pre-18:30) |
| redemption_notes | TEXT | Service action (e.g. Present glass of vintage champagne) |
| internal_notes | TEXT | Internal promotion context |
| created_at | TIMESTAMPTZ NOT NULL | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ NOT NULL | DEFAULT NOW() |

### `experience_availability_rules` (Service Pacing & Availability Rules)

| Column | Type | Constraints / Notes |
|---|---|---|
| id | UUID PK | `gen_random_uuid()` |
| organization_id | UUID FK -> organizations.id | Multi-tenant organization scope |
| outlet_id | UUID FK -> outlets.id | Physical outlet scope |
| experience_id | UUID FK -> experiences.id | ON DELETE CASCADE |
| day_of_week | INT NOT NULL | `CHECK (day_of_week BETWEEN 0 AND 6)` (0=Sunday ... 6=Saturday) |
| start_time | TIME NOT NULL | Service window start (e.g. '18:00') |
| end_time | TIME NOT NULL | Service window end (e.g. '22:30'); `CHECK (end_time > start_time)` |
| is_active | BOOLEAN NOT NULL | DEFAULT TRUE |
| maximum_bookings | INT | Capacity pacing cap per window |
| created_at | TIMESTAMPTZ NOT NULL | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ NOT NULL | DEFAULT NOW() |

### `reservation_experiences` (Operational Package Attachment)

| Column | Type | Constraints / Notes |
|---|---|---|
| id | UUID PK | `gen_random_uuid()` |
| organization_id | UUID FK -> organizations.id | Multi-tenant organization scope |
| outlet_id | UUID FK -> outlets.id | Physical outlet scope |
| reservation_id | UUID FK -> reservations.id | ON DELETE CASCADE |
| experience_id | UUID FK -> experiences.id | ON DELETE RESTRICT |
| status | TEXT NOT NULL | `CHECK (status IN ('pending', 'confirmed', 'fulfilled', 'cancelled'))` |
| quantity | INT NOT NULL | `CHECK (quantity > 0)` (Default 1) |
| unit_price_snapshot | NUMERIC(10,2) | Immutable price snapshot captured at booking attachment |
| currency_code | TEXT NOT NULL | Default `'MYR'` |
| guest_notes | TEXT | Guest celebration request / dietary specification |
| staff_notes | TEXT | Service captain / kitchen instructions |
| added_by | UUID FK -> profiles.id | Nullable staff member |
| created_at | TIMESTAMPTZ NOT NULL | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ NOT NULL | DEFAULT NOW() |

### `reservation_addons` (Operational Add-on Attachment)

| Column | Type | Constraints / Notes |
|---|---|---|
| id | UUID PK | `gen_random_uuid()` |
| organization_id | UUID FK -> organizations.id | Multi-tenant organization scope |
| outlet_id | UUID FK -> outlets.id | Physical outlet scope |
| reservation_id | UUID FK -> reservations.id | ON DELETE CASCADE |
| experience_id | UUID FK -> experiences.id | Nullable linked package |
| addon_id | UUID FK -> experience_addons.id | ON DELETE RESTRICT |
| quantity | INT NOT NULL | `CHECK (quantity > 0)` (Default 1) |
| unit_price_snapshot | NUMERIC(10,2) | Immutable price snapshot captured at attachment |
| currency_code | TEXT NOT NULL | Default `'MYR'` |
| notes | TEXT | Custom plaque wording, rose colors, etc. |
| added_by | UUID FK -> profiles.id | Nullable staff member |
| created_at | TIMESTAMPTZ NOT NULL | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ NOT NULL | DEFAULT NOW() |

### Multi-Tenant Integrity Triggers (Phase 3H)
1. `trg_check_experience`: Validates that `preferred_seating_area_id` belongs to the matching `organization_id` and (if specified) `outlet_id`.
2. `trg_check_addon`: Enforces that `experience_id` organization and outlet match the add-on's organization and outlet.
3. `trg_check_offer`: Enforces that linked `experience_id` organization matches the offer's organization.
4. `trg_check_reservation_experience`: Ensures `reservation_id` and `experience_id` share identical `organization_id` and valid `outlet_id`.
5. `trg_check_reservation_addon`: Ensures `reservation_id`, `addon_id`, and `experience_id` share identical tenant scope.

### Dual-Scope RLS Policies
- Catalog tables (`experiences`, `experience_addons`, `offers`, `experience_availability_rules`):
  - Where `outlet_id IS NULL`: validated via `public.has_organization_access(auth.uid(), organization_id)`.
  - Where `outlet_id IS NOT NULL`: validated via `public.has_outlet_access(auth.uid(), organization_id, outlet_id)`.
- Operational tables (`reservation_experiences`, `reservation_addons`):
  - Strictly validated via `public.has_outlet_access(auth.uid(), organization_id, outlet_id)`.

---

## Phase 3J — Staff, Settings & Hotel Mode (Local Migration `20260920000014_phase3j_staff_settings_hotel.sql`)

### 1. Role Enum Extensions

New values added to `app_role` using safe additive `ALTER TYPE ADD VALUE IF NOT EXISTS`:

```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'waiter';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cashier';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'kitchen';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'bar';
```

**`staff` is preserved** — soft-deprecated, maps operationally to `waiter`. Do NOT remove without a data-migration plan.

### 2. `organization_members` — New Optional Columns

| Column | Type | Notes |
|---|---|---|
| job_title | TEXT | Human-readable job title, e.g. "Head Bartender" |
| status | TEXT | 'active' \| 'inactive' \| 'invited' — operational state only, not HR |

### 3. `outlet_settings`

| Column | Type | Constraints / Notes |
|---|---|---|
| id | UUID PK | `gen_random_uuid()` |
| organization_id | UUID FK → organizations.id | Multi-tenant isolation |
| outlet_id | UUID FK → outlets.id | UNIQUE — one settings row per outlet |
| settings_json | JSONB | Typed `OutletSettings` container — see TypeScript types |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | Auto-updated via trigger |

**`settings_json` TypeScript type structure:**
```typescript
OutletSettings {
  restaurant: RestaurantSettings   // display name, contact, timezone, currency, locale
  service: ServiceSettings         // Breakfast / Lunch / Dinner / Late Night periods
  reservations: ReservationSettings
  floor: FloorSettings
  queue: QueueSettings
  orders: OrderSettings
  guests: GuestSettings
  hotel: HotelSettings             // hotelModeEnabled (default: false)
}
```

### 4. RLS for `outlet_settings`

- **SELECT:** `is_org_member(auth.uid(), organization_id)`
- **ALL (write):** `organization_members.role IN ('owner', 'admin', 'manager')`

### 5. Trigger

`outlet_settings_updated_at` — BEFORE UPDATE, sets `updated_at = NOW()` via SECURITY DEFINER function.
