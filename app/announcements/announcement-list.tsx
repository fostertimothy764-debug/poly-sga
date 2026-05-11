"use client";

import { useState } from "react";
import { Pin, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { relativeTime, formatDate } from "@/lib/utils";

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
}: {
  initial: Announcement[];
  admin: AdminContext | null;
}) {
  const [items, setItems] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editPinned, setEditPinned] = useState(false);
  const [saving, setSaving] = useState(false);

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
    if (!confirm("Delete this announcement?")) return;
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
      <div className="card text-center text-sm text-ink-500 py-16">
        No announcements here yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((a) => (
        <article key={a.id} className="card animate-slide-up group relative">
          {editingId === a.id ? (
            /* ── Inline edit form ── */
            <div className="space-y-3">
              <input
                className="input font-display text-xl"
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
              {/* Admin controls — appear on hover */}
              {canEdit(a) && (
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(a)}
                    title="Edit"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-poly-navy/8 text-poly-navy hover:bg-poly-navy/15 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => remove(a.id)}
                    title="Delete"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mb-3">
                {a.pinned && (
                  <span className="chip border-poly-orange/30 bg-poly-orange/10 text-poly-orangeDark">
                    <Pin size={11} /> Pinned
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
              <p className="text-ink-700 leading-relaxed whitespace-pre-line">{a.body}</p>
              {a.authorName && <p className="mt-4 text-xs text-ink-500">— {a.authorName}</p>}
            </>
          )}
        </article>
      ))}
    </div>
  );
}
