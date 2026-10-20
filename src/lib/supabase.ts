/**
 * Supabase Client Integration Hub for TECHNOVIX Chat
 * Real-time PostgreSQL database, Supabase Auth & WebSockets
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawAnonKey &&
  rawUrl.trim() !== '' &&
  rawAnonKey.trim() !== '' &&
  !rawUrl.includes('your-project-ref') &&
  !rawAnonKey.includes('your-anon-key') &&
  rawUrl.startsWith('https://')
);

export interface SupabaseConfigStatus {
  configured: boolean;
  url: string | null;
  mode: 'connected' | 'demo-preview';
  realtimeEnabled: boolean;
}

export const getSupabaseStatus = (): SupabaseConfigStatus => ({
  configured: isSupabaseConfigured,
  url: isSupabaseConfigured && rawUrl ? rawUrl : null,
  mode: isSupabaseConfigured ? 'connected' : 'demo-preview',
  realtimeEnabled: isSupabaseConfigured,
});

export const supabase = (isSupabaseConfigured && rawUrl && rawAnonKey)
  ? createClient<Database>(rawUrl, rawAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;
