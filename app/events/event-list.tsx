"use client";

import { useState } from "react";
import { Calendar, Clock, MapPin, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { classAccentStyle, formatDate, formatTime } from "@/lib/utils";
import { useConfirm } from "@/components/confirm-dialog";

type EventItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  audience: string;
  clubId: string | null;
  startsAt: Date | string;
  endsAt: Date | string | null;
  club?: { name: string } | null;
};

type AdminContext = {
  name: string;
  role: string;
  classYear: string | null;
  clubId: string | null;
};

function DateBlock({ date }: { date: Date | string }) {
  const d = new Date(date);
  return (
    <div className="flex-shrink-0 w-14 text-center">
      <div className="rounded-xl bg-poly-navy text-white py-2">
        <div className="font-display text-2xl leading-none">{d.getDate()}</div>
        <div className="text-[10px] uppercase tracking-wider mt-0.5 text-ink-300">
          {d.toLocaleDateString("en-US", { month: "short" })}
        </div>
      </div>
    </div>
  );
}

function toDatetimeLocal(val: Date | string | null) {
  if (!val) return "";
  const d = new Date(val);
  // Format as "YYYY-MM-DDTHH:MM" for datetime-local input
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventList({
  initial,
  admin,
  section,
  viewerGrade,
}: {
  initial: EventItem[];
  admin: AdminContext | null;
  section: "upcoming" | "past" | "club";
  viewerGrade: string | null;
}) {
  const [items, setItems] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editStartsAt, setEditStartsAt] = useState("");
  const [editEndsAt, setEditEndsAt] = useState("");
  const [saving, setSaving] = useState(false);
  const { confirm, dialog } = useConfirm();

  function startEdit(e: EventItem) {
    setEditingId(e.id);
    setEditTitle(e.title);
    setEditDesc(e.description);
    setEditLocation(e.location);
    setEditStartsAt(toDatetimeLocal(e.startsAt));
    setEditEndsAt(toDatetimeLocal(e.endsAt));
  }

  async function saveEdit(id: string) {
    setSaving(true);
    const res = await fetch("/api/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        title: editTitle,
        description: editDesc,
        location: editLocation,
        startsAt: editStartsAt,
        endsAt: editEndsAt || null,
      }),
    });
    setSaving(false);
    if (!res.ok) return;
    const updated = await res.json();
    setItems((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    setEditingId(null);
  }

  async function remove(id: string) {
    const ok = await confirm({
      title: "Delete this event?",
      body: "Anyone who saved it will lose it. This can't be undone.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    await fetch(`/api/events?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((e) => e.id !== id));
  }

  function canEdit(e: EventItem) {
    if (!admin) return false;
    if (admin.role === "sga_admin" || admin.role === "sga_member") return true;
    if (admin.role === "class") return e.audience === admin.classYear;
    if (admin.role === "club") return e.audience === "club" && e.clubId === admin.clubId;
    return false;
  }

  function isSoon(startsAt: Date | string) {
    const diff = new Date(startsAt).getTime() - Date.now();
    return diff > 0 && diff < 24 * 60 * 60 * 1000;
  }

  if (items.length === 0) return null;

  return (
    <div className={section === "upcoming" ? "grid gap-3 md:grid-cols-2" : "space-y-3"}>
      {dialog}
      {items.map((e) => (
        <article
          key={e.id}
          className="card card-hover animate-slide-up group relative"
          style={classAccentStyle(e.audience, viewerGrade)}
        >
          {editingId === e.id ? (
            /* ── Inline edit form ── */
            <div className="space-y-3">
              <input className="input text-base font-semibold" value={editTitle} onChange={(ev) => setEditTitle(ev.target.value)} placeholder="Event title" />
              <textarea className="input resize-none" rows={3} value={editDesc} onChange={(ev) => setEditDesc(ev.target.value)} placeholder="Description" />
              <input className="input" value={editLocation} onChange={(ev) => setEditLocation(ev.target.value)} placeholder="Location" />
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Start</label>
                  <input type="datetime-local" className="input" value={editStartsAt} onChange={(ev) => setEditStartsAt(ev.target.value)} />
                </div>
                <div>
                  <label className="label">End (optional)</label>
                  <input type="datetime-local" className="input" value={editEndsAt} onChange={(ev) => setEditEndsAt(ev.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => saveEdit(e.id)} disabled={saving} className="btn-primary text-xs px-4 py-2">
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
                </button>
                <button onClick={() => setEditingId(null)} className="btn-ghost text-xs px-4 py-2">
                  <X size={12} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            /* ── Normal view ── */
            <>
              {canEdit(e) && (
                <div className="absolute top-3 right-3 z-10 flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(e)}
                    title="Edit"
                    aria-label="Edit event"
                    className="flex h-10 w-10 md:h-9 md:w-9 items-center justify-center rounded-xl bg-white border border-ink-200 text-poly-navy hover:bg-poly-navySoft active:scale-95 transition-all shadow-sm"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => remove(e.id)}
                    title="Delete"
                    aria-label="Delete event"
                    className="flex h-10 w-10 md:h-9 md:w-9 items-center justify-center rounded-xl bg-white border border-ink-200 text-ink-700 hover:bg-poly-orangeSoft hover:text-poly-orangeDark hover:border-poly-orange/30 active:scale-95 transition-all shadow-sm"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
              <div className="flex items-start gap-5">
                <DateBlock date={e.startsAt} />
                <div className="flex-1 min-w-0">
                  <div className={`flex flex-wrap gap-2 mb-2 ${canEdit(e) ? "pr-24 md:pr-0" : ""}`}>
                    {isSoon(e.startsAt) && (
                      <span className="chip border-poly-orange/40 bg-poly-orangeSoft text-poly-orangeDark font-mono font-semibold tracking-wide">
                        SOON
                        <span className="sr-only">(happening within 24 hours)</span>
                      </span>
                    )}
                    {e.audience === "all" ? (
                      <span className="chip">Schoolwide</span>
                    ) : e.audience === "club" ? (
                      <span className="chip border-poly-orange/30 bg-poly-orange/5 text-poly-orangeDark">
                        {e.club?.name ?? "Club Event"}
                      </span>
                    ) : (
                      <span className="chip border-poly-navy/30 bg-poly-navy/5 text-poly-navy">
                        Class of 20{e.audience}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-xl mb-2">{e.title}</h3>
                  <p className="text-sm text-ink-600 leading-relaxed mb-4">{e.description}</p>
                  <div className="flex flex-col gap-1.5 text-xs text-ink-500">
                    <span className="flex items-center gap-2"><Calendar size={12} /> {formatDate(e.startsAt)}</span>
                    <span className="flex items-center gap-2">
                      <Clock size={12} /> {formatTime(e.startsAt)}{e.endsAt && ` — ${formatTime(e.endsAt)}`}
                    </span>
                    <span className="flex items-center gap-2"><MapPin size={12} /> {e.location}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </article>
      ))}
    </div>
  );
}
