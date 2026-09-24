import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
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
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  let session = null;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const sessionResult = await supabase.auth.getSession();
      session = sessionResult.data?.session ?? null;
    } catch {
      session = null;
    }
  }

  const pathname = request.nextUrl.pathname;

  // Public routes that don't require auth
  const publicRoutes = ["/", "/login", "/register", "/public-impact", "/dev"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isApiRoute = pathname.startsWith("/api/");
  const isStaticAsset = pathname.startsWith("/_next/") || pathname.startsWith("/favicon") || pathname.startsWith("/fonts/");

  if (isPublicRoute || isApiRoute || isStaticAsset) {
    return response;
  }

  const localToken =
    request.cookies.get("sb-access-token")?.value ||
    request.cookies.get("annasetu-token")?.value;

  const isAuthenticated = Boolean(session || localToken);

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
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};