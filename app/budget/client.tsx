"use client";

import { useMemo, useState } from "react";
import { ChevronDown, DollarSign, PiggyBank, Receipt, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export type BudgetLineDTO = {
  id: string;
  category: string;
  label: string;
  allocated: number;
  spent: number;
  note: string | null;
};

export type BudgetPeriodDTO = {
  id: string;
  label: string;
  startsAt: string;
  endsAt: string;
  total: number;
  current: boolean;
  notes: string | null;
  updatedAt: string;
  lines: BudgetLineDTO[];
};

const CATEGORY_ORDER = ["events", "operations", "resources", "reserves", "other"] as const;
type Category = (typeof CATEGORY_ORDER)[number];

const CATEGORY_LABELS: Record<Category, string> = {
  events: "Events",
  operations: "Operations",
  resources: "Resources",
  reserves: "Reserves",
  other: "Other",
};

const CATEGORY_COLORS: Record<Category, string> = {
  events: "#f26522",      // poly orange
  operations: "#0a2342",   // poly navy
  resources: "#3E8E5A",    // poly green
  reserves: "#C68A1E",     // poly amber
  other: "#928c7e",        // ink-400
};

function fmtMoney(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  });
}

function fmtPct(num: number, denom: number) {
  if (denom === 0) return "0%";
  return `${Math.round((num / denom) * 100)}%`;
}

export default function BudgetClient({
  initial,
}: {
  initial: BudgetPeriodDTO[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const cur = initial.find((p) => p.current);
    return cur?.id ?? initial[0]?.id ?? null;
  });

  const selected = useMemo(
    () => initial.find((p) => p.id === selectedId) ?? null,
    [initial, selectedId]
  );

  if (initial.length === 0) {
    return (
      <div className="container-page py-10 sm:py-14">
        <header className="mb-10 pb-6 border-b border-ink-200">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-poly-orange mb-3">
            Transparency · the money trail
          </p>
          <h1 className="h-display text-4xl sm:text-5xl leading-tight mb-3">
            Budget.
          </h1>
          <p className="text-ink-600 max-w-2xl text-base leading-relaxed">
            Where your activity fee dollars land.
          </p>
        </header>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="mb-10 pb-6 border-b border-ink-200">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-poly-orange mb-3">
          Transparency · the money trail
        </p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="h-display text-4xl sm:text-5xl leading-tight mb-3">
              Where the money goes.
            </h1>
            <p className="text-ink-600 text-base leading-relaxed">
              Every line item, every dollar — for the current semester and
              every one before it.
            </p>
          </div>
          {/* Semester selector */}
          <label className="block">
            <span className="label">Semester</span>
            <div className="relative">
              <select
                value={selectedId ?? ""}
                onChange={(e) => setSelectedId(e.target.value)}
                className="input pr-10 min-w-[14rem] appearance-none"
              >
                {initial.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                    {p.current ? " · current" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
              />
            </div>
          </label>
        </div>
      </header>

      {selected && <PeriodView period={selected} />}
    </div>
  );
}

function PeriodView({ period }: { period: BudgetPeriodDTO }) {
  const totals = useMemo(() => {
    const allocated = period.lines.reduce((s, l) => s + l.allocated, 0);
    const spent = period.lines.reduce((s, l) => s + l.spent, 0);
    const total = period.total > 0 ? period.total : allocated;
    return { allocated, spent, total, remaining: total - spent };
  }, [period]);

  const byCategory = useMemo(() => {
    const map = new Map<string, { allocated: number; spent: number; lines: BudgetLineDTO[] }>();
    for (const cat of CATEGORY_ORDER) {
      map.set(cat, { allocated: 0, spent: 0, lines: [] });
    }
    for (const l of period.lines) {
      const key = (CATEGORY_ORDER.includes(l.category as Category) ? l.category : "other") as Category;
      const entry = map.get(key)!;
      entry.allocated += l.allocated;
      entry.spent += l.spent;
      entry.lines.push(l);
    }
    return map;
  }, [period]);

  const utilization = totals.total > 0 ? Math.round((totals.spent / totals.total) * 100) : 0;

  return (
    <>
      {/* Last updated callout */}
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3 text-xs">
        <p className="font-mono text-ink-500">
          {period.label} · {new Date(period.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – {new Date(period.endsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
        <p className="text-ink-500">
          Last updated{" "}
          <time
            className="text-ink-800 font-medium"
            dateTime={period.updatedAt}
          >
            {new Date(period.updatedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </time>
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-12">
        <StatCard
          icon={<Wallet size={16} />}
          label="Total budget"
          value={fmtMoney(totals.total)}
          accent="text-poly-navy"
        />
        <StatCard
          icon={<Receipt size={16} />}
          label="Spent"
          value={fmtMoney(totals.spent)}
          accent="text-poly-orange"
        />
        <StatCard
          icon={<PiggyBank size={16} />}
          label="Remaining"
          value={fmtMoney(Math.max(0, totals.remaining))}
          accent="text-emerald-700"
        />
        <StatCard
          icon={<DollarSign size={16} />}
          label="Utilized"
          value={`${utilization}%`}
          accent={utilization > 100 ? "text-rose-700" : "text-ink-900"}
          subline={
            <ProgressBar value={utilization} />
          }
        />
      </div>

      {/* Charts: pie (allocation) + bar (allocated vs spent) */}
      <div className="grid gap-6 lg:grid-cols-2 mb-12">
        <PieChartCard byCategory={byCategory} total={totals.allocated} />
        <BarChartCard byCategory={byCategory} />
      </div>

      {/* Category accordion with line items */}
      <section className="space-y-3 mb-10">
        <h2 className="label text-ink-700 mb-1">Line items</h2>
        {CATEGORY_ORDER.map((cat) => {
          const entry = byCategory.get(cat)!;
          if (entry.lines.length === 0) return null;
          return (
            <CategoryGroup
              key={cat}
              category={cat}
              entry={entry}
            />
          );
        })}
        {period.lines.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ink-300 px-6 py-12 text-center bg-ink-50/60">
            <p className="text-sm text-ink-500">
              No line items posted for {period.label} yet.
            </p>
          </div>
        )}
      </section>

      {period.notes && (
        <section className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
          <h3 className="label text-ink-700 mb-2">Officer notes</h3>
          <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-line">
            {period.notes}
          </p>
        </section>
      )}
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
  subline,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
  subline?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <div className="flex items-center gap-2 text-ink-500 text-[11px] uppercase tracking-[0.14em] mb-2">
        {icon}
        {label}
      </div>
      <p
        className={cn(
          "font-display text-3xl leading-none",
          accent || "text-ink-900"
        )}
      >
        {value}
      </p>
      {subline && <div className="mt-3">{subline}</div>}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const over = value > 100;
  return (
    <div className="space-y-1.5">
      <div className="h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            over ? "bg-rose-500" : "bg-poly-orange"
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {over && (
        <p className="text-[11px] text-rose-700">
          Over budget by {value - 100}%
        </p>
      )}
    </div>
  );
}

function PieChartCard({
  byCategory,
  total,
}: {
  byCategory: Map<string, { allocated: number; spent: number; lines: BudgetLineDTO[] }>;
  total: number;
}) {
  const slices = CATEGORY_ORDER.map((c) => ({
    cat: c,
    value: byCategory.get(c)?.allocated ?? 0,
  })).filter((s) => s.value > 0);

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
      <h3 className="label text-ink-700 mb-1">Allocation</h3>
      <p className="text-xs text-ink-500 mb-5">Share of the budget set aside per category.</p>
      {slices.length === 0 ? (
        <p className="text-sm text-ink-500 italic">No allocations posted.</p>
      ) : (
        <div className="grid sm:grid-cols-[180px_1fr] gap-6 items-center">
          <PieSvg slices={slices} total={total} />
          <ul className="space-y-2.5 text-sm">
            {slices.map((s) => {
              const cat = s.cat as Category;
              return (
                <li key={s.cat} className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                  />
                  <span className="flex-1 text-ink-700">{CATEGORY_LABELS[cat]}</span>
                  <span className="font-mono text-xs text-ink-500">
                    {fmtPct(s.value, total)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function PieSvg({
  slices,
  total,
}: {
  slices: { cat: string; value: number }[];
  total: number;
}) {
  const size = 180;
  const r = 78;
  const cx = size / 2;
  const cy = size / 2;
  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="#eeede9" />
      </svg>
    );
  }

  let cumulative = 0;
  const paths = slices.map((s) => {
    const startAngle = (cumulative / total) * Math.PI * 2 - Math.PI / 2;
    cumulative += s.value;
    const endAngle = (cumulative / total) * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    // For a single slice == full pie, draw two arcs to avoid degenerate path
    const d =
      slices.length === 1
        ? `M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} Z`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { d, color: CATEGORY_COLORS[s.cat as Category] };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Budget allocation pie chart"
    >
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} stroke="#fff" strokeWidth={2} />
      ))}
      <circle cx={cx} cy={cy} r={32} fill="#fff" />
      <text
        x={cx}
        y={cy - 2}
        textAnchor="middle"
        className="fill-ink-500"
        style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase" }}
      >
        Total
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        className="fill-ink-900"
        style={{ fontSize: 14, fontWeight: 600 }}
      >
        {fmtMoney(total)}
      </text>
    </svg>
  );
}

function BarChartCard({
  byCategory,
}: {
  byCategory: Map<string, { allocated: number; spent: number; lines: BudgetLineDTO[] }>;
}) {
  const rows = CATEGORY_ORDER.map((c) => ({
    cat: c,
    allocated: byCategory.get(c)?.allocated ?? 0,
    spent: byCategory.get(c)?.spent ?? 0,
  })).filter((r) => r.allocated > 0 || r.spent > 0);

  const max = Math.max(1, ...rows.map((r) => Math.max(r.allocated, r.spent)));

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
      <h3 className="label text-ink-700 mb-1">Allocated vs spent</h3>
      <p className="text-xs text-ink-500 mb-5">
        Where we&apos;ve actually moved money compared to the plan.
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-500 italic">No category data posted.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => {
            const cat = r.cat as Category;
            const allocPct = (r.allocated / max) * 100;
            const spentPct = (r.spent / max) * 100;
            const over = r.spent > r.allocated && r.allocated > 0;
            return (
              <li key={r.cat}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-sm font-medium text-ink-800">
                    {CATEGORY_LABELS[cat]}
                  </span>
                  <span className="font-mono text-[11px] text-ink-500">
                    {fmtMoney(r.spent)} / {fmtMoney(r.allocated)}
                  </span>
                </div>
                <div className="relative h-6 rounded-md bg-ink-50 overflow-hidden border border-ink-100">
                  <div
                    className="absolute inset-y-0 left-0 rounded-md"
                    style={{
                      width: `${allocPct}%`,
                      backgroundColor: CATEGORY_COLORS[cat],
                      opacity: 0.18,
                    }}
                    aria-label={`Allocated ${fmtMoney(r.allocated)}`}
                  />
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-md transition-all",
                      over && "ring-1 ring-rose-400"
                    )}
                    style={{
                      width: `${spentPct}%`,
                      backgroundColor: CATEGORY_COLORS[cat],
                    }}
                    aria-label={`Spent ${fmtMoney(r.spent)}`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-5 flex flex-wrap items-center gap-3 text-[11px] text-ink-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-sm bg-poly-navy opacity-20" />
          Allocated
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-sm bg-poly-navy" />
          Spent
        </span>
      </p>
    </div>
  );
}

function CategoryGroup({
  category,
  entry,
}: {
  category: Category;
  entry: { allocated: number; spent: number; lines: BudgetLineDTO[] };
}) {
  const [open, setOpen] = useState(false);
  const remaining = entry.allocated - entry.spent;
  const utilization = entry.allocated > 0 ? Math.round((entry.spent / entry.allocated) * 100) : 0;

  return (
    <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-ink-50/60 transition-colors"
        aria-expanded={open}
      >
        <span
          className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: CATEGORY_COLORS[category] }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-display text-base text-ink-900">
            {CATEGORY_LABELS[category]}
          </p>
          <p className="text-[11px] text-ink-500 mt-0.5">
            {entry.lines.length} line item{entry.lines.length !== 1 ? "s" : ""} · {utilization}% utilized
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="font-mono text-sm text-ink-900">{fmtMoney(entry.spent)}</p>
          <p className="text-[11px] text-ink-500">
            of {fmtMoney(entry.allocated)}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={cn(
            "text-ink-400 transition-transform shrink-0",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="border-t border-ink-100 px-5 py-4 animate-fade-in">
          <ul className="divide-y divide-ink-100">
            {entry.lines.map((l) => {
              const lineUtil = l.allocated > 0 ? Math.round((l.spent / l.allocated) * 100) : 0;
              const lineOver = l.spent > l.allocated && l.allocated > 0;
              return (
                <li key={l.id} className="py-3 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink-900">{l.label}</p>
                    {l.note && (
                      <p className="text-xs text-ink-500 mt-0.5">{l.note}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm text-ink-900">
                      {fmtMoney(l.spent)}
                    </p>
                    <p
                      className={cn(
                        "text-[11px]",
                        lineOver ? "text-rose-600" : "text-ink-500"
                      )}
                    >
                      of {fmtMoney(l.allocated)} · {lineUtil}%
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between text-xs">
            <span className="text-ink-500">
              {remaining >= 0 ? "Remaining" : "Over by"}
            </span>
            <span
              className={cn(
                "font-mono",
                remaining < 0 ? "text-rose-700" : "text-emerald-700"
              )}
            >
              {fmtMoney(Math.abs(remaining))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-ink-300 px-6 py-16 text-center bg-ink-50/60">
      <Wallet size={28} className="mx-auto text-ink-400 mb-3" />
      <p className="font-display text-xl text-ink-800 mb-2">
        No budget period posted yet.
      </p>
      <p className="text-sm text-ink-500 max-w-md mx-auto leading-relaxed">
        Once your SGA publishes a semester budget, you&apos;ll see allocation,
        spend, and remaining balance — broken down line by line.
      </p>
    </div>
  );
}
