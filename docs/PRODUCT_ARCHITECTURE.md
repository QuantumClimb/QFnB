# Q F&B Product & System Architecture

**Product:** Q F&B Standalone Hospitality Operations Application  
**Version:** 0.7.0 - Revised September 2026 (Phase 3G Guest Profiles + CRM Intelligence)

---

## 1. Modular Architecture Principles

Q F&B follows strict feature encapsulation under `src/features/`:

```
src/
├── features/
│   ├── dashboard/               # Phase 3B: TODAY / Live Operations Foundation
│   │   ├── types/
│   │   ├── fixtures/
│   │   ├── services/            # IDashboardService boundary
│   │   ├── context/
│   │   └── components/
│   ├── reservations/            # Phase 3C & 3C.1: Reservations + Availability Foundation
│   │   ├── types/
│   │   ├── fixtures/
│   │   ├── services/            # IReservationService & IAvailabilityService
│   │   ├── context/
│   │   └── components/
│   ├── floor/                   # Phase 3D & 3D.1: Floor + Tables + Smart Availability
│   │   ├── types/               # Strongly-typed SeatReservationInput, SeatWalkInInput, MovePartyInput
│   │   ├── fixtures/
│   │   ├── services/            # IFloorService & ISmartAvailabilityService
│   │   ├── context/
│   │   └── components/
│   ├── queue/                   # Phase 3E, 3E.1 & 3E.2: Queue + Waitlist Engine
│   │   ├── types/
│   │   ├── fixtures/
│   │   ├── services/            # IQueueService, IWaitEstimationService, IGuestNotificationService
│   │   ├── context/
│   │   └── components/
│   ├── orders/                  # Phase 3F & 3F.1: Orders + Waiter Workflow & Service Expedite
│   │   ├── types/               # OpenOrderInput, AddOrderItemInput, UpdateOrderItemInput
│   │   ├── fixtures/            # Realistic menu categories & active orders
│   │   ├── services/            # IOrderService & FixtureOrderService
│   │   ├── context/             # OrderContext & useOrders hook
│   │   └── components/          # Service board, My Tables, fast entry drawer, ticket drawer
│   └── guests/                  # Phase 3G: Guest Profiles + CRM Intelligence
│       ├── types/               # Guest, GuestVisit, CreateGuestInput, DuplicateMatchResult
│       ├── fixtures/            # Rich guest profiles, timelines, allergy safety tags
│       ├── services/            # IGuestService, FixtureGuestService, duplicate detection
│       ├── context/             # GuestContext & useGuests hook
│       └── components/          # KPI header, filters, guest list, detail drawer, modals
├── components/                  # Global AppShell, ProtectedRoute, UI primitives
├── context/                     # Global AuthContext & OrgContext
├── lib/                         # Supabase client & utilities
├── pages/                       # Route entrypoints wrapping feature providers
└── types/                       # Shared platform models
```

---

## 2. Floor Service Boundary & Typed Seating Inputs

The floor service API enforces strongly-typed operational inputs without using `any`:
- `seatReservation(tableId: string, reservationId: string, guestData: SeatReservationInput): Promise<RestaurantTable>`
- `seatWalkIn(tableId: string, guestData: SeatWalkInInput): Promise<RestaurantTable>`
- `moveParty(fromTableId: string, toTableId: string): Promise<{ fromTable: RestaurantTable; toTable: RestaurantTable }>`

---

## 3. Future Atomic Backend Operations (Phase 3D.1 Architecture Spec)

When connecting real Supabase RPCs in production:

### Atomic Seating RPC (`seat_reservation_atomic`)
1. Validates reservation exists, matches tenant outlet, and is in valid transition state (`confirmed` or `arrived`).
2. Validates target table exists, matches tenant outlet, and is `available` (or held for this reservation).
3. Validates table capacity meets party size (`minimum_party_size <= party_size <= capacity`).
4. Updates `reservations.status` to `seated` and sets `reservations.assigned_table_id = target_table_id`.
5. Updates `restaurant_tables.status` to `seated`.
6. Inserts record into `public.reservation_status_history` (`old_status -> seated`).
7. Inserts record into `public.table_state_history` (`old_status -> seated`).
8. Executes as a single atomic transaction: all succeed together or all roll back.

### Atomic Relocation RPC (`move_party_atomic`)
1. Validates source table is occupied (`seated`, `ordering`, `dining`, `bill_requested`).
2. Validates destination table is `available` or `cleaning` and belongs to same outlet.
3. Validates destination table capacity >= moving party size.
4. Moves active session / reservation reference to destination table and sets status to `seated`.
5. Sets source table status to `cleaning`.
6. Inserts `table_state_history` records for both source and destination tables.
7. Executes atomically in one transaction.

---

## 4. Smart Availability Safety & Deterministic Pacing

Smart Availability performs deterministic gap discovery:
- Ignores `blocked` or inactive tables.
- Accounts for a configurable **15-minute cleaning turn buffer** between bookings.
- Verifies remaining time gap >= requested dining duration (e.g. 75 mins).
- Zero artificial AI scoring; all slots are backed by deterministic capacity and time boundaries.

---

## 5. Queue & Waitlist Engine Architecture (Phase 3E)

### Decoupled Presentation vs Service-Layer Coordination
- `QueueContext` and `FloorContext` are isolated presentation boundaries. Neither context imports or depends on the other.
- Cross-feature operations (e.g. seating a guest from queue, preparing a table) coordinate strictly through the service layer (`IQueueService` ↔ `IFloorService` backed by a shared development operational store).

```
Queue UI (components)
       ↓
  QueueContext (presentation state only)
       ↓
  IQueueService
       ↓
Queue / Floor Coordination Layer (shared operational store)
       ↓
  IFloorService
```

### Deterministic Wait Estimation (`IWaitEstimationService`)
- Evaluates target party size against compatible tables (considering physical capacity and active states).
- Calculates projected table turnovers with elapsed dining timers and a 15-minute cleaning buffer.
- Accounts for compatible parties ahead in the queue.
- 100% deterministic and predictable without black-box AI claims.

### Channel-Neutral Guest Notification Boundary (`IGuestNotificationService`)
- Clean interface supporting simulated dispatch across WhatsApp, SMS, push notifications, and contactless guest status URLs.
- In Phase 3E DEV PREVIEW mode, notifications are simulated in-browser with zero external SMS/WhatsApp network calls.

### Guest Status Token & Future Contactless Q RESTOBAR Integration
- Each waitlist entry generates a secure, non-sequential `guest_status_token` (`encode(gen_random_bytes(16), 'hex')`).
- Public guest status endpoints will consume this token in future phases to display real-time queue position ("#3 in queue", "Table preparing", "Table ready") without exposing private tenant operational data, phone numbers, or staff notes.

### Future Atomic Seating RPC (`seat_waitlist_guest_atomic`)
When connecting remote Supabase RPCs in production:
1. Locks waitlist entry (`SELECT ... FOR UPDATE`).
2. Validates entry is in `waiting`, `notified`, `table_preparing`, or `ready` status.
3. Locks target table and validates tenant outlet ownership.
4. Validates target table capacity >= entry party size.
5. Updates `waitlist_entries.status` to `seated`, sets `seated_at = NOW()`, and sets `assigned_table_id`.
6. Updates `restaurant_tables.status` to `seated` and sets active guest session.
7. Inserts `public.waitlist_status_history` record (`old_status -> seated`).
8. Inserts `public.table_state_history` record (`old_status -> seated`).
9. Executes atomically inside a single Postgres transaction.

---

## 6. Queue Fairness & Positioning Model (Phase 3E.2)

### Timestamp-Based Ordering Fairness
- **Primary Mechanism:** `joined_at ASC` dictates the authoritative arrival ordering for all waiting guests.
- **Informational Tags:** Priority tags (`VIP`, `HOTEL_GUEST`, `ACCESSIBILITY`, `BIRTHDAY`, `FAMILY`, `SPECIAL_OCCASION`) provide operational context to host staff but **never** cause automatic queue jumping or reordering.

### Position-Bearing Statuses vs Action Stages
1. **Position-Bearing Waiting Queue:**
   - Applicable to active waiting statuses: `waiting`, `notified`, `arrived`.
   - Numbered sequentially as `#01, #02, #03...` strictly by `joined_at ASC`.
2. **Operational Action Stages (Separated from Waiting Queue):**
   - **`ready` (Ready for Seating):** Displayed in dedicated action panel with green accent and table assignment. Does not hold a `#0X` position in the waiting line.
   - **`table_preparing` (Tables Preparing):** Displayed in dedicated action panel with purple accent while floor staff preps the table.
   - When a guest moves into an action stage, the active waiting queue immediately re-indexes without disruption.
3. **Terminal States:**
   - `seated`, `cancelled`, `no_response` do not hold queue positions.

---

## 7. Orders & Service Expedite Architecture (Phase 3F & 3F.1)

### Floor Status Ownership Boundary
- **Allowed Automatic Coordination:**
  - `openOrder`: transitions table from `seated` → `ordering` when a service ticket is initiated.
  - `sendOrder`: transitions table from `ordering` → `dining` when items are sent to kitchen/bar stations.
- **Strict Floor Operations Boundary:**
  - Orders must **NOT** automatically transition a table to `bill_requested`, `cleaning`, or `available` upon item service or order completion.
  - `BILL_REQUESTED` must be explicitly triggered by service staff or Floor workflows.
  - `CLEANING` occurs only after guest departure.
  - `AVAILABLE` occurs only when table reset is verified.
  - **Order completion and table turnover are distinct operational events.**

### Canonical Unsent Semantics: `pending`
- **`pending`** is the single canonical status for editable items that have not yet been sent to production stations.
- **`draft`** is retained solely as a backward-compatibility alias.
- When `sendOrder` is executed, items transition from `pending` → `sent`.

### Item Status Transition State Machine
The lifecycle transitions are strictly enforced in application services and database triggers:
```
[pending / draft] ──► [sent] ──► [accepted] ──► [preparing] ──► [ready] ──► [served (terminal)]
       │                │             │               │            │
       ▼                ▼             ▼               ▼            ▼
 [cancelled]      [cancelled]   [cancelled]     [cancelled]  [cancelled]
```
- Mutations on terminal states (`served`, `cancelled`) are strictly forbidden.
- Reverse transitions (e.g. `served` → `preparing`) throw validation errors.

### Order-Level Status Derivation
Order status reflects the aggregate state of all non-cancelled items:
- **`open`**: All active items are `pending` (or no active items exist).
- **`sent`**: All active items have been sent to stations with none preparing yet.
- **`in_progress`**: Cooking or drink preparation has begun (`preparing`, `accepted`, or mixed sent/pending).
- **`ready`**: All active items are ready on the kitchen pass / bar counter.
- **`partially_served`**: Some items have been delivered to the table, while other active items remain in preparation, ready, or sent.
- **`served`**: All non-cancelled items have been delivered to the table.
- **`completed`**: Explicit staff action; never derived automatically solely because items are served.

### Single Active Order per Table Constraint
- Multi-order collisions for the same table are prevented in the database via a partial unique index:
  ```sql
  CREATE UNIQUE INDEX uq_active_order_per_table
      ON public.orders (table_id)
      WHERE status NOT IN ('completed', 'cancelled') AND table_id IS NOT NULL;
  ```
- In the UI and development service, opening a second active order on an occupied table is rejected.

### Multi-Tenant Engine-Level Integrity
- Multi-tenant foreign keys are physically guaranteed via composite foreign keys:
  - `order_items (order_id, organization_id, outlet_id) REFERENCES orders(id, organization_id, outlet_id)`
  - `order_item_status_history (order_item_id, organization_id, outlet_id) REFERENCES order_items(id, organization_id, outlet_id)`
- Triggers enforce tenant matching between orders and reservations, orders and tables, orders and waitlist entries, and verify staff outlet authorization via `public.has_outlet_access()`.

### Order Number Generation Strategy
- Primary key is `id UUID DEFAULT gen_random_uuid()`.
- `order_number` is a human-readable identifier formatted as `ORD-YYYYMMDD-SEQ`.
- In production, generation is backed by an atomic tenant-scoped sequence or counter table (`outlet_order_counters` locked `FOR UPDATE`) to prevent race conditions during peak dining rushes.

### Future Atomic Production RPCs
1. **`open_order_for_table_atomic(p_table_id, p_org_id, p_outlet_id, p_staff_id, p_notes)`**:
   - Validates no active order exists for the table (`SELECT ... FOR UPDATE`).
   - Inserts order record with generated order number.
   - Transitions table status from `seated` to `ordering`.
2. **`send_order_atomic(p_order_id, p_outlet_id, p_sent_by)`**:
   - Transitions all `pending` items to `sent`.
   - Transitions order status to `in_progress` (or `sent`).
   - Transitions table status from `ordering` to `dining`.
   - Writes item history audit records.
3. **`complete_order_atomic(p_order_id, p_outlet_id, p_closed_by)`**:
   - Validates all active items are `served`.
   - Sets `orders.status = 'completed'` and `orders.completed_at = NOW()`.
   - Leaves table status untouched for floor operations.

---

## 8. Guest Profiles & Hospitality CRM Architecture (Phase 3G)

### Guest Identity vs Staff Profiles
A fundamental architectural boundary in Q F&B is the total separation between staff user accounts and hospitality guests:
- **`profiles` (Phase 3A):** Represents authenticated human employees (managers, hosts, waitstaff, chefs). Profiles have Supabase `auth.users` linkages, application roles (`owner`, `manager`, `host`, `waiter`), and outlet access memberships.
- **`guests` (Phase 3G):** Represents dining patrons who make reservations, join waitlists, dine, and order food. Guests **never** have entries in `profiles` or `auth.users`.
- All operational modules (`reservations`, `waitlist_entries`, `orders`) link to `guests.id` via direct foreign keys (`ON DELETE SET NULL`), resolving the Phase 3C forward reference.

### Multi-Tenant Scope Hierarchy: Organization-Scoped Identity vs Outlet-Scoped Visits
- **Guest Identity (`guests`):** Scoped to `organization_id`. This allows sister restaurants within the same hospitality brand (e.g. *Quantum Restobar KLCC*, *Quantum Grill Bangsar*, *Quantum Bistro Penang*) to recognize returning guests, VIP statuses, dietary preferences, and allergy alerts as soon as they book or walk in.
- **Visit History (`guest_visits`):** Scoped to both `organization_id` AND `outlet_id`. Operational actions, assigned tables, specific staff interactions, and service observations remain grounded in the physical outlet where the visit took place.

### Deterministic Duplicate Matching & Intake Flow
Hospitality front desk staff operate in fast, noisy environments. Automated silent merging risks conflating two different guests with similar names, leading to allergy accidents or privacy breaches. Q F&B implements **Deterministic Duplicate Matching**:
1. **Normalization Trigger:** A PostgreSQL trigger (`normalize_contact_string`) cleans phone numbers (E.164 standard: `+60123456789`) and emails (lowercased trimmed: `user@example.com`).
2. **Match Evaluation:** When staff creates or edits a guest profile, the service executes exact matches across:
   - Primary Phone (Normalized)
   - WhatsApp Number (Normalized)
   - Email Address (Lowercased)
3. **Staff Discretion Banner:** If a duplicate match is detected, the UI renders a prominent amber alert banner (`POSSIBLE EXISTING GUEST`) displaying the matched profile's name, visit count, and primary contact. Staff is presented with explicit choices:
   - `[ VIEW EXISTING PROFILE ]`: Navigates to the existing guest to avoid creating duplicates.
   - `[ CREATE NEW ANYWAY ]`: Overrides the warning if two individuals legitimately share a contact channel (e.g., family members or corporate assistants).
4. **No Auto-Merge:** Merging is never performed automatically by client code or background tasks.

### Privacy, PII Protection & Marketing Opt-In Audit
- Guest profiles store Personally Identifiable Information (PII) including full names, phone numbers, emails, birthdays, and anniversaries.
- Strict Row Level Security enforces that staff with verified organization access (`has_organization_access()`) can view and recognize organization guests, while outlet visits require outlet-level access (`has_outlet_access()`).
- Marketing communication opt-in fields (`marketing_email_opt_in`, `marketing_whatsapp_opt_in`, `marketing_sms_opt_in`) are explicitly audited boolean columns that **default to `FALSE`**. Front-of-house staff cannot opt a guest into promotional messaging without verifiable patron consent.
- Zero generic sales CRM fields (e.g. deal pipelines, opportunity stages, lead scores) are permitted in Q F&B.

### Cross-Module Intelligence Synthesis
The Guest Profile detail drawer surfaces a unified operational intelligence panel synthesizing data across:
- **Floor & Seating:** Preferred seating areas (`indoor`, `terrace`, `booth`, `window`), favorite tables, and special requests (e.g., high chair, quiet corner).
- **Kitchen & Service Safety:** Prominent red alerts for life-threatening allergies (`PEANUT`, `SHELLFISH`, `GLUTEN`, `CELIAC`) and dietary guidelines (`HALAL`, `VEGAN`, `VEGETARIAN`).
- **Occasions & Milestones:** Birthday and anniversary tracking with upcoming visit flags.
- **Operational Visit Metrics:** Total completed visits, regular/returning status, cancellation rate, no-show rate, and first/last visit timestamps. Non-authoritative spend intelligence (lifetime spend, average spend per cover) is strictly omitted until future POS payment processing.
- **Operational Timeline:** Unified chronological feed combining reservations, waitlist records, and completed dining orders.

### Future Atomic Production RPC
- **`merge_guest_profiles_atomic(p_primary_guest_id, p_secondary_guest_id, p_merged_by, p_reason)`**:
  - Re-points all historical `reservations.guest_id`, `waitlist_entries.guest_id`, `orders.guest_id`, and `guest_visits.guest_id` from secondary to primary.
  - Recalculates aggregated metrics (`total_visits`, visit history) on primary.
  - Combines non-conflicting tags and notes.
  - Archives or hard-deletes the secondary record while logging an audit record in `guest_profile_merges`.

---

## 9. Offers & Experiences Engine Architecture (Phase 3H)

### 9.1 Domain Model Separation
The hospitality curation module cleanly separates four concepts:
1. **EXPERIENCE (`experiences`):** A packaged dining product or multi-course set (e.g., *Chef's Tasting Menu*, *Birthday Package*, *Romantic Dinner Setup*, *Sommelier Wine Pairing*, *Corporate Executive Dinner*).
2. **ADD-ON (`experience_addons`):** An optional enhancer attached to an experience or general reservation (e.g., *Artisanal Birthday Cake*, *Handcrafted Floral Bouquet*, *Candlelight Rose Petals*, *Welcome Champagne Flutes*, *Personalized Calligraphy Menus*).
3. **OFFER (`offers`):** An informational hospitality privilege or promotional perk (e.g., *Weekday Gastronomy Privilege*, *Anniversary Champagne Special*). Offers are not an automated POS discount engine.
4. **RESERVATION ATTACHMENT (`reservation_experiences`, `reservation_addons`):** Operational junction linking packages and add-ons directly to guest bookings with independent operational lifecycle statuses (`pending`, `confirmed`, `fulfilled`, `cancelled`).

### 9.2 Price Snapshot Principle
Catalogue pricing fluctuates over time due to seasonal ingredient costs, holiday surcharges, and menu revisions. To guarantee operational integrity and audit immutability:
- When an experience or add-on is attached to a reservation, the system records an explicit **Price Snapshot** (`unit_price_snapshot`) directly into `reservation_experiences` and `reservation_addons`.
- Subsequent edits to catalogue pricing in `experiences.base_price` or `experience_addons.price` **never** retroactively mutate historical booking snapshots.
- This maintains total separation between catalogue definition and historical operational records.

### 9.3 Zero-Payment Boundary
- Stored prices (`base_price`, `unit_price_snapshot`) are strictly **hospitality catalogue metadata**.
- The system does **NOT** calculate sales tax (SST), service charges, deposits, refunds, receipts, merchant fees, or billing settlements.
- UI labels clearly display starting prices (e.g. `RM 380 / guest`, `RM 88 add-on`) and avoid misleading financial accounting terms such as `PAID`, `BALANCE DUE`, or `REVENUE COLLECTED`.

### 9.4 Tenant Scope Hierarchy & Dual-Scope RLS
- **Catalogue Items (`experiences`, `experience_addons`, `offers`):**
  - May be defined as **Organization-wide** (`outlet_id IS NULL`), making them available across all venues in the hospitality group (e.g., *Lumina Birthday Celebration Package*).
  - Or defined as **Outlet-specific** (`outlet_id IS NOT NULL`), restricting them to a specific location (e.g., *Alfresco Terrace Romantic Dinner at KLCC*).
  - RLS policies conditionally evaluate:
    - If `outlet_id IS NULL`: `public.has_organization_access(auth.uid(), organization_id)`
    - If `outlet_id IS NOT NULL`: `public.has_outlet_access(auth.uid(), organization_id, outlet_id)`
- **Operational Attachments (`reservation_experiences`, `reservation_addons`):**
  - Always have non-null `organization_id` and `outlet_id`, strictly protected via `public.has_outlet_access(auth.uid(), organization_id, outlet_id)`.

### 9.5 Deterministic Availability & Compatibility Engine
Before an experience can be attached to a reservation, the system verifies compatibility:
1. **Active Status:** Experience status must be `active`.
2. **Outlet Isolation:** If experience is outlet-specific, reservation must be at the identical outlet.
3. **Party Size Range:** `reservation.party_size >= experience.minimum_party_size` AND `<= experience.maximum_party_size`.
4. **Date Validity:** Booking date falls between `valid_from` and `valid_until`.
5. **Schedule Windows:** Booking day of the week and booking time must fall within configured `experience_availability_rules`.

### 9.6 Channel Visibility & Public API Privacy Boundary
- **Public vs. Staff-Only:** Experiences and offers support `is_public: boolean`. Internal recovery packages, owner tasting courtesies, and manager discretionary upgrades (`is_public = false`) are visible only to authenticated staff and will never be exposed through public discovery endpoints.
- **Future Q RESTOBAR Integration:**
  - Public discovery endpoints will expose: `title`, `slug`, `short_description`, `description`, `party_limits`, `duration`, `public_price`, `available_times`, `guest_terms`, and public add-ons.
  - Public endpoints will **strictly disallow**: internal notes, staff identities, server instructions, cross-tenant records, or private guest reservation data.

### 9.7 Add-On Compatibility & Explicit Rule A
In restaurant dining operations, certain add-ons are intrinsic extensions of an experience (e.g., *Sommelier Wine Pairing* or *Caviar Quenelle Upgrade* for the *Chef's Tasting Menu*), while others are general celebrations (e.g., *Birthday Cake*, *Rose Bouquet*).
Q F&B enforces an explicit **Rule A**:
- If an add-on has `experience_id IS NOT NULL` (or is selected as an experience-tied add-on), that specific experience **must** be actively attached (`status IN ('pending', 'confirmed', 'fulfilled')`) to the target reservation.
- If an add-on has `experience_id IS NULL`, it is general and can be attached to any reservation in that organization/outlet.
- This rule is enforced both database-side via trigger `check_reservation_addon_consistency_hardened` and at the service layer in `attachAddonToReservation`.

### 9.8 Operational Attachment State Machine
`reservation_experiences` statuses follow a strict state machine to prevent operational regressions:
- Valid forward flow: `pending` → `confirmed` → `fulfilled`.
- Allowed cancellation: `pending` → `cancelled`, `confirmed` → `cancelled`.
- Terminal states:
  - Once `fulfilled`, service has completed and the attachment cannot be transitioned back to `pending`, `confirmed`, or `cancelled`.
  - Once `cancelled`, the attachment cannot be transitioned back to `pending`, `confirmed`, or `fulfilled` (a new attachment must be created).
- Both the PostgreSQL trigger `check_reservation_experience_consistency_hardened` and the TypeScript service reject invalid transitions.

### 9.9 Future Atomic Attachment Operation (`attach_experience_to_reservation_atomic`)
To guarantee multi-entity consistency during high-concurrency public guest booking and staff operations, the future backend will implement an atomic database function:
- **`attach_experience_to_reservation_atomic(p_reservation_id, p_experience_id, p_quantity, p_addon_ids, p_guest_notes, p_staff_notes, p_user_id)`**:
  1. `SELECT ... FOR UPDATE` on `reservations` to lock the booking row.
  2. Validate tenant and outlet consistency (`reservation.organization_id`, `reservation.outlet_id`).
  3. Validate experience status (`status = 'active'`) and date interval (`valid_from <= res_date <= valid_until`).
  4. Validate party size bounds (`min <= party_size <= max`).
  5. Validate schedule window & capacity pacing: count active attachments against `maximum_bookings` for that day/time slot.
  6. Capture immutable price snapshot (`unit_price_snapshot = experience.base_price`, `currency_code = experience.currency_code`).
  7. Insert `reservation_experiences` record.
  8. For each requested add-on, validate Rule A, check max quantity, snapshot price, and insert into `reservation_addons`.
  9. All operations commit together; any failure rolls back the entire transaction.

### 9.10 Capacity Pacing vs Concurrency Architecture
- `experience_availability_rules.maximum_bookings` caps the number of active bookings that can take place during a specific service window.
- In Phase 3H.1, deterministic capacity counting is executed in `checkExperienceCompatibility` by counting non-cancelled bookings.
- Production multi-user contention will rely on row-level locking via the atomic procedure described above.

---

## 10. Manager Live View & Basic Insights Architecture (Phase 3I)

### 10.1 Architectural Role & Scope Boundary
The Manager Live View is a **read-only supervisory synthesis layer** — it does NOT own any database tables, migrations, or write operations. It exists purely as a dynamically computed aggregation of operational state from the six underlying domain services.

**Zero Financial Intelligence:** The Manager Live View strictly excludes revenue, profit, average spend, sales forecasting, billing, payment processing, tax calculations, or any POS-derived monetary metrics. All insights are **operational only** — table turns, prep times, queue wait durations, guest return rates, and seating occupancy.

### 10.2 Data Flow Architecture
```
Manager UI Components
        ↓
ManagerContext (React Context)
        ↓
IManagerService (Service Interface)
        ↓
Concurrent Domain Service Reads (Promise.all)
   ├── IReservationService  → reservations, today's bookings
   ├── IFloorService        → tables, seating areas, floor summary
   ├── IQueueService        → queue summary, waitlist entries
   ├── IOrderService        → orders, order summary metrics
   ├── IGuestService        → guest summary metrics
   └── IOffersService       → reservation experiences, addons, catalogue
```

**Critical Rule:** `ManagerContext` imports **only** `IManagerService`. It does NOT import React contexts from other features (`FloorContext`, `ReservationContext`, `QueueContext`, etc.). Data flows strictly through the service layer to prevent circular dependency chains and maintain clean feature boundaries.

### 10.3 Snapshot Synthesis Model
The `ManagerSnapshot` is a fully self-contained object computed on each refresh cycle:

| Section | Source Services | Purpose |
|---|---|---|
| `kpis` (ManagerLiveKpis) | Floor + Queue + Orders | 8 headline operational metrics |
| `alerts` (ServiceAlert[]) | All 6 services | Deduplicated urgency-prioritized service bottlenecks |
| `floor` (ManagerFloorPressure) | Floor | Zone occupancy breakdown, tables needing attention |
| `reservations` (ManagerReservationPressure) | Reservations | Next arrivals, late guests, VIP incoming |
| `queue` (ManagerQueuePressure) | Queue | Wait times, pressure level, ready parties |
| `orders` (ManagerOrderPressure) | Orders | Station load breakdown, delayed ticket tracking |
| `guestMoments` (GuestMomentItem[]) | Reservations + Guests | VIPs, birthdays, anniversaries, allergy flags |
| `experiences` (ManagerExperienceBookingItem[]) | Offers | Attached packages and add-on execution roster |
| `timeline` (OperationalTimelineEvent[]) | Fixtures (Phase 3I) | Chronological shift audit stream |
| `todaySummary` (ManagerTodaySummary) | Reservations + Queue + Orders | Day-level cumulative totals |
| `insights` (ManagerBasicInsights) | All 6 services | Transparent operational formulas |

### 10.4 Alert Deduplication Engine
Service alerts use deterministic ID patterns to prevent duplicate notifications:
- `alert-orders-delayed` — Kitchen items exceeding 20-minute prep threshold
- `alert-orders-ready` — Plated orders waiting at pass for runner pickup
- `table:{tableId}:turn-overdue` — Table turn exceeding 105-minute target window
- `alert-queue-wait-high` — Queue longest wait exceeding 25 minutes or `HIGH_WAIT` pressure
- `alert-vip-arrival` — VIP patron expected within next service window

Each alert carries a `targetRoute` enabling direct click-through navigation to the responsible domain page.

### 10.5 View Mode Architecture
The Manager workspace supports three tab views, all reading from the same `ManagerSnapshot`:

1. **LIVE_SERVICE:** Real-time supervisory command centre with KPI bar, alerts banner, floor/reservations/kitchen/queue pressure panels, VIP moments, experience bookings, and operational timeline.
2. **TODAY:** Day-level cumulative totals — reservations executed vs no-shows, walk-in throughput, waitlist turnover, completed orders, and packages delivered.
3. **INSIGHTS:** Transparent operational metrics with explicit formula descriptions — peak service period, most utilized area, average table turn, average kitchen prep, average queue wait, guest return rate, reservation source mix, and experience penetration rate.

### 10.6 Basic Insights Transparency Principle
Every metric displayed in the INSIGHTS tab includes an explicit formula explanation visible to the manager. There are no opaque "AI scores" or unexplained percentages. Examples:
- **Average Table Turn:** "Mean duration between table seating and table clearance across all completed parties today."
- **Guest Return Rate:** "Percentage of recognized guests with prior recorded visits in the guest CRM profile database."
- **Experience Penetration:** "Proportion of booked reservations that included a structured package."

### 10.7 Route & Mount Point
The Manager Live View replaces the Phase 3B placeholder at `/app/insights`. The `InsightsPage` component wraps `ManagerProvider` around the workspace, establishing the context boundary.

---

## 11. Staff & Role Architecture (Phase 3J)

### 11.1 Staff Identity Architecture
Q F&B maintains a strict separation between two identity types:
- **`profiles`** — Authenticated staff (restaurant employees). Linked to `auth.users`. They operate the system.
- **`guests`** — Hospitality customers. Created manually or through booking flows. They are served by the system.

These identities are NEVER merged. Staff are in `organization_members` / `outlet_members`. Guests are in `guests` / `guest_visits`.

### 11.2 Canonical Role Model
```
app_role enum (PostgreSQL):
  owner     — Full organization authority
  admin     — Platform and tenant administration
  manager   — Operational management across all modules
  host      — Reservations, arrivals, queue, seating, guest recognition
  waiter    — Table service and order workflow (Phase 3J addition)
  cashier   — Future checkout/payment role (Phase 3J addition, no payment built)
  marketing — Guest/offer/experience access with privacy limitations
  kitchen   — Kitchen station order workflow (Phase 3J addition)
  bar       — Bar station order workflow (Phase 3J addition)
  viewer    — Read-only access where authorized
  staff     — @deprecated legacy alias for 'waiter', preserved for migration safety
```

### 11.3 Permission Architecture
Centralized at `src/features/staff/permissions/permissions.ts`:
- **`Permission`** — Strongly typed union type (22 keys, no `any`)
- **`ROLE_PERMISSION_MAP`** — Single source of truth for role → permissions
- **`hasPermission(role, permission)`** — Primary utility
- **`can(role, permission)`** — Convenience alias
- **`canAny(role, permissions[])`** — Check any of a set

**CRITICAL:** Frontend permission checks are UX-layer only. Never sufficient security. Backend MUST enforce via Supabase RLS, SECURITY DEFINER functions, and authorized RPCs.

### 11.4 Frontend vs Backend Authorization Boundary
| Layer | Mechanism | Purpose |
|---|---|---|
| Frontend (AppShell) | `hasPermission()` | Hide irrelevant nav items |
| Frontend (Pages) | `can(role, permission)` | Show `<AccessDenied>` guard |
| Backend (Supabase) | RLS policies | Enforce data access |
| Backend (RPCs) | SECURITY DEFINER functions | Enforce mutation authority |

### 11.5 Self-Promotion & Owner Protection
Production requirements (enforced server-side, documented in SupabaseStaffService.stub.ts):
- **Self-promotion prevention:** Role upgrades must be validated server-side. A user cannot promote themselves via client-side changes.
- **Last owner protection:** The final organization owner cannot be demoted or removed without explicit ownership transfer to another member.

### 11.6 Staff Feature Architecture
```
src/features/staff/
├── types/           # StaffMember, StaffInvite, StaffStatus, input types
├── permissions/     # Permission type, ROLE_PERMISSION_MAP, utilities
├── fixtures/        # 9 realistic fictional staff for DEV PREVIEW
├── services/
│   ├── IStaffService.ts               # Interface
│   ├── FixtureStaffService.ts         # DEV implementation
│   └── SupabaseStaffService.stub.ts   # Production stub
├── context/         # StaffContext + useStaff hook
└── components/      # StaffHeader, StaffKpiBar, StaffList, StaffDetailDrawer, InviteStaffModal
```

### 11.7 Outlet Assignment Model
- Staff may belong to one outlet, multiple outlets, or organization-wide (owner/admin)
- Outlet membership stored in `outlet_members` table
- Staff directory filters by outlet via `IStaffService.listStaff(orgId, outletId?)`
- Production: outlet-level assignments validated by `has_outlet_access()` RLS helper

---

## 12. Settings Architecture (Phase 3J)

### 12.1 Settings Storage Model
All outlet configuration stored in `outlet_settings.settings_json` (JSONB).
Strongly typed at the TypeScript layer — zero untyped JSON access in UI.

```
OutletSettings {
  restaurant: RestaurantSettings     — display name, contact, timezone, currency, locale
  service: ServiceSettings           — 4 service periods (Breakfast/Lunch/Dinner/Late Night)
  reservations: ReservationSettings  — duration, interval, late/no-show thresholds
  floor: FloorSettings               — cleaning buffer, turn duration, availability window
  queue: QueueSettings               — wait thresholds (normal/busy/high), notification channel
  orders: OrderSettings              — prep thresholds, station enablement
  guests: GuestSettings              — returning/regular visit count thresholds
  hotel: HotelSettings               — hotel mode master toggle + hotel feature flags
}
```

### 12.2 Settings Feature Architecture
```
src/features/settings/
├── types/
│   ├── index.ts        # All 8 strongly typed settings interfaces + OutletSettings
│   ├── hotel.ts        # HotelGuestContext, ConciergeBookingContext, HotelVipStatus
│   └── pms.ts          # IPmsIntegrationService (documented future boundary)
├── fixtures/           # DEV_FIXTURE_OUTLET_SETTINGS with realistic defaults
├── services/
│   ├── ISettingsService.ts               # Interface
│   ├── FixtureSettingsService.ts         # DEV in-memory implementation
│   └── SupabaseSettingsService.stub.ts   # Production stub
├── context/            # SettingsContext + useSettings hook + SettingsSection type
└── components/         # SettingsNav + 9 panel components (one per section)
```

### 12.3 Settings RLS Design
- **SELECT:** Any organization member (`is_org_member()`)
- **INSERT/UPDATE/DELETE:** Owner, admin, or manager roles only
- Write protection enforced at database level, not just frontend

---

## 13. Hotel Mode Architecture (Phase 3J)

### 13.1 Hotel Mode Default
Hotel Mode defaults to **OFF**. When disabled, Q F&B operates as a standard restaurant system. No hotel context renders anywhere.

### 13.2 Hotel Mode Features (When Enabled)
- Hotel name and property code for reference
- Room number display on reservations and guest profiles
- Concierge booking source context (`booking_source = 'hotel_concierge'`)
- Hotel guest tags on arrivals and guest profiles
- Charge-to-room eligibility flag (architectural marker only)

### 13.3 Hotel Mode Strict Boundaries
- **NO** real PMS integration (Opera, Mews, Cloudbeds) — future Phase 3K+
- **NO** room billing, folio posting, or payment settlement
- **NO** queue reordering based on hotel/VIP status (Phase 3E.2 fairness preserved)
- Charge-to-room is an eligibility flag only — not actual billing

### 13.4 Future PMS Integration Boundary
Documented in `src/features/settings/types/pms.ts` as `IPmsIntegrationService`:
- `findInHouseGuest(input)` — Find in-house guest by room/folio
- `validateRoom(input)` — Validate room occupancy
- `getStayDates(folioRef)` — Get arrival/departure dates
- `getVipStatus(folioRef)` — Get hotel VIP tier
- `getRoomChargeEligibility(folioRef)` — Check charge-to-room eligibility

Future provider implementations: `OperaPmsService`, `MewsPmsService`, `CloudbedsPmsService`

---

## 14. Role-Aware Navigation Architecture (Phase 3J)

Navigation items in AppShell declare an optional `requiredPermission`. The shell filters items using `hasPermission(role, permission)` from the centralized permission utilities.

**DEV PREVIEW** always shows the full navigation (treated as owner role).

Role navigation examples:
| Role | Visible Modules |
|---|---|
| HOST | Today, Reservations, Floor, Queue, Guests |
| WAITER | Today, Floor, Orders, Guests |
| KITCHEN | Orders |
| BAR | Orders |
| MARKETING | Today, Guests, Offers, Insights |
| MANAGER | All operational + Insights + Staff + Settings |
| OWNER/ADMIN | Full application |

**SECURITY:** This is UX navigation filtering only. Backend RLS is the authoritative enforcement layer.
