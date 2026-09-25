import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createMockClient } from "./mockClient";

export async function createClient() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("sb-access-token")?.value ||
    cookieStore.get("annasetu-token")?.value;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasLiveSupabase = Boolean(supabaseUrl && !supabaseUrl.includes("placeholder"));

  // If Supabase credentials are not configured, return instantaneous local mock client
  if (!hasLiveSupabase) {
    return createMockClient(token) as any;
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server Component ignore
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Server Component ignore
          }
        },
      },
    }
  );
}