import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { isDemoMode } from "../lib/config";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isDevPreview: boolean;
  signInWithPassword: (email: string, pass: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  enterDevPreview: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDevPreview, setIsDevPreview] = useState<boolean>(false);

  useEffect(() => {
    if (!isSupabaseConfigured || isDemoMode) {
      // If Supabase is not configured or demo mode is active, default to unauthenticated unless dev preview is triggered
      setIsLoading(false);
      return;
    }

    // Genuine Supabase Auth Session Handling
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithPassword = async (email: string, pass: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error("Supabase credentials not configured in environment.") };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    if (isDevPreview) {
      setIsDevPreview(false);
      setUser(null);
      setSession(null);
      return;
    }
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error("Supabase credentials not configured.") };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const enterDevPreview = () => {
    setIsDevPreview(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isDevPreview,
        signInWithPassword,
        signOut,
        resetPassword,
        enterDevPreview,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
