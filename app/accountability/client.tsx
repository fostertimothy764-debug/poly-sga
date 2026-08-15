"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock,
  Filter,
  Search,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AccountabilityItem = {
  id: string;
  description: string;
  assignee: string;
  dueDate: string | null;
  status: string;
  category: string | null;
  completedAt: string | null;
  meeting: {
    id: string;
    date: string;
    type: string;
    title: string | null;
  };
};

function isOverdue(item: AccountabilityItem) {
  if (item.status === "completed") return false;
  if (!item.dueDate) return false;
  return new Date(item.dueDate).getTime() < Date.now();
}

function fmtDateShort(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_FILTERS = [
  { value: "all", label: "All", icon: Filter },
  { value: "pending", label: "Pending", icon: CircleDashed },
  { value: "in_progress", label: "In progress", icon: Clock },
  { value: "overdue", label: "Overdue", icon: AlertTriangle },
  { value: "completed", label: "Completed", icon: CheckCircle2 },
];

export default function AccountabilityClient({
  initial,
}: {
  initial: AccountabilityItem[];
}) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [officerFilter, setOfficerFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const allOfficers = useMemo(() => {
    const set = new Set(initial.map((i) => i.assignee));
    return Array.from(set).sort();
  }, [initial]);

  const allCategories = useMemo(() => {
    const set = new Set(initial.map((i) => i.category).filter((c): c is string => !!c));
    return Array.from(set).sort();
  }, [initial]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromTime = from ? new Date(from).getTime() : null;
    const toTime = to ? new Date(to + "T23:59:59").getTime() : null;
    return initial.filter((i) => {
      if (statusFilter === "overdue" && !isOverdue(i)) return false;
      if (
        statusFilter !== "all" &&
        statusFilter !== "overdue" &&
        i.status !== statusFilter
      )
        return false;
      if (officerFilter !== "all" && i.assignee !== officerFilter) return false;
      if (categoryFilter !== "all" && i.category !== categoryFilter) return false;
      const refTime = new Date(i.meeting.date).getTime();
      if (fromTime !== null && refTime < fromTime) return false;
      if (toTime !== null && refTime > toTime) return false;
      if (!q) return true;
      return (
        i.description.toLowerCase().includes(q) ||
        i.assignee.toLowerCase().includes(q) ||
        (i.category?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [initial, statusFilter, officerFilter, categoryFilter, query, from, to]);

  const stats = useMemo(() => {
    const total = initial.length;
    const completed = initial.filter((i) => i.status === "completed").length;
    const inProgress = initial.filter((i) => i.status === "in_progress").length;
    const pending = initial.filter((i) => i.status === "pending").length;
    const overdue = initial.filter(isOverdue).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, pending, overdue, rate };
  }, [initial]);

  // Per-officer completion rates
  const officerStats = useMemo(() => {
    const map = new Map<string, { assigned: number; completed: number; overdue: number }>();
    for (const i of initial) {
      const entry = map.get(i.assignee) ?? { assigned: 0, completed: 0, overdue: 0 };
      entry.assigned += 1;
      if (i.status === "completed") entry.completed += 1;
      if (isOverdue(i)) entry.overdue += 1;
      map.set(i.assignee, entry);
    }
    return Array.from(map.entries())
      .map(([name, s]) => ({
        name,
        ...s,
        rate: s.assigned > 0 ? Math.round((s.completed / s.assigned) * 100) : 0,
      }))
      .sort((a, b) => b.assigned - a.assigned || a.name.localeCompare(b.name));
  }, [initial]);

  if (initial.length === 0) {
    return (
      <div className="container-page py-10 sm:py-14">
        <Header />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <Header />

      {/* Top stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5 mb-10">
        <StatTile label="Total tracked" value={stats.total} />
        <StatTile label="Completed" value={stats.completed} accent="text-emerald-700" />
        <StatTile label="In progress" value={stats.inProgress} accent="text-amber-700" />
        <StatTile label="Pending" value={stats.pending} accent="text-ink-700" />
        <StatTile
          label="Overdue"
          value={stats.overdue}
          accent={stats.overdue > 0 ? "text-rose-700" : "text-ink-700"}
        />
      </div>

      {/* Per-officer scoreboard */}
      <section className="mb-12 rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={14} className="text-poly-navy" />
          <h2 className="font-display text-lg">Completion rate by officer</h2>
        </div>
        <p className="text-xs text-ink-500 mb-5">
          Of every action item assigned to them, the share they&apos;ve closed.
        </p>
        <ul className="space-y-4">
          {officerStats.map((o) => (
            <li key={o.name}>
              <div className="flex items-baseline justify-between mb-1.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">
                    {o.name}
                  </p>
                  <p className="text-[11px] text-ink-500">
                    {o.completed}/{o.assigned} closed
                    {o.overdue > 0 && (
                      <span className="text-rose-600">
                        {" "}
                        · {o.overdue} overdue
                      </span>
                    )}
                  </p>
                </div>
                <span className="font-mono text-sm text-ink-800">{o.rate}%</span>
              </div>
              <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    o.rate >= 80
                      ? "bg-emerald-500"
                      : o.rate >= 50
                        ? "bg-amber-500"
                        : "bg-poly-orange"
                  )}
                  style={{ width: `${o.rate}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((s) => {
          const Icon = s.icon;
          const count =
            s.value === "all"
              ? initial.length
              : s.value === "overdue"
                ? initial.filter(isOverdue).length
                : initial.filter((i) => i.status === s.value).length;
          return (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === s.value
                  ? "bg-poly-navy text-white border-poly-navy"
                  : "bg-white text-ink-700 border-ink-200 hover:border-ink-300"
              )}
            >
              <Icon size={12} />
              {s.label}
              <span
                className={cn(
                  "inline-flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[10px] font-mono",
                  statusFilter === s.value ? "bg-white/15" : "bg-ink-100 text-ink-500"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-8 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] items-end">
        <label className="block">
          <span className="label">Search</span>
          <span className="relative block">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search description, officer, category…"
              className="input pl-10"
            />
          </span>
        </label>
        <label className="block">
          <span className="label">Officer</span>
          <select
            value={officerFilter}
            onChange={(e) => setOfficerFilter(e.target.value)}
            className="input min-w-[10rem]"
          >
            <option value="all">Everyone</option>
            {allOfficers.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Category</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input min-w-[10rem]"
          >
            <option value="all">Any</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
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
      </div>

      <p className="mb-4 text-xs text-ink-500">
        Showing {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        {filtered.length !== initial.length && ` of ${initial.length}`}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-300 px-6 py-12 text-center bg-ink-50/60">
          <p className="text-sm text-ink-500">
            No action items match those filters.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Header() {
  return (
    <header className="mb-10 pb-6 border-b border-ink-200">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-poly-orange mb-3">
        Transparency · on the clock
      </p>
      <h1 className="h-display text-4xl sm:text-5xl leading-tight mb-3">
        Accountability tracker.
      </h1>
      <p className="text-ink-600 max-w-2xl text-base leading-relaxed">
        Every promise the SGA has put on the record, aggregated from every
        meeting. Filter by officer, by status, by due date, and watch the
        completion rate climb.
      </p>
    </header>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4">
      <p className="text-[10px] uppercase tracking-[0.14em] text-ink-500 mb-1">
        {label}
      </p>
      <p
        className={cn(
          "font-display text-2xl sm:text-3xl leading-none",
          accent || "text-ink-900"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ItemRow({ item }: { item: AccountabilityItem }) {
  const overdue = isOverdue(item);

  let tone = "border-ink-200 bg-white";
  let pillTone = "bg-ink-100 text-ink-700 border-ink-200";
  let label: string = "Pending";
  let Icon = CircleDashed;
  let iconClass = "text-ink-400";

  if (item.status === "completed") {
    tone = "border-emerald-200 bg-emerald-50/40";
    pillTone = "bg-emerald-100 text-emerald-800 border-emerald-200";
    label = "Completed";
    Icon = CheckCircle2;
    iconClass = "text-emerald-600";
  } else if (overdue) {
    tone = "border-rose-200 bg-rose-50/40";
    pillTone = "bg-rose-100 text-rose-800 border-rose-200";
    label = item.status === "in_progress" ? "In progress · overdue" : "Overdue";
    Icon = AlertTriangle;
    iconClass = "text-rose-600";
  } else if (item.status === "in_progress") {
    tone = "border-amber-200 bg-amber-50/40";
    pillTone = "bg-amber-100 text-amber-800 border-amber-200";
    label = "In progress";
    Icon = Clock;
    iconClass = "text-amber-600";
  }

  return (
    <li className={cn("rounded-xl border px-4 sm:px-5 py-3.5 flex gap-4", tone)}>
      <Icon size={16} className={cn("mt-1 shrink-0", iconClass)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink-900 leading-snug">
          {item.description}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-500">
          <span>
            Owner:{" "}
            <span className="text-ink-800 font-medium">{item.assignee}</span>
          </span>
          {item.dueDate && (
            <span>
              Due{" "}
              <span className={cn(overdue ? "text-rose-700" : "text-ink-800")}>
                {fmtDateShort(item.dueDate)}
              </span>
            </span>
          )}
          {item.category && (
            <span className="inline-flex items-center rounded-full bg-ink-100 px-2 py-0.5 text-ink-600">
              {item.category}
            </span>
          )}
          <span className="text-ink-400">·</span>
          <Link
            href="/minutes"
            className="text-ink-500 hover:text-poly-navy"
            title={item.meeting.title || undefined}
          >
            from meeting on {fmtDateShort(item.meeting.date)}
          </Link>
        </div>
      </div>
      <span
        className={cn(
          "self-start shrink-0 inline-flex items-center text-[10px] font-medium uppercase tracking-[0.12em] px-2 py-1 rounded-full border whitespace-nowrap",
          pillTone
        )}
      >
        {label}
      </span>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-ink-300 px-6 py-16 text-center bg-ink-50/60">
      <CircleDashed size={28} className="mx-auto text-ink-400 mb-3" />
      <p className="font-display text-xl text-ink-800 mb-2">
        No action items on the books yet.
      </p>
      <p className="text-sm text-ink-500 max-w-md mx-auto leading-relaxed">
        Once the SGA logs its first meeting with action items, you&apos;ll
        see every promise here (owner, deadline, and status) color-coded
        so nothing slips.
      </p>
      <Link href="/minutes" className="mt-5 inline-flex btn-ghost">
        Browse meeting minutes
      </Link>
    </div>
  );
}
