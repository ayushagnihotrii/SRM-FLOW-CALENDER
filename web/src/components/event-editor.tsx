"use client";

import { useState, useEffect } from "react";
import { SavedEvent, DAYS_OF_WEEK } from "@/lib/schemas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";

interface EventEditorProps {
  event: SavedEvent | null;
  open: boolean;
  onClose: () => void;
  onSave: (eventId: string, updates: Partial<SavedEvent>) => void;
  onDelete: (eventId: string) => void;
  mode?: "edit" | "add";
  onAdd?: (event: Omit<SavedEvent, "id">) => void;
}

const EMPTY_EVENT: Omit<SavedEvent, "id"> = {
  courseCode: "",
  courseName: "",
  faculty: "",
  room: "",
  dayOfWeek: "Monday",
  startTime: "09:00",
  endTime: "10:00",
  reminderEnabled: true,
};

export function EventEditor({
  event,
  open,
  onClose,
  onSave,
  onDelete,
  mode = "edit",
  onAdd,
}: EventEditorProps) {
  const [formData, setFormData] = useState<Omit<SavedEvent, "id">>(EMPTY_EVENT);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (event && mode === "edit") {
      setFormData({
        courseCode: event.courseCode,
        courseName: event.courseName,
        faculty: event.faculty,
        room: event.room,
        dayOfWeek: event.dayOfWeek,
        startTime: event.startTime,
        endTime: event.endTime,
        reminderEnabled: event.reminderEnabled,
      });
    } else if (mode === "add") {
      setFormData(EMPTY_EVENT);
    }
    setErrors({});
  }, [event, mode, open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.courseCode.trim()) newErrors.courseCode = "Required";
    if (!formData.courseName.trim()) newErrors.courseName = "Required";
    if (!formData.faculty.trim()) newErrors.faculty = "Required";
    if (!formData.room.trim()) newErrors.room = "Required";
    if (!formData.startTime) newErrors.startTime = "Required";
    if (!formData.endTime) newErrors.endTime = "Required";

    if (formData.startTime && formData.endTime) {
      const [sh, sm] = formData.startTime.split(":").map(Number);
      const [eh, em] = formData.endTime.split(":").map(Number);
      if (sh * 60 + sm >= eh * 60 + em) {
        newErrors.endTime = "Must be after start time";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    if (mode === "add" && onAdd) {
      onAdd(formData);
    } else if (event) {
      onSave(event.id, formData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (event && mode === "edit") {
      onDelete(event.id);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Class" : "Edit Class"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Add a new class to your timetable"
              : "Edit class details"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Course Code */}
          <div className="space-y-1.5">
            <Label htmlFor="courseCode">Course Code</Label>
            <Input
              id="courseCode"
              placeholder="CSE 309"
              value={formData.courseCode}
              onChange={(e) =>
                setFormData({ ...formData, courseCode: e.target.value })
              }
            />
            {errors.courseCode && (
              <p className="text-xs text-red-500">{errors.courseCode}</p>
            )}
          </div>

          {/* Course Name */}
          <div className="space-y-1.5">
            <Label htmlFor="courseName">Course Name</Label>
            <Input
              id="courseName"
              placeholder="Advanced Java Programming"
              value={formData.courseName}
              onChange={(e) =>
                setFormData({ ...formData, courseName: e.target.value })
              }
            />
            {errors.courseName && (
              <p className="text-xs text-red-500">{errors.courseName}</p>
            )}
          </div>

          {/* Faculty */}
          <div className="space-y-1.5">
            <Label htmlFor="faculty">Faculty</Label>
            <Input
              id="faculty"
              placeholder="Ms. Gudapati Maneesha"
              value={formData.faculty}
              onChange={(e) =>
                setFormData({ ...formData, faculty: e.target.value })
              }
            />
            {errors.faculty && (
              <p className="text-xs text-red-500">{errors.faculty}</p>
            )}
          </div>

          {/* Room */}
          <div className="space-y-1.5">
            <Label htmlFor="room">Room</Label>
            <Input
              id="room"
              placeholder="C 509"
              value={formData.room}
              onChange={(e) =>
                setFormData({ ...formData, room: e.target.value })
              }
            />
            {errors.room && (
              <p className="text-xs text-red-500">{errors.room}</p>
            )}
          </div>

          {/* Day */}
          <div className="space-y-1.5">
            <Label>Day</Label>
            <Select
              value={formData.dayOfWeek}
              onValueChange={(val) =>
                setFormData({
                  ...formData,
                  dayOfWeek: val as (typeof DAYS_OF_WEEK)[number],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
              />
              {errors.startTime && (
                <p className="text-xs text-red-500">{errors.startTime}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
              />
              {errors.endTime && (
                <p className="text-xs text-red-500">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* Reminder Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <div>
              <Label htmlFor="reminder" className="font-medium">
                Enable Reminder
              </Label>
              <p className="text-xs text-zinc-500">
                20-minute pre-class notification
              </p>
            </div>
            <Switch
              id="reminder"
              checked={formData.reminderEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, reminderEnabled: checked })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <div className="flex w-full justify-between">
            {mode === "edit" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {mode === "add" ? "Add Class" : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
