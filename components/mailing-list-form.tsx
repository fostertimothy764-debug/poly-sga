"use client";

import { useState } from "react";
import { Mail, Check, Loader2 } from "lucide-react";

type State = "idle" | "loading" | "success" | "error";

export default function MailingListForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/mailing-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong.");
        setState("error");
      } else {
        setState("success");
        setEmail("");
      }
    } catch {
      setErrorMsg("Network error — please try again.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-poly-green/10 border border-poly-green/30 px-5 py-4 text-ink-800">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-poly-green/20">
          <Check size={16} className="text-poly-green" />
        </span>
        <div>
          <p className="font-medium text-sm">You&apos;re on the list.</p>
          <p className="text-xs text-ink-600 mt-0.5">We&apos;ll email you when new Scoop issues drop.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={subscribe} className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="input pl-9 w-full"
          disabled={state === "loading"}
        />
      </div>
      <button
        type="submit"
        disabled={state === "loading" || !email.trim()}
        className="btn-primary flex-shrink-0"
      >
        {state === "loading" ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Mail size={14} />
        )}
        Subscribe
      </button>
      {state === "error" && (
        <p className="w-full text-xs text-poly-orangeDark -mt-1">{errorMsg}</p>
      )}
    </form>
  );
}
