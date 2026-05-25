"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Loader2,
  Pencil,
  Pin,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ActionItemDTO = {
  id: string;
  description: string;
  assignee: string;
  dueDate: string | null;
  status: string;
  category: string | null;
};

export type AdminMeetingDTO = {
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
  { value: "general", label: "General" },
  { value: "executive", label: "Executive" },
  { value: "emergency", label: "Emergency" },
];

const ACTION_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MinutesAdmin({ initial }: { initial: AdminMeetingDTO[] }) {
  const router = useRouter();
  const [meetings, setMeetings] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  async function deleteMeeting(id: string) {
    if (!confirm("Delete this meeting and all its action items? This cannot be undone.")) return;
    const res = await fetch(`/api/minutes?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Delete failed.");
      return;
    }
    setMeetings((prev) => prev.filter((m) => m.id !== id));
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
          <h1 className="h-display text-3xl">Meeting minutes</h1>
          <p className="text-sm text-ink-500 mt-1">
            {meetings.length} on the record · public at{" "}
            <Link href="/minutes" className="text-poly-navy hover:underline">
              /minutes
            </Link>
          </p>
        </div>
        {!creating && (
          <button onClick={() => setCreating(true)} className="btn-accent">
            <Plus size={14} />
            New meeting
          </button>
        )}
      </header>

      {creating && (
        <MeetingForm
          onCancel={() => setCreating(false)}
          onSaved={(m) => {
            setMeetings((prev) => [m, ...prev]);
            setCreating(false);
            refresh();
          }}
        />
      )}

      {meetings.length === 0 && !creating && (
        <div className="rounded-2xl border border-dashed border-ink-300 px-6 py-12 text-center bg-ink-50/60">
          <CalendarDays size={28} className="mx-auto text-ink-400 mb-3" />
          <p className="font-display text-xl text-ink-800 mb-2">No meetings yet.</p>
          <p className="text-sm text-ink-500 mb-4">
            Log your first meeting to start the public record.
          </p>
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus size={14} />
            Add a meeting
          </button>
        </div>
      )}

      <ol className="space-y-3 mt-6">
        {meetings.map((m) =>
          editingId === m.id ? (
            <li key={m.id}>
              <MeetingForm
                existing={m}
                onCancel={() => setEditingId(null)}
                onSaved={(updated) => {
                  setMeetings((prev) =>
                    prev.map((x) => (x.id === updated.id ? updated : x))
                  );
                  setEditingId(null);
                  refresh();
                }}
              />
            </li>
          ) : (
            <MeetingRow
              key={m.id}
              meeting={m}
              onEdit={() => setEditingId(m.id)}
              onDelete={() => deleteMeeting(m.id)}
              onActionChange={(updatedItems) => {
                setMeetings((prev) =>
                  prev.map((x) => (x.id === m.id ? { ...x, actionItems: updatedItems } : x))
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

function MeetingRow({
  meeting,
  onEdit,
  onDelete,
  onActionChange,
}: {
  meeting: AdminMeetingDTO;
  onEdit: () => void;
  onDelete: () => void;
  onActionChange: (items: ActionItemDTO[]) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex-1 text-left flex items-center gap-4"
          aria-expanded={open}
        >
          <div className="flex flex-col items-center justify-center w-12 rounded-lg border border-ink-200 bg-ink-50 py-1.5">
            <span className="text-[9px] uppercase tracking-[0.14em] text-ink-500">
              {new Date(meeting.date).toLocaleDateString("en-US", { month: "short" })}
            </span>
            <span className="font-display text-lg text-poly-navy leading-none">
              {new Date(meeting.date).getDate()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {meeting.pinned && (
                <Pin size={11} className="text-poly-orange" />
              )}
              <span className="text-[10px] uppercase tracking-[0.12em] text-ink-500 font-mono">
                {meeting.type}
              </span>
              <span className="text-[10px] text-ink-400">·</span>
              <span className="text-[10px] text-ink-500">
                {meeting.actionItems.length} action item
                {meeting.actionItems.length !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="font-display text-base text-ink-900 truncate">
              {meeting.title || `${meeting.type[0].toUpperCase() + meeting.type.slice(1)} meeting`}
              <span className="text-ink-500 font-sans text-sm ml-2 font-normal">
                · {fmtDateShort(meeting.date)}
              </span>
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
        <button
          onClick={onEdit}
          className="text-ink-500 hover:text-poly-navy p-2"
          title="Edit meeting"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onDelete}
          className="text-ink-500 hover:text-rose-600 p-2"
          title="Delete meeting"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-100 px-5 py-4 bg-ink-50/40 animate-fade-in space-y-5">
          <SectionPreview label="Attendees" body={meeting.attendees} bullet />
          <SectionPreview label="Agenda" body={meeting.agenda} bullet />
          <SectionPreview
            label="Decisions"
            body={meeting.decisions}
            bullet
            tone="orange"
          />
          {meeting.notes && <SectionPreview label="Notes" body={meeting.notes} />}

          <ActionItemsManager
            meetingId={meeting.id}
            items={meeting.actionItems}
            onChange={onActionChange}
          />
        </div>
      )}
    </li>
  );
}

function SectionPreview({
  label,
  body,
  bullet,
  tone,
}: {
  label: string;
  body: string;
  bullet?: boolean;
  tone?: "orange";
}) {
  if (!body.trim()) return null;
  const lines = bullet
    ? body
        .split("\n")
        .map((l) => l.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean)
    : null;

  return (
    <div>
      <p
        className={cn(
          "label mb-2",
          tone === "orange" ? "text-poly-orangeDark" : "text-ink-700"
        )}
      >
        {label}
      </p>
      {lines ? (
        <ul className="space-y-1.5">
          {lines.map((l, i) => (
            <li
              key={i}
              className={cn(
                "text-sm leading-relaxed",
                tone === "orange"
                  ? "rounded-md border-l-2 border-poly-orange/60 bg-poly-orange/[0.06] pl-3 py-1"
                  : "pl-4 relative text-ink-800"
              )}
            >
              {!tone && (
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-ink-400" />
              )}
              {l}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-700 whitespace-pre-line leading-relaxed">{body}</p>
      )}
    </div>
  );
}

function ActionItemsManager({
  meetingId,
  items,
  onChange,
}: {
  meetingId: string;
  items: ActionItemDTO[];
  onChange: (items: ActionItemDTO[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/action-items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed");
      onChange(items.map((it) => (it.id === id ? { ...it, status } : it)));
    } catch {
      alert("Status update failed.");
    } finally {
      setBusy(null);
    }
  }

  async function removeItem(id: string) {
    if (!confirm("Delete this action item?")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/action-items?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      onChange(items.filter((it) => it.id !== id));
    } catch {
      alert("Delete failed.");
    } finally {
      setBusy(null);
    }
  }

  async function addItem(values: {
    description: string;
    assignee: string;
    dueDate: string;
    category: string;
  }) {
    const res = await fetch("/api/action-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        meetingId,
        description: values.description,
        assignee: values.assignee,
        dueDate: values.dueDate || null,
        category: values.category || null,
      }),
    });
    if (!res.ok) throw new Error("Add failed");
    const created = await res.json();
    onChange([
      ...items,
      {
        id: created.id,
        description: created.description,
        assignee: created.assignee,
        dueDate: created.dueDate,
        status: created.status,
        category: created.category,
      },
    ]);
    setAdding(false);
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <p className="label text-ink-700">Action items</p>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-[11px] font-medium text-poly-navy hover:text-poly-navyDark inline-flex items-center gap-1"
          >
            <Plus size={12} />
            Add
          </button>
        )}
      </div>

      {adding && (
        <ActionItemForm
          onCancel={() => setAdding(false)}
          onSubmit={addItem}
        />
      )}

      {items.length === 0 && !adding && (
        <p className="text-xs text-ink-500 italic">No action items yet.</p>
      )}

      <ul className="space-y-2">
        {items.map((a) => (
          <li
            key={a.id}
            className="rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 flex gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-ink-900 leading-snug">
                {a.description}
              </p>
              <p className="text-[11px] text-ink-500 mt-0.5">
                {a.assignee}
                {a.dueDate && (
                  <>
                    <span className="mx-1.5">·</span>
                    Due {fmtDateShort(a.dueDate)}
                  </>
                )}
                {a.category && (
                  <>
                    <span className="mx-1.5">·</span>
                    {a.category}
                  </>
                )}
              </p>
            </div>
            <select
              value={a.status}
              onChange={(e) => updateStatus(a.id, e.target.value)}
              disabled={busy === a.id}
              className="text-[11px] rounded-lg border border-ink-200 bg-ink-50 px-2 py-1"
            >
              {ACTION_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => removeItem(a.id)}
              disabled={busy === a.id}
              className="text-ink-500 hover:text-rose-600 p-1.5"
              title="Remove action item"
            >
              <Trash2 size={12} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActionItemForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (values: {
    description: string;
    assignee: string;
    dueDate: string;
    category: string;
  }) => Promise<void>;
}) {
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || !assignee.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ description, assignee, dueDate, category });
    } catch {
      alert("Failed to add action item.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-poly-navy/30 bg-poly-navy/[0.03] p-3.5 mb-3 grid gap-2.5 sm:grid-cols-2"
    >
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What needs to happen?"
        className="input sm:col-span-2 text-sm"
        required
      />
      <input
        value={assignee}
        onChange={(e) => setAssignee(e.target.value)}
        placeholder="Officer name"
        className="input text-sm"
        required
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="input text-sm"
      />
      <input
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Category (optional)"
        className="input text-sm sm:col-span-2"
      />
      <div className="sm:col-span-2 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-ghost text-xs">
          Cancel
        </button>
        <button type="submit" className="btn-primary text-xs" disabled={submitting}>
          {submitting ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          Add action item
        </button>
      </div>
    </form>
  );
}

function MeetingForm({
  existing,
  onCancel,
  onSaved,
}: {
  existing?: AdminMeetingDTO;
  onCancel: () => void;
  onSaved: (m: AdminMeetingDTO) => void;
}) {
  const [date, setDate] = useState(
    existing ? existing.date.slice(0, 10) : todayIso()
  );
  const [type, setType] = useState(existing?.type ?? "general");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [attendees, setAttendees] = useState(existing?.attendees ?? "");
  const [agenda, setAgenda] = useState(existing?.agenda ?? "");
  const [decisions, setDecisions] = useState(existing?.decisions ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [pinned, setPinned] = useState(existing?.pinned ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Only used when creating a new meeting — action items can be added inline below
  const [draftItems, setDraftItems] = useState<
    { description: string; assignee: string; dueDate: string; category: string }[]
  >([]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!attendees.trim()) {
      setError("List at least one attendee.");
      return;
    }
    if (!agenda.trim() && !decisions.trim()) {
      setError("Add an agenda or some decisions.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        date,
        type,
        title: title.trim() || null,
        attendees,
        agenda,
        decisions,
        notes: notes.trim() || null,
        pinned,
      };
      if (existing) {
        payload.id = existing.id;
      } else {
        payload.actionItems = draftItems.filter(
          (i) => i.description.trim() && i.assignee.trim()
        );
      }
      const res = await fetch("/api/minutes", {
        method: existing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Save failed");
      }
      const saved = await res.json();
      const dto: AdminMeetingDTO = {
        id: saved.id,
        date: saved.date,
        type: saved.type,
        title: saved.title,
        attendees: saved.attendees,
        agenda: saved.agenda,
        decisions: saved.decisions,
        notes: saved.notes,
        pinned: saved.pinned,
        authorName: saved.authorName,
        actionItems: (saved.actionItems ?? []).map((a: ActionItemDTO) => ({
          id: a.id,
          description: a.description,
          assignee: a.assignee,
          dueDate: a.dueDate,
          status: a.status,
          category: a.category,
        })),
      };
      onSaved(dto);
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
          {existing ? "Edit meeting" : "New meeting"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-ink-500 hover:text-ink-800 p-1"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <label className="block">
          <span className="label">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
            required
          />
        </label>
        <label className="block">
          <span className="label">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="input"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 mt-7">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="accent-poly-orange"
          />
          <span className="text-sm text-ink-700">Pin to top of public list</span>
        </label>
      </div>

      <label className="block mb-4">
        <span className="label">Title (optional)</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Mid-semester check-in"
          className="input"
          maxLength={160}
        />
      </label>

      <label className="block mb-4">
        <span className="label">Officers present</span>
        <textarea
          value={attendees}
          onChange={(e) => setAttendees(e.target.value)}
          rows={3}
          className="input resize-y font-mono text-sm"
          placeholder={"One name per line\nMaya Patel\nDevon Rivers"}
        />
      </label>

      <label className="block mb-4">
        <span className="label">Agenda</span>
        <textarea
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)}
          rows={4}
          className="input resize-y font-mono text-sm"
          placeholder={"One item per line\nReview cafeteria survey results\nDiscuss homecoming budget"}
        />
      </label>

      <label className="block mb-4">
        <span className="label">Decisions made</span>
        <textarea
          value={decisions}
          onChange={(e) => setDecisions(e.target.value)}
          rows={4}
          className="input resize-y font-mono text-sm"
          placeholder={"One per line — these get highlighted on the public page"}
        />
        <span className="text-[11px] text-ink-500 mt-1 block">
          Highlighted on the public minutes page.
        </span>
      </label>

      <label className="block mb-5">
        <span className="label">Notes (optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="input resize-y text-sm"
          placeholder="Free-form notes, attendance issues, side conversations, etc."
        />
      </label>

      {!existing && (
        <DraftActionItems items={draftItems} onChange={setDraftItems} />
      )}

      {error && (
        <p className="mb-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 mt-2">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save size={14} />
              {existing ? "Save changes" : "Publish meeting"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function DraftActionItems({
  items,
  onChange,
}: {
  items: { description: string; assignee: string; dueDate: string; category: string }[];
  onChange: (
    items: { description: string; assignee: string; dueDate: string; category: string }[]
  ) => void;
}) {
  function update(idx: number, key: string, value: string) {
    onChange(items.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));
  }
  function add() {
    onChange([...items, { description: "", assignee: "", dueDate: "", category: "" }]);
  }
  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  return (
    <div className="mb-5 rounded-xl border border-dashed border-ink-300 px-4 py-4">
      <div className="flex items-baseline justify-between mb-3">
        <p className="label text-ink-700">Action items (optional)</p>
        <button
          type="button"
          onClick={add}
          className="text-[11px] font-medium text-poly-navy hover:text-poly-navyDark inline-flex items-center gap-1"
        >
          <Plus size={12} />
          Add row
        </button>
      </div>
      {items.length === 0 && (
        <p className="text-xs text-ink-500 italic">
          Add action items now, or attach them after the meeting is published.
        </p>
      )}
      {items.map((it, idx) => (
        <div key={idx} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] mb-2.5">
          <input
            value={it.description}
            onChange={(e) => update(idx, "description", e.target.value)}
            placeholder="Description"
            className="input text-sm"
          />
          <input
            value={it.assignee}
            onChange={(e) => update(idx, "assignee", e.target.value)}
            placeholder="Owner"
            className="input text-sm"
          />
          <input
            type="date"
            value={it.dueDate}
            onChange={(e) => update(idx, "dueDate", e.target.value)}
            className="input text-sm"
          />
          <input
            value={it.category}
            onChange={(e) => update(idx, "category", e.target.value)}
            placeholder="Category"
            className="input text-sm"
          />
          <button
            type="button"
            onClick={() => remove(idx)}
            className="text-ink-500 hover:text-rose-600 p-1.5 self-center"
            title="Remove row"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
