"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { SavedEvent, SavedTimetable } from "@/lib/schemas";
import {
  loadTimetable,
  saveTimetable as storageSave,
  updateEvent as storageUpdate,
  deleteEvent as storageDelete,
  addEvent as storageAdd,
} from "@/lib/storage";
import { generateId } from "@/lib/utils";

interface TimetableContextType {
  timetable: SavedTimetable | null;
  isLoaded: boolean;
  saveTimetable: (timetable: SavedTimetable) => void;
  createFromEvents: (events: SavedEvent[]) => SavedTimetable;
  updateEvent: (eventId: string, updates: Partial<SavedEvent>) => void;
  deleteEvent: (eventId: string) => void;
  addEvent: (event: Omit<SavedEvent, "id">) => void;
  clearTimetable: () => void;
}

const TimetableContext = createContext<TimetableContextType | null>(null);

export function TimetableProvider({ children }: { children: React.ReactNode }) {
  const [timetable, setTimetable] = useState<SavedTimetable | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = loadTimetable();
    if (stored) {
      setTimetable(stored);
    }
    setIsLoaded(true);
  }, []);

  const saveTimetableHandler = useCallback((tt: SavedTimetable) => {
    storageSave(tt);
    setTimetable(tt);
  }, []);

  const createFromEvents = useCallback(
    (events: SavedEvent[]): SavedTimetable => {
      const now = new Date().toISOString();
      const tt: SavedTimetable = {
        id: generateId(),
        name: "My Timetable",
        semesterStart: process.env.NEXT_PUBLIC_SEMESTER_START || "2026-09-28",
        semesterEnd: process.env.NEXT_PUBLIC_SEMESTER_END || "2026-12-15",
        timezone: process.env.NEXT_PUBLIC_TIMEZONE || "Asia/Kolkata",
        events,
        createdAt: now,
        updatedAt: now,
      };
      storageSave(tt);
      setTimetable(tt);
      return tt;
    },
    []
  );

  const updateEventHandler = useCallback((eventId: string, updates: Partial<SavedEvent>) => {
    const updated = storageUpdate(eventId, updates);
    if (updated) setTimetable({ ...updated });
  }, []);

  const deleteEventHandler = useCallback((eventId: string) => {
    const updated = storageDelete(eventId);
    if (updated) setTimetable({ ...updated });
  }, []);

  const addEventHandler = useCallback((event: Omit<SavedEvent, "id">) => {
    const newEvent: SavedEvent = {
      ...event,
      id: generateId(),
    };
    const updated = storageAdd(newEvent);
    if (updated) setTimetable({ ...updated });
  }, []);

  const clearTimetable = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("campuspulse_timetable");
    }
    setTimetable(null);
  }, []);

  return (
    <TimetableContext.Provider
      value={{
        timetable,
        isLoaded,
        saveTimetable: saveTimetableHandler,
        createFromEvents,
        updateEvent: updateEventHandler,
        deleteEvent: deleteEventHandler,
        addEvent: addEventHandler,
        clearTimetable,
      }}
    >
      {children}
    </TimetableContext.Provider>
  );
}

export function useTimetable() {
  const context = useContext(TimetableContext);
  if (!context) {
    throw new Error("useTimetable must be used within a TimetableProvider");
  }
  return context;
}
