/**
 * Centralized Permission Architecture — Phase 3J
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SECURITY BOUNDARY NOTICE
 * ═══════════════════════════════════════════════════════════════════════════
 * Frontend permission checks performed here are UX-layer controls ONLY.
 * They are NOT sufficient security.
 *
 * Production MUST additionally enforce sensitive actions through:
 *   - Supabase Row Level Security (RLS) policies
 *   - Database functions (SECURITY DEFINER)
 *   - Authorized RPCs / Edge Functions
 *   - Backend validation
 *
 * NEVER treat a hidden button as authorization.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Additional production requirements:
 *   - Role changes must be performed by an authorized higher-level user
 *     and validated server-side. Self-promotion via client-side changes
 *     MUST be blocked at the RLS/RPC layer.
 *   - The final organization owner MUST NOT be removed or demoted without
 *     explicit ownership transfer. This MUST be enforced at the database layer.
 */

import type { Role } from "../../../types";

// ─────────────────────────────────────────────────────────────────────────────
// Permission Keys — strongly typed union, no 'any'
// ─────────────────────────────────────────────────────────────────────────────

export type Permission =
  // TODAY dashboard
  | "today.read"
  // Reservations
  | "reservations.read"
  | "reservations.write"
  // Floor management
  | "floor.read"
  | "floor.manage"
  // Queue / Waitlist
  | "queue.read"
  | "queue.manage"
  // Orders
  | "orders.read"
  | "orders.write"
  | "orders.kitchen"
  | "orders.bar"
  // Guest profiles
  | "guests.read"
  | "guests.manage"
  // Offers & Experiences
  | "offers.read"
  | "offers.manage"
  // Insights / Manager view
  | "insights.read"
  // Staff directory & management
  | "staff.read"
  | "staff.manage"
  // Settings
  | "settings.read"
  | "settings.manage"
  // Hotel mode
  | "hotel.read"
  | "hotel.manage";

// ─────────────────────────────────────────────────────────────────────────────
// Centralized Role → Permissions Map
//
// One canonical source of truth. Do NOT scatter role-name comparisons
// (e.g. if (role === 'manager')) across components.
// Always use hasPermission() or getPermissions() utilities.
// ─────────────────────────────────────────────────────────────────────────────

const ALL_PERMISSIONS: readonly Permission[] = [
  "today.read",
  "reservations.read",
  "reservations.write",
  "floor.read",
  "floor.manage",
  "queue.read",
  "queue.manage",
  "orders.read",
  "orders.write",
  "orders.kitchen",
  "orders.bar",
  "guests.read",
  "guests.manage",
  "offers.read",
  "offers.manage",
  "insights.read",
  "staff.read",
  "staff.manage",
  "settings.read",
  "settings.manage",
  "hotel.read",
  "hotel.manage",
] as const;

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  /**
   * OWNER — Full organization authority.
   * All permissions. Ownership transfer protection applies (backend enforced).
   */
  owner: ALL_PERMISSIONS,

  /**
   * ADMIN — Platform and tenant administration.
   * All permissions equivalent to owner for operational purposes.
   */
  admin: ALL_PERMISSIONS,

  /**
   * MANAGER — Operational management.
   * All operational modules + insights + staff read + settings read.
   * Cannot manage staff roles or system settings (admin/owner only).
   */
  manager: [
    "today.read",
    "reservations.read", "reservations.write",
    "floor.read", "floor.manage",
    "queue.read", "queue.manage",
    "orders.read", "orders.write", "orders.kitchen", "orders.bar",
    "guests.read", "guests.manage",
    "offers.read", "offers.manage",
    "insights.read",
    "staff.read",
    "settings.read",
    "hotel.read",
  ],

  /**
   * HOST — Reservations, arrivals, queue, seating, guest recognition.
   */
  host: [
    "today.read",
    "reservations.read", "reservations.write",
    "floor.read", "floor.manage",
    "queue.read", "queue.manage",
    "guests.read",
    "offers.read",
  ],

  /**
   * WAITER — Table service and order workflow.
   */
  waiter: [
    "today.read",
    "floor.read",
    "queue.read",
    "orders.read", "orders.write",
    "guests.read",
  ],

  /**
   * CASHIER — Future checkout/payment operational role.
   * No payment processing implemented. Placeholder permissions only.
   */
  cashier: [
    "today.read",
    "orders.read",
    "guests.read",
  ],

  /**
   * MARKETING — Guest/offer/experience access with privacy limitations.
   * Cannot access individual PII beyond what is permitted by guest consent.
   */
  marketing: [
    "today.read",
    "guests.read",
    "offers.read", "offers.manage",
    "insights.read",
  ],

  /**
   * KITCHEN — Kitchen station order workflow.
   */
  kitchen: [
    "orders.read",
    "orders.kitchen",
  ],

  /**
   * BAR — Bar station order workflow.
   */
  bar: [
    "orders.read",
    "orders.bar",
  ],

  /**
   * VIEWER — Read-only access where authorized.
   */
  viewer: [
    "today.read",
    "reservations.read",
    "floor.read",
    "queue.read",
    "orders.read",
    "guests.read",
    "offers.read",
    "insights.read",
  ],

  /**
   * STAFF — @deprecated legacy alias for 'waiter'.
   * Preserved for migration safety. Maps to waiter permissions.
   * DO NOT remove without a planned data-migration step.
   */
  staff: [
    "today.read",
    "floor.read",
    "queue.read",
    "orders.read", "orders.write",
    "guests.read",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Permission Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check whether a role has a specific permission.
 * Use this instead of raw role-name comparisons in components.
 *
 * @example
 *   hasPermission('manager', 'staff.manage')  // false
 *   hasPermission('owner', 'staff.manage')    // true
 *
 * SECURITY: This is a UX-layer check only. Backend must also enforce.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return (permissions as readonly Permission[]).includes(permission);
}

/**
 * Get all permissions for a role.
 */
export function getPermissions(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Convenience alias — reads more naturally in component code.
 *
 * @example
 *   if (can(role, 'staff.manage')) { ... }
 *
 * SECURITY: UX-layer only. Backend must also enforce.
 */
export function can(role: Role, permission: Permission): boolean {
  return hasPermission(role, permission);
}

/**
 * Check if a role has any of the given permissions.
 */
export function canAny(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Get a human-readable description of the role's operational scope.
 */
export function getRoleDescription(role: Role): string {
  switch (role) {
    case "owner":     return "Full organization authority";
    case "admin":     return "Platform and tenant administration";
    case "manager":   return "Operational management across all modules";
    case "host":      return "Reservations, arrivals, queue, seating & guest recognition";
    case "waiter":    return "Table service and order workflow";
    case "cashier":   return "Checkout & payment operations (future)";
    case "marketing": return "Guest, offer & experience access";
    case "kitchen":   return "Kitchen station order workflow";
    case "bar":       return "Bar station order workflow";
    case "viewer":    return "Read-only access across authorized modules";
    case "staff":     return "Legacy role — maps to waiter permissions";
    default:          return "Unknown role";
  }
}

/** Export the complete role→permissions map (read-only) */
export const ROLE_PERMISSION_MAP: Readonly<typeof ROLE_PERMISSIONS> = ROLE_PERMISSIONS;
