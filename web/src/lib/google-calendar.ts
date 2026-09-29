import { serverDb } from "./server-db";
import { SavedEvent } from "./schemas";
import crypto from "crypto";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  "http://localhost:3001/api/auth/google/callback";
const GOOGLE_CALENDAR_SCOPE =
  process.env.GOOGLE_CALENDAR_SCOPE ||
  "https://www.googleapis.com/auth/calendar.app.created";

const DEFAULT_SEMESTER_START =
  process.env.NEXT_PUBLIC_SEMESTER_START || "2026-09-28";
const DEFAULT_SEMESTER_END =
  process.env.NEXT_PUBLIC_SEMESTER_END || "2026-12-15";
const DEFAULT_TIMEZONE =
  process.env.NEXT_PUBLIC_TIMEZONE || "Asia/Kolkata";

export function isGoogleConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

export function getGoogleAuthUrl(state = "sync", isPopup = false): string {
  if (!isGoogleConfigured()) {
    return `/auth/google-select?state=${encodeURIComponent(state)}${isPopup ? "&popup=true" : ""}`;
  }

  const scopes = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    GOOGLE_CALENDAR_SCOPE,
  ].join(" ");

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: "select_account consent",
    state: isPopup ? `${state}_popup` : state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}> {
  const params = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: GOOGLE_REDIRECT_URI,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google token exchange error:", errorText);
    throw new Error("Failed to exchange authorization code with Google");
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Token refresh error:", errorText);
    throw new Error("Failed to refresh Google access token");
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

export async function getValidAccessToken(userId: string): Promise<string> {
  const account = serverDb.getGoogleAccountByUserId(userId);
  if (!account) {
    throw new Error("No Google account linked for this user");
  }

  const now = Date.now();
  // If token expires in less than 2 minutes and refresh token exists, refresh it
  if (now >= account.expiresAt - 120000 && account.refreshToken) {
    try {
      const refreshed = await refreshAccessToken(account.refreshToken);
      serverDb.upsertGoogleAccount({
        userId,
        googleUserId: account.googleUserId,
        email: account.email,
        accessToken: refreshed.accessToken,
        refreshToken: account.refreshToken,
        expiresAt: Date.now() + refreshed.expiresIn * 1000,
      });
      return refreshed.accessToken;
    } catch (err) {
      console.warn("Auto-refresh failed, attempting with current token:", err);
    }
  }

  return account.accessToken;
}

export async function getGoogleUserInfo(accessToken: string): Promise<{
  id: string;
  email: string;
  name: string;
  picture: string;
}> {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Google user profile");
  }

  const data = await response.json();
  return {
    id: data.sub,
    email: data.email,
    name: data.name || data.email.split("@")[0],
    picture: data.picture || "",
  };
}

export async function getOrCreateCampusPulseCalendar(
  accessToken: string,
  userId: string
): Promise<string> {
  const user = serverDb.getUserById(userId);
  if (user?.campusPulseCalendarId) {
    // Verify it still exists in Google Calendar
    try {
      const verifyRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
          user.campusPulseCalendarId
        )}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (verifyRes.ok) {
        return user.campusPulseCalendarId;
      }
    } catch {
      // Continue to search or create
    }
  }

  // Search existing user calendars for "CampusPulse"
  const listRes = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (listRes.ok) {
    const listData = await listRes.json();
    const existing = (listData.items || []).find(
      (cal: { summary: string }) => cal.summary === "CampusPulse"
    );
    if (existing?.id) {
      serverDb.updateUserCalendarId(userId, existing.id);
      return existing.id;
    }
  }

  // Create new secondary calendar
  const createRes = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: "CampusPulse",
        description: "University timetable managed by CampusPulse",
        timeZone: DEFAULT_TIMEZONE,
      }),
    }
  );

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error("Calendar creation failed:", errText);
    throw new Error("Failed to create CampusPulse secondary calendar");
  }

  const newCalendar = await createRes.json();
  serverDb.updateUserCalendarId(userId, newCalendar.id);
  return newCalendar.id;
}

/**
 * Generate a deterministic Google Calendar event ID.
 * Must satisfy: ^[a-v0-9]{5,1024}$
 */
export function generateDeterministicGoogleEventId(
  userId: string,
  courseCode: string,
  dayOfWeek: string,
  startTime: string
): string {
  const raw = `${userId}_${courseCode}_${dayOfWeek}_${startTime}`.toLowerCase();
  const hash = crypto.createHash("md5").update(raw).digest("hex");
  // Map hex chars (0-9, a-f) into safe [a-v0-9]
  const clean = hash.replace(/[^a-v0-9]/g, "");
  return `cp${clean.substring(0, 24)}`;
}

/**
 * Helper to compute next target date on or after semester start
 */
function getFirstDateForDayOfWeek(
  semesterStartStr: string,
  dayOfWeekName: string
): Date {
  const dayMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const targetDay = dayMap[dayOfWeekName] ?? 1;
  const date = new Date(semesterStartStr);

  while (date.getDay() !== targetDay) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}

function formatDateToIsoString(d: Date, timeStr: string): string {
  const [hours, minutes] = timeStr.split(":");
  const copy = new Date(d);
  copy.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

  const pad = (n: number) => String(n).padStart(2, "0");
  const year = copy.getFullYear();
  const month = pad(copy.getMonth() + 1);
  const day = pad(copy.getDate());
  const hour = pad(copy.getHours());
  const min = pad(copy.getMinutes());
  const sec = "00";

  return `${year}-${month}-${day}T${hour}:${min}:${sec}`;
}

export async function syncTimetableToGoogle(
  userId: string,
  events: SavedEvent[],
  options?: {
    semesterStart?: string;
    semesterEnd?: string;
    timezone?: string;
  }
): Promise<{
  success: boolean;
  calendarId: string;
  calendarUrl: string;
  createdCount: number;
  updatedCount: number;
  deletedCount: number;
  lastSyncedAt: string;
}> {
  const semesterStart = options?.semesterStart || DEFAULT_SEMESTER_START;
  const semesterEnd = options?.semesterEnd || DEFAULT_SEMESTER_END;
  const timezone = options?.timezone || DEFAULT_TIMEZONE;

  const nowIso = new Date().toISOString();
  const calendarUrl = "https://calendar.google.com/calendar/u/0/r";

  // Check if live Google credentials are used or demo mode
  if (!isGoogleConfigured()) {
    // Demo mode: simulate sync idempotency
    const calendarId = "campuspulse_demo_calendar";
    serverDb.updateUserCalendarId(userId, calendarId);

    // Save mappings
    for (const ev of events) {
      const gEventId = generateDeterministicGoogleEventId(
        userId,
        ev.courseCode,
        ev.dayOfWeek,
        ev.startTime
      );
      serverDb.saveEventMapping({
        userId,
        timetableEventId: ev.id,
        googleCalendarId: calendarId,
        googleEventId: gEventId,
        courseCode: ev.courseCode,
        dayOfWeek: ev.dayOfWeek,
        startTime: ev.startTime,
        endTime: ev.endTime,
      });
    }

    const stats = {
      lastSyncedAt: nowIso,
      classesCount: events.length,
      calendarId,
      calendarUrl,
    };
    serverDb.saveLastSyncStats(stats);

    return {
      success: true,
      calendarId,
      calendarUrl,
      createdCount: events.length,
      updatedCount: 0,
      deletedCount: 0,
      lastSyncedAt: nowIso,
    };
  }

  // Live Google API Flow
  const accessToken = await getValidAccessToken(userId);
  const calendarId = await getOrCreateCampusPulseCalendar(accessToken, userId);

  // Fetch all existing events from the secondary calendar
  const listEventsRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events?maxResults=2500`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const existingGoogleEvents: Array<{ id: string; summary: string }> =
    listEventsRes.ok ? (await listEventsRes.json()).items || [] : [];

  const existingIdsSet = new Set(existingGoogleEvents.map((e) => e.id));
  const currentEventIdSet = new Set<string>();

  // Format UNTIL date in UTC for Google Calendar RRULE: YYYYMMDDTHHMMSSZ
  const untilDate = new Date(semesterEnd);
  untilDate.setHours(23, 59, 59, 0);
  const untilFormatted =
    untilDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  let createdCount = 0;
  let updatedCount = 0;
  let deletedCount = 0;

  for (const event of events) {
    const stableGoogleId = generateDeterministicGoogleEventId(
      userId,
      event.courseCode,
      event.dayOfWeek,
      event.startTime
    );
    currentEventIdSet.add(stableGoogleId);

    const firstDate = getFirstDateForDayOfWeek(semesterStart, event.dayOfWeek);
    const startDateTime = formatDateToIsoString(firstDate, event.startTime);
    const endDateTime = formatDateToIsoString(firstDate, event.endTime);

    const eventPayload = {
      id: stableGoogleId,
      summary: `${event.courseCode} (${event.courseName})`,
      location: event.room,
      description: `Course: ${event.courseName}\nCourse Code: ${event.courseCode}\nFaculty: ${event.faculty}\nRoom: ${event.room}\n\nCreated by CampusPulse`,
      start: {
        dateTime: startDateTime,
        timeZone: timezone,
      },
      end: {
        dateTime: endDateTime,
        timeZone: timezone,
      },
      recurrence: [`RRULE:FREQ=WEEKLY;UNTIL=${untilFormatted}`],
      reminders: {
        useDefault: false,
        overrides: [
          {
            method: "popup",
            minutes: 20,
          },
        ],
      },
    };

    if (existingIdsSet.has(stableGoogleId)) {
      // Update existing
      const updateRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
          calendarId
        )}/events/${stableGoogleId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventPayload),
        }
      );
      if (updateRes.ok) {
        updatedCount++;
      }
    } else {
      // Insert new
      const insertRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
          calendarId
        )}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventPayload),
        }
      );
      if (insertRes.ok) {
        createdCount++;
      }
    }

    serverDb.saveEventMapping({
      userId,
      timetableEventId: event.id,
      googleCalendarId: calendarId,
      googleEventId: stableGoogleId,
      courseCode: event.courseCode,
      dayOfWeek: event.dayOfWeek,
      startTime: event.startTime,
      endTime: event.endTime,
    });
  }

  // Remove any obsolete events that were previously synced by CampusPulse
  const storedMappings = serverDb.getEventMappings(userId);
  for (const mapping of storedMappings) {
    if (!currentEventIdSet.has(mapping.googleEventId)) {
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
          calendarId
        )}/events/${mapping.googleEventId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      serverDb.deleteEventMapping(userId, mapping.timetableEventId);
      deletedCount++;
    }
  }

  const stats = {
    lastSyncedAt: nowIso,
    classesCount: events.length,
    calendarId,
    calendarUrl,
  };
  serverDb.saveLastSyncStats(stats);

  return {
    success: true,
    calendarId,
    calendarUrl,
    createdCount,
    updatedCount,
    deletedCount,
    lastSyncedAt: nowIso,
  };
}
