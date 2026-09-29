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
  BookOpen,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header, GoogleGIcon } from "@/components/header";
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
import { openGoogleSignInWindow } from "@/lib/google-auth-popup";
import { toast } from "sonner";

type ViewMode = "grid" | "table" | "calendar";

interface SyncStep {
  label: string;
  status: "pending" | "running" | "done" | "error";
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  hasGoogleAccount: boolean;
  campusPulseCalendarId?: string;
}

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

  // User and Google Calendar Sync State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [calendarUrl, setCalendarUrl] = useState("https://calendar.google.com/calendar/u/0/r");

  // Step-by-step progress for Google Calendar Sync
  const [syncSteps, setSyncSteps] = useState<SyncStep[]>([
    { label: "Connecting to Google Calendar", status: "pending" },
    { label: "Creating / Verifying CampusPulse calendar", status: "pending" },
    { label: "Adding recurring class events", status: "pending" },
    { label: "Setting 20-minute popup reminders", status: "pending" },
  ]);

  // Load User & Check Sync Status
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});

    fetch("/api/calendar/google-status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.hasSynced && data.stats) {
          setSyncDone(true);
          setLastSyncTime(
            new Date(data.stats.lastSyncedAt).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          );
          if (data.stats.calendarUrl) {
            setCalendarUrl(data.stats.calendarUrl);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Redirect if no timetable
  useEffect(() => {
    if (isLoaded && !timetable) {
      router.push("/upload");
    }
  }, [isLoaded, timetable, router]);

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = user?.name ? user.name.split(" ")[0] : "Student";
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  }, [user]);

  // Calculate next class and today's classes
  const { nextClass, todaysClasses, isHappening } = useMemo(() => {
    if (!timetable)
      return { nextClass: null, todaysClasses: [], isHappening: false };

    const now = new Date();
    const currentDay = getCurrentDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const todaysClasses = timetable.events
      .filter((e) => e.dayOfWeek === currentDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    let nextClass: SavedEvent | null = null;
    let isHappening = false;

    const happeningNow = todaysClasses.find(
      (e) =>
        timeToMinutes(e.startTime) <= currentMinutes &&
        timeToMinutes(e.endTime) > currentMinutes
    );

    if (happeningNow) {
      nextClass = happeningNow;
      isHappening = true;
    } else {
      const upcomingToday = todaysClasses.find(
        (e) => timeToMinutes(e.startTime) > currentMinutes
      );

      if (upcomingToday) {
        nextClass = upcomingToday;
      } else {
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
          const nextDayIndex = (currentDayIndex + i) % 7;
          const nextDayName = dayNames[nextDayIndex];
          const nextDayClasses = timetable.events
            .filter((e) => e.dayOfWeek === nextDayName)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          if (nextDayClasses.length > 0) {
            nextClass = nextDayClasses[0];
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

  // PRIMARY ACTION: Sync with Google Calendar
  const handleGoogleCalendarSync = async () => {
    if (!timetable || timetable.events.length === 0) return;

    setIsSyncing(true);
    setSyncError(null);

    // Initial state
    setSyncSteps([
      { label: "Connecting to Google Calendar", status: "running" },
      { label: "Creating / Verifying CampusPulse calendar", status: "pending" },
      { label: "Adding recurring class events", status: "pending" },
      { label: "Setting 20-minute popup reminders", status: "pending" },
    ]);

    try {
      // Step 1: Connecting
      await new Promise((r) => setTimeout(r, 600));
      setSyncSteps((prev) => [
        { ...prev[0], status: "done" },
        { ...prev[1], status: "running" },
        prev[2],
        prev[3],
      ]);

      // Step 2: Creating/Verifying calendar
      await new Promise((r) => setTimeout(r, 700));
      setSyncSteps((prev) => [
        prev[0],
        { ...prev[1], status: "done" },
        { ...prev[2], status: "running" },
        prev[3],
      ]);

      // Call API
      const res = await fetch("/api/calendar/google-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: timetable.events,
          semesterStart: timetable.semesterStart,
          semesterEnd: timetable.semesterEnd,
          timezone: timetable.timezone,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Failed to synchronize with Google Calendar."
        );
      }

      const result = await res.json();

      // Step 3: Classes Added
      setSyncSteps((prev) => [
        prev[0],
        prev[1],
        { ...prev[2], status: "done" },
        { ...prev[3], status: "running" },
      ]);

      // Step 4: Reminders Set
      await new Promise((r) => setTimeout(r, 500));
      setSyncSteps((prev) => [
        prev[0],
        prev[1],
        prev[2],
        { ...prev[3], status: "done" },
      ]);

      setSyncDone(true);
      if (result.calendarUrl) setCalendarUrl(result.calendarUrl);
      setLastSyncTime(
        new Date().toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );

      toast.success("Timetable successfully synchronized to Google Calendar!");
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to connect to Google Calendar";
      setSyncError(msg);
      toast.error(msg);
    } finally {
      setIsSyncing(false);
    }
  };

  // Secondary Action: Download .ICS
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

  // Secondary Action: WebCal Feed
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
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6">
        {/* User Greeting & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {greeting}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Semester Schedule: {timetable.semesterStart} to {timetable.semesterEnd} ({timetable.timezone})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddClick}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Add Class</span>
            </Button>
          </div>
        </div>

        {/* PRIMARY CALLOUT: Google Calendar Synchronizer Banner */}
        <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 p-6 shadow-sm dark:border-blue-900/60 dark:from-blue-950/30 dark:via-zinc-900 dark:to-indigo-950/20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  <GoogleGIcon className="h-3.5 w-3.5" />
                  Primary Integration
                </span>
                {syncDone && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    Synchronized
                  </span>
                )}
              </div>

              <h2 className="text-xl font-bold tracking-tight">
                {syncDone ? "Your timetable is in Google Calendar" : "Your timetable is ready to synchronize"}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xl">
                Automatically creates recurring weekly class events in your secondary <strong className="font-semibold text-zinc-900 dark:text-zinc-200">CampusPulse</strong> calendar with native 20-minute popup reminders.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={handleGoogleCalendarSync}
                disabled={isSyncing}
                className="gap-2.5 rounded-xl px-6 font-semibold shadow-md bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Syncing {timetable.events.length} classes...</span>
                  </>
                ) : (
                  <>
                    <GoogleGIcon className="h-4 w-4" />
                    <span>{syncDone ? "Re-sync with Google Calendar" : "Sync with Google Calendar"}</span>
                  </>
                )}
              </Button>

              {syncDone && (
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="gap-2 rounded-xl border-zinc-300 dark:border-zinc-700 font-semibold"
                >
                  <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span>Open Google Calendar</span>
                    <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Sync Progression / Step-by-Step Live Feedback */}
          {(isSyncing || syncDone) && (
            <div className="mt-6 border-t border-zinc-200/80 pt-5 dark:border-zinc-800/80">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {syncSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 text-xs sm:text-sm font-medium"
                  >
                    {step.status === "done" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    )}
                    {step.status === "running" && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600 shrink-0" />
                    )}
                    {step.status === "pending" && (
                      <div className="h-3.5 w-3.5 rounded-full border border-zinc-300 dark:border-zinc-700 shrink-0" />
                    )}
                    <span
                      className={cn(
                        step.status === "done" && "text-emerald-700 dark:text-emerald-400 font-semibold",
                        step.status === "running" && "text-blue-700 dark:text-blue-400 font-semibold",
                        step.status === "pending" && "text-zinc-500"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {lastSyncTime && (
                <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>✓ {timetable.events.length} classes synchronized with 20-min reminders</span>
                  </div>
                  <div>Last synchronized: {lastSyncTime}</div>
                </div>
              )}
            </div>
          )}

          {/* Sync Error Notice */}
          {syncError && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-red-50 p-4 border border-red-200 text-xs text-red-700 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{syncError}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  openGoogleSignInWindow(() => {
                    handleGoogleCalendarSync();
                  }, "dashboard")
                }
                className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-100"
              >
                Reconnect Google Calendar
              </Button>
            </div>
          )}
        </div>

        {/* Top Schedule Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Next Class Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                <Clock className="h-3.5 w-3.5" />
                {isHappening ? "Happening Now" : "NEXT CLASS"}
              </div>
              {timeUntil && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                  {timeUntil}
                </span>
              )}
            </div>

            {nextClass ? (
              <div className="mt-3">
                <p className="text-xl font-bold tracking-tight">{nextClass.courseCode}</p>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {nextClass.courseName}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300">
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    {formatTime(nextClass.startTime)} – {formatTime(nextClass.endTime)}
                  </span>
                  <span className="flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 font-medium dark:bg-zinc-800">
                    <MapPin className="h-3.5 w-3.5 text-blue-500" />
                    Room: {nextClass.room}
                  </span>
                </div>
                {nextClass.faculty && (
                  <p className="mt-2 text-xs text-zinc-500">Faculty: {nextClass.faculty}</p>
                )}
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-sm text-zinc-500">
                  No more classes today. You&apos;re free! 🎉
                </p>
              </div>
            )}
          </div>

          {/* Today's Classes */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <span className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5" />
                Today&apos;s Schedule
              </span>
              <span>{todaysClasses.length} Classes</span>
            </div>

            {todaysClasses.length > 0 ? (
              <div className="mt-3 space-y-2">
                {todaysClasses.map((event) => {
                  const color = getCourseColor(event.courseCode);
                  return (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="flex cursor-pointer items-center justify-between gap-2 rounded-lg p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div
                          className={cn("h-2 w-2 rounded-full shrink-0", color.dot)}
                        />
                        <span className="font-semibold text-xs tabular-nums text-zinc-500 w-12">
                          {formatTime(event.startTime)}
                        </span>
                        <span className="text-sm font-medium truncate">{event.courseCode}</span>
                      </div>
                      <span className="text-xs text-zinc-400 shrink-0">{event.room}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">
                No classes scheduled for today.
              </p>
            )}
          </div>

          {/* Alternative Exports & Android Sync */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <Smartphone className="h-3.5 w-3.5" />
              Android & Utility Exports
            </div>

            <div className="mt-3 space-y-2.5">
              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span>Android App Sync Endpoint</span>
                  <span className="text-blue-600 font-bold">Port 3001</span>
                </div>
                <code className="mt-1 block text-[11px] text-zinc-500 truncate">
                  http://10.0.2.2:3001/api/timetable/sync
                </code>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={handleDownloadICS}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .ICS</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={handleWebCal}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  <span>WebCal Feed</span>
                </Button>
              </div>

              {webcalUrl && (
                <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 dark:border-zinc-800 dark:bg-zinc-950">
                  <code className="flex-1 truncate text-[10px]">{webcalUrl}</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyWebcalUrl}>
                    {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Controls & Schedule View */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div>
              <h3 className="text-lg font-bold">Weekly Schedule View</h3>
              <p className="text-xs text-zinc-500">
                Click any class cell to edit course details, room number, or toggle 20-min reminders
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-950">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                className="gap-1.5 h-8 text-xs font-semibold"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-3.5 w-3.5" />
                <span>Grid</span>
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                className="gap-1.5 h-8 text-xs font-semibold"
                onClick={() => setViewMode("table")}
              >
                <Table2 className="h-3.5 w-3.5" />
                <span>Table</span>
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                className="gap-1.5 h-8 text-xs font-semibold"
                onClick={() => setViewMode("calendar")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Calendar</span>
              </Button>
            </div>
          </div>

          {/* Views */}
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
      </main>

      {/* Event Editor Modal */}
      <EventEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        event={editingEvent}
        mode={editorMode}
        onSave={(id, updates) => {
          updateEvent(id, updates);
          toast.success("Class updated!");
        }}
        onAdd={(data) => {
          addEvent(data);
          toast.success("Class added!");
        }}
        onDelete={(id) => {
          deleteEvent(id);
          toast.success("Class removed!");
        }}
      />
    </div>
  );
}
