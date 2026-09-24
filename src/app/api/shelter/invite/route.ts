import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { queueEmail } from "@/lib/queue/emailQueue";
import { renderCoordinatorInvite } from "@/lib/email/templates";
import crypto from "crypto";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const adminSupabase = createAdminClient();

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role, full_name, email")
      .eq("id", userId)
      .single();

    const role = profile?.role ?? "";
    const isAdmin = ["super_admin", "platform_admin", "moderator"].includes(role);
    const isShelterAdmin = role === "shelter_admin";

    if (!isAdmin && !isShelterAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Only shelter admins can invite coordinators" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role: inviteRole = "Shelter Coordinator" } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    // Find shelter
    const { data: shelter } = await adminSupabase
      .from("shelters")
      .select("id, name")
      .eq("profile_id", userId)
      .maybeSingle();

    const shelterName = shelter?.name || "Community Food Shelter";
    const shelterId = shelter?.id || "default";

    // Generate secure invite token
    const token = crypto.randomBytes(24).toString("hex");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${appUrl}/register?token=${token}&shelter=${shelterId}&role=shelter_coordinator&email=${encodeURIComponent(email)}`;

    // Render & Queue email
    try {
      const emailHtml = await renderCoordinatorInvite({
        inviteeEmail: email,
        shelterName,
        inviterName: profile?.full_name || "Shelter Administrator",
        role: inviteRole,
        inviteLink,
        expiresInDays: 7,
      });

      await queueEmail({
        to: email,
        subject: `🤝 You've been invited to join ${shelterName} on AnnaSetu`,
        html: emailHtml,
        priority: "normal",
        metadata: {
          userId,
          eventType: "coordinator_invite",
        },
      });
    } catch (emailErr) {
      console.warn("[Shelter Invite] Failed to queue email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: `Invitation successfully sent to ${email}`,
      inviteLink,
      token,
      shelterId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
