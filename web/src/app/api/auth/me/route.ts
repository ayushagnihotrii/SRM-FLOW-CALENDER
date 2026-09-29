import { NextRequest, NextResponse } from "next/server";
import { serverDb } from "@/lib/server-db";
import { isGoogleConfigured } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const sessionId = request.cookies.get("campuspulse_session")?.value;

  if (!sessionId) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      isGoogleConfigured: isGoogleConfigured(),
    });
  }

  const user = serverDb.getUserById(sessionId);
  if (!user) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      isGoogleConfigured: isGoogleConfigured(),
    });
  }

  const googleAccount = serverDb.getGoogleAccountByUserId(user.id);

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
