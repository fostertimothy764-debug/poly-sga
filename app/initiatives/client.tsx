"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Hourglass,
  Lightbulb,
  Loader2,
  Plus,
  Send,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type InitiativeUpdateDTO = {
  id: string;
  body: string;
  authorName: string | null;
  createdAt: string;
};

export type InitiativeDTO = {
  id: string;
  title: string;
  description: string;
  owner: string;
  column: string;
  category: string;
  startedAt: string | null;
  expectedAt: string | null;
  completedAt: string | null;
  updates: InitiativeUpdateDTO[];
};

const COLUMN_META: {
  value: string;
  label: string;
  blurb: string;
  Icon: typeof Lightbulb;
  accent: string;
}[] = [
  {
    value: "proposed",
    label: "Proposed",
    blurb: "Ideas on deck, awaiting kickoff.",
    Icon: Lightbulb,
    accent: "border-t-poly-orange",
  },
  {
    value: "in_progress",
    label: "In progress",
    blurb: "Actively in motion this semester.",
    Icon: Hourglass,
    accent: "border-t-poly-navy",
  },
  {
    value: "completed",
    label: "Completed",
    blurb: "Shipped. Receipts attached.",
    Icon: CheckCircle2,
    accent: "border-t-emerald-500",
  },
  {
    value: "archived",
    label: "Archived",
    blurb: "Paused, deferred, or out of scope.",
    Icon: Archive,
    accent: "border-t-ink-300",
  },
];

const CATEGORY_META: Record<string, { label: string; tone: string }> = {
  academic: { label: "Academic", tone: "bg-blue-50 text-blue-700 border-blue-200" },
  facilities: { label: "Facilities", tone: "bg-stone-50 text-stone-700 border-stone-200" },
  events: { label: "Events", tone: "bg-poly-orange/10 text-poly-orangeDark border-poly-orange/30" },
  policy: { label: "Policy", tone: "bg-violet-50 text-violet-700 border-violet-200" },
  resources: { label: "Resources", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function categoryChip(cat: string) {
  return CATEGORY_META[cat] || {
    label: cat,
    tone: "bg-ink-100 text-ink-700 border-ink-200",
  };
}

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function InitiativesClient({
  initial,
}: {
  initial: InitiativeDTO[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const byColumn = useMemo(() => {
    const map = new Map<string, InitiativeDTO[]>();
    COLUMN_META.forEach((c) => map.set(c.value, []));
    for (const it of initial) {
      if (filter !== "all" && it.category !== filter) continue;
      const col = map.get(it.column) ?? map.get("proposed")!;
      col.push(it);
    }
    return map;
  }, [initial, filter]);

  const totals = useMemo(() => {
    return {
      total: initial.length,
      inProgress: initial.filter((i) => i.column === "in_progress").length,
      completed: initial.filter((i) => i.column === "completed").length,
    };
  }, [initial]);

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="mb-10 pb-6 border-b border-ink-200">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-poly-orange mb-3">
          Transparency · in motion
        </p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="h-display text-4xl sm:text-5xl leading-tight mb-3">
              What we&apos;re actually working on.
            </h1>
            <p className="text-ink-600 text-base leading-relaxed">
              Every active SGA initiative — its owner, its category, where it
              stands. If you don&apos;t see something you care about, propose it.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 sm:gap-8 text-sm">
            <Stat number={totals.total} label="Active initiatives" />
            <Stat number={totals.inProgress} label="In progress" />
            <Stat number={totals.completed} label="Completed this year" />
          </div>
        </div>
      </header>

      {/* Filter + CTA */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5">
          <CategoryPill
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label="All"
            count={initial.length}
          />
          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const count = initial.filter((i) => i.category === key).length;
            return (
              <CategoryPill
                key={key}
                active={filter === key}
                onClick={() => setFilter(key)}
                label={meta.label}
                count={count}
              />
            );
          })}
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className={showForm ? "btn-ghost" : "btn-accent"}
        >
          {showForm ? (
            <>
              <X size={14} />
              Cancel
            </>
          ) : (
            <>
              <Plus size={14} />
              Suggest an initiative
            </>
          )}
        </button>
      </div>

      {showForm && (
        <SuggestionForm onSubmitted={() => setShowForm(false)} />
      )}

      {/* Kanban — horizontal scroll on small screens */}
      <div className="grid gap-5 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        {COLUMN_META.map((col) => {
          const items = byColumn.get(col.value) ?? [];
          const ColIcon = col.Icon;
          return (
            <section
              key={col.value}
              className={cn(
                "rounded-2xl border border-ink-200 bg-white/60 border-t-2 p-4",
                col.accent
              )}
            >
              <header className="flex items-baseline justify-between mb-1">
                <div className="flex items-center gap-2">
                  <ColIcon size={14} className="text-ink-500" />
                  <h2 className="font-display text-base text-ink-900">
                    {col.label}
                  </h2>
                </div>
                <span className="font-mono text-[11px] text-ink-500">
                  {items.length}
                </span>
              </header>
              <p className="text-[11px] text-ink-500 mb-4">{col.blurb}</p>
              <ul className="space-y-3">
                {items.map((it) => (
                  <InitiativeCard key={it.id} item={it} />
                ))}
                {items.length === 0 && (
                  <li className="rounded-xl border border-dashed border-ink-200 px-3 py-6 text-center text-xs text-ink-500">
                    Nothing here yet.
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ number, label }: { number: number; label: string }) {
  return (
    <div>
      <p className="font-display text-3xl text-poly-navy leading-none">{number}</p>
      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-500 mt-1">
        {label}
      </p>
    </div>
  );
}

function CategoryPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-poly-navy text-white border-poly-navy"
          : "bg-white text-ink-700 border-ink-200 hover:border-ink-300"
      )}
    >
      {label}
      <span
        className={cn(
          "inline-flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[10px] font-mono",
          active ? "bg-white/15 text-white" : "bg-ink-100 text-ink-500"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function InitiativeCard({ item }: { item: InitiativeDTO }) {
  const [open, setOpen] = useState(false);
  const cat = categoryChip(item.category);

  return (
    <li className="rounded-xl border border-ink-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-4 py-3.5 hover:bg-ink-50/60 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-start gap-2 mb-2">
          <span
            className={cn(
              "inline-flex items-center text-[10px] font-medium uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border",
              cat.tone
            )}
          >
            {cat.label}
          </span>
          <ChevronDown
            size={14}
            className={cn(
              "ml-auto mt-1 text-ink-400 transition-transform",
              open && "rotate-180"
            )}
          />
        </div>
        <h3 className="font-display text-base leading-snug text-ink-900 mb-1.5">
          {item.title}
        </h3>
        <p className="text-xs text-ink-500 leading-relaxed line-clamp-2">
          {item.description}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-500">
          <span>
            Owner:{" "}
            <span className="text-ink-800 font-medium">{item.owner}</span>
          </span>
          {item.expectedAt && (
            <span>
              Target{" "}
              <span className="text-ink-800">{fmtDate(item.expectedAt)}</span>
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-ink-100 px-4 py-3.5 space-y-3 bg-ink-50/40 animate-fade-in">
          <p className="text-sm text-ink-800 leading-relaxed whitespace-pre-line">
            {item.description}
          </p>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            {item.startedAt && (
              <>
                <dt className="text-ink-500">Started</dt>
                <dd className="text-ink-800 text-right">{fmtDate(item.startedAt)}</dd>
              </>
            )}
            {item.expectedAt && (
              <>
                <dt className="text-ink-500">Target</dt>
                <dd className="text-ink-800 text-right">{fmtDate(item.expectedAt)}</dd>
              </>
            )}
            {item.completedAt && (
              <>
                <dt className="text-ink-500">Completed</dt>
                <dd className="text-ink-800 text-right">{fmtDate(item.completedAt)}</dd>
              </>
            )}
          </dl>
          {item.updates.length > 0 ? (
            <div>
              <p className="label text-ink-700 mb-2">Updates</p>
              <ol className="space-y-2.5">
                {item.updates.map((u) => (
                  <li
                    key={u.id}
                    className="rounded-lg border-l-2 border-poly-navy/30 pl-3 py-1 text-xs text-ink-700"
                  >
                    <p className="whitespace-pre-line leading-relaxed">{u.body}</p>
                    <p className="text-[10px] text-ink-500 mt-1">
                      {u.authorName || "SGA"} ·{" "}
                      {new Date(u.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="text-[11px] text-ink-500 italic">No updates posted yet.</p>
          )}
        </div>
      )}
    </li>
  );
}

function SuggestionForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !description.trim()) {
      setError("Title and why-it-matters are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/initiative-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          submitterName: name.trim() || null,
          submitterGrade: grade.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Submission failed");
      }
      setDone(true);
      setTimeout(() => onSubmitted(), 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-8 mb-8 text-center animate-fade-in">
        <CheckCircle2 size={28} className="mx-auto text-emerald-600 mb-2" />
        <p className="font-display text-lg text-emerald-900">
          Got it. Your idea is on the next agenda.
        </p>
        <p className="text-sm text-emerald-700 mt-1">
          The SGA will review and respond. Check back here.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6 mb-8 animate-fade-in"
    >
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb size={16} className="text-poly-orange" />
        <h2 className="font-display text-lg">Suggest an initiative</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="label">Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="What should the SGA work on?"
            maxLength={160}
            required
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="label">Why it matters</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="input resize-y"
            placeholder="What's the problem? Who does it affect? What would success look like?"
            maxLength={2000}
            required
          />
        </label>
        <label className="block">
          <span className="label">Your name (optional)</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Anonymous if blank"
            maxLength={80}
          />
        </label>
        <label className="block">
          <span className="label">Grade (optional)</span>
          <input
            type="text"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="input"
            placeholder="9, 10, 11, 12"
            maxLength={8}
          />
        </label>
      </div>
      {error && (
        <p className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div className="mt-5 flex items-center justify-end gap-3">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send size={14} />
              Submit idea
            </>
          )}
        </button>
      </div>
    </form>
  );
}
