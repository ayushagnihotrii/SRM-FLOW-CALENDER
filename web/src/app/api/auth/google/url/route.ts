import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl, isGoogleConfigured } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state") || "dashboard";
  const isPopup = request.nextUrl.searchParams.get("popup") === "true";
  const authUrl = getGoogleAuthUrl(state, isPopup);

  return NextResponse.json({
    url: authUrl,
    isGoogleConfigured: isGoogleConfigured(),
  });
}
