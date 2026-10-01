import { NextRequest, NextResponse } from "next/server";
import { syncTimetableToGoogle } from "@/lib/google-calendar";
import { serverDb } from "@/lib/server-db";
import { decryptSession, encryptSession } from "@/lib/session";
import { SavedEvent } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("campuspulse_session")?.value;

    const sessionData = sessionCookie ? decryptSession(sessionCookie) : null;
    let user =
      sessionData?.user ||
      (sessionCookie ? serverDb.getUserById(sessionCookie) : null);
    let googleAccount =
      sessionData?.account ||
      (user ? serverDb.getGoogleAccountByUserId(user.id) : null);

    if (!user) {
      // Create guest/demo user if not yet authenticated
      user = serverDb.upsertUser({
        googleId: "google_demo_1092837465",
        email: "ayush.sharma@university.edu",
        name: "Ayush Sharma",
        avatarUrl:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
        campusPulseCalendarId: "campuspulse_demo_calendar",
      });
    }

    const body = await request.json();
    const { events, semesterStart, semesterEnd, timezone } = body as {
      events: SavedEvent[];
      semesterStart?: string;
      semesterEnd?: string;
      timezone?: string;
    };

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "No classes found to synchronize" },
        { status: 400 }
      );
    }

    const result = await syncTimetableToGoogle(
      user.id,
      events,
      {
        semesterStart,
        semesterEnd,
        timezone,
      },
      googleAccount
    );

    const response = NextResponse.json(result);
    // Ensure encrypted cookie is set
    const sessionToken = encryptSession({
      user,
      account: googleAccount || undefined,
    });
    response.cookies.set("campuspulse_session", sessionToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("Google Calendar sync error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to synchronize timetable with Google Calendar";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
