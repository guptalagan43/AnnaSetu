import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const isJson =
    request.headers.get("accept")?.includes("application/json") ||
    request.headers.get("content-type")?.includes("application/json");

  const response = isJson
    ? NextResponse.json({ message: "Logged out successfully" })
    : NextResponse.redirect(new URL("/login", request.url));

  response.cookies.delete("sb-access-token");
  response.cookies.delete("sb-refresh-token");
  response.cookies.delete("annasetu-token");

  return response;
}

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));

  response.cookies.delete("sb-access-token");
  response.cookies.delete("sb-refresh-token");
  response.cookies.delete("annasetu-token");

  return response;
}