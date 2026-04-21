// External Supabase client — points at the user's OWN Supabase project
// (not Lovable Cloud). All app code should import `supabase` from here.
//
// NOTE: The publishable (anon) key is safe to expose in client bundles.
// Row-Level Security policies on every table protect user data.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const EXTERNAL_SUPABASE_URL = "https://ioqkpjvjiojglpfajaak.supabase.co";
const EXTERNAL_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_xA6b9HkLljE9Wlbu06RSfw_mPwwrYhn";

export const supabase = createClient<Database>(
  EXTERNAL_SUPABASE_URL,
  EXTERNAL_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
