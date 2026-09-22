import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck } from "lucide-react";

type ProtectedRouteProps = Readonly<{
  children: React.ReactNode;
}>;

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isDevPreview, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center font-mono text-xs text-zinc-400 space-y-4">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>VERIFYING PLATFORM SESSION...</span>
        </div>
      </div>
    );
  }

  // Render application only if genuinely authenticated OR explicitly in DEV PREVIEW MODE
  if (!user && !isDevPreview) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
