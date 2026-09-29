import { SavedEvent } from "@/lib/schemas";
import { v5 as uuidv5 } from "uuid";

const NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

/**
 * Generate a stable, deterministic UID for a calendar event.
 * Uses UUID v5 with event properties so the same event always produces the same UID.
 */
export function generateEventUID(event: SavedEvent): string {
  const seed = `${event.id}-${event.courseCode}-${event.dayOfWeek}-${event.startTime}`;
  return `${uuidv5(seed, NAMESPACE)}@campuspulse`;
}

/**
 * Convert day name to RRULE BYDAY value
 */
function dayToByday(day: string): string {
  const map: Record<string, string> = {
    Monday: "MO",
    Tuesday: "TU",
    Wednesday: "WE",
    Thursday: "TH",
    Friday: "FR",
    Saturday: "SA",
    Sunday: "SU",
  };
  return map[day] || "MO";
}

/**
 * Convert day name to JS Date getDay() offset (0=Sunday)
 */
function dayToNumber(day: string): number {
  const map: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  return map[day] ?? 1;
}

/**
 * Find the first occurrence of a given weekday on or after a start date.
 */
function getFirstOccurrence(startDate: string, dayOfWeek: string): Date {
  const date = new Date(startDate + "T00:00:00");
  const targetDay = dayToNumber(dayOfWeek);
  const currentDay = date.getDay();
  const diff = (targetDay - currentDay + 7) % 7;
  date.setDate(date.getDate() + diff);
  return date;
}

/**
 * Format a Date + time string (HH:MM) into iCal DTSTART/DTEND value.
 * Uses TZID format for timezone-aware events.
 */
function formatICalDateTime(date: Date, time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}T${String(hours).padStart(2, "0")}${String(minutes).padStart(2, "0")}00`;
}

/**
 * Format a date string into iCal UNTIL format
 */
function formatUntilDate(dateStr: string): string {
  const date = new Date(dateStr + "T23:59:59");
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}T235959Z`;
}

/**
 * Escape special characters in iCal text values
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Fold long lines per RFC 5545 (max 75 octets per line)
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  parts.push(line.substring(0, 75));
  let remaining = line.substring(75);
  while (remaining.length > 0) {
    parts.push(" " + remaining.substring(0, 74));
    remaining = remaining.substring(74);
  }
  return parts.join("\r\n");
}

export interface CalendarOptions {
  semesterStart: string;
  semesterEnd: string;
  timezone: string;
  calendarName?: string;
}

/**
 * Generate a single VEVENT block for an event
 */
export function generateVEvent(
  event: SavedEvent,
  options: CalendarOptions
): string {
  const firstOccurrence = getFirstOccurrence(
    options.semesterStart,
    event.dayOfWeek
  );
  const dtstart = formatICalDateTime(firstOccurrence, event.startTime);
  const dtend = formatICalDateTime(firstOccurrence, event.endTime);
  const until = formatUntilDate(options.semesterEnd);
  const uid = generateEventUID(event);
  const summary = `${event.courseCode} (${event.courseName})`;
  const byday = dayToByday(event.dayOfWeek);

  const lines: string[] = [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART;TZID=${options.timezone}:${dtstart}`,
    `DTEND;TZID=${options.timezone}:${dtend}`,
    `SUMMARY:${escapeICalText(summary)}`,
    `LOCATION:${escapeICalText(event.room)}`,
    `DESCRIPTION:${escapeICalText(`Faculty: ${event.faculty}`)}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${byday};UNTIL=${until}`,
  ];

  // Add 20-minute reminder alarm if enabled
  if (event.reminderEnabled) {
    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "TRIGGER:-PT20M",
      "DESCRIPTION:Upcoming class",
      "END:VALARM"
    );
  }

  lines.push("END:VEVENT");

  return lines.map(foldLine).join("\r\n");
}

/**
 * Generate VTIMEZONE block for Asia/Kolkata (IST, no DST)
 */
function generateTimezone(timezone: string): string {
  // Simple timezone for IST (no DST transitions)
  if (timezone === "Asia/Kolkata") {
    return [
      "BEGIN:VTIMEZONE",
      "TZID:Asia/Kolkata",
      "BEGIN:STANDARD",
      "DTSTART:19700101T000000",
      "TZOFFSETFROM:+0530",
      "TZOFFSETTO:+0530",
      "TZNAME:IST",
      "END:STANDARD",
      "END:VTIMEZONE",
    ].join("\r\n");
  }

  // Generic fallback
  return [
    "BEGIN:VTIMEZONE",
    `TZID:${timezone}`,
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0000",
    "TZOFFSETTO:+0000",
    "END:STANDARD",
    "END:VTIMEZONE",
  ].join("\r\n");
}

/**
 * Generate a complete RFC 5545 compliant iCalendar file
 */
export function generateICalendar(
  events: SavedEvent[],
  options: CalendarOptions
): string {
  const calName = options.calendarName || "CampusPulse Timetable";

  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CampusPulse//Timetable//EN",
    `X-WR-CALNAME:${escapeICalText(calName)}`,
    `X-WR-TIMEZONE:${options.timezone}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ].join("\r\n");

  const timezone = generateTimezone(options.timezone);
  const vevents = events.map((e) => generateVEvent(e, options)).join("\r\n");
  const footer = "END:VCALENDAR";

  return `${header}\r\n${timezone}\r\n${vevents}\r\n${footer}\r\n`;
}
