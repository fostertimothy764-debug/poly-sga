"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check, Loader2, Lock } from "lucide-react";

const GRADES = [
  { value: "30", label: "Class of 2030", sub: "Freshmen" },
  { value: "29", label: "Class of 2029", sub: "Sophomores" },
  { value: "28", label: "Class of 2028", sub: "Juniors" },
  { value: "27", label: "Class of 2027", sub: "Seniors" },
];

export default function WelcomeClient() {
  const params = useSearchParams();
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    if (!picked) return;
    setBusy(true);
    await fetch("/api/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grade: picked }),
    });
    const dest = params.get("from") || "/";
    // Use a hard navigation so the cookie is fully committed before the
    // new page loads — avoids the router.push + router.refresh race condition
    // that caused the spinner to hang indefinitely.
    window.location.href = dest;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 px-6 py-16">
      <div className="absolute inset-0 dot-grid opacity-50 pointer-events-none" aria-hidden />
      <div className="relative w-full max-w-xl animate-slide-up">
        <div className="text-center mb-10">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-poly-orange font-bold mb-6">
            P
          </div>
          <h1 className="h-display text-4xl sm:text-5xl mb-3 leading-tight">
            Welcome to <span className="gradient-text italic">Poly SGA</span>
          </h1>
          <p className="text-ink-600">
            Pick your class so we can show you what matters to you.
          </p>
        </div>

        <div className="grid gap-2 mb-6">
          {GRADES.map((g) => (
            <button
              key={g.value}
              onClick={() => setPicked(g.value)}
              className={`group flex items-center justify-between rounded-2xl border p-4 sm:p-5 text-left transition-all ${
                picked === g.value
                  ? "border-ink-900 bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)]"
                  : "border-ink-200 bg-white/60 hover:border-ink-300 hover:bg-white"
              }`}
            >
              <div>
                <div className="font-display text-xl">{g.label}</div>
                <div className="text-xs text-ink-500 mt-0.5">{g.sub}</div>
              </div>
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                  picked === g.value
                    ? "bg-poly-orange border-poly-orange text-white"
                    : "border-ink-200 group-hover:border-ink-400"
                }`}
              >
                {picked === g.value && <Check size={12} />}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={confirm}
          disabled={!picked || busy}
          className="btn-primary w-full"
        >
          {busy ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Setting up
            </>
          ) : (
            <>
              Continue
              <ArrowRight size={16} />
            </>
          )}
        </button>

        <p className="text-center text-xs text-ink-400 mt-6">
          You can change this anytime from the footer.
        </p>

        <div className="mt-10 pt-8 border-t border-ink-200/60 text-center">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-900 transition-colors group"
          >
            <Lock size={13} className="text-ink-400 group-hover:text-ink-700" />
            Officer? Sign in here
            <ArrowRight
              size={13}
              className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
