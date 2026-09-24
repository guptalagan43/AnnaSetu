import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" });
  
  response.cookies.delete("sb-access-token");
  response.cookies.delete("sb-refresh-token");
  
  return response;
}