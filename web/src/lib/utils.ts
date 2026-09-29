import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format time string (HH:MM) to 12-hour format
 */
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Get the day number (0=Monday for our timetable display)
 */
export function getDayIndex(day: string): number {
  const days: Record<string, number> = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
  };
  return days[day] ?? 0;
}

/**
 * Get current day name
 */
export function getCurrentDay(): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[new Date().getDay()];
}

/**
 * Convert time string to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Course color palette for consistent event styling
 */
const COURSE_COLORS = [
  { bg: "bg-blue-500/15", border: "border-blue-500/30", text: "text-blue-700", darkText: "dark:text-blue-300", dot: "bg-blue-500" },
  { bg: "bg-violet-500/15", border: "border-violet-500/30", text: "text-violet-700", darkText: "dark:text-violet-300", dot: "bg-violet-500" },
  { bg: "bg-emerald-500/15", border: "border-emerald-500/30", text: "text-emerald-700", darkText: "dark:text-emerald-300", dot: "bg-emerald-500" },
  { bg: "bg-amber-500/15", border: "border-amber-500/30", text: "text-amber-700", darkText: "dark:text-amber-300", dot: "bg-amber-500" },
  { bg: "bg-rose-500/15", border: "border-rose-500/30", text: "text-rose-700", darkText: "dark:text-rose-300", dot: "bg-rose-500" },
  { bg: "bg-cyan-500/15", border: "border-cyan-500/30", text: "text-cyan-700", darkText: "dark:text-cyan-300", dot: "bg-cyan-500" },
  { bg: "bg-orange-500/15", border: "border-orange-500/30", text: "text-orange-700", darkText: "dark:text-orange-300", dot: "bg-orange-500" },
  { bg: "bg-teal-500/15", border: "border-teal-500/30", text: "text-teal-700", darkText: "dark:text-teal-300", dot: "bg-teal-500" },
];

const courseColorMap = new Map<string, (typeof COURSE_COLORS)[number]>();

export function getCourseColor(courseCode: string) {
  if (!courseColorMap.has(courseCode)) {
    const index = courseColorMap.size % COURSE_COLORS.length;
    courseColorMap.set(courseCode, COURSE_COLORS[index]);
  }
  return courseColorMap.get(courseCode)!;
}
