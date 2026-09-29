"use client";

import { SavedEvent, DAYS_OF_WEEK } from "@/lib/schemas";
import { formatTime, getCourseColor, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Pencil, Plus } from "lucide-react";

interface TableViewProps {
  events: SavedEvent[];
  onEventClick: (event: SavedEvent) => void;
  onToggleReminder: (eventId: string, enabled: boolean) => void;
  onAddClick: () => void;
}

const DAY_ORDER: Record<string, number> = {};
DAYS_OF_WEEK.forEach((day, i) => {
  DAY_ORDER[day] = i;
});

export function TableView({
  events,
  onEventClick,
  onToggleReminder,
  onAddClick,
}: TableViewProps) {
  const sorted = [...events].sort((a, b) => {
    const dayDiff = (DAY_ORDER[a.dayOfWeek] ?? 0) - (DAY_ORDER[b.dayOfWeek] ?? 0);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-4 py-3 text-left font-medium text-zinc-500">
                Course
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">
                Faculty
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">
                Room
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">
                Day
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">
                Start
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">
                End
              </th>
              <th className="px-4 py-3 text-center font-medium text-zinc-500">
                Alert
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((event) => {
              const color = getCourseColor(event.courseCode);
              return (
                <tr
                  key={event.id}
                  className="border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn("h-2 w-2 rounded-full", color.dot)}
                      />
                      <div>
                        <p className="font-medium">{event.courseCode}</p>
                        <p className="text-xs text-zinc-500">
                          {event.courseName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {event.faculty}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {event.room}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {event.dayOfWeek.slice(0, 3)}
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400">
                    {formatTime(event.startTime)}
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400">
                    {formatTime(event.endTime)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Switch
                      checked={event.reminderEnabled}
                      onCheckedChange={(checked) =>
                        onToggleReminder(event.id, checked)
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEventClick(event)}
                      aria-label={`Edit ${event.courseCode}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <Button variant="ghost" size="sm" onClick={onAddClick}>
          <Plus className="h-4 w-4" />
          Add Class
        </Button>
      </div>
    </div>
  );
}
