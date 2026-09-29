# CampusPulse ⚡
> **Turn your university timetable into a smarter schedule.**  
> Automatic Vision-AI extraction, calendar sync, 20-minute pre-class alarms, and Android home-screen widget.

---

## 🌟 Core Value Proposition

A university student uploads a timetable image or PDF. **CampusPulse**:
1. Understands the timetable structure via Gemini 2.5 Flash vision processing.
2. Extracts structured class events (course code, name, room, timing, faculty).
3. Provides an interactive dashboard with weekly grid, tabular view, and FullCalendar views to edit, add, or toggle reminders.
4. Generates standard `.ics` calendar files with recurring rules and 20-minute pre-class `VALARM` notifications, plus a live WebCal feed.
5. Synchronizes in one tap with a native Android app featuring exact alarms (`AlarmManager`) and a Jetpack Glance home-screen widget.

---

## 🏗 Architecture & Flow

```text
┌─────────────────────────┐
│ Timetable Image / PDF   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Gemini Vision (AI / OCR)│ (Extracts grid, merges slots, extracts courses)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Zod Validation Engine   │ (Ensures clean schema, standard time formats)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Interactive Web Review  │ (Weekly Grid, Table View, FullCalendar, Edit Modal)
└──────┬────────────┬─────┘
       │            │
       ▼            ▼
┌──────────────┐  ┌────────────────────────────────────────┐
│ .ICS Export  │  │ Android App Synchronization            │
│ & WebCal     │  │ (Retrofit -> Room DB -> AlarmManager)  │
└──────────────┘  └───────────────────┬────────────────────┘
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
              ┌─────────────────────┐   ┌─────────────────────┐
              │ 20-min Notifications│   │ Glance Home Widget  │
              │ (Exact Alarms)      │   │ (Next Class Status) │
              └─────────────────────┘   └─────────────────────┘
```

---

## 🚀 Repository Structure

```text
campuspulse/
├── web/                             # Next.js 16 (React 19, TypeScript, Tailwind)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx             # Premium hero landing page
│   │   │   ├── upload/page.tsx      # Drag-and-drop timetable upload with stage animations
│   │   │   ├── dashboard/page.tsx   # Schedule dashboard (Next class card, views, export)
│   │   │   └── api/
│   │   │       ├── parse-timetable/ # Gemini 2.5 Flash Vision OCR with demo fallback
│   │   │       ├── timetable/sync/  # Sync endpoint for Android application
│   │   │       └── calendar/        # .ics generation & WebCal feed
│   │   ├── components/              # Grid view, table view, FullCalendar view, event modals
│   │   └── lib/                     # Zod schemas, iCal generator, demo datasets
│   └── package.json
│
├── android/                         # Native Android Application (Kotlin, Compose)
│   ├── app/src/main/
│   │   ├── java/com/campuspulse/
│   │   │   ├── CampusPulseApp.kt    # Notification channel setup
│   │   │   ├── MainActivity.kt      # Compose Navigation (Today, Weekly, Sync)
│   │   │   ├── database/            # Room Database (TimetableDao, TimetableEvent)
│   │   │   ├── network/             # Retrofit client for CampusPulse Web API
│   │   │   ├── notifications/       # AlarmManager 20-min scheduler & BootReceiver
│   │   │   ├── widget/              # Jetpack Glance Home-screen Widget
│   │   │   └── ui/                  # Compose UI screens (HomeScreen, TimetableScreen, SyncScreen)
│   │   ├── res/                     # Adaptive icons, theme styles, widget provider metadata
│   │   └── AndroidManifest.xml      # Exact alarms, notifications, boot completed permissions
│   └── build.gradle.kts
│
└── shared/                          # Shared TypeScript types & sample timetable datasets
```

---

## 💻 Quick Start Guide

### 1. Web Application

```bash
cd campuspulse/web
npm install
npm run dev
```

The web application runs on `http://localhost:3000` (or `http://localhost:3001` if 3000 is occupied).

#### Key Web Features:
- **Landing Page** (`/`): Sleek dark-mode interface introducing the platform.
- **Upload Page** (`/upload`): Upload any timetable image or PDF. Even without an API key configured, the built-in intelligent demo fallback automatically parses a complete multi-course schedule.
- **Dashboard** (`/dashboard`):
  - **Next Class Hero Card**: Real-time indicator of the current or next upcoming class.
  - **View Switcher**: Toggle between **Weekly Grid**, **Table View**, and **FullCalendar**.
  - **Calendar Export**: Instant 1-click download of `.ics` file or copyable WebCal URL.
  - **Android Sync Details**: Clear instructions and live API endpoint for the mobile app.

---

### 2. Android Application

1. Open `campuspulse/android` in **Android Studio**.
2. Run on an Android Emulator or connected physical device (Android 8.0+ / API 26+).
3. **Sync your timetable**:
   - In the app, navigate to the **Sync** tab.
   - For Android Emulator, the server URL defaults to `http://10.0.2.2:3001` (pointing to your host machine's Next.js dev server).
   - Tap **"Sync Timetable Now"** to pull down classes, populate the offline Room database, and schedule 20-minute pre-class alarms.
   - Or tap **"Pre-load Demo Timetable"** for immediate offline demonstration.
4. **Home-Screen Widget**:
   - Long-press your home screen -> Widgets -> **CampusPulse**.
   - Add the widget to your home screen to see your next class, room, timing, and remaining class count.

---

## 🔔 20-Minute Pre-Class Notifications

- **Deterministic Timing**: Alarms are scheduled using Android `AlarmManager.setRepeating` or exact RTC wakeups timed precisely **20 minutes before each class start time**.
- **Reboot Resilience**: A `BootReceiver` listens to `ACTION_BOOT_COMPLETED` to reschedule alarms if the user restarts their phone.
- **Granular Control**: Each class has a reminder toggle switch on both the Web dashboard and the Android app. Disabling a reminder immediately cancels that class's alarm.

---

## 🛠 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/parse-timetable` | `POST` | Upload timetable multipart file; returns extracted course JSON |
| `/api/timetable/sync` | `GET` | Android sync endpoint returning active timetable and sync token |
| `/api/calendar/download` | `POST` | Generates downloadable `.ics` iCalendar file |
| `/api/calendar/feed` | `GET / POST` | Registers or serves live subscription calendar feed |

---

## 📜 License

MIT License. Built for university students everywhere.
