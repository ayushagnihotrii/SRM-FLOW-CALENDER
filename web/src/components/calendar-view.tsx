"use client";

import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { SavedEvent } from "@/lib/schemas";

interface CalendarViewProps {
  events: SavedEvent[];
  onEventClick?: (event: SavedEvent) => void;
}

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
 * Get a date for this week corresponding to the given day of week
 */
function getDateForDay(dayOfWeek: string): Date {
  const today = new Date();
  const currentDay = today.getDay();
  const targetDay = dayToNumber(dayOfWeek);
  const diff = targetDay - currentDay;
  const date = new Date(today);
  date.setDate(today.getDate() + diff);
  return date;
}

export function CalendarView({ events, onEventClick }: CalendarViewProps) {
  const calendarEvents = useMemo(() => {
    return events.map((event) => {
      const date = getDateForDay(event.dayOfWeek);
      const [startH, startM] = event.startTime.split(":").map(Number);
      const [endH, endM] = event.endTime.split(":").map(Number);

      const start = new Date(date);
      start.setHours(startH, startM, 0, 0);

      const end = new Date(date);
      end.setHours(endH, endM, 0, 0);

      // Get color for this course
      const colorIndex = events.findIndex(
        (e) => e.courseCode === event.courseCode
      );
      const colors = [
        { bg: "#3b82f6", border: "#2563eb" },
        { bg: "#8b5cf6", border: "#7c3aed" },
        { bg: "#10b981", border: "#059669" },
        { bg: "#f59e0b", border: "#d97706" },
        { bg: "#ef4444", border: "#dc2626" },
        { bg: "#06b6d4", border: "#0891b2" },
        { bg: "#f97316", border: "#ea580c" },
        { bg: "#14b8a6", border: "#0d9488" },
      ];

      const uniqueCodes = [...new Set(events.map((e) => e.courseCode))];
      const codeIndex = uniqueCodes.indexOf(event.courseCode);
      const color = colors[codeIndex % colors.length];

      return {
        id: event.id,
        title: `${event.courseCode}\n${event.room}`,
        start,
        end,
        backgroundColor: color.bg,
        borderColor: color.border,
        textColor: "#ffffff",
        extendedProps: { event },
      };
    });
  }, [events]);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin] as any}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridWeek,timeGridDay",
        }}
        events={calendarEvents}
        slotMinTime="08:00:00"
        slotMaxTime="18:00:00"
        allDaySlot={false}
        weekends={true}
        height="auto"
        expandRows={true}
        nowIndicator={true}
        eventClick={(info) => {
          const ev = info.event.extendedProps.event as SavedEvent;
          onEventClick?.(ev);
        }}
        eventContent={(arg) => {
          const ev = arg.event.extendedProps.event as SavedEvent;
          return (
            <div className="overflow-hidden p-0.5">
              <p className="truncate text-xs font-semibold">{ev.courseCode}</p>
              <p className="truncate text-[10px] opacity-80">{ev.room}</p>
            </div>
          );
        }}
      />
    </div>
  );
}
