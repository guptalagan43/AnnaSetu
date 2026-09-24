import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type UserRole = 
  | "super_admin"
  | "platform_admin"
  | "moderator"
  | "reporter"
  | "donor_admin"
  | "donor_staff"
  | "shelter_admin"
  | "shelter_coordinator"
  | "verified_driver"
  | "casual_volunteer"
  | "observer_gov"
  | "observer_esg";

export interface UserSession {
  user: {
    id: string;
    email: string;
    role: UserRole;
  } | null;
}

export async function getSession(): Promise<UserSession> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { user: null };
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  return {
    user: {
      id: session.user.id,
      email: session.user.email!,
      role: profile?.role as UserRole || "donor_staff",
    },
  };
}

export function requireRole(allowedRoles: UserRole[]) {
  return async function requireRoleWrapper() {
    const session = await getSession();
    
    if (!session.user) {
      redirect("/login");
    }

    if (!allowedRoles.includes(session.user.role)) {
      redirect("/unauthorized");
    }

    return session;
  };
}

export async function getCurrentUser() {
  const session = await getSession();
  return session.user;
}

export const donorRoles: UserRole[] = ["donor_admin", "donor_staff", "super_admin", "platform_admin", "moderator"];
export const shelterRoles: UserRole[] = ["shelter_admin", "shelter_coordinator", "super_admin", "platform_admin", "moderator"];
export const driverRoles: UserRole[] = ["verified_driver", "casual_volunteer", "super_admin", "platform_admin", "moderator"];
export const adminRoles: UserRole[] = ["super_admin", "platform_admin", "moderator"];
export const publicRoles: UserRole[] = []; // No auth required