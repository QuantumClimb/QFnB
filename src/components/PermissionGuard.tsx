import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useOrg } from "../context/OrgContext";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../features/staff/permissions";
import type { Permission } from "../features/staff/permissions";

interface PermissionGuardProps {
  requiredPermission: Permission;
  children: React.ReactNode;
}

/**
 * Route-level permission guard wrapper component.
 *
 * Prevents unauthorized roles from accessing privileged operational routes
 * via direct URL navigation (e.g., /app/settings, /app/staff).
 *
 * NOTE: Frontend checks provide UX protection only.
 * Supabase Row Level Security (RLS) and authorized RPCs enforce backend security.
 */
export function PermissionGuard({ requiredPermission, children }: PermissionGuardProps) {
  const { role } = useOrg();
  const { isDevPreview } = useAuth();

  // DEV PREVIEW mode has full access as tenant developer/owner
  if (isDevPreview) {
    return <>{children}</>;
  }

  const isAllowed = hasPermission(role, requiredPermission);

  if (!isAllowed) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-mono font-black text-white uppercase tracking-tight mb-2">
          Access Restricted
        </h2>
        <p className="text-xs text-zinc-400 max-w-md mb-6 font-sans leading-relaxed">
          Your current role (<span className="text-purple-400 font-mono font-bold uppercase">{role}</span>) does not have permission (<span className="text-zinc-300 font-mono">{requiredPermission}</span>) to view this module.
        </p>
        <Link
          to="/app/overview"
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white rounded font-mono text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Today Overview</span>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
