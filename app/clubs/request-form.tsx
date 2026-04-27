"use client";

import { useState } from "react";
import { ArrowRight, Check, ChevronDown, Loader2, X } from "lucide-react";

export default function ClubRequestForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    clubName: "",
    description: "",
    contactName: "",
    contactInfo: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clubName.trim() || !form.description.trim()) return;
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/club-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Something went wrong");
      return;
    }
    setDone(true);
    setForm({ clubName: "", description: "", contactName: "", contactInfo: "" });
  }

  if (done) {
    return (
      <div className="mt-20 rounded-3xl border border-green-200 bg-green-50 px-8 py-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Check size={22} className="text-green-600" />
        </div>
        <h3 className="font-display text-2xl mb-2">Request received!</h3>
        <p className="text-sm text-ink-600 mb-5 max-w-sm mx-auto">
          SGA will review your request and follow up if needed. Thanks for getting involved.
        </p>
        <button
          onClick={() => { setDone(false); setOpen(false); }}
          className="text-sm text-ink-500 hover:text-ink-900 underline underline-offset-2"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <div className="mt-20">
      {/* Header row */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-2">
            Don&apos;t see your club?
          </p>
          <h2 className="font-display text-3xl sm:text-4xl">Request to add a club</h2>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="btn-primary"
        >
          {open ? (
            <>
              <X size={14} /> Cancel
            </>
          ) : (
            <>
              Send a request
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>

      {!open && (
        <div className="max-w-2xl space-y-3">
          <p className="text-ink-600 leading-relaxed">
            If your club already exists at Poly but isn&apos;t listed here, you can ask SGA to add it to the website.
          </p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>⚠ This is not a form to start a new club.</strong> It only requests that an
            existing club be added to this website&apos;s listing. SGA will review and may follow up with
            you before anything appears.
          </div>
        </div>
      )}

      {open && (
        <form
          onSubmit={submit}
          className="card space-y-5 animate-slide-up"
        >
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
            <strong>⚠ Not a club creation form.</strong> This only requests that your club be
            added to this website. It does <em>not</em> create, register, or officially start a
            club at Poly. SGA will review and may reach out before approving.
          </div>

          <div>
            <label className="label" htmlFor="clubName">
              Club name <span className="text-red-500">*</span>
            </label>
            <input
              id="clubName"
              className="input"
              placeholder="e.g. Photography Club"
              value={form.clubName}
              onChange={(e) => setForm({ ...form, clubName: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="description">
              What is your club? <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              className="input resize-none"
              rows={4}
              placeholder="Describe the club's purpose, activities, and who it's for…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="contactName">
                Your name 
              </label>
              <input
                id="contactName"
                className="input"
                placeholder="First name is fine"
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="contactInfo">
                How can SGA reach you? 
              </label>
              <input
                id="contactInfo"
                className="input"
                placeholder="@yourinstagram or school email"
                value={form.contactInfo}
                onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
              />
            </div>
          </div>

          {err && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !form.clubName.trim() || !form.description.trim()}
            className="btn-accent"
          >
            {busy ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Check size={14} />
                Submit request
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
