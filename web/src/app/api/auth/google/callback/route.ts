import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  getGoogleUserInfo,
  getOrCreateCampusPulseCalendar,
  isGoogleConfigured,
} from "@/lib/google-calendar";
import { serverDb } from "@/lib/server-db";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const isDemo = request.nextUrl.searchParams.get("demo") === "true";
  const state = request.nextUrl.searchParams.get("state") || "dashboard";

  const redirectTarget = state.startsWith("/") ? state : `/${state}`;

  try {
    if (isDemo || !isGoogleConfigured() || !code) {
      // Demo / Hackathon Fallback User
      const demoUser = serverDb.upsertUser({
        googleId: "google_demo_1092837465",
        email: "ayush.sharma@university.edu",
        name: "Ayush Sharma",
        avatarUrl:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
        campusPulseCalendarId: "campuspulse_demo_calendar",
      });

      const response = NextResponse.redirect(
        new URL(`${redirectTarget}?auth=success`, request.url)
      );
      response.cookies.set("campuspulse_session", demoUser.id, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return response;
    }

    // Exchange code for tokens
    const { accessToken, refreshToken, expiresIn } =
      await exchangeCodeForTokens(code);

    // Fetch user profile
    const profile = await getGoogleUserInfo(accessToken);

    // Create or update user
    const user = serverDb.upsertUser({
      googleId: profile.id,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture,
    });

    // Save tokens securely on server
    serverDb.upsertGoogleAccount({
      userId: user.id,
      googleUserId: profile.id,
      email: profile.email,
      accessToken,
      refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
    });

    // Create or locate the CampusPulse Google Calendar
    try {
      await getOrCreateCampusPulseCalendar(accessToken, user.id);
    } catch (calErr) {
      console.warn("Could not pre-initialize calendar on callback:", calErr);
    }

    const response = NextResponse.redirect(
      new URL(`${redirectTarget}?auth=success`, request.url)
    );
    response.cookies.set("campuspulse_session", user.id, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      new URL(`/dashboard?auth=error&message=${encodeURIComponent(
        err instanceof Error ? err.message : "Authentication failed"
      )}`, request.url)
    );
  }
}
