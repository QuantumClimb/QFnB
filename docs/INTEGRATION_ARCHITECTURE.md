# Q F&B × Q RESTOBAR — Integration Architecture

**Version:** 1.0.0
**Last Updated:** 2026-09-19
**Status:** Planning Document. No integration code has been written. Phase 3K is the target implementation phase.

---

## 1. System Ownership Model

### Principle

> Q F&B is the single source of operational truth.
> Q RESTOBAR is the guest-facing surface that consumes and submits into Q F&B services.

| Domain | Owner | Q RESTOBAR Access |
|---|---|---|
| Reservations | Q F&B | Submit (write), Status (read own) |
| Availability | Q F&B | Read (filtered public view) |
| Table States | Q F&B | None |
| Seating Areas | Q F&B | Read (names only, for selection) |
| Waitlist | Q F&B | Submit (write), Status (read own) |
| Guest Profiles | Q F&B | Submit (name, phone, email only) |
| Offers / Experiences | Q F&B | Read (active, public-flagged only) |
| Service Activity | Q F&B | None |
| Staff Data | Q F&B | None |
| Operational Alerts | Q F&B | None |
| Financial Data | Q F&B | None |

Q RESTOBAR must never have direct database access to Q F&B Supabase tables. All communication passes through validated server-side functions.

---

## 2. System Topology

```
┌─────────────────────────────────────────────────────────┐
│                    GUEST BROWSER                        │
│                                                         │
│              Q RESTOBAR (QC WEBSITE)                    │
│              Guest-facing web experience                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ HTTPS requests (no Supabase keys exposed)
                       │
┌──────────────────────▼──────────────────────────────────┐
│              PUBLIC INTEGRATION LAYER                   │
│                                                         │
│  Supabase Edge Functions (server-side, validated)       │
│                                                         │
│  ├── /public-availability                               │
│  ├── /public-create-reservation                         │
│  ├── /public-reservation-status                         │
│  ├── /public-waitlist                                   │
│  └── /public-experiences                                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Server-side Supabase client (service role, never exposed)
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  Q F&B SERVICES                         │
│                                                         │
│  ├── Reservation Service                                │
│  ├── Availability Service                               │
│  ├── Guest Service (matching + creation)                │
│  ├── Queue Service                                      │
│  └── Experience Service                                 │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              SUPABASE / POSTGRES                        │
│                                                         │
│  Multi-tenant database with RLS                         │
│  organizations, outlets, reservations,                  │
│  guests, waitlist, experiences, etc.                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Supabase Realtime
                       │
┌──────────────────────▼──────────────────────────────────┐
│             Q F&B OPERATIONS APP                        │
│                                                         │
│  Staff-facing operational interface                     │
│  Reservations, Floor, Orders, Manager View, etc.        │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Guest Journey — End to End

```
GUEST OPENS Q RESTOBAR
        │
        ▼
REQUESTS AVAILABILITY
  → Calls /public-availability
  → Passes: outlet_id, date, party_size
  → Q F&B calculates: reservations + table capacity + buffer settings
  → Returns: available time slots (no internal data exposed)
        │
        ▼
SELECTS DATE / TIME / PARTY SIZE / AREA
        │
        ▼
BROWSES EXPERIENCES
  → Calls /public-experiences
  → Returns: active, publicly flagged experiences for outlet
        │
        ▼
SELECTS EXPERIENCE / ADD-ON
        │
        ▼
ENTERS GUEST DETAILS
  name, phone, email (optional), special occasion
        │
        ▼
SUBMITS RESERVATION
  → POST /public-create-reservation
  → Validates: organization, outlet, slot, party size, availability, experience
  → Guest matching: phone/email against guests table (conservative)
  → Idempotency check: request_id
  → Creates: reservation record (booking_source = q_restobar)
  → Creates or links: reservation_addons (experience)
  → Returns: reservation_id, status, confirmation reference
        │
        ▼
Q F&B RECEIVES BOOKING
  → Appears in Reservations list immediately
  → Booking source labelled: Q RESTOBAR
  → Host / manager sees: guest details, time, area, experience
        │
        ▼
STAFF CONTACTS / CONFIRMS
  → Status updated: CONTACTED → CONFIRMED
        │
        ▼
GUEST STATUS UPDATE
  → Guest polls or retrieves /public-reservation-status
  → Returns: current status, time, outlet name (no internal data)
        │
        ▼
GUEST ARRIVES
  → Staff updates: ARRIVED → SEATED
        │
        ▼
SERVICE COMPLETES
  → Staff marks: COMPLETED
  → Guest profile updated: visit count, last visit
        │
        ▼
GUEST HISTORY UPDATED IN Q F&B
```

The guest at no point directly interacts with the Q F&B application. The Q F&B operational team at no point manually re-enters Q RESTOBAR bookings.

---

## 4. Security Boundary

### What Q RESTOBAR May Never Access

| Category | Examples |
|---|---|
| Supabase service role key | Never in client code, never in environment variables accessible to browser |
| Internal operational tables | table_states, staff_shifts, operational_alerts |
| Staff data | profiles, organization_members, outlet_members |
| Private guest history | guest_notes, internal tags, no-show history, spend data |
| Manager alerts | operational_alerts |
| Financial data | total_spend, deposit processing |
| Other tenants' data | Any data belonging to a different organization or outlet |

### What Q RESTOBAR May Access (via Edge Functions Only)

| Category | Data Returned |
|---|---|
| Availability | Available time slots for a specific outlet and date |
| Seating areas | Area names (for guest selection, no internal IDs exposed unless needed for booking) |
| Experiences | Title, description, price, type — for publicly flagged, active records only |
| Reservation status | Status label, time, outlet name — for reservations created by that guest request only |
| Queue status | Position, estimated wait, status label — for the specific queue entry |

### Edge Function Security Pattern

Every Edge Function must:

1. Authenticate the request origin (CORS origin check against allowed Q RESTOBAR domains)
2. Validate all input fields server-side before any database call
3. Resolve `organization_id` and `outlet_id` from validated public identifiers
4. Use the Supabase service role client only on the server side within the function
5. Return only the minimum required fields — never return raw database rows
6. Log request metadata for audit purposes

```
Edge Function receives request
        │
        ▼
Validate CORS origin (Q RESTOBAR domain only)
        │
        ▼
Parse and validate request body
        │
        ▼
Resolve tenant (organization_id + outlet_id) from public slug or identifier
        │
        ▼
Execute business logic using service role (server-side only)
        │
        ▼
Apply field filtering — return only public-safe fields
        │
        ▼
Return response
```

---

## 5. Multi-Tenant Routing

Every Q RESTOBAR integration request must identify the target tenant.

### Public Tenant Identifiers

Q RESTOBAR will identify outlets using:

| Identifier | Example | Notes |
|---|---|---|
| `organization_slug` | lumina-group | URL-safe, unique per org |
| `outlet_slug` | lumina-klcc | URL-safe, unique per org |

These slugs are already stored in the `organizations` and `outlets` tables from Phase 3A.

### Tenant Resolution Pattern

```
Incoming request contains:
  organization_slug = "lumina-group"
  outlet_slug       = "lumina-klcc"

Edge Function resolves:
  SELECT id FROM organizations WHERE slug = 'lumina-group'
  SELECT id FROM outlets WHERE slug = 'lumina-klcc' AND organization_id = <resolved_org_id>

All subsequent operations use:
  organization_id = <resolved>
  outlet_id       = <resolved>
```

Bookings submitted without a valid, resolvable tenant pair are rejected with a clear error. Bookings can never bleed into a different outlet.

---

## 6. Integration Identifiers

### Reservation Request Payload

```json
{
  "request_id": "uuid-v4-generated-by-client",
  "organization_slug": "lumina-group",
  "outlet_slug": "lumina-klcc",
  "source": "q_restobar",
  "reservation": {
    "date": "2026-10-15",
    "time": "19:30",
    "party_size": 4,
    "seating_area_slug": "main-dining",
    "guest": {
      "full_name": "Sarah Lim",
      "phone": "+60123456789",
      "email": "sarah@example.com"
    },
    "special_occasion": "birthday",
    "dietary_requirements": "vegetarian",
    "allergies": "nuts",
    "notes": "",
    "experience_id": "uuid-of-birthday-package"
  }
}
```

### Reservation Response Payload

```json
{
  "reservation_id": "uuid-from-database",
  "reference": "LMN-20261015-0042",
  "status": "new",
  "outlet_name": "Lumina Restobar (KLCC)",
  "date": "2026-10-15",
  "time": "19:30",
  "party_size": 4,
  "experience": "Birthday Package",
  "message": "Your reservation has been received. Our team will confirm shortly."
}
```

### Idempotency

The `request_id` field is a UUID generated by Q RESTOBAR before submission.

On receiving a reservation request, the Edge Function checks:

```sql
SELECT id FROM reservations
WHERE external_request_id = :request_id
  AND outlet_id = :outlet_id
LIMIT 1;
```

If a record already exists with that `request_id`, return the existing reservation response instead of creating a duplicate. This protects against network retries and double-submissions.

The `external_request_id` and `external_reference` columns must be added to the `reservations` table in Phase 3K.

---

## 7. Availability API Design

### Purpose

Allow Q RESTOBAR to display accurate bookable time slots without accessing internal table or reservation data directly.

### Endpoint

```
GET /public-availability
```

### Request Parameters

```
organization_slug  string  required
outlet_slug        string  required
date               string  required  (YYYY-MM-DD)
party_size         int     required
seating_area_slug  string  optional
```

### Availability Calculation Logic (Q F&B side)

The availability calculation will use the same rules as the Short Seat algorithm (Phase 3D):

```
For each table in the requested outlet / seating area:
  1. Get existing confirmed reservations for that date
  2. Apply cleaning buffer (outlet-configured, default 15 min)
  3. Apply minimum dining window (outlet-configured, default 60 min)
  4. Identify bookable slots that fit the requested party_size within table capacity
  5. Exclude slots where a confirmed reservation already exists

Return: list of bookable time slots as HH:MM strings
```

This logic must live exclusively in Q F&B. Q RESTOBAR must not replicate it.

### Response Shape

```json
{
  "outlet": "Lumina Restobar (KLCC)",
  "date": "2026-10-15",
  "party_size": 4,
  "available_slots": [
    "12:00", "12:30", "13:00",
    "18:30", "19:00", "19:30", "21:00"
  ]
}
```

No table IDs, table names, reservation IDs, or capacity details are returned.

---

## 8. Experiences API Design

### Purpose

Allow Q RESTOBAR to display experiences available for guest selection without accessing the full experiences table.

### Endpoint

```
GET /public-experiences
```

### Request Parameters

```
organization_slug  string  required
outlet_slug        string  optional
```

### Filter Criteria (applied server-side)

Only experiences meeting ALL of the following criteria are returned:

- `is_active = TRUE`
- `is_public = TRUE` (new column to be added in Phase 3K)
- `organization_id` matches resolved tenant
- Not expired (if `valid_until` is set)

### Response Shape

```json
{
  "experiences": [
    {
      "id": "uuid",
      "title": "Birthday Package",
      "description": "Cake, balloon arrangement and personalised birthday setup.",
      "experience_type": "birthday_package",
      "price": 150.00,
      "currency": "MYR"
    },
    {
      "id": "uuid",
      "title": "Anniversary Package",
      "description": "Flowers, sparkling wine and candle table setup.",
      "experience_type": "anniversary_package",
      "price": 200.00,
      "currency": "MYR"
    }
  ]
}
```

Private fields not returned: `created_by`, `organization_id`, internal notes.

The `is_public` flag allows staff to selectively expose experiences to guests via Q RESTOBAR without exposing their full internal experience library.

---

## 9. Guest Matching Design

### Purpose

When a guest books via Q RESTOBAR, their name/phone/email should be matched against the Q F&B guest database to avoid creating duplicate profiles.

### Matching Strategy (conservative)

```
Incoming guest data:
  phone = "+60123456789"
  email = "sarah@example.com"
  name  = "Sarah Lim"

Step 1: Exact phone match (normalised format)
  SELECT id FROM guests
  WHERE organization_id = :org_id
    AND phone = normalize_phone("+60123456789")
  LIMIT 1

Step 2: If no phone match, try email match
  SELECT id FROM guests
  WHERE organization_id = :org_id
    AND email = "sarah@example.com"
  LIMIT 1

Step 3: If match found → link reservation to existing guest_id
Step 4: If no match found → create new guest record (name, phone, email only)
Step 5: If ambiguous (multiple matches) → create new record, flag for staff review
```

### Rules

- Phone numbers are normalised to E.164 format before comparison (e.g., `+60123456789`)
- Name matching is NOT used for deduplication (names are not reliable identifiers)
- Ambiguous matches are never automatically merged
- Staff must manually resolve flagged duplicates within Q F&B
- Q RESTOBAR never receives historical guest data (previous visits, notes, tags)

---

## 10. Queue / Waitlist API Design

### Purpose

Allow guests to join a waitlist via Q RESTOBAR and check their queue status.

### Endpoints (Phase 3K)

```
POST /public-waitlist
  Join the waitlist for an outlet.

GET /public-waitlist-status?token=:queue_token
  Check current queue position and status using a one-time token.
```

### Join Waitlist Payload

```json
{
  "organization_slug": "lumina-group",
  "outlet_slug": "lumina-klcc",
  "guest_name": "Marcus Tan",
  "phone": "+60129876543",
  "party_size": 3,
  "notes": "Prefer terrace if available"
}
```

### Join Waitlist Response

```json
{
  "queue_id": "uuid",
  "token": "secure-random-token-for-status-check",
  "position": 4,
  "estimated_wait_minutes": 25,
  "status": "waiting",
  "message": "You are #4 in the queue. Estimated wait: 25 minutes."
}
```

### Status Response

```json
{
  "position": 2,
  "estimated_wait_minutes": 12,
  "status": "waiting",
  "message": "You are #2 in the queue."
}
```

Or:

```json
{
  "position": 0,
  "status": "notified",
  "message": "Your table is being prepared. Please proceed to the host station."
}
```

Q F&B remains the authority for queue state. Q RESTOBAR reads only.

---

## 11. Reservation Status API Design

### Purpose

Allow guests to check the status of a specific reservation they submitted.

### Endpoint

```
GET /public-reservation-status?token=:reservation_token
```

The `reservation_token` is a secure one-time token returned when the reservation is created. It is not the internal `reservation_id`.

### Response

```json
{
  "status": "confirmed",
  "outlet_name": "Lumina Restobar (KLCC)",
  "date": "2026-10-15",
  "time": "19:30",
  "party_size": 4,
  "experience": "Birthday Package",
  "message": "Your reservation is confirmed. We look forward to welcoming you."
}
```

Fields NOT returned: `reservation_id`, `guest_id`, table assignment, seating area internal ID, staff notes, internal status history.

---

## 12. Proposed Q F&B Source Structure for Integration

These folders are planned for future implementation. Do not create them yet.

```
src/
  integrations/
    qrestobar/
      index.ts             ← Integration boundary and type definitions
      types.ts             ← Request/response types for Q RESTOBAR payloads
      README.md            ← Integration notes and version changelog

  services/
    reservations/
      reservationService.ts    ← Core reservation business logic (shared)
      availabilityService.ts   ← Availability calculation (used by both app + API)
    guests/
      guestService.ts          ← Guest creation and matching logic
    queue/
      queueService.ts          ← Queue management logic
    experiences/
      experienceService.ts     ← Experience retrieval (filtered for public or private)
```

```
supabase/
  functions/
    public-availability/
      index.ts             ← Phase 3K
    public-create-reservation/
      index.ts             ← Phase 3K
    public-reservation-status/
      index.ts             ← Phase 3K
    public-waitlist/
      index.ts             ← Phase 3K
    public-experiences/
      index.ts             ← Phase 3K
```

### Service Layer Principle

Business logic rules such as:

- Availability calculation
- Reservation conflict detection
- Table capacity matching
- Booking duration and buffer application
- Experience eligibility

must live in the `services/` layer — not duplicated inside Edge Functions and not duplicated inside Q RESTOBAR.

Edge Functions call services. Q F&B app UI calls services. The rules execute once, in one place.

---

## 13. Additional Database Columns Required (Phase 3K)

The following columns must be added to existing tables in Phase 3K migrations.

### `reservations` table additions

| Column | Type | Notes |
|---|---|---|
| external_request_id | UUID | UNIQUE, nullable — idempotency key from Q RESTOBAR |
| external_reference | TEXT | Human-readable booking reference (e.g. LMN-20261015-0042) |
| reservation_token | TEXT | UNIQUE, secure random token for guest status lookup |
| integration_source | TEXT | e.g. q_restobar, direct (mirrors booking_source) |

### `experiences` table additions

| Column | Type | Notes |
|---|---|---|
| is_public | BOOLEAN | DEFAULT FALSE — controls visibility on Q RESTOBAR |
| valid_from | DATE | Nullable — date range for seasonal experiences |
| valid_until | DATE | Nullable |

### `waitlist` table additions

| Column | Type | Notes |
|---|---|---|
| external_request_id | UUID | Nullable — idempotency key |
| queue_token | TEXT | UNIQUE, secure random token for guest status lookup |
| integration_source | TEXT | Nullable |

---

## 14. Phase 3K — Full Implementation Scope

Phase 3K is the only phase where actual Q RESTOBAR integration is built.

### Prerequisites (must be complete before Phase 3K begins)

- Phase 3C: Reservations module stable and tested
- Phase 3D: Floor + Tables + Short Seat stable (availability calculation live)
- Phase 3E: Queue / Waitlist module stable
- Phase 3G: Guest Profiles stable (matching logic designed)
- Phase 3H: Offers + Experiences stable (is_public flag implemented)

### Phase 3K Deliverables

1. `public-availability` Edge Function
2. `public-create-reservation` Edge Function with idempotency
3. `public-reservation-status` Edge Function
4. `public-waitlist` Edge Function (join + status)
5. `public-experiences` Edge Function
6. Guest matching logic in `guestService.ts`
7. Reservation token generation on creation
8. `is_public` flag UI in Q F&B Offers / Experiences module
9. Multi-tenant slug resolution in all Edge Functions
10. CORS configuration (Q RESTOBAR domain whitelist)
11. Security testing: no internal data leakage, no cross-tenant access
12. Duplicate request protection (idempotency key handling)
13. Realtime subscription in Q F&B Reservations for new Q RESTOBAR bookings
14. End-to-end guest booking integration test
15. Q RESTOBAR integration (QC WEBSITE) implementation of the above APIs

> Note: Steps 1–14 are Q F&B work. Step 15 requires work in the QC WEBSITE / Q RESTOBAR project. Do not modify QC WEBSITE until Phase 3K and until the Q F&B APIs are validated.

---

## 15. Design Principles Summary

| Principle | Rule |
|---|---|
| Single source of truth | Q F&B owns all operational data |
| No public DB access | Q RESTOBAR never connects directly to Supabase |
| Server-side secrets | Service role keys only ever used in Edge Functions |
| Field filtering | Public endpoints return minimum required fields only |
| Tenant isolation | Every request must resolve and validate organization + outlet |
| No duplication | Availability logic, reservation rules live once — in Q F&B services |
| Idempotency | Duplicate submissions are safe and return the original result |
| Conservative matching | Guest deduplication never auto-merges ambiguous records |
| Clean service boundary | Q F&B modules expose service interfaces — not direct DB access |
| Seamless guest experience | Guest never knows two systems are involved |

---

## 16. Relationship to Existing Phase 3A Foundation

| Phase 3A Element | Integration Compatibility |
|---|---|
| `organizations` + `outlets` with slugs | Used directly for tenant resolution in every Edge Function |
| `booking_source_enum` with `q_restobar` value | Already planned — no enum change needed |
| `app_role` enum | Not used in public APIs — staff-only |
| Multi-tenant RLS | Will be extended to cover new tables (reservations, guests, etc.) |
| `isSupabaseConfigured` pattern | Edge Functions use service role — separate from frontend Supabase client |

The Phase 3A foundation requires no modifications to support this integration architecture.

---

End of Q F&B × Q RESTOBAR Integration Architecture v1.0.0
