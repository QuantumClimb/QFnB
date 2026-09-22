/**
 * DEMO / DEVELOPMENT FIXTURE DATA
 * 
 * IMPORTANT: These fixtures are strictly used when running in DEVELOPMENT PREVIEW MODE.
 * Production builds load organizations, outlets, and memberships directly from the
 * authenticated user's Supabase access records.
 */

import { Organization, Outlet } from "../types";

export const DEV_FIXTURE_ORGANIZATIONS: Organization[] = [
  {
    id: "dev-org-001",
    name: "Quantum Climb",
    slug: "lumina-group",
    status: "active",
    country_code: "MY",
    default_timezone: "Asia/Kuala_Lumpur",
    default_currency: "MYR",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  }
];

export const DEV_FIXTURE_OUTLETS: Outlet[] = [
  {
    id: "dev-outlet-001",
    organization_id: "dev-org-001",
    name: "Quantum Climb",
    slug: "lumina-klcc",
    address_line1: "Jalan Ampang, Kuala Lumpur",
    city: "Kuala Lumpur",
    country: "Malaysia",
    timezone: "Asia/Kuala_Lumpur",
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "dev-outlet-002",
    organization_id: "dev-org-001",
    name: "Quantum Climb — Bangsar",
    slug: "lumina-bangsar",
    address_line1: "Jalan Telawi, Bangsar",
    city: "Kuala Lumpur",
    country: "Malaysia",
    timezone: "Asia/Kuala_Lumpur",
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  }
];
