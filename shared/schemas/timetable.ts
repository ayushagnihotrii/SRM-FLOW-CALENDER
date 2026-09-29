import { z } from "zod";

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export const TIME_REGEX = /^\d{2}:\d{2}$/;

export const timetableEventSchema = z
  .object({
    courseCode: z.string().min(1, "Course code is required"),
    courseName: z.string().min(1, "Course name is required"),
    room: z.string().min(1, "Room is required"),
    dayOfWeek: z.enum(DAYS_OF_WEEK, {
      errorMap: () => ({ message: "Invalid day of week" }),
    }),
    startTime: z
      .string()
      .regex(TIME_REGEX, "Start time must be in HH:MM format"),
    endTime: z.string().regex(TIME_REGEX, "End time must be in HH:MM format"),
    faculty: z.string().min(1, "Faculty is required"),
  })
  .refine(
    (data) => {
      const [startH, startM] = data.startTime.split(":").map(Number);
      const [endH, endM] = data.endTime.split(":").map(Number);
      return startH * 60 + startM < endH * 60 + endM;
    },
    {
      message: "Start time must be before end time",
      path: ["endTime"],
    }
  );

export type TimetableEvent = z.infer<typeof timetableEventSchema>;

export const parsedTimetableSchema = z.object({
  events: z.array(timetableEventSchema).min(1, "No events found"),
});

export type ParsedTimetable = z.infer<typeof parsedTimetableSchema>;

// Extended event with ID and reminder flag (used after saving)
export const savedEventSchema = timetableEventSchema.innerType().extend({
  id: z.string(),
  reminderEnabled: z.boolean().default(true),
});

export type SavedEvent = z.infer<typeof savedEventSchema>;

export const savedTimetableSchema = z.object({
  id: z.string(),
  name: z.string().default("My Timetable"),
  semesterStart: z.string(),
  semesterEnd: z.string(),
  timezone: z.string().default("Asia/Kolkata"),
  events: z.array(savedEventSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SavedTimetable = z.infer<typeof savedTimetableSchema>;

// Sync response format for Android
export const syncResponseSchema = z.object({
  timetable: savedTimetableSchema,
  syncToken: z.string(),
});

export type SyncResponse = z.infer<typeof syncResponseSchema>;
