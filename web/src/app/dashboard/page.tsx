"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Link2,
  Smartphone,
  Clock,
  MapPin,
  Calendar,
  Table2,
  Grid3X3,
  LayoutGrid,
  Plus,
  Upload,
  BookOpen,
  Copy,
  Check,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { TimetableGrid } from "@/components/timetable-grid";
import { TableView } from "@/components/table-view";
import { CalendarView } from "@/components/calendar-view";
import { EventEditor } from "@/components/event-editor";
import { useTimetable } from "@/components/providers/timetable-provider";
import { SavedEvent } from "@/lib/schemas";
import {
  formatTime,
  getCurrentDay,
  timeToMinutes,
  cn,
  getCourseColor,
} from "@/lib/utils";
import { getWebCalToken } from "@/lib/storage";
import { toast } from "sonner";

type ViewMode = "grid" | "table" | "calendar";

export default function DashboardPage() {
  const router = useRouter();
  const { timetable, isLoaded, updateEvent, deleteEvent, addEvent } =
    useTimetable();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [editingEvent, setEditingEvent] = useState<SavedEvent | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"edit" | "add">("edit");
  const [copied, setCopied] = useState(false);
  const [webcalUrl, setWebcalUrl] = useState("");

  // Redirect if no timetable
  useEffect(() => {
    if (isLoaded && !timetable) {
      router.push("/upload");
    }
  }, [isLoaded, timetable, router]);

  // Calculate next class and today's classes
  const { nextClass, todaysClasses, isHappening } = useMemo(() => {
    if (!timetable) return { nextClass: null, todaysClasses: [], isHappening: false };

    const now = new Date();
    const currentDay = getCurrentDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const todaysClasses = timetable.events
      .filter((e) => e.dayOfWeek === currentDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Find the next class (could be today or another day)
    let nextClass: SavedEvent | null = null;
    let isHappening = false;

    // Check if any class is happening right now
    const happeningNow = todaysClasses.find(
      (e) =>
        timeToMinutes(e.startTime) <= currentMinutes &&
        timeToMinutes(e.endTime) > currentMinutes
    );

    if (happeningNow) {
      nextClass = happeningNow;
      isHappening = true;
    } else {
      // Find next upcoming class today
      const upcomingToday = todaysClasses.find(
        (e) => timeToMinutes(e.startTime) > currentMinutes
      );

      if (upcomingToday) {
        nextClass = upcomingToday;
      } else {
        // Find next class in upcoming days
        const dayNames = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        const currentDayIndex = dayNames.indexOf(currentDay);

        for (let i = 1; i <= 7; i++) {
          const checkDay = dayNames[(currentDayIndex + i) % 7];
          const dayEvents = timetable.events
            .filter((e) => e.dayOfWeek === checkDay)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          if (dayEvents.length > 0) {
            nextClass = dayEvents[0];
            break;
          }
        }
      }
    }

    return { nextClass, todaysClasses, isHappening };
  }, [timetable]);

  // Time until next class
  const timeUntil = useMemo(() => {
    if (!nextClass || isHappening) return null;

    const now = new Date();
    const currentDay = getCurrentDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const classMinutes = timeToMinutes(nextClass.startTime);

    if (nextClass.dayOfWeek === currentDay && classMinutes > currentMinutes) {
      const diff = classMinutes - currentMinutes;
      if (diff < 60) return `In ${diff} mins`;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      return `In ${hours}h ${mins}m`;
    }

    return `${nextClass.dayOfWeek}`;
  }, [nextClass, isHappening]);

  const handleDownloadICS = async () => {
    if (!timetable) return;

    try {
      const response = await fetch("/api/calendar/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: timetable.events,
          semesterStart: timetable.semesterStart,
          semesterEnd: timetable.semesterEnd,
          timezone: timetable.timezone,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate calendar");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "campuspulse-timetable.ics";
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Calendar file downloaded!");
    } catch {
      toast.error("Failed to download calendar file");
    }
  };

  const handleWebCal = async () => {
    if (!timetable) return;

    try {
      const token = getWebCalToken();
      const response = await fetch("/api/calendar/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          events: timetable.events,
          semesterStart: timetable.semesterStart,
          semesterEnd: timetable.semesterEnd,
          timezone: timetable.timezone,
        }),
      });

      if (!response.ok) throw new Error("Failed to register feed");

      const data = await response.json();
      setWebcalUrl(data.webcalUrl);
      toast.success("WebCal feed ready!");
    } catch {
      toast.error("Failed to set up WebCal feed");
    }
  };

  const copyWebcalUrl = () => {
    navigator.clipboard.writeText(webcalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("WebCal URL copied!");
  };

  const handleEventClick = (event: SavedEvent) => {
    setEditingEvent(event);
    setEditorMode("edit");
    setEditorOpen(true);
  };

  const handleAddClick = () => {
    setEditingEvent(null);
    setEditorMode("add");
    setEditorOpen(true);
  };

  if (!isLoaded || !timetable) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
            <p className="mt-4 text-sm text-zinc-500">Loading timetable...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Top Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Next Class Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              <Clock className="h-3.5 w-3.5" />
              {isHappening ? "Happening Now" : "Next Class"}
            </div>

            {nextClass ? (
              <div className="mt-3">
                <p className="text-lg font-bold">{nextClass.courseCode}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {nextClass.courseName}
                </p>
                <div className="mt-3 flex items-center gap-4 text-sm text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(nextClass.startTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {nextClass.room}
                  </span>
                </div>
                {isHappening ? (
                  <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Ends at {formatTime(nextClass.endTime)}
                  </p>
                ) : (
                  timeUntil && (
                    <p className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                      {timeUntil}
                    </p>
                  )
                )}
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-sm text-zinc-500">
                  No more classes today. You&apos;re free!
                </p>
              </div>
            )}
          </div>

          {/* Today's Classes */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              <BookOpen className="h-3.5 w-3.5" />
              Today&apos;s Classes
            </div>

            {todaysClasses.length > 0 ? (
              <div className="mt-3 space-y-2">
                {todaysClasses.map((event) => {
                  const color = getCourseColor(event.courseCode);
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div
                        className={cn("h-2 w-2 rounded-full shrink-0", color.dot)}
                      />
                      <span className="font-medium tabular-nums text-zinc-500 w-16">
                        {formatTime(event.startTime)}
                      </span>
                      <span className="truncate">{event.courseCode}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">
                No classes scheduled for today
              </p>
            )}
          </div>

          {/* Actions Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 sm:col-span-2 lg:col-span-1 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              <Calendar className="h-3.5 w-3.5" />
              Actions
            </div>

            <div className="mt-3 space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleDownloadICS}
              >
                <Download className="h-4 w-4" />
                Download .ICS
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleWebCal}
              >
                <Link2 className="h-4 w-4" />
                Subscribe via WebCal
              </Button>

              {webcalUrl && (
                <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                  <code className="flex-1 truncate text-xs">
                    {webcalUrl}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={copyWebcalUrl}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              )}

              <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-sm">
                  <Smartphone className="h-4 w-4 text-zinc-400" />
                  <span className="font-medium">Android Sync</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Schedule ready to sync
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {timetable.events.length} classes •{" "}
                  {timetable.events.filter((e) => e.reminderEnabled).length}{" "}
                  reminders active
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher */}
        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Weekly Schedule</h2>
          <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950">
            {[
              { key: "grid" as ViewMode, icon: Grid3X3, label: "Grid" },
              { key: "table" as ViewMode, icon: Table2, label: "Table" },
              { key: "calendar" as ViewMode, icon: LayoutGrid, label: "Calendar" },
            ].map(({ key, icon: Icon, label }) => (
              <Button
                key={key}
                variant={viewMode === key ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode(key)}
                className="gap-1.5"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </Button>
            ))}

            <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-800" />

            <Button variant="ghost" size="sm" onClick={handleAddClick}>
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </div>
        </div>

        {/* Timetable Views */}
        <div className="mt-4">
          {viewMode === "grid" && (
            <TimetableGrid
              events={timetable.events}
              onEventClick={handleEventClick}
            />
          )}
          {viewMode === "table" && (
            <TableView
              events={timetable.events}
              onEventClick={handleEventClick}
              onToggleReminder={(id, enabled) =>
                updateEvent(id, { reminderEnabled: enabled })
              }
              onAddClick={handleAddClick}
            />
          )}
          {viewMode === "calendar" && (
            <CalendarView
              events={timetable.events}
              onEventClick={handleEventClick}
            />
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          <span>
            {timetable.events.length} classes total
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span>
            {new Set(timetable.events.map((e) => e.courseCode)).size} unique
            courses
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span className="flex items-center gap-1">
            <Bell className="h-3.5 w-3.5" />
            {timetable.events.filter((e) => e.reminderEnabled).length} reminders
          </span>
        </div>
      </main>

      {/* Event Editor */}
      <EventEditor
        event={editingEvent}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={updateEvent}
        onDelete={deleteEvent}
        mode={editorMode}
        onAdd={addEvent}
      />
    </div>
  );
}
