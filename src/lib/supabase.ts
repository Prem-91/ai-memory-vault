// Re-export the managed Lovable Cloud Supabase client so every existing
// `@/lib/supabase` import keeps working without changes.
//
// NOTE: The previous external Supabase project was unreachable (DNS failed
// from the published site, causing every auth request to throw
// "Failed to fetch"). We now use the project's own Lovable Cloud backend.
export { supabase } from "@/integrations/supabase/client";
