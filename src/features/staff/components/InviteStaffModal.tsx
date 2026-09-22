import React, { useState } from "react";
import { X, UserPlus, Mail, Store } from "lucide-react";
import type { Role } from "../../../types";
import type { CreateStaffInviteInput } from "../types";
import { useStaff } from "../context/StaffContext";
import { useOrg } from "../../../context/OrgContext";

const INVITABLE_ROLES: { value: Role; label: string; description: string }[] = [
  { value: "manager",   label: "Manager",   description: "Full operational management" },
  { value: "host",      label: "Host",      description: "Reservations, queue, seating" },
  { value: "waiter",    label: "Waiter",    description: "Table service & orders" },
  { value: "kitchen",   label: "Kitchen",   description: "Kitchen station workflow" },
  { value: "bar",       label: "Bar",       description: "Bar station workflow" },
  { value: "marketing", label: "Marketing", description: "Guest & offers access" },
  { value: "cashier",   label: "Cashier",   description: "Future checkout role" },
  { value: "viewer",    label: "Viewer",    description: "Read-only access" },
];

interface InviteStaffModalProps {
  onClose: () => void;
}

export function InviteStaffModal({ onClose }: InviteStaffModalProps) {
  const { inviteStaff } = useStaff();
  const { outlets } = useOrg();

  const [email, setEmail]       = useState("");
  const [role, setRole]         = useState<Role>("waiter");
  const [outletId, setOutletId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const selectedRoleInfo = INVITABLE_ROLES.find((r) => r.value === role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const input: CreateStaffInviteInput = {
        email: email.trim().toLowerCase(),
        role,
        outletId: outletId || null,
      };
      await inviteStaff(input);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-md font-mono">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <div className="text-[10px] text-purple-400 uppercase tracking-widest mb-1">STAFF MANAGEMENT</div>
              <h2 className="text-lg font-black text-white uppercase">INVITE STAFF</h2>
            </div>
            <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {done ? (
            /* Success State */
            <div className="p-8 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <UserPlus className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <div className="text-white font-bold text-lg">Invite Simulated</div>
                <div className="text-zinc-400 text-sm font-sans mt-1">
                  In DEV PREVIEW, invitation emails are simulated. No real email was sent.
                </div>
                <div className="mt-3 px-4 py-2 bg-zinc-800 rounded text-xs text-zinc-300">
                  <span className="text-zinc-500">To: </span>{email}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase rounded transition-colors"
              >
                DONE
              </button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@yourvenue.com"
                    className="w-full bg-zinc-800 border border-white/15 text-white text-sm rounded px-3 py-2.5 pl-10 focus:outline-none focus:border-purple-500 placeholder:text-zinc-600 font-sans"
                    required
                  />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {INVITABLE_ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`text-left p-3 rounded-lg border transition-all duration-150 ${
                        role === r.value
                          ? "bg-purple-600/20 border-purple-500/50 text-white"
                          : "bg-zinc-800 border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-300"
                      }`}
                    >
                      <div className="text-xs font-bold uppercase">{r.label}</div>
                      <div className="text-[10px] text-zinc-500 font-sans mt-0.5 leading-tight">{r.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Outlet Assignment */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  Outlet Assignment <span className="text-zinc-600">(optional)</span>
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    id="invite-outlet"
                    value={outletId ?? ""}
                    onChange={(e) => setOutletId(e.target.value || null)}
                    className="w-full bg-zinc-800 border border-white/15 text-white text-sm rounded px-3 py-2.5 pl-10 focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Organization-wide (all outlets)</option>
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dev Notice */}
              <div className="px-3 py-2.5 bg-purple-500/10 border border-purple-500/20 rounded text-[10px] text-purple-300">
                DEV PREVIEW: Invitation is simulated. No real email will be sent.
              </div>

              {error && (
                <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-bold uppercase rounded border border-white/10 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  id="btn-send-invite"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase rounded transition-colors disabled:opacity-50"
                >
                  {isLoading ? "SENDING..." : "SEND INVITE"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
