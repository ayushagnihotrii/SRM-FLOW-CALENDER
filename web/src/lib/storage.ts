import { SavedEvent, SavedTimetable } from "@/lib/schemas";

const STORAGE_KEY = "campuspulse_timetable";
const TOKEN_KEY = "campuspulse_webcal_token";

/**
 * Generate a random token for WebCal feed
 */
function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

/**
 * Get or create a persistent WebCal token
 */
export function getWebCalToken(): string {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = generateToken();
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

/**
 * Save timetable to localStorage
 */
export function saveTimetable(timetable: SavedTimetable): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(timetable));
}

/**
 * Load timetable from localStorage
 */
export function loadTimetable(): SavedTimetable | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as SavedTimetable;
  } catch {
    return null;
  }
}

/**
 * Delete timetable from localStorage
 */
export function deleteTimetable(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Update a single event in the stored timetable
 */
export function updateEvent(
  eventId: string,
  updates: Partial<SavedEvent>
): SavedTimetable | null {
  const timetable = loadTimetable();
  if (!timetable) return null;

  timetable.events = timetable.events.map((e) =>
    e.id === eventId ? { ...e, ...updates } : e
  );
  timetable.updatedAt = new Date().toISOString();
  saveTimetable(timetable);
  return timetable;
}

/**
 * Delete an event from the stored timetable
 */
export function deleteEvent(eventId: string): SavedTimetable | null {
  const timetable = loadTimetable();
  if (!timetable) return null;

  timetable.events = timetable.events.filter((e) => e.id !== eventId);
  timetable.updatedAt = new Date().toISOString();
  saveTimetable(timetable);
  return timetable;
}

/**
 * Add a new event to the stored timetable
 */
export function addEvent(event: SavedEvent): SavedTimetable | null {
  const timetable = loadTimetable();
  if (!timetable) return null;

  timetable.events.push(event);
  timetable.updatedAt = new Date().toISOString();
  saveTimetable(timetable);
  return timetable;
}
