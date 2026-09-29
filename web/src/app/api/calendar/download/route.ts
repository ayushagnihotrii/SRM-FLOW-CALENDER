import { NextRequest, NextResponse } from "next/server";
import { generateICalendar } from "@/lib/calendar/ical";
import { SavedEvent } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events, semesterStart, semesterEnd, timezone } = body as {
      events: SavedEvent[];
      semesterStart: string;
      semesterEnd: string;
      timezone: string;
    };

    if (!events || events.length === 0) {
      return NextResponse.json(
        { error: "No events to export" },
        { status: 400 }
      );
    }

    const icsContent = generateICalendar(events, {
      semesterStart: semesterStart || "2026-09-28",
      semesterEnd: semesterEnd || "2026-12-15",
      timezone: timezone || "Asia/Kolkata",
    });

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="campuspulse-timetable.ics"',
      },
    });
  } catch (error) {
    console.error("Calendar download error:", error);
    return NextResponse.json(
      { error: "Failed to generate calendar file" },
      { status: 500 }
    );
  }
}
