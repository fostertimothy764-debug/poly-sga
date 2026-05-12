"use client";

import { useState } from "react";
import { Pin, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { classAccentStyle, readingTime, relativeTime, formatDate } from "@/lib/utils";
import { useConfirm } from "@/components/confirm-dialog";
import RichBody from "@/components/rich-body";

type Announcement = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  audience: string;
  authorName: string | null;
  createdAt: Date | string;
};

type AdminContext = {
  name: string;
  role: string;
  classYear: string | null;
  clubId: string | null;
};

export default function AnnouncementList({
  initial,
  admin,
  viewerGrade,
}: {
  initial: Announcement[];
  admin: AdminContext | null;
  viewerGrade: string | null;
}) {
  const [items, setItems] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editPinned, setEditPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const { confirm, dialog } = useConfirm();

  function startEdit(a: Announcement) {
    setEditingId(a.id);
    setEditTitle(a.title);
    setEditBody(a.body);
    setEditPinned(a.pinned);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    const res = await fetch("/api/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title: editTitle, body: editBody, pinned: editPinned }),
    });
    setSaving(false);
    if (!res.ok) return;
    const updated = await res.json();
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
    setEditingId(null);
  }

  async function remove(id: string) {
    const ok = await confirm({
      title: "Delete this announcement?",
      body: "This can't be undone. Students will no longer see it.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((a) => a.id !== id));
  }

  // Check if admin can edit a given announcement
  function canEdit(a: Announcement) {
    if (!admin) return false;
    if (admin.role === "sga_admin" || admin.role === "sga_member") {
      if (a.audience === "club") return admin.role === "sga_admin";
      return true;
    }
    if (admin.role === "class") return a.audience === admin.classYear;
    if (admin.role === "club") return a.audience === "club";
    return false;
  }

  if (items.length === 0) {
    return (
      <div className="border-t border-ink-200 py-16 max-w-xl">
        <p className="label text-ink-500 mb-3">Nothing here yet</p>
        <h3 className="font-display text-2xl leading-snug mb-3">
          No announcements in this view.
        </h3>
        <p className="text-sm text-ink-600 leading-relaxed">
          Switch to <strong className="font-medium text-ink-900">All</strong>{" "}
          to see schoolwide posts, or check back after the next SGA meeting.
        </p>
      </div>
    );
  }

  function isNew(date: Date | string) {
    return Date.now() - new Date(date).getTime() < 48 * 60 * 60 * 1000;
  }

  return (
    <div className="space-y-3">
      {dialog}
      {items.map((a) => (
        <article
          key={a.id}
          className="card animate-slide-up group relative"
          style={classAccentStyle(a.audience, viewerGrade)}
        >
          {editingId === a.id ? (
            /* ── Inline edit form ── */
            <div className="space-y-3">
              <input
                className="input text-base font-semibold"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Title"
              />
              <textarea
                className="input resize-none"
                rows={5}
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
              />
              <label className="flex items-center gap-2 text-sm text-ink-600">
                <input
                  type="checkbox"
                  checked={editPinned}
                  onChange={(e) => setEditPinned(e.target.checked)}
                />
                Pin to top
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => saveEdit(a.id)}
                  disabled={saving}
                  className="btn-primary text-xs px-4 py-2"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Save
                </button>
                <button onClick={cancelEdit} className="btn-ghost text-xs px-4 py-2">
                  <X size={12} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            /* ── Normal view ── */
            <>
              {/* Admin controls — always visible on touch, hover-reveal on desktop */}
              {canEdit(a) && (
                <div className="absolute top-3 right-3 z-10 flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(a)}
                    title="Edit"
                    aria-label="Edit announcement"
                    className="flex h-10 w-10 md:h-9 md:w-9 items-center justify-center rounded-xl bg-white border border-ink-200 text-poly-navy hover:bg-poly-navySoft active:scale-95 transition-all shadow-sm"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => remove(a.id)}
                    title="Delete"
                    aria-label="Delete announcement"
                    className="flex h-10 w-10 md:h-9 md:w-9 items-center justify-center rounded-xl bg-white border border-ink-200 text-ink-700 hover:bg-poly-orangeSoft hover:text-poly-orangeDark hover:border-poly-orange/30 active:scale-95 transition-all shadow-sm"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}

              <div className={`flex flex-wrap items-center gap-2 mb-3 ${canEdit(a) ? "pr-24 md:pr-0" : ""}`}>
                {a.pinned && (
                  <span className="chip border-poly-orange/30 bg-poly-orange/10 text-poly-orangeDark">
                    <Pin size={11} /> Pinned
                    <span className="sr-only">(pinned post)</span>
                  </span>
                )}
                {!a.pinned && isNew(a.createdAt) && (
                  <span className="chip border-poly-green/30 bg-poly-green/10 text-poly-green font-mono font-semibold tracking-wide">
                    NEW
                    <span className="sr-only">(posted in the last 48 hours)</span>
                  </span>
                )}
                {a.audience === "all" ? (
                  <span className="chip border-ink-300 bg-ink-100 text-ink-700">Schoolwide</span>
                ) : a.audience === "club" ? (
                  <span className="chip border-poly-orange/30 bg-poly-orange/10 text-poly-orangeDark">Club</span>
                ) : (
                  <span className="chip border-poly-navy/30 bg-poly-navy/5 text-poly-navy">
                    Class of 20{a.audience}
                  </span>
                )}
                <time className="text-xs text-ink-500" dateTime={new Date(a.createdAt).toISOString()}>
                  {formatDate(a.createdAt)} · {relativeTime(a.createdAt)}
                </time>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl mb-3">{a.title}</h2>
              <RichBody text={a.body} />
              <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-500">
                {a.authorName && <span>— {a.authorName}</span>}
                {a.authorName && <span className="text-ink-300">·</span>}
                <span>{readingTime(a.body)}</span>
              </div>
            </>
          )}
        </article>
      ))}
    </div>
  );
}
