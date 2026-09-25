import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { verifyAuthToken } from "@/lib/auth/localStore";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;

  // Static assets and internal paths are always passed through
  const isStaticAsset =
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/fonts/") ||
    pathname.includes(".");

  if (isStaticAsset) {
    return response;
  }

  // Public routes that don't require auth
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/public-impact") ||
    pathname.startsWith("/dev") ||
    pathname.startsWith("/unauthorized");

  const isApiRoute = pathname.startsWith("/api/");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
  const hasLiveSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
  );

  let session = null;
  if (hasLiveSupabase) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: "", ...options });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({ name, value, ...options });
          },
        },
      });

      const sessionResult = await supabase.auth.getSession();
      session = sessionResult.data?.session ?? null;
    } catch {
      session = null;
    }
  }

  const localToken =
    request.cookies.get("sb-access-token")?.value ||
    request.cookies.get("annasetu-token")?.value;

  let localUser = null;
  if (localToken) {
    localUser = verifyAuthToken(localToken);
  }

  const isAuthenticated = Boolean(session || localUser);
  console.log("[Middleware] pathname:", pathname, "localToken:", Boolean(localToken), "localUser:", localUser?.role, "isAuthenticated:", isAuthenticated);

  // Authenticated users visiting /login or /register are sent straight to their dashboard
  if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
    const role = (session?.user?.user_metadata?.role || localUser?.role || "donor_admin") as string;
    let target = "/donor";
    if (role === "shelter_admin" || role === "shelter_coordinator") target = "/shelter";
    else if (role === "verified_driver" || role === "casual_volunteer") target = "/driver";
    else if (role === "platform_admin" || role === "super_admin") target = "/admin";

    return NextResponse.redirect(new URL(target, request.url));
  }

  if (isPublicRoute || isApiRoute) {
    return response;
  }

  // Protected dashboard routes
  if (
    pathname.startsWith("/donor") ||
    pathname.startsWith("/shelter") ||
    pathname.startsWith("/driver") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings")
  ) {
    if (!isAuthenticated) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
