import { NextRequest, NextResponse } from "next/server";
import { serverDb } from "@/lib/server-db";
import { encryptSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const { email, name, avatarUrl } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid Google email address." },
        { status: 400 }
      );
    }

    const cleanName = name?.trim() || email.split("@")[0];
    const googleId = `gid_${Buffer.from(email).toString("hex").substring(0, 16)}`;

    // Upsert user in database
    const user = serverDb.upsertUser({
      googleId,
      email: email.trim().toLowerCase(),
      name: cleanName,
      avatarUrl:
        avatarUrl ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=2563eb`,
      campusPulseCalendarId: "campuspulse_calendar_" + googleId,
    });

    const response = NextResponse.json({ success: true, user });

    // Set HTTP-only session cookie with encrypted user
    const sessionToken = encryptSession({ user });
    response.cookies.set("campuspulse_session", sessionToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Select account error:", error);
    return NextResponse.json(
      { error: "Failed to sign in with specified account." },
      { status: 500 }
    );
  }
}
