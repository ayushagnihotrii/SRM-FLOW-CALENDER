"use client";

import Link from "next/link";
import {
  Upload,
  Calendar,
  Smartphone,
  ArrowRight,
  GraduationCap,
  Bell,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header, GoogleGIcon } from "@/components/header";
import { openGoogleSignInWindow } from "@/lib/google-auth-popup";

const steps = [
  {
    number: "01",
    title: "Sign in with Google",
    description: "One-click OAuth authorization creates your dedicated CampusPulse secondary calendar.",
    icon: Sparkles,
  },
  {
    number: "02",
    title: "Upload Timetable",
    description: "Upload an image or PDF. Gemini 2.5 Flash understands merged cells and class blocks.",
    icon: Upload,
  },
  {
    number: "03",
    title: "Review & Edit",
    description: "Verify course codes, timings, rooms, and professors on an interactive weekly dashboard.",
    icon: Calendar,
  },
  {
    number: "04",
    title: "Sync with Google Calendar",
    description: "Synchronizes recurring classes with native 20-minute popup alarms and Android widget.",
    icon: Smartphone,
  },
];

const features = [
  {
    icon: Calendar,
    title: "Google Calendar Sync",
    description: "Automatic creation of recurring classes inside a dedicated CampusPulse calendar with popup alerts.",
  },
  {
    icon: Bell,
    title: "20-Minute Reminders",
    description: "Pre-class notifications both natively in Google Calendar and through Android AlarmManager.",
  },
  {
    icon: Smartphone,
    title: "Android Glance Widget",
    description: "Glance at your next upcoming class, room number, and time right on your phone's home screen.",
  },
  {
    icon: CheckCircle2,
    title: "Offline-First Android",
    description: "Room local database caches your entire semester schedule so you never miss a lecture.",
  },
];

export default function HomePage() {
  const handleGoogleLogin = () => {
    openGoogleSignInWindow(() => {
      window.location.href = "/dashboard";
    }, "dashboard");
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="absolute inset-0 bg-radial-at-t from-blue-500/10 via-transparent to-transparent dark:from-blue-600/15" />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/50 px-4 py-1.5 text-xs sm:text-sm font-medium text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
              <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Smart Timetable to Google Calendar & Android Widget</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Turn your university timetable into a{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                smarter schedule
              </span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              Sign in with your Google account, upload your timetable image or PDF, review extracted classes, and automatically sync recurring lectures with 20-minute reminders to Google Calendar and your Android home screen.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={handleGoogleLogin}
                className="w-full sm:w-auto gap-2.5 rounded-full px-6 py-6 text-base font-semibold shadow-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                <GoogleGIcon className="h-5 w-5" />
                <span>Continue with Google</span>
              </Button>

              <Button
                variant="outline"
                size="lg"
                asChild
                className="w-full sm:w-auto rounded-full px-6 py-6 text-base font-semibold"
              >
                <Link href="/upload">
                  <Upload className="h-4 w-4" />
                  <span>Upload Timetable Directly</span>
                </Link>
              </Button>
            </div>

            {/* Quick trust metrics */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Zero Manual Calendar Entry</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Narrow Calendar.app.created Scope</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Pre-Class 20m Notifications</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Core Workflow
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              From PDF or image to Google Calendar in 60 seconds
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="relative rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-6 dark:border-zinc-800/80 dark:bg-zinc-900/50"
                >
                  <span className="text-4xl font-extrabold text-blue-600/20 dark:text-blue-400/20">
                    {step.number}
                  </span>
                  <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-200 bg-zinc-50/50 py-20 sm:py-28 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Features
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything built for a frictionless university semester
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 p-8 text-center text-white sm:p-16 shadow-xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to sync your schedule?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-blue-100 sm:text-lg">
              Sign in with your Google account now and let AI turn your timetable into native calendar events with 20-minute pre-class reminders.
            </p>
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                onClick={handleGoogleLogin}
                className="gap-2.5 rounded-full bg-white px-8 py-6 text-base font-bold text-blue-700 shadow-md hover:bg-blue-50"
              >
                <GoogleGIcon className="h-5 w-5" />
                <span>Continue with Google</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:text-left sm:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <span>CampusPulse</span>
          </div>
          <p className="text-sm text-zinc-500">
            Smart Timetable to Google Calendar & Android Widget Sync
          </p>
        </div>
      </footer>
    </div>
  );
}
