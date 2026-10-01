import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TimetableProvider } from "@/components/providers/timetable-provider";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CampusPulse — Smart Timetable to Calendar Sync",
  description:
    "Upload your university timetable and automatically convert it into calendar events, reminders, and an Android home-screen schedule.",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  keywords: [
    "timetable",
    "calendar",
    "university",
    "schedule",
    "student",
    "android",
    "widget",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans min-h-screen bg-white text-zinc-950 antialiased dark:bg-zinc-950 dark:text-zinc-50`}
      >
        <ThemeProvider>
          <TimetableProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                className:
                  "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50",
              }}
            />
          </TimetableProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
