import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // Check auth
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string | null) || "verification-docs";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 422 });
    }

    // Validate file size (5 MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large — maximum 5 MB" }, { status: 422 });
    }

    // Validate mime type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type — only PDF, JPG, PNG, WEBP are allowed" },
        { status: 422 }
      );
    }

    // Build a unique path: userId/timestamp-filename
    const ext = file.name.split(".").pop() ?? "bin";
    const safeName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 40);
    const path = `${session.user.id}/${Date.now()}-${safeName}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("[Upload] Supabase Storage error:", uploadError);
      return NextResponse.json({ error: "Storage upload failed" }, { status: 500 });
    }

    // Return the public URL (bucket must allow read or use signed URL)
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path);

    return NextResponse.json({ data: { url: publicUrl, path } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    console.error("[Upload] Unexpected error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
