// External Supabase client — points at the user's OWN Supabase project
// (not Lovable Cloud). All app code should import `supabase` from here.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function createExternalSupabase() {
  const url =
    (import.meta.env as Record<string, string | undefined>).VITE_EXTERNAL_SUPABASE_URL ||
    process.env.EXTERNAL_SUPABASE_URL;
  const key =
    (import.meta.env as Record<string, string | undefined>).VITE_EXTERNAL_SUPABASE_PUBLISHABLE_KEY ||
    process.env.EXTERNAL_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing EXTERNAL_SUPABASE_URL / EXTERNAL_SUPABASE_PUBLISHABLE_KEY. Configure them in project secrets.",
    );
  }

  return createClient<Database>(url, key, {
    auth: {
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _client: ReturnType<typeof createExternalSupabase> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createExternalSupabase>, {
  get(_, prop, receiver) {
    if (!_client) _client = createExternalSupabase();
    return Reflect.get(_client, prop, receiver);
  },
});
