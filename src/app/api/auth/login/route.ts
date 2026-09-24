import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateLocalUser } from "@/lib/auth/localStore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 422 }
      );
    }

    const hasSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
    );

    // 1. Try Supabase Auth if live project is configured
    if (hasSupabase) {
      try {
        const supabase = createAdminClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!error && data?.user && data?.session) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, display_name")
            .eq("id", data.user.id)
            .single();

          const userRole = profile?.role || "donor_admin";
          const response = NextResponse.json({
            user: {
              id: data.user.id,
              email: data.user.email,
              role: userRole,
              display_name: profile?.display_name || "",
            },
            session: {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_at: data.session.expires_at,
            },
          });

          response.cookies.set("sb-access-token", data.session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
          });

          response.cookies.set("annasetu-token", data.session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
          });

          return response;
        }
      } catch (sbErr) {
        console.warn("[Auth Login] Supabase unavailable, checking local store:", sbErr);
      }
    }

    // 2. Local & Demo Authentication Fallback
    const authResult = authenticateLocalUser(email, password);

    if (!authResult) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const { user, token } = authResult;
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        display_name: user.display_name,
      },
      session: {
        access_token: token,
      },
    });

    response.cookies.set("sb-access-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    response.cookies.set("annasetu-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Auth Login] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}