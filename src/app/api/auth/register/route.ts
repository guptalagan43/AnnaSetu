import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { display_name, email, phone, password, role } = body;

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
      "verified_driver", "casual_volunteer", "observer_gov", "observer_esg"
    ];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 422 }
      );
    }

    const supabase = createAdminClient();

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers.users.some(u => u.email === email);
    
    if (userExists) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for demo; in production send verification email
      user_metadata: {
        display_name,
        phone,
        role,
      },
    });

    if (authError) {
      console.error("[Auth] Create user error:", authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      );
    }

    // Create profile (trigger should handle this, but ensure it exists)
    if (authData.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: authData.user.id,
          role,
          display_name,
          phone,
        });

      if (profileError) {
        console.error("[Auth] Profile creation error:", profileError);
        // Don't fail registration for profile error - trigger should handle
      }
    }

    return NextResponse.json(
      { 
        message: "Account created successfully. Please check your email to verify.",
        user: authData.user 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Auth Register] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}