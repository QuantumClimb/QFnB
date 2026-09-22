import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";

export function LoginPage() {
  const navigate = useNavigate();
  const { signInWithPassword, resetPassword, enterDevPreview } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "reset">("signin");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    if (mode === "signin") {
      const { error } = await signInWithPassword(email, password);
      setLoading(false);
      if (error) {
        setErrorMsg(error.message || "Invalid credentials. Please try again.");
      } else {
        navigate("/app/overview");
      }
    } else {
      const { error } = await resetPassword(email);
      setLoading(false);
      if (error) {
        setErrorMsg(error.message || "Failed to send reset email.");
      } else {
        setSuccessMsg("Password reset instructions have been sent to your email.");
      }
    }
  };

  const handleEnterDevPreview = () => {
    enterDevPreview();
    navigate("/app/overview");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4 font-sans text-zinc-200">
      
      {/* Container Box */}
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 p-8 space-y-6 shadow-2xl rounded-lg">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono text-xs uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AUTHENTICATION SYSTEM</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase font-mono">
            Q F&B OS
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            The live operating system for hospitality.
          </p>
        </div>

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 font-mono text-xs rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs rounded">
            {successMsg}
          </div>
        )}

        {/* Mode Switcher */}
        <div className="flex border-b border-white/10 font-mono text-xs">
          <button
            onClick={() => { setMode("signin"); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 text-center border-b-2 font-bold transition-colors ${
              mode === "signin" 
                ? "border-purple-500 text-white" 
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            SIGN IN
          </button>
          <button
            onClick={() => { setMode("reset"); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 text-center border-b-2 font-bold transition-colors ${
              mode === "reset" 
                ? "border-purple-500 text-white" 
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            RESET PASSWORD
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div className="space-y-1.5">
            <label className="text-zinc-400 font-bold uppercase block text-[11px]">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@restaurant.com"
                className="w-full bg-black border border-white/10 focus:border-purple-500 text-white pl-10 pr-3 py-2.5 rounded focus:outline-none"
              />
            </div>
          </div>

          {mode === "signin" && (
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-bold uppercase block text-[11px]">
                PASSWORD
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="������������"
                  className="w-full bg-black border border-white/10 focus:border-purple-500 text-white pl-10 pr-3 py-2.5 rounded focus:outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-black hover:bg-purple-500 hover:text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 rounded cursor-pointer mt-4"
          >
            {loading ? (
              <span>PROCESSING...</span>
            ) : (
              <>
                <span>{mode === "signin" ? "AUTHENTICATE SESSION" : "SEND RESET INSTRUCTIONS"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Explicit Development Preview Action */}
        <div className="pt-4 border-t border-white/10 space-y-3 font-mono text-xs">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-[11px] uppercase">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>DEVELOPMENT PREVIEW MODE</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
              Test layout, organization switching, and module shells without connecting to a live Supabase database.
            </p>
            <button
              onClick={handleEnterDevPreview}
              className="w-full py-2 bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-200 font-bold text-[11px] uppercase tracking-wider rounded transition-colors"
            >
              ENTER DEVELOPMENT PREVIEW
            </button>
          </div>

          <div className="text-center text-[10px] text-zinc-500">
            Multi-Tenant Security � Row Level Security Enabled
          </div>
        </div>

      </div>

    </div>
  );
}
