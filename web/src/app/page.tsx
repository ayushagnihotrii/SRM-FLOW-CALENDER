"use client";

import Link from "next/link";
import {
  Upload,
  Search,
  Smartphone,
  ArrowRight,
  GraduationCap,
  Calendar,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";

const steps = [
  {
    number: "01",
    title: "Upload",
    description: "Upload your timetable as an image or PDF.",
    icon: Upload,
  },
  {
    number: "02",
    title: "Review",
    description: "CampusPulse extracts your classes automatically.",
    icon: Search,
  },
  {
    number: "03",
    title: "Sync",
    description: "Export to your calendar and Android device.",
    icon: Smartphone,
  },
];

const features = [
  {
    icon: Calendar,
    title: "Calendar Export",
    description: "Download .ICS files or subscribe via WebCal",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "20-minute pre-class notifications",
  },
  {
    icon: Smartphone,
    title: "Home Widget",
    description: "See your next class right on your home screen",
  },
  {
    icon: CheckCircle2,
    title: "Offline Ready",
    description: "Works without internet after initial sync",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <GraduationCap className="h-4 w-4 text-blue-600" />
              <span>For university students</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Turn your timetable into a{" "}
              <span className="text-blue-600">smarter schedule</span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              Upload your university timetable and automatically convert it into
              calendar events, reminders, and an Android home-screen schedule.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/upload">
                  <Upload className="h-4 w-4" />
                  Upload Timetable
                </Link>
              </Button>

              <Button variant="outline" size="lg" asChild>
                <a href="#how-it-works">
                  How it Works
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </section>

      {/* How it Works */}
      <section
        id="how-it-works"
        className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50"
      >
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              How it works
            </h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Three simple steps to a smarter schedule
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="relative rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-3xl font-bold text-zinc-200 dark:text-zinc-800">
                    {step.number}
                  </span>
                  <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950/30">
                    <step.icon className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Everything you need
            </h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              One upload. Everywhere you need it.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
              >
                <div className="mb-3 inline-flex rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">
                  <feature.icon className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Button size="lg" asChild>
              <Link href="/upload">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <GraduationCap className="h-4 w-4" />
              <span>CampusPulse</span>
            </div>
            <p className="text-sm text-zinc-400">
              Built for students, by students
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
