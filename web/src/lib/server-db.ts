import fs from "fs";
import path from "path";

export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string;
  campusPulseCalendarId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoogleAccount {
  id: string;
  userId: string;
  googleUserId: string;
  email: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // timestamp in ms
  createdAt: string;
  updatedAt: string;
}

export interface GoogleCalendarEventMapping {
  id: string;
  userId: string;
  timetableEventId: string;
  googleCalendarId: string;
  googleEventId: string;
  courseCode: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseSchema {
  users: Record<string, User>;
  accounts: Record<string, GoogleAccount>;
  calendarEvents: Record<string, GoogleCalendarEventMapping>;
  lastSyncStats?: {
    lastSyncedAt: string;
    classesCount: number;
    calendarId: string;
    calendarUrl: string;
  };
}

const DB_FILE_PATH = path.join(process.cwd(), "data", "campuspulse-db.json");

function ensureDbFile(): DatabaseSchema {
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE_PATH)) {
      const initial: DatabaseSchema = {
        users: {},
        accounts: {},
        calendarEvents: {},
      };
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const data = fs.readFileSync(DB_FILE_PATH, "utf-8");
    return JSON.parse(data) as DatabaseSchema;
  } catch (err) {
    console.error("Error reading campuspulse db:", err);
    return { users: {}, accounts: {}, calendarEvents: {} };
  }
}

function writeDb(data: DatabaseSchema): void {
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing campuspulse db:", err);
  }
}

export const serverDb = {
  // Users
  getUserById(id: string): User | null {
    const db = ensureDbFile();
    return db.users[id] || null;
  },

  getUserByGoogleId(googleId: string): User | null {
    const db = ensureDbFile();
    for (const user of Object.values(db.users)) {
      if (user.googleId === googleId) return user;
    }
    return null;
  },

  getUserByEmail(email: string): User | null {
    const db = ensureDbFile();
    for (const user of Object.values(db.users)) {
      if (user.email.toLowerCase() === email.toLowerCase()) return user;
    }
    return null;
  },

  upsertUser(user: Partial<User> & { googleId: string; email: string }): User {
    const db = ensureDbFile();
    let existing = this.getUserByGoogleId(user.googleId);

    const now = new Date().toISOString();
    if (existing) {
      existing = {
        ...existing,
        ...user,
        updatedAt: now,
      };
      db.users[existing.id] = existing;
      writeDb(db);
      return existing;
    }

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      googleId: user.googleId,
      email: user.email,
      name: user.name || "Student",
      avatarUrl: user.avatarUrl || "",
      campusPulseCalendarId: user.campusPulseCalendarId,
      createdAt: now,
      updatedAt: now,
    };

    db.users[newUser.id] = newUser;
    writeDb(db);
    return newUser;
  },

  updateUserCalendarId(userId: string, calendarId: string): void {
    const db = ensureDbFile();
    if (db.users[userId]) {
      db.users[userId].campusPulseCalendarId = calendarId;
      db.users[userId].updatedAt = new Date().toISOString();
      writeDb(db);
    }
  },

  // Accounts
  getGoogleAccountByUserId(userId: string): GoogleAccount | null {
    const db = ensureDbFile();
    return db.accounts[userId] || null;
  },

  upsertGoogleAccount(account: Omit<GoogleAccount, "id" | "createdAt" | "updatedAt">): GoogleAccount {
    const db = ensureDbFile();
    const existing = db.accounts[account.userId];
    const now = new Date().toISOString();

    const updatedAccount: GoogleAccount = {
      id: existing ? existing.id : `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: account.userId,
      googleUserId: account.googleUserId,
      email: account.email,
      accessToken: account.accessToken,
      refreshToken: account.refreshToken || existing?.refreshToken,
      expiresAt: account.expiresAt,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    db.accounts[account.userId] = updatedAccount;
    writeDb(db);
    return updatedAccount;
  },

  // Calendar Event Mappings
  getEventMappings(userId: string): GoogleCalendarEventMapping[] {
    const db = ensureDbFile();
    return Object.values(db.calendarEvents).filter((e) => e.userId === userId);
  },

  saveEventMapping(mapping: Omit<GoogleCalendarEventMapping, "id" | "createdAt" | "updatedAt">): GoogleCalendarEventMapping {
    const db = ensureDbFile();
    const key = `${mapping.userId}_${mapping.timetableEventId}`;
    const existing = db.calendarEvents[key];
    const now = new Date().toISOString();

    const item: GoogleCalendarEventMapping = {
      id: existing ? existing.id : `gce_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...mapping,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    db.calendarEvents[key] = item;
    writeDb(db);
    return item;
  },

  deleteEventMapping(userId: string, timetableEventId: string): void {
    const db = ensureDbFile();
    const key = `${userId}_${timetableEventId}`;
    if (db.calendarEvents[key]) {
      delete db.calendarEvents[key];
      writeDb(db);
    }
  },

  // Sync Stats
  saveLastSyncStats(stats: {
    lastSyncedAt: string;
    classesCount: number;
    calendarId: string;
    calendarUrl: string;
  }): void {
    const db = ensureDbFile();
    db.lastSyncStats = stats;
    writeDb(db);
  },

  getLastSyncStats() {
    const db = ensureDbFile();
    return db.lastSyncStats || null;
  }
};
