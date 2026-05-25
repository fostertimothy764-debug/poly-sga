"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type LineDTO = {
  id: string;
  category: string;
  label: string;
  allocated: number;
  spent: number;
  note: string | null;
};

export type AdminPeriodDTO = {
  id: string;
  label: string;
  startsAt: string;
  endsAt: string;
  total: number;
  current: boolean;
  notes: string | null;
  updatedAt: string;
  lines: LineDTO[];
};

const CATEGORIES = [
  { value: "events", label: "Events" },
  { value: "operations", label: "Operations" },
  { value: "resources", label: "Resources" },
  { value: "reserves", label: "Reserves" },
  { value: "other", label: "Other" },
];

function fmtMoney(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function BudgetAdmin({ initial }: { initial: AdminPeriodDTO[] }) {
  const router = useRouter();
  const [periods, setPeriods] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  async function deletePeriod(id: string) {
    if (
      !confirm(
        "Delete this budget period and all its line items? This cannot be undone."
      )
    )
      return;
    const res = await fetch(`/api/budget?id=${id}`, { method: "DELETE" });
    if (!res.ok) return alert("Delete failed.");
    setPeriods((prev) => prev.filter((p) => p.id !== id));
    refresh();
  }

  async function setCurrent(id: string) {
    const res = await fetch("/api/budget", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, current: true }),
    });
    if (!res.ok) return alert("Could not set as current.");
    setPeriods((prev) =>
      prev.map((p) => ({ ...p, current: p.id === id }))
    );
    refresh();
  }

  return (
    <div className="container-page py-10 animate-fade-in">
      <Link
        href="/admin/transparency"
        className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-poly-navy mb-6"
      >
        <ArrowLeft size={12} />
        Back to transparency hub
      </Link>

      <header className="mb-8 pb-6 border-b border-ink-200 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-1">
            Admin
          </p>
          <h1 className="h-display text-3xl">Budget</h1>
          <p className="text-sm text-ink-500 mt-1">
            {periods.length} period{periods.length !== 1 ? "s" : ""} · public at{" "}
            <Link href="/budget" className="text-poly-navy hover:underline">
              /budget
            </Link>
          </p>
        </div>
        {!creating && (
          <button onClick={() => setCreating(true)} className="btn-accent">
            <Plus size={14} />
            New period
          </button>
        )}
      </header>

      {creating && (
        <PeriodForm
          onCancel={() => setCreating(false)}
          onSaved={(p) => {
            setPeriods((prev) =>
              p.current ? [p, ...prev.map((x) => ({ ...x, current: false }))] : [p, ...prev]
            );
            setCreating(false);
            refresh();
          }}
        />
      )}

      {periods.length === 0 && !creating && (
        <div className="rounded-2xl border border-dashed border-ink-300 px-6 py-12 text-center bg-ink-50/60">
          <Wallet size={28} className="mx-auto text-ink-400 mb-3" />
          <p className="font-display text-xl text-ink-800 mb-2">
            No budget periods yet.
          </p>
          <p className="text-sm text-ink-500 mb-4">
            Create your first semester budget to publish the page.
          </p>
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus size={14} />
            Add a period
          </button>
        </div>
      )}

      <ol className="space-y-3 mt-6">
        {periods.map((p) =>
          editingId === p.id ? (
            <li key={p.id}>
              <PeriodForm
                existing={p}
                onCancel={() => setEditingId(null)}
                onSaved={(saved) => {
                  setPeriods((prev) =>
                    prev.map((x) =>
                      x.id === saved.id
                        ? { ...saved, lines: x.lines }
                        : saved.current
                          ? { ...x, current: false }
                          : x
                    )
                  );
                  setEditingId(null);
                  refresh();
                }}
              />
            </li>
          ) : (
            <PeriodRow
              key={p.id}
              period={p}
              onEdit={() => setEditingId(p.id)}
              onDelete={() => deletePeriod(p.id)}
              onSetCurrent={() => setCurrent(p.id)}
              onLinesChange={(lines) => {
                setPeriods((prev) =>
                  prev.map((x) => (x.id === p.id ? { ...x, lines } : x))
                );
                refresh();
              }}
            />
          )
        )}
      </ol>
    </div>
  );
}

function PeriodRow({
  period,
  onEdit,
  onDelete,
  onSetCurrent,
  onLinesChange,
}: {
  period: AdminPeriodDTO;
  onEdit: () => void;
  onDelete: () => void;
  onSetCurrent: () => void;
  onLinesChange: (lines: LineDTO[]) => void;
}) {
  const [open, setOpen] = useState(period.current);
  const totals = {
    allocated: period.lines.reduce((s, l) => s + l.allocated, 0),
    spent: period.lines.reduce((s, l) => s + l.spent, 0),
  };

  return (
    <li className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex-1 text-left flex items-center gap-4"
          aria-expanded={open}
        >
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <p className="font-display text-base text-ink-900">{period.label}</p>
              {period.current && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border border-poly-orange/40 bg-poly-orange/10 text-poly-orangeDark">
                  <Star size={9} />
                  Current
                </span>
              )}
            </div>
            <p className="text-[11px] text-ink-500">
              {new Date(period.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – {new Date(period.endsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              <span className="mx-2 text-ink-300">·</span>
              {period.lines.length} line item{period.lines.length !== 1 ? "s" : ""}
              <span className="mx-2 text-ink-300">·</span>
              {fmtMoney(totals.spent)} / {fmtMoney(totals.allocated || period.total)}
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
        {!period.current && (
          <button
            onClick={onSetCurrent}
            className="text-ink-500 hover:text-poly-orange p-2"
            title="Set as current period"
          >
            <Star size={14} />
          </button>
        )}
        <button
          onClick={onEdit}
          className="text-ink-500 hover:text-poly-navy p-2"
          title="Edit period"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onDelete}
          className="text-ink-500 hover:text-rose-600 p-2"
          title="Delete period"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-100 px-5 py-4 bg-ink-50/40 animate-fade-in">
          <LinesManager
            periodId={period.id}
            lines={period.lines}
            onChange={onLinesChange}
          />
        </div>
      )}
    </li>
  );
}

function LinesManager({
  periodId,
  lines,
  onChange,
}: {
  periodId: string;
  lines: LineDTO[];
  onChange: (lines: LineDTO[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function addLine(values: {
    category: string;
    label: string;
    allocated: string;
    spent: string;
    note: string;
  }) {
    const res = await fetch("/api/budget/lines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        periodId,
        category: values.category,
        label: values.label,
        allocated: parseFloat(values.allocated || "0"),
        spent: parseFloat(values.spent || "0"),
        note: values.note || null,
      }),
    });
    if (!res.ok) throw new Error("Add failed");
    const created = await res.json();
    onChange([...lines, created]);
    setAdding(false);
  }

  async function updateLine(id: string, values: {
    category: string;
    label: string;
    allocated: string;
    spent: string;
    note: string;
  }) {
    const res = await fetch("/api/budget/lines", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        category: values.category,
        label: values.label,
        allocated: parseFloat(values.allocated || "0"),
        spent: parseFloat(values.spent || "0"),
        note: values.note || null,
      }),
    });
    if (!res.ok) throw new Error("Save failed");
    const updated = await res.json();
    onChange(lines.map((l) => (l.id === id ? updated : l)));
    setEditingId(null);
  }

  async function removeLine(id: string) {
    if (!confirm("Delete this line item?")) return;
    const res = await fetch(`/api/budget/lines?id=${id}`, { method: "DELETE" });
    if (!res.ok) return alert("Delete failed.");
    onChange(lines.filter((l) => l.id !== id));
  }

  const grouped = CATEGORIES.map((c) => ({
    ...c,
    lines: lines.filter((l) => l.category === c.value),
  })).filter((g) => g.lines.length > 0);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <p className="label text-ink-700">Line items</p>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-[11px] font-medium text-poly-navy hover:text-poly-navyDark inline-flex items-center gap-1"
          >
            <Plus size={12} />
            Add line
          </button>
        )}
      </div>

      {adding && (
        <LineForm
          onCancel={() => setAdding(false)}
          onSubmit={addLine}
        />
      )}

      {lines.length === 0 && !adding && (
        <p className="text-xs text-ink-500 italic">No line items yet.</p>
      )}

      <div className="space-y-4">
        {grouped.map((g) => (
          <section key={g.value}>
            <p className="text-[10px] uppercase tracking-[0.14em] text-ink-500 font-mono mb-2">
              {g.label}
            </p>
            <ul className="space-y-2">
              {g.lines.map((l) =>
                editingId === l.id ? (
                  <li key={l.id}>
                    <LineForm
                      existing={l}
                      onCancel={() => setEditingId(null)}
                      onSubmit={(v) => updateLine(l.id, v)}
                    />
                  </li>
                ) : (
                  <li
                    key={l.id}
                    className="rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 flex gap-3 items-center"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink-900">{l.label}</p>
                      {l.note && (
                        <p className="text-[11px] text-ink-500 mt-0.5">{l.note}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">{fmtMoney(l.spent)}</p>
                      <p className="text-[10px] text-ink-500">
                        of {fmtMoney(l.allocated)}
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingId(l.id)}
                      className="text-ink-500 hover:text-poly-navy p-1.5"
                      title="Edit"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => removeLine(l.id)}
                      className="text-ink-500 hover:text-rose-600 p-1.5"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </li>
                )
              )}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function LineForm({
  existing,
  onCancel,
  onSubmit,
}: {
  existing?: LineDTO;
  onCancel: () => void;
  onSubmit: (values: {
    category: string;
    label: string;
    allocated: string;
    spent: string;
    note: string;
  }) => Promise<void>;
}) {
  const [category, setCategory] = useState(existing?.category ?? "events");
  const [label, setLabel] = useState(existing?.label ?? "");
  const [allocated, setAllocated] = useState(
    existing ? String(existing.allocated) : ""
  );
  const [spent, setSpent] = useState(existing ? String(existing.spent) : "");
  const [note, setNote] = useState(existing?.note ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ category, label, allocated, spent, note });
    } catch {
      alert("Save failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-poly-navy/30 bg-white p-3.5 mb-3 grid gap-2.5 sm:grid-cols-[1fr_2fr_1fr_1fr_auto] items-end"
    >
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="input text-sm"
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Line item label"
        className="input text-sm"
        required
      />
      <input
        type="number"
        step="0.01"
        min="0"
        value={allocated}
        onChange={(e) => setAllocated(e.target.value)}
        placeholder="Allocated"
        className="input text-sm"
      />
      <input
        type="number"
        step="0.01"
        min="0"
        value={spent}
        onChange={(e) => setSpent(e.target.value)}
        placeholder="Spent"
        className="input text-sm"
      />
      <div className="flex gap-1">
        <button type="submit" className="btn-primary text-xs" disabled={submitting}>
          {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost text-xs">
          <X size={12} />
        </button>
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        className="input text-sm sm:col-span-5"
      />
    </form>
  );
}

function PeriodForm({
  existing,
  onCancel,
  onSaved,
}: {
  existing?: AdminPeriodDTO;
  onCancel: () => void;
  onSaved: (p: AdminPeriodDTO) => void;
}) {
  const [label, setLabel] = useState(existing?.label ?? "");
  const [startsAt, setStartsAt] = useState(
    existing ? existing.startsAt.slice(0, 10) : todayIso()
  );
  const [endsAt, setEndsAt] = useState(
    existing ? existing.endsAt.slice(0, 10) : ""
  );
  const [total, setTotal] = useState(existing ? String(existing.total) : "");
  const [current, setCurrent] = useState(existing?.current ?? false);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!label.trim() || !startsAt || !endsAt) {
      setError("Label, start, and end dates are required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        label,
        startsAt,
        endsAt,
        total: parseFloat(total || "0"),
        current,
        notes: notes.trim() || null,
      };
      if (existing) payload.id = existing.id;
      const res = await fetch("/api/budget", {
        method: existing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Save failed");
      }
      const saved = await res.json();
      onSaved({
        id: saved.id,
        label: saved.label,
        startsAt: saved.startsAt,
        endsAt: saved.endsAt,
        total: saved.total,
        current: saved.current,
        notes: saved.notes,
        updatedAt: saved.updatedAt,
        lines: existing?.lines ?? [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-poly-navy/30 bg-white p-5 sm:p-6 mb-6 animate-fade-in"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-lg">
          {existing ? "Edit period" : "New budget period"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-ink-500 hover:text-ink-800 p-1"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <label className="block">
          <span className="label">Label</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="input"
            placeholder="Fall 2026"
            maxLength={60}
            required
          />
        </label>
        <label className="block">
          <span className="label">Total budget</span>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 text-sm">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="input pl-7"
              placeholder="0.00"
            />
          </div>
        </label>
        <label className="block">
          <span className="label">Starts</span>
          <input
            type="date"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="input"
            required
          />
        </label>
        <label className="block">
          <span className="label">Ends</span>
          <input
            type="date"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="input"
            required
          />
        </label>
      </div>

      <label className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          checked={current}
          onChange={(e) => setCurrent(e.target.checked)}
          className="accent-poly-orange"
        />
        <span className="text-sm text-ink-700">
          Mark as current period (shown by default to public visitors)
        </span>
      </label>

      <label className="block mb-4">
        <span className="label">Officer notes (optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="input resize-y text-sm"
          placeholder="Context, caveats, or anything you want surfaced to students."
        />
      </label>

      {error && (
        <p className="mb-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          {existing ? "Save changes" : "Create period"}
        </button>
      </div>
    </form>
  );
}
