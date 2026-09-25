import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registerLocalUser } from "@/lib/auth/localStore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { display_name, email, phone, password, role, fullName, name } = body;
    display_name = display_name || fullName || name;

    // Map shorthand roles
    if (role === "donor") role = "donor_admin";
    else if (role === "shelter") role = "shelter_admin";
    else if (role === "driver") role = "verified_driver";
    else if (role === "admin") role = "platform_admin";

    // Validate required fields
    if (!display_name || !email || !phone || !password || !role) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 422 }
      );
    }

    // Validate role
    const validRoles = [
      "donor_admin", "donor_staff", "shelter_admin", "shelter_coordinator",
      "verified_driver", "casual_volunteer", "observer_gov", "observer_esg",
      "platform_admin", "super_admin"
    ];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
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
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        if (existingUsers?.users?.some((u: any) => u.email === email)) {
          return NextResponse.json(
            { error: "An account with this email already exists" },
            { status: 409 }
          );
        }

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            display_name,
            phone,
            role,
          },
        });

        if (!authError && authData?.user) {
          await supabase.from("profiles").upsert({
            id: authData.user.id,
            role,
            display_name,
            phone,
            full_name: display_name,
          });

          return NextResponse.json(
            {
              message: "Account created successfully. Please check your email to verify.",
              user: authData.user,
            },
            { status: 201 }
          );
        }
      } catch (sbErr) {
        console.warn("[Auth Register] Supabase unavailable, using local store:", sbErr);
      }
    }

    // 2. Local & Demo Registration Fallback
    const { user, token } = registerLocalUser({
      email,
      password,
      display_name,
      phone,
      role,
    });

    const response = NextResponse.json(
      {
        message: "Account created successfully! You are now logged in.",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          display_name: user.display_name,
        },
        session: {
          access_token: token,
        },
      },
      { status: 201 }
    );

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
    console.error("[Auth Register] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}