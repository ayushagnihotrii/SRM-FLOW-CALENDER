import { NextRequest, NextResponse } from "next/server";
import { generateICalendar } from "@/lib/calendar/ical";
import { SavedEvent } from "@/lib/schemas";

// In-memory store for demo purposes (in production, use a database)
const feedStore = new Map<
  string,
  {
    events: SavedEvent[];
    semesterStart: string;
    semesterEnd: string;
    timezone: string;
  }
>();

// POST to register/update a feed
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, events, semesterStart, semesterEnd, timezone } = body;

    if (!token || !events) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    feedStore.set(token, {
      events,
      semesterStart: semesterStart || "2026-09-28",
      semesterEnd: semesterEnd || "2026-12-15",
      timezone: timezone || "Asia/Kolkata",
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const webcalUrl = `webcal://${new URL(baseUrl).host}/api/calendar/feed?token=${token}`;

    return NextResponse.json({ webcalUrl, token });
  } catch (error) {
    console.error("Feed registration error:", error);
    return NextResponse.json(
      { error: "Failed to register feed" },
      { status: 500 }
    );
  }
}

// GET to serve the calendar feed
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const feedData = feedStore.get(token);

  if (!feedData) {
    return NextResponse.json({ error: "Feed not found" }, { status: 404 });
  }

  const icsContent = generateICalendar(feedData.events, {
    semesterStart: feedData.semesterStart,
    semesterEnd: feedData.semesterEnd,
    timezone: feedData.timezone,
    calendarName: "CampusPulse Timetable",
  });

  return new NextResponse(icsContent, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
