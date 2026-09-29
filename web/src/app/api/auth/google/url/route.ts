import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl, isGoogleConfigured } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state") || "dashboard";
  const isPopup = request.nextUrl.searchParams.get("popup") === "true";
  const shouldRedirect = request.nextUrl.searchParams.get("redirect") === "true";

  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host;
  const proto =
    request.headers.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  const authUrl = getGoogleAuthUrl(state, isPopup, origin);

  if (shouldRedirect) {
    return NextResponse.redirect(authUrl);
  }

  return NextResponse.json({
    url: authUrl,
    isGoogleConfigured: isGoogleConfigured(),
  });
}
