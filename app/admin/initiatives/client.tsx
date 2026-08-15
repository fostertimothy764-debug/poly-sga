"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Inbox,
  Lightbulb,
  Loader2,
  MessageSquarePlus,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { cn, relativeTime } from "@/lib/utils";

type InitiativeUpdate = {
  id: string;
  body: string;
  authorName: string | null;
  createdAt: string;
};

export type AdminInitiativeDTO = {
  id: string;
  title: string;
  description: string;
  owner: string;
  column: string;
  category: string;
  startedAt: string | null;
  expectedAt: string | null;
  completedAt: string | null;
  updates: InitiativeUpdate[];
};

export type SuggestionDTO = {
  id: string;
  title: string;
  description: string;
  submitterName: string | null;
  submitterGrade: string | null;
  status: string;
  reviewerNote: string | null;
  createdAt: string;
};

const COLUMNS = [
  { value: "proposed", label: "Proposed" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const CATEGORIES = [
  { value: "academic", label: "Academic" },
  { value: "facilities", label: "Facilities" },
  { value: "events", label: "Events" },
  { value: "policy", label: "Policy" },
  { value: "resources", label: "Resources" },
];

export default function InitiativesAdmin({
  initiatives,
  suggestions,
}: {
  initiatives: AdminInitiativeDTO[];
  suggestions: SuggestionDTO[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initiatives);
  const [sugs, setSugs] = useState(suggestions);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<"board" | "suggestions">("board");

  function refresh() {
    router.refresh();
  }

  async function moveColumn(id: string, column: string) {
    const previous = items;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, column } : i)));
    try {
      const res = await fetch("/api/initiatives", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, column }),
      });
      if (!res.ok) throw new Error("Move failed");
      const updated = await res.json();
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated, updates: i.updates } : i)));
      refresh();
    } catch {
      setItems(previous);
      alert("Move failed.");
    }
  }

  async function deleteInit(id: string) {
    if (!confirm("Delete this initiative? All updates will be removed too.")) return;
    const res = await fetch(`/api/initiatives?id=${id}`, { method: "DELETE" });
    if (!res.ok) return alert("Delete failed.");
    setItems((prev) => prev.filter((i) => i.id !== id));
    refresh();
  }

  async function reviewSuggestion(id: string, status: string, note?: string) {
    const res = await fetch("/api/initiative-suggestions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, reviewerNote: note ?? null }),
    });
    if (!res.ok) return alert("Update failed.");
    const updated = await res.json();
    setSugs((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    refresh();
  }

  async function deleteSug(id: string) {
    if (!confirm("Delete this suggestion?")) return;
    const res = await fetch(`/api/initiative-suggestions?id=${id}`, { method: "DELETE" });
    if (!res.ok) return alert("Delete failed.");
    setSugs((prev) => prev.filter((s) => s.id !== id));
    refresh();
  }

  function promoteToInitiative(sug: SuggestionDTO) {
    // Open creation form pre-filled with the suggestion
    setCreating(true);
    setPrefill({
      title: sug.title,
      description:
        sug.description +
        `\n\nOriginally suggested by ${sug.submitterName || "an anonymous student"}${sug.submitterGrade ? ` (Grade ${sug.submitterGrade})` : ""}.`,
    });
    setTab("board");
  }

  const [prefill, setPrefill] = useState<{ title: string; description: string } | null>(null);

  const pendingCount = sugs.filter((s) => s.status === "pending").length;

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
          <h1 className="h-display text-3xl">Initiatives</h1>
          <p className="text-sm text-ink-500 mt-1">
            {items.length} on the board · public at{" "}
            <Link href="/initiatives" className="text-poly-navy hover:underline">
              /initiatives
            </Link>
          </p>
        </div>
        {!creating && (
          <button onClick={() => setCreating(true)} className="btn-accent">
            <Plus size={14} />
            New initiative
          </button>
        )}
      </header>

      <div className="flex gap-1 p-1 rounded-full bg-ink-100 w-fit mb-6">
        <TabBtn
          active={tab === "board"}
          onClick={() => setTab("board")}
          label="Board"
        />
        <TabBtn
          active={tab === "suggestions"}
          onClick={() => setTab("suggestions")}
          label="Suggestions"
          badge={pendingCount}
        />
      </div>

      {creating && (
        <InitiativeForm
          prefill={prefill}
          onCancel={() => {
            setCreating(false);
            setPrefill(null);
          }}
          onSaved={(it) => {
            setItems((prev) => [it, ...prev]);
            setCreating(false);
            setPrefill(null);
            refresh();
          }}
        />
      )}

      {tab === "board" && (
        <BoardView
          items={items}
          onMove={moveColumn}
          onDelete={deleteInit}
          onUpdate={(updated) => {
            setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
            refresh();
          }}
        />
      )}

      {tab === "suggestions" && (
        <SuggestionsView
          items={sugs}
          onReview={reviewSuggestion}
          onDelete={deleteSug}
          onPromote={promoteToInitiative}
        />
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-colors",
        active ? "bg-white text-ink-900" : "text-ink-600 hover:text-ink-900"
      )}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="inline-flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-poly-orange text-white text-[9px] font-bold">
          {badge}
        </span>
      )}
    </button>
  );
}

function BoardView({
  items,
  onMove,
  onDelete,
  onUpdate,
}: {
  items: AdminInitiativeDTO[];
  onMove: (id: string, column: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (item: AdminInitiativeDTO) => void;
}) {
  const grouped = COLUMNS.map((c) => ({
    ...c,
    items: items.filter((i) => i.column === c.value),
  }));

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {grouped.map((col) => (
        <section
          key={col.value}
          className="rounded-2xl border border-ink-200 bg-white/60 p-4"
        >
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-base">{col.label}</h2>
            <span className="font-mono text-[11px] text-ink-500">
              {col.items.length}
            </span>
          </div>
          <ul className="space-y-3">
            {col.items.map((i) => (
              <InitiativeCard
                key={i.id}
                item={i}
                onMove={(c) => onMove(i.id, c)}
                onDelete={() => onDelete(i.id)}
                onUpdate={onUpdate}
              />
            ))}
            {col.items.length === 0 && (
              <li className="rounded-xl border border-dashed border-ink-200 px-3 py-6 text-center text-xs text-ink-500">
                Empty.
              </li>
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}

function InitiativeCard({
  item,
  onMove,
  onDelete,
  onUpdate,
}: {
  item: AdminInitiativeDTO;
  onMove: (column: string) => void;
  onDelete: () => void;
  onUpdate: (item: AdminInitiativeDTO) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [updateText, setUpdateText] = useState("");

  async function postUpdate() {
    const text = updateText.trim();
    if (!text) return;
    setPostingUpdate(true);
    try {
      const res = await fetch("/api/initiatives/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initiativeId: item.id, body: text }),
      });
      if (!res.ok) throw new Error("Failed");
      const created = await res.json();
      onUpdate({
        ...item,
        updates: [
          {
            id: created.id,
            body: created.body,
            authorName: created.authorName,
            createdAt: created.createdAt,
          },
          ...item.updates,
        ],
      });
      setUpdateText("");
    } catch {
      alert("Could not post update.");
    } finally {
      setPostingUpdate(false);
    }
  }

  async function deleteUpdate(uid: string) {
    if (!confirm("Delete this update?")) return;
    const res = await fetch(`/api/initiatives/updates?id=${uid}`, { method: "DELETE" });
    if (!res.ok) return alert("Failed.");
    onUpdate({ ...item, updates: item.updates.filter((u) => u.id !== uid) });
  }

  if (editing) {
    return (
      <li>
        <InitiativeForm
          existing={item}
          inline
          onCancel={() => setEditing(false)}
          onSaved={(saved) => {
            onUpdate({ ...saved, updates: item.updates });
            setEditing(false);
          }}
        />
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-ink-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-3.5 py-3 hover:bg-ink-50/60 transition-colors"
        aria-expanded={open}
      >
        <p className="text-[10px] uppercase tracking-[0.12em] text-ink-500 font-mono mb-1">
          {item.category}
        </p>
        <p className="font-display text-sm leading-snug">{item.title}</p>
        <p className="text-[11px] text-ink-500 mt-1">{item.owner}</p>
      </button>
      {open && (
        <div className="border-t border-ink-100 px-3.5 py-3 bg-ink-50/40 space-y-3 animate-fade-in">
          <p className="text-xs text-ink-700 leading-relaxed whitespace-pre-line">
            {item.description}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={item.column}
              onChange={(e) => onMove(e.target.value)}
              className="text-[11px] rounded-lg border border-ink-200 bg-white px-2 py-1"
            >
              {COLUMNS.map((c) => (
                <option key={c.value} value={c.value}>
                  Move to {c.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setEditing(true)}
              className="text-[11px] font-medium text-poly-navy hover:text-poly-navyDark inline-flex items-center gap-1"
            >
              <Pencil size={11} />
              Edit
            </button>
            <button
              onClick={onDelete}
              className="text-[11px] font-medium text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 ml-auto"
            >
              <Trash2 size={11} />
              Delete
            </button>
          </div>

          {/* Add update */}
          <div className="rounded-lg border border-dashed border-ink-200 p-2.5 bg-white">
            <div className="flex items-center gap-1.5 mb-1.5 text-[10px] uppercase tracking-[0.12em] text-ink-500 font-mono">
              <MessageSquarePlus size={11} />
              Post update
            </div>
            <textarea
              value={updateText}
              onChange={(e) => setUpdateText(e.target.value)}
              rows={2}
              placeholder="What's the progress?"
              className="w-full text-xs rounded-md border border-ink-200 px-2 py-1.5 resize-y"
              maxLength={1000}
            />
            <div className="mt-1.5 flex justify-end">
              <button
                onClick={postUpdate}
                disabled={postingUpdate || !updateText.trim()}
                className="btn-primary text-[11px] py-1.5 px-3"
              >
                {postingUpdate ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                Post
              </button>
            </div>
          </div>

          {item.updates.length > 0 && (
            <ol className="space-y-2">
              {item.updates.map((u) => (
                <li
                  key={u.id}
                  className="rounded-lg border-l-2 border-poly-navy/30 pl-2.5 py-1 text-xs text-ink-700"
                >
                  <p className="whitespace-pre-line leading-relaxed">{u.body}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-ink-500">
                      {u.authorName || "SGA"} · {relativeTime(u.createdAt)}
                    </span>
                    <button
                      onClick={() => deleteUpdate(u.id)}
                      className="text-[10px] text-ink-400 hover:text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </li>
  );
}

function InitiativeForm({
  existing,
  prefill,
  inline,
  onCancel,
  onSaved,
}: {
  existing?: AdminInitiativeDTO;
  prefill?: { title: string; description: string } | null;
  inline?: boolean;
  onCancel: () => void;
  onSaved: (item: AdminInitiativeDTO) => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? prefill?.title ?? "");
  const [description, setDescription] = useState(
    existing?.description ?? prefill?.description ?? ""
  );
  const [owner, setOwner] = useState(existing?.owner ?? "");
  const [column, setColumn] = useState(existing?.column ?? "proposed");
  const [category, setCategory] = useState(existing?.category ?? "academic");
  const [expectedAt, setExpectedAt] = useState(
    existing?.expectedAt ? existing.expectedAt.slice(0, 10) : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !description.trim() || !owner.trim()) {
      setError("Title, description, and owner are required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title,
        description,
        owner,
        column,
        category,
        expectedAt: expectedAt || null,
      };
      if (existing) payload.id = existing.id;
      const res = await fetch("/api/initiatives", {
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
        title: saved.title,
        description: saved.description,
        owner: saved.owner,
        column: saved.column,
        category: saved.category,
        startedAt: saved.startedAt,
        expectedAt: saved.expectedAt,
        completedAt: saved.completedAt,
        updates: existing?.updates ?? [],
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
      className={cn(
        "rounded-2xl border bg-white p-5 animate-fade-in",
        inline
          ? "border-poly-navy/30 mt-1"
          : "border-poly-navy/30 mb-6 p-5 sm:p-6"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg">
          {existing ? "Edit initiative" : "New initiative"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-ink-500 hover:text-ink-800 p-1"
        >
          <X size={14} />
        </button>
      </div>

      <label className="block mb-3">
        <span className="label">Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          placeholder="e.g. Cafeteria menu overhaul"
          maxLength={160}
          required
        />
      </label>

      <label className="block mb-3">
        <span className="label">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="input resize-y"
          placeholder="What's the goal? What's the plan?"
          required
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-3 mb-3">
        <label className="block">
          <span className="label">Owner</span>
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="input"
            placeholder="Officer name"
            maxLength={120}
            required
          />
        </label>
        <label className="block">
          <span className="label">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Column</span>
          <select
            value={column}
            onChange={(e) => setColumn(e.target.value)}
            className="input"
          >
            {COLUMNS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block mb-4">
        <span className="label">Target completion (optional)</span>
        <input
          type="date"
          value={expectedAt}
          onChange={(e) => setExpectedAt(e.target.value)}
          className="input max-w-xs"
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
          {existing ? "Save" : "Create"}
        </button>
      </div>
    </form>
  );
}

function SuggestionsView({
  items,
  onReview,
  onDelete,
  onPromote,
}: {
  items: SuggestionDTO[];
  onReview: (id: string, status: string, note?: string) => void;
  onDelete: (id: string) => void;
  onPromote: (sug: SuggestionDTO) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-300 px-6 py-12 text-center bg-ink-50/60">
        <Inbox size={28} className="mx-auto text-ink-400 mb-3" />
        <p className="font-display text-xl text-ink-800 mb-2">
          No student suggestions yet.
        </p>
        <p className="text-sm text-ink-500">
          Suggestions submitted from{" "}
          <Link href="/initiatives" className="text-poly-navy hover:underline">
            /initiatives
          </Link>{" "}
          land here for review.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((s) => (
        <SuggestionRow
          key={s.id}
          item={s}
          onReview={onReview}
          onDelete={onDelete}
          onPromote={onPromote}
        />
      ))}
    </ul>
  );
}

function SuggestionRow({
  item,
  onReview,
  onDelete,
  onPromote,
}: {
  item: SuggestionDTO;
  onReview: (id: string, status: string, note?: string) => void;
  onDelete: (id: string) => void;
  onPromote: (sug: SuggestionDTO) => void;
}) {
  const [note, setNote] = useState(item.reviewerNote ?? "");
  const [open, setOpen] = useState(item.status === "pending");

  const statusTone =
    item.status === "approved"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : item.status === "declined"
        ? "bg-rose-50 text-rose-800 border-rose-200"
        : "bg-amber-50 text-amber-800 border-amber-200";

  return (
    <li className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <h3 className="font-display text-base">{item.title}</h3>
        <span
          className={cn(
            "inline-flex items-center text-[10px] font-medium uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border",
            statusTone
          )}
        >
          {item.status}
        </span>
      </div>
      <p className="text-xs text-ink-500 mb-3">
        {item.submitterName
          ? `${item.submitterName}${item.submitterGrade ? ` · Grade ${item.submitterGrade}` : ""}`
          : "Anonymous"}{" "}
        · submitted {relativeTime(item.createdAt)}
      </p>
      <p className="text-sm text-ink-800 whitespace-pre-line leading-relaxed">
        {item.description}
      </p>

      {open ? (
        <div className="mt-4 space-y-3 border-t border-ink-100 pt-4">
          <label className="block">
            <span className="label">Reviewer note (optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="input text-sm resize-y"
              placeholder="Why are you approving / declining?"
              maxLength={500}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onReview(item.id, "approved", note.trim() || undefined)}
              className="btn-primary text-xs"
            >
              <CheckCircle2 size={12} />
              Mark approved
            </button>
            <button
              onClick={() => onPromote(item)}
              className="btn-accent text-xs"
            >
              <ArrowRight size={12} />
              Promote to initiative
            </button>
            <button
              onClick={() => onReview(item.id, "declined", note.trim() || undefined)}
              className="btn-ghost text-xs text-rose-700"
            >
              <X size={12} />
              Decline
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="btn-ghost text-xs text-ink-500 ml-auto"
            >
              <Trash2 size={12} />
              Delete
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="mt-3 text-xs text-poly-navy hover:underline inline-flex items-center gap-1"
        >
          <Pencil size={11} />
          Review
        </button>
      )}
    </li>
  );
}
