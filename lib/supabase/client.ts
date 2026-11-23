"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getFirebaseAuth } from "@/lib/firebase/client";

let browserClient: SupabaseClient | undefined;

export function hasSupabaseBrowserConfig(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!hasSupabaseBrowserConfig()) {
    throw new Error("Authentication is not configured. Set the Supabase project URL and public anon key.");
  }
  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        accessToken: async () => {
          const user = getFirebaseAuth().currentUser;
          return user ? user.getIdToken() : null;
        },
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      },
    );
  }
  return browserClient;
}
