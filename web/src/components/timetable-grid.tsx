"use client";

import { SavedEvent, DAYS_OF_WEEK } from "@/lib/schemas";
import { formatTime, timeToMinutes, getCourseColor, cn } from "@/lib/utils";

interface TimetableGridProps {
  events: SavedEvent[];
  onEventClick: (event: SavedEvent) => void;
}

const DISPLAY_DAYS = DAYS_OF_WEEK.slice(0, 6); // Mon-Sat
const START_HOUR = 8;
const END_HOUR = 18;
const HOUR_HEIGHT = 64; // px per hour

export function TimetableGrid({ events, onEventClick }: TimetableGridProps) {
  const hours = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, i) => START_HOUR + i
  );

  const getEventStyle = (event: SavedEvent) => {
    const startMins = timeToMinutes(event.startTime);
    const endMins = timeToMinutes(event.endTime);
    const topOffset = ((startMins - START_HOUR * 60) / 60) * HOUR_HEIGHT;
    const height = ((endMins - startMins) / 60) * HOUR_HEIGHT;

    return {
      top: `${topOffset}px`,
      height: `${Math.max(height, 28)}px`,
    };
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-[60px_repeat(6,1fr)] border-b border-zinc-200 dark:border-zinc-800">
          <div className="p-3" />
          {DISPLAY_DAYS.map((day) => (
            <div
              key={day}
              className="border-l border-zinc-200 p-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-800"
            >
              {day.slice(0, 3)}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="relative grid grid-cols-[60px_repeat(6,1fr)]">
          {/* Time labels */}
          <div className="relative">
            {hours.map((hour) => (
              <div
                key={hour}
                className="flex items-start justify-end pr-2 text-xs text-zinc-400"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <span className="-mt-2">
                  {hour % 12 || 12}:00 {hour >= 12 ? "PM" : "AM"}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DISPLAY_DAYS.map((day) => {
            const dayEvents = events.filter((e) => e.dayOfWeek === day);

            return (
              <div
                key={day}
                className="relative border-l border-zinc-200 dark:border-zinc-800"
              >
                {/* Hour grid lines */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="border-b border-zinc-100 dark:border-zinc-900"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  />
                ))}

                {/* Events */}
                {dayEvents.map((event) => {
                  const color = getCourseColor(event.courseCode);
                  const style = getEventStyle(event);
                  const durationMins =
                    timeToMinutes(event.endTime) -
                    timeToMinutes(event.startTime);
                  const isShort = durationMins < 60;

                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={cn(
                        "absolute inset-x-1 rounded-md border px-2 py-1 text-left transition-all hover:shadow-md hover:z-10",
                        color.bg,
                        color.border,
                        color.text,
                        color.darkText
                      )}
                      style={style}
                    >
                      <p className="truncate text-xs font-semibold">
                        {event.courseCode}
                      </p>
                      {!isShort && (
                        <>
                          <p className="truncate text-[11px] opacity-80">
                            {event.courseName}
                          </p>
                          <p className="truncate text-[10px] opacity-60">
                            {event.room}
                          </p>
                          <p className="truncate text-[10px] opacity-60">
                            {formatTime(event.startTime)} –{" "}
                            {formatTime(event.endTime)}
                          </p>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
