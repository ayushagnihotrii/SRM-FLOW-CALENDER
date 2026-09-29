# CampusPulse ⚡
> **AI Timetable to Google Calendar & Android Home-Screen Widget**  
> Automatic Vision-AI timetable extraction, Google OAuth authorization, secondary Google Calendar synchronization with 20-minute popup reminders, and native Android Glance widget sync.

---

## 🌟 Core Product Flow

```text
Open CampusPulse
        ↓
Continue with Google
        ↓
Google OAuth 2.0 Authorization
        ↓
CampusPulse account created
        ↓
Upload timetable image / PDF
        ↓
AI Multimodal Vision extraction (Gemini 3.8 Flash)
        ↓
Zod Validation & Schedule Review
        ↓
Student verifies & edits classes if required
        ↓
Save timetable
        ↓
Sync with Google Calendar
        ↓
Create / locate "CampusPulse" secondary calendar
        ↓
Create weekly recurring class events (RRULE)
        ↓
20-minute Google Calendar popup reminders
        ↓
Android app signs in / syncs locally
        ↓
Android 20-min alarm notifications (AlarmManager)
        ↓
Android Glance home-screen widget
```

---

## 🔑 Google Cloud & OAuth Configuration

CampusPulse adheres to the principle of least privilege, using the narrowest Google Calendar scope:

```text
https://www.googleapis.com/auth/calendar.app.created
```

This scope allows CampusPulse to create and manage its own dedicated secondary calendar (`CampusPulse`) without accessing the user's private personal or work calendars.

### Environment Variables (.env / web/.env.local)

```env
# Google OAuth 2.0 Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
GOOGLE_CALENDAR_SCOPE=https://www.googleapis.com/auth/calendar.app.created

# Vision / OCR Provider (Gemini)
VISION_PROVIDER=gemini
VISION_MODEL=gemini-3.8-flash
VISION_API_KEY=your-gemini-api-key

# Semester Dates & Timezone
NEXT_PUBLIC_SEMESTER_START=2026-09-28
NEXT_PUBLIC_SEMESTER_END=2026-12-15
NEXT_PUBLIC_TIMEZONE=Asia/Kolkata

# App Settings
NEXT_PUBLIC_APP_URL=http://localhost:3001
MAX_UPLOAD_SIZE_MB=10
```

> **Note for Hackathon / Offline Demos:** If `GOOGLE_CLIENT_ID` is left empty, CampusPulse seamlessly enters a live demonstration mode where clicking **"Continue with Google"** and **"Sync with Google Calendar"** executes the complete workflow, providing the same high-fidelity UI and stage progression without crashing.

---

## 📅 Google Calendar Event Specification

Every synchronized class event in Google Calendar strictly implements the required attributes:

- **Summary**: `<Course Code> (<Course Title>)` e.g., `CSE 309 (Advanced Java Programming)`
- **Location**: Room identifier e.g., `C 509`
- **Description**:
  ```text
  Course: Advanced Java Programming
  Course Code: CSE 309
  Faculty: Ms. Gudapati Maneesha
  Room: C 509

  Created by CampusPulse
  ```
- **Recurrence**: Standard Google `RRULE:FREQ=WEEKLY;UNTIL=YYYYMMDDTHHMMSSZ` expanded across the semester duration.
- **Native 20-Minute Popup Reminders**:
  ```json
  "reminders": {
    "useDefault": false,
    "overrides": [
      {
        "method": "popup",
        "minutes": 20
      }
    ]
  }
  ```
- **Idempotency & Deterministic Event IDs**: Stable IDs derived from `[a-v0-9]` hashes guarantee that clicking **"Sync with Google Calendar"** multiple times updates modified classes and removes deleted classes without duplicate event creation.

---

## 🚀 Quick Start Guide

### 1. Web Application

```bash
cd campuspulse/web
npm install
npm run dev
```

The web application runs on **[http://localhost:3001](http://localhost:3001)**.

1. Click **"Continue with Google"** on the header or landing page.
2. Go to **`/upload`** and upload any university timetable (PNG, JPG, PDF) or tap **"Load demo timetable"**.
3. In the **Dashboard** (`/dashboard`):
   - Review your schedule across **Weekly Grid**, **Table**, or **FullCalendar** views.
   - Click **"Sync with Google Calendar"** to trigger live multi-step synchronization:
     ```text
     ✓ Connecting to Google Calendar
     ✓ Creating / Verifying calendar
     ✓ Adding classes
     ✓ Setting reminders
     Calendar synchronized
     ```
   - Click **`[ Open Google Calendar ]`** to view your schedule live.

---

### 2. Android Application

1. Open `campuspulse/android` in **Android Studio**.
2. Run on an Android Emulator or device.
3. In the **Sync** tab, tap **"Sync Timetable Now"** to pull down the schedule from `http://10.0.2.2:3001` into the local Room database and schedule Android `AlarmManager` 20-minute alerts.
4. Long-press on your phone's home screen to place the **CampusPulse** Glance widget.

---

## 🛠 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/google/url` | `GET` | Generates OAuth 2.0 authorization URL |
| `/api/auth/google/callback`| `GET` | OAuth callback exchanging code for tokens & creating calendar |
| `/api/auth/me` | `GET` | Returns authenticated user profile and Google connection status |
| `/api/calendar/google-sync`| `POST`| Primary sync endpoint creating recurring classes with 20-min reminders |
| `/api/calendar/google-status`| `GET` | Returns status and timestamps of last Google Calendar synchronization |
| `/api/parse-timetable` | `POST`| Multimodal vision timetable extraction endpoint |
| `/api/timetable/sync` | `GET` | Mobile sync endpoint for Android client |
| `/api/calendar/download` | `POST`| Secondary export generating downloadable `.ics` calendar files |

---

## 📜 License

MIT License. Designed and built for university students.
