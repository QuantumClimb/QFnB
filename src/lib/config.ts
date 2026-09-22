/**
 * Q F&B Application Configuration & Environment Detection
 */

export const isDemoMode = Boolean(
  import.meta.env.VITE_DEMO_MODE === 'true' ||
  !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co' ||
  import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co'
);

export const APP_CONFIG = {
  appName: 'Q F&B OS',
  platformVersion: '0.1.0-hardening',
  isDemoMode,
};
