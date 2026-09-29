"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GoogleGIcon } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Settings,
  CheckCircle2,
  Loader2,
  PlusCircle,
} from "lucide-react";

function GoogleSelectContent() {
  const searchParams = useSearchParams();
  const isPopup = searchParams.get("popup") === "true";
  const state = searchParams.get("state") || "dashboard";

  const [loading, setLoading] = useState(true);
  const [isRedirectingToGoogle, setIsRedirectingToGoogle] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState(false);

  // Manual / Account Chooser state
  const [selectedEmail, setSelectedEmail] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Cloud Config state
  const [showConfig, setShowConfig] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);
  const [configError, setConfigError] = useState("");

  const sampleAccounts = [
    {
      name: "Saumya",
      email: "saumya@gmail.com",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Saumya&backgroundColor=2563eb",
    },
    {
      name: "Student Account",
      email: "student@university.edu",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Student&backgroundColor=10b981",
    },
  ];

  useEffect(() => {
    // Check if Google OAuth is configured on server
    fetch("/api/auth/google/url?popup=" + isPopup + "&state=" + state)
      .then((res) => res.json())
      .then((data) => {
        setGoogleConfigured(data.isGoogleConfigured);
        if (data.isGoogleConfigured && data.url && !data.url.includes("/auth/google-select")) {
          // Real Google credentials are set; redirect straight to Google's real OAuth account selection screen
          setIsRedirectingToGoogle(true);
          window.location.href = data.url;
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });
  }, [isPopup, state]);

  const handleSelectAccount = async (email: string, name: string, avatarUrl?: string) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/google/select-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, avatarUrl }),
      });

      if (!res.ok) {
        throw new Error("Failed to sign in");
      }

      const data = await res.json();

      // Notify parent window if in popup
      if (window.opener) {
        window.opener.postMessage(
          { type: "GOOGLE_AUTH_SUCCESS", user: data.user },
          "*"
        );
        setTimeout(() => window.close(), 400);
      } else {
        const dest = state.startsWith("/") ? state : `/${state}`;
        window.location.href = `${dest}?auth=success`;
      }
    } catch (e) {
      alert("Error signing in: " + (e instanceof Error ? e.message : "Unknown error"));
      setSubmitting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim() || !clientSecret.trim()) {
      setConfigError("Please enter both Client ID and Client Secret.");
      return;
    }

    setSavingConfig(true);
    setConfigError("");

    try {
      const res = await fetch("/api/auth/google/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save configuration");
      }

      setConfigSuccess(true);
      setTimeout(() => {
        // Now trigger real Google OAuth redirect
        window.location.href = `/api/auth/google/url?popup=${isPopup}&state=${state}`;
      }, 800);
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : "Configuration failed");
      setSavingConfig(false);
    }
  };

  if (isRedirectingToGoogle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6 dark:bg-zinc-950">
        <div className="text-center space-y-4">
          <GoogleGIcon className="mx-auto h-10 w-10 animate-bounce" />
          <h2 className="text-lg font-semibold">Redirecting to Google...</h2>
          <p className="text-xs text-zinc-500">
            Opening Google account chooser and calendar authorization
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        {/* Google Header */}
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-800 shadow-xs mb-3">
            <GoogleGIcon className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Sign in with Google
          </h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Choose an account to continue to <strong className="font-semibold text-zinc-800 dark:text-zinc-200">CampusPulse</strong>
          </p>
        </div>

        {/* Account Selector List */}
        <div className="mt-6 space-y-2">
          {sampleAccounts.map((account) => (
            <button
              key={account.email}
              type="button"
              disabled={submitting}
              onClick={() => handleSelectAccount(account.email, account.name, account.avatar)}
              className="flex w-full items-center gap-3.5 rounded-xl border border-zinc-200/80 p-3 text-left transition-all hover:border-blue-500 hover:bg-blue-50/40 dark:border-zinc-800 dark:hover:border-blue-500 dark:hover:bg-blue-950/20"
            >
              <img
                src={account.avatar}
                alt={account.name}
                className="h-9 w-9 rounded-full object-cover bg-blue-600"
              />
              <div className="flex-1 truncate">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {account.name}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {account.email}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400" />
            </button>
          ))}
        </div>

        {/* Custom Account Input Form */}
        <div className="mt-5 border-t border-zinc-100 pt-5 dark:border-zinc-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
            <PlusCircle className="h-3.5 w-3.5 text-blue-600" />
            <span>Use another Google account</span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customEmail) {
                handleSelectAccount(customEmail, customName || customEmail.split("@")[0]);
              }
            }}
            className="space-y-3"
          >
            <div>
              <Label className="text-xs">Your Google Email</Label>
              <Input
                type="email"
                required
                placeholder="your.name@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs">Display Name (optional)</Label>
              <Input
                type="text"
                placeholder="Your Name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || !customEmail}
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in as {customEmail || "Google Account"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Google Cloud Console Setup Collapsible */}
        <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="flex w-full items-center justify-between text-xs text-zinc-500 hover:text-blue-600 transition-colors"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Settings className="h-3.5 w-3.5" />
              <span>Connect Google Cloud Client ID (Optional)</span>
            </span>
            <span className="font-mono">{showConfig ? "▲" : "▼"}</span>
          </button>

          {showConfig && (
            <div className="mt-3 rounded-xl bg-zinc-50 p-4 border border-zinc-200 text-xs dark:bg-zinc-800/40 dark:border-zinc-700 space-y-3">
              <p className="text-zinc-600 dark:text-zinc-300 text-[11px] leading-relaxed">
                Paste your OAuth 2.0 Client credentials from Google Cloud Console to enable Google&apos;s native OAuth screen:
              </p>

              <form onSubmit={handleSaveConfig} className="space-y-2.5">
                <div>
                  <Label className="text-[11px]">Google Client ID</Label>
                  <Input
                    placeholder="xxxx.apps.googleusercontent.com"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="mt-0.5 h-8 text-xs font-mono"
                  />
                </div>

                <div>
                  <Label className="text-[11px]">Google Client Secret</Label>
                  <Input
                    type="password"
                    placeholder="GOCSPX-xxxx"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    className="mt-0.5 h-8 text-xs font-mono"
                  />
                </div>

                {configError && (
                  <p className="text-[11px] text-red-500">{configError}</p>
                )}

                {configSuccess && (
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Saved! Redirecting to Google...
                  </p>
                )}

                <Button
                  type="submit"
                  size="sm"
                  disabled={savingConfig || configSuccess}
                  className="w-full h-8 text-xs bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900"
                >
                  {savingConfig ? "Saving..." : "Save & Open Real Google Screen"}
                </Button>
              </form>

              <div className="pt-1 text-[10px] text-zinc-400">
                Redirect URI needed in console:
                <code className="block mt-0.5 p-1 bg-zinc-200 dark:bg-zinc-900 rounded font-mono select-all">
                  http://localhost:3001/api/auth/google/callback
                </code>
              </div>
            </div>
          )}
        </div>

        {/* Security badge */}
        <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Scope: calendar.app.created (least privilege)</span>
        </div>
      </div>
    </div>
  );
}

export default function GoogleSelectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <GoogleSelectContent />
    </Suspense>
  );
}
