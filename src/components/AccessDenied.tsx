import React from "react";
import { ShieldOff } from "lucide-react";

interface AccessDeniedProps {
  module?: string;
}

/**
 * AccessDenied — Reusable professional access denied state.
 *
 * Shown when the current user's role does not have permission to access
 * the requested module. Does NOT expose raw technical errors.
 *
 * NOTE: This is a UX control only. Production authorization is enforced
 * by Supabase RLS and backend validation — never by hidden UI elements alone.
 */
export function AccessDenied({ module }: AccessDeniedProps) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="max-w-sm text-center space-y-5 px-6">
        <div className="w-16 h-16 bg-zinc-800 border border-white/10 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldOff className="w-8 h-8 text-zinc-500" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-black text-white font-mono uppercase tracking-wide">
            ACCESS RESTRICTED
          </h2>
          {module && (
            <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
              Module: {module}
            </div>
          )}
          <p className="text-sm text-zinc-500 font-sans leading-relaxed">
            You do not have access to this module.
          </p>
          <p className="text-xs text-zinc-600 font-sans leading-relaxed">
            Contact an administrator if you believe this is incorrect.
          </p>
        </div>

        <div className="pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-white/8 text-zinc-600 font-mono text-[10px] uppercase tracking-wider rounded">
            <ShieldOff className="w-3 h-3" />
            Insufficient permissions
          </div>
        </div>
      </div>
    </div>
  );
}
