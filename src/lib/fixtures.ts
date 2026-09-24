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
    id: "73b9d863-89e8-4999-87a3-f76e2c716268",
    name: "Lumina Group",
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
    id: "7e76ef38-0b8d-4a17-8ebd-c89b455270a4",
    organization_id: "73b9d863-89e8-4999-87a3-f76e2c716268",
    name: "Lumina Restobar (KLCC)",
    slug: "lumina-klcc",
    address_line1: "Level 5, Suria KLCC, Persiaran Petronas",
    city: "Kuala Lumpur",
    country: "Malaysia",
    timezone: "Asia/Kuala_Lumpur",
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "dev-outlet-002",
    organization_id: "73b9d863-89e8-4999-87a3-f76e2c716268",
    name: "Lumina Restobar (Bangsar)",
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
