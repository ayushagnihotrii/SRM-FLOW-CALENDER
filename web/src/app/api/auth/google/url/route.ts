import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl, isGoogleConfigured } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state") || "dashboard";
  const authUrl = getGoogleAuthUrl(state);

  return NextResponse.json({
    url: authUrl,
    isGoogleConfigured: isGoogleConfigured(),
  });
}
