import { createClient } from "@supabase/supabase-js";
import { createMockClient } from "./mockClient";

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasLiveSupabase = Boolean(supabaseUrl && !supabaseUrl.includes("placeholder"));

  if (!hasLiveSupabase) {
    return createMockClient() as any;
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}