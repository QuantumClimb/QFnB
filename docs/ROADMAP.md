# Q F&B Development Roadmap

**Product:** Q F&B Standalone Hospitality Operations Application  
**Version:** 0.9.0 - Revised September 2026  
**Status:** Phase 3A, 3B, 3C, 3C.1, 3D, 3D.1, 3E, 3E.1, 3E.2, 3F, 3F.1, 3G, 3H, 3H.1, 3I, and 3J are COMPLETE. Phase 3K requires explicit approval.

---

## Product Mission

> Q F&B should know what is happening to every guest, every table, every booking, and every order - right now.

---

## Phase Overview

---

### PHASE 3A - Application Foundation (COMPLETE)
- Vite + React + TypeScript project scaffold with deep graphite styling
- Multi-tenant Supabase database schema (organizations, outlets, profiles, members, invites)
- Row Level Security (RLS) policies and atomic tenant creation RPC
- Auth context & DEV PREVIEW mode

---

### PHASE 3B - TODAY / Live Operations Foundation (COMPLETE)
- TODAY live operational dashboard (`src/features/dashboard/`)
- 8 Primary KPI metric tiles (Reservations, Covers, Seated, Tables, Waitlist, Kitchen, Ready, Alerts)
- Pacing, live service watch, VIP touchpoints, and quick action modals

---

### PHASE 3C & 3C.1 - Reservations + Availability Foundation (COMPLETE)
- Full lifecycle reservation management workspace (`src/features/reservations/`)
- Local migration (`20260919000004_phase3c_reservations_schema.sql`) with hardened `guest_id`, outlet-scoped RLS, database tokens, and audit history
- View modes, multi-dimensional search & filtering, detail slide-over drawer, and staff reservation creation

---

### PHASE 3D & 3D.1 - Floor + Tables + Smart Availability (COMPLETE)
- Operational floor management workspace (`src/features/floor/`)
- Local migrations (`20260919000005_phase3d_floor_tables.sql`, `20260919000006_phase3d1_floor_integrity.sql`)
- Foreign key linking `reservations.assigned_table_id -> restaurant_tables.id ON DELETE SET NULL`
- Database-level tenant consistency triggers for reservation-table, table-seating-area, and table-state-history
- Table capacity check constraints (`capacity > 0`, `min <= max <= capacity`)
- Strongly typed seating & walk-in inputs replacing loose `any` types
- Visual 2D floor map canvas distinguishing table shapes (`round`, `square`, `rectangle`, `booth`, `bar`) with live turn timers and status badges
- Zone filtering (All Zones, Main Dining, Alfresco Terrace, Cocktail Bar, Private Dining Suite)
- Table Detail slide-over drawer with active guest session data, turn progress bars, next booking alerts, and operational action triggers (*Seat Guest, Start Dining, Request Bill, Clear Table, Mark Available, Move Guest, Block Table*)
- Modal workflows: Reservation seating, walk-in party seating, and table relocation with capacity validation
- Smart Availability engine: Deterministic gap calculation between bookings taking into account party size, duration, and 15-minute cleaning buffers
- Responsive layout with touch-friendly controls for Manager iPad tablets and compact card feed for mobile smartphones

---

### PHASE 3E, 3E.1 & 3E.2 - Queue & Waitlist Engine (COMPLETE)
- Operational queue & waitlist workspace (`src/features/queue/`)
- Local migrations (`20260919000007_phase3e_waitlist.sql`, `20260919000008_phase3e1_waitlist_integrity.sql`)
- Hardened RLS policies with standardized 3-parameter helper `has_outlet_access(auth.uid(), org_id, outlet_id)` and `pgcrypto` extension
- Strict timestamp fairness ordering (`joined_at ASC`) for position-bearing waiting guests (`waiting`, `notified`, `arrived`) numbered `#01, #02, #03...`
- Informational-only priority tags (VIP, Hotel Guest, Accessibility, Birthday, Family) that do not cause queue jumping
- Clean visual and structural separation of operational action stages (*Ready For Seating*, *Tables Preparing*) from the active waiting queue
- Deterministic wait estimation engine (`IWaitEstimationService`) based on party size, floor table turnover projections, and 15-minute cleaning buffers
- Status transition validation rules preventing terminal state modification
- Channel-neutral guest notification simulation (`IGuestNotificationService`) supporting WhatsApp and SMS preview templates
- Rapid host intake modal with touch presets for party size, quoted wait, and priority tags
- Slide-over detail drawer, table preparation synchronization, and seat-from-queue workflow via clean service-layer coordination (`IQueueService` ↔ `IFloorService`) with strict active/blocked/capacity checks
- Fully responsive across Desktop Host Stand, Manager iPad (768px - 1366px), and Mobile cards

---

### PHASE 3F - Orders & Waiter Workflow (COMPLETE)
- Operational restaurant ordering & service workflow (`src/features/orders/`)
- Local migration (`20260919000009_phase3f_orders.sql`) with enums (`order_status_enum`, `order_item_status_enum`, `prep_station_enum`, `course_type_enum`), `orders`, `order_items`, `order_item_status_history`, partial service status triggers, and hardened RLS
- 4 View Modes: **All Orders**, **Service Expedite Board** (Sent, Preparing, Ready, Served), **My Tables Waiter Feed**, and Station-specific filtering (**Kitchen**, **Bar**, **Dessert**, **Service**)
- Fast Order Intake Drawer optimized for handheld devices with menu category browsing, search, seat number mapping (1..12), course assignment (`drinks`, `starter`, `main`, `side`, `dessert`), structured modifiers, custom chef instructions, and allergy safety badges
- Live Prep Timers with urgency color indicators (Green <15m, Amber 15-25m, Red >25m overdue)
- Order detail slide-over ticket drawer with item-level status advancement (`START PREPARATION`, `MARK READY`, `SERVE ITEM`), rush tagging, voiding with operational reasons, and complete order workflow
- Non-authoritative item pricing and subtotal preview for waiter confirmation (zero POS / commerce logic)
- Decoupled floor state synchronization coordinating table transitions (`seated` -> `ordering` -> `dining`)
- Responsive across Desktop Expedite Stand, Server iPad, and Mobile Waiter handhelds

---

### PHASE 3F.1 - Orders Data Integrity + Service Lifecycle Hardening (COMPLETE)
- Local hardening migration (`20260919000010_phase3f1_orders_integrity.sql`)
- **Floor Status Ownership Correction:** Confirmed and enforced that Orders may only transition tables (`seated` -> `ordering` and `ordering` -> `dining`). Table transitions to `bill_requested`, `cleaning`, and `available` are strictly owned by Floor staff workflows.
- **Canonical Unsent Item Semantics:** Standardized on `pending` as the canonical status for unsent items, with `draft` as a backward-compatibility alias.
- **Single Active Order per Table:** Enforced via partial unique index `uq_active_order_per_table` (`WHERE status NOT IN ('completed', 'cancelled') AND table_id IS NOT NULL`) and service-layer validation with UI visual indicators.
- **Multi-Tenant Engine Integrity:** Added composite foreign keys (`fk_order_items_parent_composite`, `fk_order_item_history_parent_composite`), reservation tenant consistency, waitlist tenant consistency, and staff tenant authorization check via `has_outlet_access()`.
- **Item Lifecycle Transition Guards:** Disallowed mutations on terminal states (`served`, `cancelled`) and validated valid transition paths (`pending` -> `sent` -> `preparing` -> `ready` -> `served`).
- **Hardened Status Derivation:** Robust aggregate calculation respecting `open`, `sent`, `in_progress`, `ready`, `partially_served`, and `served`, with cancelled items safely ignored.

---

### PHASE 3G - Guest Profiles & CRM Intelligence (COMPLETE)
- Hospitality guest profile and visit-history management workspace (`src/features/guests/`)
- Local migration (`20260919000011_phase3g_guests.sql`) with `guests`, `guest_visits`, foreign key migrations linking `reservations.guest_id`, `waitlist_entries.guest_id`, and `orders.guest_id` to `guests.id` (`ON DELETE SET NULL`), contact normalization trigger (`normalize_contact_string`), tenant consistency triggers, organization-level RLS (`has_organization_access()`) for `guests`, and outlet-level RLS (`has_outlet_access()`) for `guest_visits`
- Total architectural separation between authenticated staff `profiles` and restaurant `guests`
- Multi-tenant scope hierarchy: Organization-scoped guest identities (cross-outlet recognition across KLCC, Bangsar, Penang) with outlet-scoped visit history (`guest_visits`)
- Deterministic duplicate matching engine (`IGuestService` / `FixtureGuestService`) based on normalized phone, WhatsApp, and email with real-time UI warning banner (`POSSIBLE EXISTING GUEST`) without auto-merging
- PII protection with explicit audited marketing communication consent checkboxes defaulting to `false` (zero generic sales CRM features; non-authoritative spend intelligence strictly excluded)
- 5 Executive KPI metric tiles: Total Profiles, Returning Guests, VIP Guests, Celebrations, Allergy Watch
- 5 View Modes: **All Guests**, **Returning (2+ Visits)**, **VIP Guests**, **Upcoming Reservations**, **Recent Visits**
- Multi-dimensional search (Name, Phone, Email) with tag chips (`VIP`, `WINE_LOVER`, `VEGETARIAN`, `BUSINESS_DINER`, `HOTEL_GUEST`), allergy toggles, and sorting
- Slide-over Guest Detail Drawer featuring Deterministic Hospitality Intelligence Panel, critical allergy/dietary alerts, contact details & marketing opt-in audit, upcoming reservations, recent orders, visit timeline, and notes/tags management
- Fast guest intake modal with touch presets and real-time duplicate check; Safe guest profile editing preserving historical visit records
- Responsive across Desktop Directory Stand, Manager iPad (1024px), and Mobile cards

---

### PHASE 3H - Offers & Experiences Engine (COMPLETE)
- Standalone Hospitality Offers & Experiences management engine (`src/features/offers/`)
- Local migration (`20260920000012_phase3h_offers_experiences.sql`) with `experiences`, `experience_addons`, `offers`, `experience_availability_rules`, `reservation_experiences`, and `reservation_addons`
- Dual-scope catalog architecture: Organization-wide catalogue availability (`outlet_id IS NULL`) vs. outlet-specific items (`outlet_id IS NOT NULL`) with RLS using `has_organization_access()` and `has_outlet_access()`
- Domain separation: Experiences (packages/menus), Add-ons (cakes, floral decor, champagne upgrades), and Offers (promotions/perks)
- Operational reservation attachment engine with deterministic compatibility checks (party size bounds, date validity, service time windows, outlet restrictions)
- Historical Price Snapshotting: Snapshots catalogue price at moment of booking attachment to preserve audit records and disallow silent historical modifications
- Strict zero-payment boundary: Hospitality product pricing metadata only; no POS billing, payment gateways, tax calculation, or settlement
- Public vs. Staff-Only channel visibility: Discretionary packages (`is_public = false`) hidden from future public endpoints
- Reservation Detail Adapter: Non-intrusive collapsible section inside `ReservationDetailDrawer.tsx` displaying attached packages and celebration add-ons
- Full operational management workspace with 4 KPI metrics, 4 top view tabs (**EXPERIENCES**, **OFFERS**, **ADD-ONS**, **RESERVATION BOOKINGS**), multi-dimensional search & filtering, slide-over detail drawer, and touch-friendly creation/attachment workflows
- Responsive across Desktop Directory, Manager iPad (768px - 1366px), and Mobile cards

---

### PHASE 3H.1 - Offers & Experiences Integrity Hardening (COMPLETE)
- Local hardening migration (`20260920000013_phase3h1_offers_integrity.sql`)
- **has_organization_access() Re-affirmation:** Audited and verified organization membership helper for organization-wide catalogue records where `outlet_id IS NULL`.
- **Dual-Scope RLS Verification:** Strict conditional enforcement ensuring catalogue records never require outlet access on a NULL `outlet_id`, while operational attachment records remain outlet-scoped.
- **Experience / Outlet Scoping:** Database-level and service-level validation ensuring outlet-specific experiences only attach to matching reservations, while org-wide experiences are accessible across all sister venues.
- **Explicit Add-on Rule A:** Enforced that experience-tied add-ons require that specific experience to be attached to the reservation (`status IN ('pending', 'confirmed', 'fulfilled')`), while general add-ons may attach independently.
- **Attachment Status State Machine:** Enforced valid operational transitions (`pending` -> `confirmed` -> `fulfilled`, with cancellation restricted to `pending` or `confirmed`). Disallowed mutations on terminal states (`fulfilled`, `cancelled`).
- **Price Snapshot & Currency Immutability:** Locked historical pricing snapshot (`unit_price_snapshot`, `currency_code`) once attachments reach `confirmed` or `fulfilled` status.
- **Deterministic Availability & Capacity Pacing:** Hardened service checks validating active status, party size bounds, date validity, advance lead notice, schedule windows, and session capacity caps (`maximum_bookings`).
- **Future Atomic Operation Architecture:** Documented `attach_experience_to_reservation_atomic` multi-entity locking and rollback specification.

---

### PHASE 3I - Manager Live View + Basic Insights (COMPLETE)
- Manager-facing operational supervisory command centre (`src/features/manager/`) mounted at `/app/insights`
- Architectural read model aggregating concurrently across all 6 underlying domain services (`reservationService`, `floorService`, `queueService`, `orderService`, `guestService`, `offersService`) without cross-context React imports
- 8 Primary Real-Time KPI Metric Cards: Covers In House, Expected Covers, Tables Occupied, Tables Available, Active Waitlist, Orders Preparing, Orders Ready, Service Alerts
- Service Alerts Engine: Deterministic deduplicated alert synthesis with urgency levels (`URGENT`, `ATTENTION`, `INFO`) and direct navigation links (`/app/orders`, `/app/floor`, `/app/reservations`, `/app/queue`, `/app/guests`, `/app/offers`)
- 6 Supervisory Command Panels: Floor & Seating Pressure, Reservations Flow, Waitlist & Queue Pressure, Kitchen & Bar Station Pressure, VIPs & Celebrations Care, and Active Experiences & Packages
- Shift Operational Timeline: Real-time chronological audit stream of floor actions, kitchen dispatches, queue events, and hospitality touches
- Shift Context Banner: Displaying service period (`DINNER SERVICE`), pressure status (`ACTIVE PEAK`), outlet identifier, duty manager name (`Marcus Vance`), freshness timestamp, and manual refresh sync
- Multi-Tab Manager Navigation:
  - **LIVE SERVICE**: Real-time supervisory command centre
  - **TODAY**: Day-level cumulative operational totals (reservations executed, no-shows, walk-ins, waitlist turnover, orders completed, packages delivered)
  - **SERVICE INSIGHTS**: 8 transparent operational metrics (peak service window, busiest seating area, average table turn, average kitchen prep, average waitlist delay, repeat guest rate, booking vs walk-in mix, experience adoption)
- Strict Scope Boundaries: Zero financial intelligence, revenue, profit, check average, or sales forecasting formulas
- Responsive across Manager Desktop (1920px), iPad Tablet (768px/1024px), and Mobile Handhelds

---

### PHASE 3J — Staff + Roles + Settings + Hotel Mode (COMPLETE)
- Full staff directory workspace (`src/features/staff/`) with role-aware tabs, KPI bar, responsive list/cards, detail drawer, and invite simulation
- Expanded `app_role` enum: `waiter`, `cashier`, `kitchen`, `bar` added (additive only, `staff` preserved for migration safety)
- Centralized permission architecture (`src/features/staff/permissions/`) — typed `Permission` union, `ROLE_PERMISSION_MAP`, `hasPermission()`, `can()`, `canAny()` utilities
- Role-aware AppShell navigation — nav items filtered by role using centralized permission utilities; DEV PREVIEW always shows full nav
- Full settings workspace (`src/features/settings/`) with 9 typed sections: Restaurant, Service, Reservations, Floor, Queue, Orders, Guests, Hotel Mode, System
- `OutletSettings` typed container with JSONB storage — 8 TypeScript interfaces enforcing structure; no untyped JSON access
- Hotel Mode foundation: master toggle (default OFF), hotel name, property code, concierge bookings, hotel guest tags, charge-to-room eligibility flag
- `HotelGuestContext` and `ConciergeBookingContext` types, `IPmsIntegrationService` stub (documented future boundary)
- `AccessDenied` reusable component — professional access-denied state with no raw errors
- Local migration (`20260920000014_phase3j_staff_settings_hotel.sql`) — additive enum values, `organization_members` enrichment, `outlet_settings` table with JSONB + RLS
- `IStaffService` / `FixtureStaffService` / `SupabaseStaffService` stub + `ISettingsService` / `FixtureSettingsService` / `SupabaseSettingsService` stub
- Documented: frontend vs backend authorization boundary, self-promotion prevention, last owner protection, RLS design
- Desktop, tablet (768–1366px), and mobile (360–430px) responsive across both Staff and Settings

---

### PHASE 3K — Q RESTOBAR Integration (NEXT — REQUIRES EXPLICIT APPROVAL)
- Integration between Q F&B operational data and Q RESTOBAR CMS/website
- Menu synchronization, public booking endpoint, and digital experience bridging
- DO NOT start without explicit written approval from the product owner

