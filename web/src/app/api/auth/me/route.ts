import { NextRequest, NextResponse } from "next/server";
import { serverDb } from "@/lib/server-db";
import { isGoogleConfigured } from "@/lib/google-calendar";
import { decryptSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("campuspulse_session")?.value;

  if (!sessionCookie) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      isGoogleConfigured: isGoogleConfigured(),
    });
  }

  // 1. Try decrypting session cookie (stateless, works on Vercel Serverless)
  const sessionData = decryptSession(sessionCookie);
  let user = sessionData?.user || null;
  let googleAccount = sessionData?.account || null;

  // 2. Fallback to serverDb
  if (!user) {
    user = serverDb.getUserById(sessionCookie);
  }
  if (user && !googleAccount) {
    googleAccount = serverDb.getGoogleAccountByUserId(user.id);
  }

  if (!user) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      isGoogleConfigured: isGoogleConfigured(),
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      campusPulseCalendarId: user.campusPulseCalendarId,
      hasGoogleAccount: Boolean(googleAccount || !isGoogleConfigured()),
    },
    isGoogleConfigured: isGoogleConfigured(),
  });
}
