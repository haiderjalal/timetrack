import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

import { AUTH_COOKIE_OPTIONS } from "./cookies";
import { getSupabaseEnv } from "./env";

import type { Database } from "@/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Create one per request; never share it between requests.
 */
export async function createSupabaseServerClient(): Promise<TypedSupabaseClient> {
  const { url, publishableKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    global: { fetch: fetchWithTimeout },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components can't write cookies. That's expected: proxy.ts
          // refreshes the session and writes the cookies on every request.
        }
      },
    },
  });
}
