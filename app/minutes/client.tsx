"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  CircleCheck,
  CircleDashed,
  Clock,
  Pin,
  Search,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ActionItemDTO = {
  id: string;
  description: string;
  assignee: string;
  dueDate: string | null;
  status: string;
  category: string | null;
};

export type MeetingDTO = {
  id: string;
  date: string;
  type: string;
  title: string | null;
  attendees: string;
  agenda: string;
  decisions: string;
  notes: string | null;
  pinned: boolean;
  authorName: string | null;
  actionItems: ActionItemDTO[];
};

const TYPES = [
  { value: "all", label: "All meetings" },
  { value: "general", label: "General" },
  { value: "executive", label: "Executive" },
  { value: "emergency", label: "Emergency" },
];

function typeChip(type: string) {
  if (type === "emergency") return "bg-poly-orange/10 text-poly-orangeDark border-poly-orange/30";
  if (type === "executive") return "bg-poly-navy/10 text-poly-navy border-poly-navy/20";
  return "bg-ink-100 text-ink-700 border-ink-200";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function splitLines(s: string): string[] {
  return s
    .split("\n")
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}

function statusMeta(status: string, due: string | null) {
  if (status === "completed") {
    return {
      tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
      label: "Completed",
      icon: CircleCheck,
    };
  }
  const overdue = due && new Date(due).getTime() < Date.now();
  if (overdue && status !== "completed") {
    return {
      tone: "text-rose-700 bg-rose-50 border-rose-200",
      label: status === "in_progress" ? "In progress · overdue" : "Overdue",
      icon: Clock,
    };
  }
  if (status === "in_progress") {
    return {
      tone: "text-amber-700 bg-amber-50 border-amber-200",
      label: "In progress",
      icon: CircleDashed,
    };
  }
  return {
    tone: "text-ink-600 bg-ink-100 border-ink-200",
    label: "Pending",
    icon: CircleDashed,
  };
}

export default function MinutesClient({ initial }: { initial: MeetingDTO[] }) {
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(initial.filter((m) => m.pinned).map((m) => m.id))
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromTime = from ? new Date(from).getTime() : null;
    const toTime = to ? new Date(to + "T23:59:59").getTime() : null;
    return initial.filter((m) => {
      if (type !== "all" && m.type !== type) return false;
      const t = new Date(m.date).getTime();
      if (fromTime !== null && t < fromTime) return false;
      if (toTime !== null && t > toTime) return false;
      if (!q) return true;
      const haystack = [
        m.title ?? "",
        m.attendees,
        m.agenda,
        m.decisions,
        m.notes ?? "",
        ...m.actionItems.map((a) => `${a.description} ${a.assignee}`),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [initial, type, query, from, to]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function resetFilters() {
    setType("all");
    setQuery("");
    setFrom("");
    setTo("");
  }

  const hasFilters = type !== "all" || query || from || to;

  return (
    <div className="container-page py-10 sm:py-14">
      {/* Header */}
      <header className="mb-10 pb-6 border-b border-ink-200">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-poly-orange mb-3">
          Transparency · the public record
        </p>
        <h1 className="h-display text-4xl sm:text-5xl leading-tight mb-3">
          Meeting minutes.
        </h1>
        <p className="text-ink-600 max-w-2xl text-base leading-relaxed">
          Every SGA meeting — who showed up, what we discussed, what we
          decided, and the action items we walked away with. Search the
          record. Hold us to it.
        </p>
      </header>

      {/* Filter bar */}
      <div className="mb-8 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] items-end">
        <label className="block">
          <span className="label">Search</span>
          <span className="relative block">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, topic, attendee, decision…"
              className="input pl-10"
            />
          </span>
        </label>
        <label className="block">
          <span className="label">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="input min-w-[10rem]"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input"
          />
        </label>
        <label className="block">
          <span className="label">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input"
          />
        </label>
      </div>

      <div className="flex items-center justify-between mb-6 text-xs text-ink-500">
        <span>
          {filtered.length} meeting{filtered.length !== 1 ? "s" : ""}
          {hasFilters && ` · filtered from ${initial.length}`}
        </span>
        {hasFilters && (
          <button
            onClick={resetFilters}
            className="text-poly-navy hover:text-poly-navyDark underline-offset-2 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 && (
        <EmptyState
          hasRecords={initial.length > 0}
          onReset={hasFilters ? resetFilters : undefined}
        />
      )}

      {/* Meetings list */}
      <ol className="space-y-5">
        {filtered.map((m) => {
          const isOpen = expanded.has(m.id);
          const decisions = splitLines(m.decisions);
          const agenda = splitLines(m.agenda);
          const attendees = splitLines(m.attendees);
          return (
            <li
              key={m.id}
              className={cn(
                "rounded-2xl border bg-white overflow-hidden transition-colors",
                m.pinned ? "border-poly-orange/40" : "border-ink-200"
              )}
            >
              <button
                onClick={() => toggle(m.id)}
                className="w-full text-left px-5 sm:px-6 py-5 flex items-start gap-5 hover:bg-ink-50/60 transition-colors"
                aria-expanded={isOpen}
              >
                <div className="hidden sm:flex shrink-0 flex-col items-center justify-center w-14 rounded-lg border border-ink-200 bg-ink-50 py-2">
                  <span className="text-[10px] uppercase tracking-[0.14em] text-ink-500">
                    {new Date(m.date).toLocaleDateString("en-US", { month: "short" })}
                  </span>
                  <span className="font-display text-2xl text-poly-navy leading-none mt-1">
                    {new Date(m.date).getDate()}
                  </span>
                  <span className="text-[10px] text-ink-500 mt-0.5">
                    {new Date(m.date).getFullYear()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {m.pinned && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.14em] text-poly-orange">
                        <Pin size={10} /> Pinned
                      </span>
                    )}
                    <span
                      className={cn(
                        "inline-flex items-center text-[10px] font-medium uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border",
                        typeChip(m.type)
                      )}
                    >
                      {m.type}
                    </span>
                    <span className="text-[11px] text-ink-500 sm:hidden">
                      {fmtDateShort(m.date)}
                    </span>
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl leading-snug text-ink-900">
                    {m.title || `${m.type[0].toUpperCase() + m.type.slice(1)} meeting · ${fmtDateShort(m.date)}`}
                  </h2>
                  <div className="mt-2 hidden sm:flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={12} />
                      {fmtDate(m.date)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={12} />
                      {attendees.length} present
                    </span>
                    {m.actionItems.length > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <CircleDashed size={12} />
                        {m.actionItems.length} action item
                        {m.actionItems.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown
                  size={18}
                  className={cn(
                    "text-ink-400 transition-transform duration-200 shrink-0 mt-1",
                    isOpen && "rotate-180"
                  )}
                />
              </button>

              {isOpen && (
                <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-ink-200 space-y-7 animate-fade-in">
                  {/* Attendees */}
                  <section>
                    <h3 className="label text-ink-700 mb-2">Officers present</h3>
                    <ul className="flex flex-wrap gap-2">
                      {attendees.map((a, i) => (
                        <li
                          key={i}
                          className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50 px-3 py-1 text-xs text-ink-700"
                        >
                          {a}
                        </li>
                      ))}
                    </ul>
                  </section>

                  {/* Agenda */}
                  {agenda.length > 0 && (
                    <section>
                      <h3 className="label text-ink-700 mb-2">Agenda</h3>
                      <ul className="space-y-2 text-sm text-ink-800">
                        {agenda.map((line, i) => (
                          <li key={i} className="pl-4 relative leading-relaxed">
                            <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-ink-400" />
                            {line}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {/* Decisions — highlighted */}
                  {decisions.length > 0 && (
                    <section>
                      <h3 className="label text-poly-orangeDark mb-2 flex items-center gap-2">
                        Decisions made
                      </h3>
                      <ul className="space-y-2.5">
                        {decisions.map((line, i) => (
                          <li
                            key={i}
                            className="rounded-xl border-l-2 border-poly-orange bg-poly-orange/[0.06] py-2.5 pl-4 pr-3 text-sm text-ink-900 leading-relaxed"
                          >
                            {line}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {/* Action items */}
                  {m.actionItems.length > 0 && (
                    <section>
                      <h3 className="label text-ink-700 mb-3">Action items</h3>
                      <ul className="space-y-2">
                        {m.actionItems.map((a) => {
                          const meta = statusMeta(a.status, a.dueDate);
                          const Icon = meta.icon;
                          return (
                            <li
                              key={a.id}
                              className="flex gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3"
                            >
                              <Icon
                                size={14}
                                className={cn(
                                  "mt-1 shrink-0",
                                  a.status === "completed"
                                    ? "text-emerald-600"
                                    : meta.label.toLowerCase().includes("overdue")
                                      ? "text-rose-600"
                                      : a.status === "in_progress"
                                        ? "text-amber-600"
                                        : "text-ink-400"
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-ink-900 leading-snug">
                                  {a.description}
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-500">
                                  <span>
                                    Owner:{" "}
                                    <span className="text-ink-800 font-medium">{a.assignee}</span>
                                  </span>
                                  {a.dueDate && (
                                    <span>
                                      Due{" "}
                                      <span className="text-ink-800">
                                        {fmtDateShort(a.dueDate)}
                                      </span>
                                    </span>
                                  )}
                                  {a.category && (
                                    <span className="inline-flex items-center rounded-full bg-ink-100 px-2 py-0.5 text-ink-600">
                                      {a.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span
                                className={cn(
                                  "self-start shrink-0 inline-flex items-center text-[10px] font-medium uppercase tracking-[0.12em] px-2 py-1 rounded-full border",
                                  meta.tone
                                )}
                              >
                                {meta.label}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  )}

                  {/* Notes */}
                  {m.notes && (
                    <section>
                      <h3 className="label text-ink-700 mb-2">Notes</h3>
                      <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-line">
                        {m.notes}
                      </p>
                    </section>
                  )}

                  {m.authorName && (
                    <p className="text-[11px] text-ink-500 pt-2 border-t border-ink-100">
                      Minutes recorded by {m.authorName}
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function EmptyState({
  hasRecords,
  onReset,
}: {
  hasRecords: boolean;
  onReset?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-300 px-6 py-16 text-center bg-ink-50/60">
      <CalendarDays size={28} className="mx-auto text-ink-400 mb-3" />
      <p className="font-display text-xl text-ink-800 mb-2">
        {hasRecords ? "No meetings match those filters." : "No minutes posted yet."}
      </p>
      <p className="text-sm text-ink-500 max-w-md mx-auto leading-relaxed">
        {hasRecords
          ? "Try widening the date range or clearing the search."
          : "When the SGA meets, minutes will land here within a day. Decisions, action items, and who made them — all on the record."}
      </p>
      {onReset && (
        <button
          onClick={onReset}
          className="mt-5 btn-ghost"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
