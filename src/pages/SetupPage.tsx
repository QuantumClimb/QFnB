import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Store, Globe, Clock, Coins, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function SetupPage() {
  const navigate = useNavigate();
  const { isDevPreview } = useAuth();
  
  const [orgName, setOrgName] = useState("");
  const [outletName, setOutletName] = useState("");
  const [country, setCountry] = useState("Malaysia");
  const [timezone, setTimezone] = useState("Asia/Kuala_Lumpur");
  const [currency, setCurrency] = useState("MYR");
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (isDevPreview || !isSupabaseConfigured) {
      // Development Preview mode success path (non-persisted fixture notice)
      setLoading(false);
      navigate("/app/overview");
      return;
    }

    try {
      // Atomic Tenant Creation via Supabase RPC function
      const { error } = await supabase.rpc("create_organization_with_outlet", {
        org_name: orgName,
        outlet_name: outletName,
        country_code: "MY",
        timezone_val: timezone,
        currency_val: currency,
      });

      setLoading(false);

      if (error) {
        setErrorMsg(error.message || "Failed to create organization.");
      } else {
        navigate("/app/overview");
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || "An unexpected error occurred during setup.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4 font-sans text-zinc-200">
      <div className="w-full max-w-xl bg-zinc-900 border border-white/10 p-8 space-y-6 shadow-2xl rounded-lg">
        
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono text-xs uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>TENANT SETUP</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase font-mono">
            Q F&B OS — TENANT SETUP
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            The live operating system for hospitality. Powered by Quantum Climb
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 font-mono text-xs rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSetup} className="space-y-4 font-mono text-xs">
          
          {/* Organization Name */}
          <div className="space-y-1.5">
            <label className="text-zinc-400 font-bold uppercase block text-[11px]">
              ORGANIZATION / RESTAURANT GROUP NAME
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-purple-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Quantum Climb Group"
                className="w-full bg-black border border-white/10 focus:border-purple-500 text-white pl-10 pr-3 py-2.5 rounded focus:outline-none"
              />
            </div>
          </div>

          {/* First Outlet Name */}
          <div className="space-y-1.5">
            <label className="text-zinc-400 font-bold uppercase block text-[11px]">
              FIRST OUTLET NAME
            </label>
            <div className="relative">
              <Store className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={outletName}
                onChange={(e) => setOutletName(e.target.value)}
                placeholder="e.g. Quantum Climb"
                className="w-full bg-black border border-white/10 focus:border-purple-500 text-white pl-10 pr-3 py-2.5 rounded focus:outline-none"
              />
            </div>
          </div>

          {/* Grid: Country, Timezone, Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-bold uppercase block text-[10px]">
                COUNTRY
              </label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-black border border-white/10 text-white pl-9 pr-2 py-2 rounded"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 font-bold uppercase block text-[10px]">
                TIMEZONE
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-black border border-white/10 text-white pl-9 pr-2 py-2 rounded"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 font-bold uppercase block text-[10px]">
                CURRENCY
              </label>
              <div className="relative">
                <Coins className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-black border border-white/10 text-white pl-9 pr-2 py-2 rounded"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-black hover:bg-purple-500 hover:text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 rounded cursor-pointer mt-6"
          >
            {loading ? (
              <span>INITIALIZING TENANT...</span>
            ) : (
              <>
                <span>INITIALIZE TENANT & FIRST OUTLET</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
