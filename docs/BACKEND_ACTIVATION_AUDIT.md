# Q F&B OS — Backend Activation Preflight Audit & Migration Analysis

**Document Version:** 1.0.0  
**Generated:** 2026-09-22  
**Target Backend:** Dedicated Q F&B OS Operational Supabase Project  
**Status:** PRE-ACTIVATION AUDIT COMPLETE — LOCAL READINESS GATE

---

## Executive Summary

This preflight report evaluates the complete migration chain (14 migrations), RLS policy models, function security contexts, and service provider architecture for **Q F&B OS** prior to remote database activation.

> [!IMPORTANT]
> **Dedicated Database Requirement**: Q F&B OS **must not** share its operational Supabase instance with the QC Website or the Q RESTOBAR CMS. Q F&B OS is the single operational source of truth for hospitality tables, reservations, orders, waitlists, and guest CRM.

---

## 1. Migration Chain Audit (Chronological)

| Index | Migration File | Primary Domain | Tables / Types Created | Risk Level | Production Readiness |
|---|---|---|---|---|---|
| 01 | `20260919000001_initial_schema.sql` | Tenant & Auth Foundation | `profiles`, `organizations`, `organization_members`, `outlets`, `outlet_members`, `organization_invites`, `app_role` enum | LOW | READY |
| 02 | `20260919000002_rls_policies.sql` | Core RLS Isolation | Helper `is_org_member()`, `handle_new_user()` trigger | LOW | READY |
| 03 | `20260919000003_tenant_creation_rpc.sql` | Tenant Bootstrap RPC | `create_organization_with_outlet()` (SECURITY DEFINER) | LOW | READY |
| 04 | `20260919000004_phase3c_reservations_schema.sql` | Reservations Engine | `seating_areas`, `reservations`, `reservation_status_history`, 3 enums | LOW | READY |
| 05 | `20260919000005_phase3d_floor_tables.sql` | Floor & Tables | `restaurant_tables`, `table_state_history`, 2 enums | LOW | READY |
| 06 | `20260919000006_phase3d1_floor_integrity.sql` | Floor Constraints & Triggers | Consistency validation triggers for seating area and reservation binding | LOW | READY |
| 07 | `20260919000007_phase3e_waitlist.sql` | Queue / Waitlist Schema | `waitlist_entries`, `waitlist_status_history`, 2 enums | LOW | READY |
| 08 | `20260919000008_phase3e1_waitlist_integrity.sql` | Waitlist State Machine | `check_waitlist_status_transition()` validation trigger | LOW | READY |
| 09 | `20260919000009_phase3f_orders.sql` | Service Orders | `orders`, `order_items`, `order_item_status_history`, 4 enums | LOW | READY |
| 10 | `20260919000010_phase3f1_orders_integrity.sql` | Order State Constraints | Lifecycle transition and single active table order constraint | LOW | READY |
| 11 | `20260919000011_phase3g_guests.sql` | Guest CRM & Normalization | `guests`, `guest_visits`, phone normalization triggers | LOW | READY |
| 12 | `20260920000012_phase3h_offers_experiences.sql` | Offers & Experiences | `experiences`, `experience_addons`, `offers`, `experience_availability_rules`, `reservation_experiences`, `reservation_addons` | MEDIUM | READY |
| 13 | `20260920000013_phase3h1_offers_integrity.sql` | Experiences Integrity | Hardened cross-tenant and schedule binding triggers | LOW | READY |
| 14 | `20260920000014_phase3j_staff_settings_hotel.sql` | Staff, Settings & Hotel Mode | `outlet_settings`, `ALTER TYPE app_role ADD VALUE` for `waiter`, `cashier`, `kitchen`, `bar` | LOW | READY |

---

## 2. Security & Integrity Verifications

### 2.1 Role Enum Compatibility (`app_role`)
- **Initial Roles (Migration 01):** `owner`, `admin`, `manager`, `host`, `marketing`, `staff`, `viewer`.
- **Phase 3J Additions (Migration 14):** `waiter`, `cashier`, `kitchen`, `bar` added via non-destructive `ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS`.
- **Legacy Compatibility:** The `staff` enum value is strictly preserved as a legacy alias for `waiter`. No table or column renames break historical rows.

### 2.2 Security Definer & Search Path Safety
All `SECURITY DEFINER` functions in the migration chain have explicit `SET search_path = public` clauses, preventing search path hijacking attacks:
- `is_org_member()` — Protected
- `handle_new_user()` — Protected
- `create_organization_with_outlet()` — Protected
- `check_outlet_organization_consistency()` — Protected
- `has_outlet_access()` — Protected
- `check_reservation_table_consistency()` — Protected
- `has_organization_access()` — Protected
- `set_outlet_settings_updated_at()` — Protected

### 2.3 Row-Level Security (RLS) Isolation
- **Organization Isolation:** All root tables (`reservations`, `restaurant_tables`, `guests`, `orders`, `waitlist_entries`, `experiences`, `outlet_settings`) enforce tenant boundaries via `organization_id` matching authenticated user membership in `organization_members`.
- **Outlet Scoping:** Operational tables (`reservations`, `restaurant_tables`, `orders`, `waitlist_entries`, `outlet_settings`) enforce `outlet_id` scoping via `outlet_members` or organizational hierarchy.

### 2.4 Last-Owner & Self-Promotion Protection (Phase 3J.1 Architecture)
- Database level RPCs must reject owner deletion or self-demotion when `COUNT(owner) = 1` for the organization.
- Staff role elevation (e.g. host -> admin) is restricted to existing `owner` or `admin` sessions.

### 2.5 Hotel Mode Operational Isolation
- When `hotelModeEnabled = false`, the restaurant operates in standard standalone mode.
- Hotel VIP / room tags do **not** influence queue priority or wait estimation (strictly FIFO / `joined_at` fairness).
- No external PMS network calls or automated room charging is permitted in the core operational loop.

---

## 3. Remote Activation Plan & Safety Gate

> [!CAUTION]
> **REMOTE ACTIVATION GATE (HALT POINT)**:  
> No remote commands (`supabase link`, `supabase db push`, remote SQL scripts) are executed autonomously. Explicit user approval is required before binding to a remote Supabase project.

### Pre-requisites for Activation:
1. Provision a dedicated Supabase project for Q F&B OS.
2. Obtain Project URL and public `anon` API key.
3. Configure local `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Apply migrations 1 through 14 sequentially via Supabase CLI or approved script.
5. Verify client authentication and toggle providerFactory from Fixture to Supabase services.
