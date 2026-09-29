"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { useTimetable } from "@/components/providers/timetable-provider";
import { SavedEvent, parsedTimetableSchema } from "@/lib/schemas";
import { generateId, cn } from "@/lib/utils";
import { toast } from "sonner";

const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

type ProcessingStage =
  | "idle"
  | "reading"
  | "detecting"
  | "extracting"
  | "validating"
  | "done"
  | "error";

const STAGES: { key: ProcessingStage; label: string }[] = [
  { key: "reading", label: "Reading timetable" },
  { key: "detecting", label: "Detecting class blocks" },
  { key: "extracting", label: "Extracting course information" },
  { key: "validating", label: "Validating schedule" },
];

export default function UploadPage() {
  const router = useRouter();
  const { createFromEvents } = useTimetable();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [stage, setStage] = useState<ProcessingStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [extractedCount, setExtractedCount] = useState(0);

  const validateFile = (f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return "Unsupported file type. Please upload a PNG, JPG, JPEG, or PDF.";
    }
    if (f.size > MAX_SIZE_BYTES) {
      return `File is too large. Maximum size is ${MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const handleFile = (f: File) => {
    const err = validateFile(f);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setFile(f);
    setStage("idle");
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = async () => {
    if (!file) return;

    setStage("reading");
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Simulate stage progression while waiting for API
      const stageTimer = setTimeout(() => setStage("detecting"), 1500);
      const stageTimer2 = setTimeout(() => setStage("extracting"), 3000);

      const response = await fetch("/api/parse-timetable", {
        method: "POST",
        body: formData,
      });

      clearTimeout(stageTimer);
      clearTimeout(stageTimer2);

      setStage("validating");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Something went wrong while processing the timetable."
        );
      }

      const data = await response.json();

      // Validate with Zod
      const parsed = parsedTimetableSchema.safeParse(data);
      if (!parsed.success) {
        throw new Error(
          `Validation error: ${parsed.error.issues.map((e: { message: string }) => e.message).join(", ")}`
        );
      }

      // Convert to saved events
      const savedEvents: SavedEvent[] = parsed.data.events.map((event) => ({
        ...event,
        id: generateId(),
        reminderEnabled: true,
      }));

      setExtractedCount(savedEvents.length);
      setStage("done");

      // Save and navigate after brief delay
      setTimeout(() => {
        createFromEvents(savedEvents);
        toast.success(`${savedEvents.length} classes extracted successfully!`);
        router.push("/dashboard");
      }, 1000);
    } catch (err) {
      setStage("error");
      const message =
        err instanceof Error ? err.message : "Failed to process timetable";
      setError(message);
      toast.error(message);
    }
  };

  const loadDemo = () => {
    import("@/lib/demo-data").then(({ createDemoTimetable }) => {
      const demo = createDemoTimetable();
      createFromEvents(demo.events);
      toast.success("Demo timetable loaded!");
      router.push("/dashboard");
    });
  };

  const isProcessing = !["idle", "done", "error"].includes(stage);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Upload your timetable
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Upload an image or PDF of your university timetable
          </p>
        </div>

        <div className="mt-10">
          {/* Upload Zone */}
          {stage === "idle" && (
            <>
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => !file && fileInputRef.current?.click()}
                className={cn(
                  "cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors",
                  isDragging
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                    : file
                      ? "border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
                      : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
                )}
              >
                {file ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {file.type.startsWith("image/") ? (
                        <ImageIcon className="h-8 w-8 text-blue-600" />
                      ) : (
                        <FileText className="h-8 w-8 text-red-500" />
                      )}
                      <div className="text-left">
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-zinc-500">
                          {file.type.split("/")[1].toUpperCase()} •{" "}
                          {formatSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setError(null);
                      }}
                      aria-label="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-10 w-10 text-zinc-400" />
                    <p className="mt-4 text-zinc-700 dark:text-zinc-300">
                      Drag & drop your timetable here
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">or</p>
                    <Button variant="outline" className="mt-3" type="button">
                      Choose File
                    </Button>
                    <p className="mt-4 text-xs text-zinc-400">
                      Supported formats: PNG, JPG, JPEG, PDF
                    </p>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />

              {error && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {file && (
                <div className="mt-6 flex justify-center">
                  <Button onClick={processFile} size="lg">
                    <Sparkles className="h-4 w-4" />
                    Process Timetable
                  </Button>
                </div>
              )}

              <div className="mt-8 text-center">
                <p className="text-sm text-zinc-500">
                  Want to try it out first?
                </p>
                <Button
                  variant="link"
                  className="mt-1 text-blue-600"
                  onClick={loadDemo}
                >
                  Load demo timetable
                </Button>
              </div>
            </>
          )}

          {/* Processing State */}
          {(isProcessing || stage === "done") && (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="text-center">
                {stage === "done" ? (
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
                ) : (
                  <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600" />
                )}
                <h2 className="mt-4 text-lg font-semibold">
                  {stage === "done"
                    ? "Timetable detected"
                    : "Analyzing your timetable"}
                </h2>
                {stage === "done" && (
                  <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                    {extractedCount} classes found
                  </p>
                )}
              </div>

              <div className="mt-8 space-y-3">
                {STAGES.map((s) => {
                  const stageIndex = STAGES.findIndex(
                    (st) => st.key === stage
                  );
                  const thisIndex = STAGES.findIndex(
                    (st) => st.key === s.key
                  );
                  const isComplete =
                    stage === "done" || thisIndex < stageIndex;
                  const isCurrent = s.key === stage;

                  return (
                    <div key={s.key} className="flex items-center gap-3">
                      {isComplete ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : isCurrent ? (
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-zinc-200 dark:border-zinc-700" />
                      )}
                      <span
                        className={cn(
                          "text-sm",
                          isComplete
                            ? "text-zinc-900 dark:text-zinc-100"
                            : isCurrent
                              ? "font-medium text-zinc-900 dark:text-zinc-100"
                              : "text-zinc-400 dark:text-zinc-600"
                        )}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error State */}
          {stage === "error" && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
              <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
              <h3 className="mt-3 font-semibold text-red-700 dark:text-red-400">
                Unable to read timetable
              </h3>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {error ||
                  "The timetable could not be understood. Please upload a clearer image or PDF."}
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStage("idle");
                    setFile(null);
                    setError(null);
                  }}
                >
                  Try Again
                </Button>
                <Button variant="secondary" onClick={loadDemo}>
                  Use Demo Data
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
