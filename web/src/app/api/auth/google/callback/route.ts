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

  const rawState = request.nextUrl.searchParams.get("state") || "dashboard";
  const isPopup =
    rawState.includes("_popup") ||
    request.nextUrl.searchParams.get("popup") === "true";
  const cleanState = rawState.replace("_popup", "");
  const redirectTarget = cleanState.startsWith("/")
    ? cleanState
    : `/${cleanState}`;

  function createResponse(userId: string) {
    if (isPopup) {
      const html = `<!DOCTYPE html>
<html>
<head>
  <title>CampusPulse — Signed In</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #09090b; color: #f4f4f5; }
    .card { text-align: center; padding: 24px; }
    .spinner { border: 2px solid #27272a; border-top: 2px solid #3b82f6; border-radius: 50%; width: 28px; height: 28px; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <div style="font-size: 16px; font-weight: 600;">Signed in successfully!</div>
    <div style="font-size: 13px; color: #a1a1aa; margin-top: 6px;">Closing window and synchronizing...</div>
  </div>
  <script>
    try {
      if (window.opener) {
        window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', userId: '${userId}' }, '*');
      }
    } catch(e) {}
    setTimeout(function() { window.close(); }, 600);
  </script>
</body>
</html>`;
      const res = new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
      res.cookies.set("campuspulse_session", userId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
      return res;
    }

    const res = NextResponse.redirect(
      new URL(`${redirectTarget}?auth=success`, request.url)
    );
    res.cookies.set("campuspulse_session", userId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }

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

      return createResponse(demoUser.id);
    }

    // Resolve dynamic request origin for exact redirect_uri match with Google OAuth
    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      request.nextUrl.host;
    const proto =
      request.headers.get("x-forwarded-proto") ||
      (host.includes("localhost") ? "http" : "https");
    const origin = `${proto}://${host}`;

    // Exchange code for tokens
    const { accessToken, refreshToken, expiresIn } =
      await exchangeCodeForTokens(code, origin);

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

    return createResponse(user.id);
  } catch (err) {
    console.error("OAuth callback error:", err);
    if (isPopup) {
      const errHtml = `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #09090b; color: #f87171; display:flex; align-items:center; justify-content:center; height:100vh;">
  <div style="text-align:center;">
    <h3>Authentication Failed</h3>
    <p>${err instanceof Error ? err.message : "Could not sign in"}</p>
    <button onclick="window.close()" style="padding: 8px 16px; border-radius: 6px; background:#27272a; color:#fff; border:none; cursor:pointer;">Close</button>
  </div>
</body>
</html>`;
      return new NextResponse(errHtml, {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return NextResponse.redirect(
      new URL(
        `/dashboard?auth=error&message=${encodeURIComponent(
          err instanceof Error ? err.message : "Authentication failed"
        )}`,
        request.url
      )
    );
  }
}
