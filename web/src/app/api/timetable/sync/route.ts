import { NextResponse } from "next/server";
import { createDemoTimetable } from "@/lib/demo-data";

// In production, this would read from the database
// For the hackathon demo, we serve the demo data or the stored data

export async function GET() {
  try {
    // For the demo, return the demo timetable
    const timetable = createDemoTimetable();

    return NextResponse.json({
      timetable,
      syncToken: `sync-${Date.now()}`,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Unable to sync timetable." },
      { status: 500 }
    );
  }
}
