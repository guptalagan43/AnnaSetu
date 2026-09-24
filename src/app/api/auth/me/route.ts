import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Get user profile for role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, display_name")
      .eq("id", session.user.id)
      .single();

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        role: profile?.role || "donor_staff",
        display_name: profile?.display_name || session.user.email?.split("@")[0] || "User",
      },
    });
  } catch (error) {
    console.error("[Auth Me] Error:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}