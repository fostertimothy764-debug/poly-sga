"use client";

import { useState } from "react";
import { ExternalLink, Newspaper, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { useConfirm } from "@/components/confirm-dialog";
import SmartImage from "@/components/smart-image";

type Issue = {
  id: string;
  title: string;
  issueLabel: string | null;
  description: string | null;
  body: string | null;
  externalUrl: string | null;
  coverUrl: string | null;
  publishedAt: Date | string;
};

function formatPublished(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function ScoopList({
  initial,
  canEdit,
}: {
  initial: Issue[];
  canEdit: boolean;
}) {
  const [items, setItems] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editDate, setEditDate] = useState("");
  const [saving, setSaving] = useState(false);
  const { confirm, dialog } = useConfirm();

  function startEdit(n: Issue) {
    setEditingId(n.id);
    setEditTitle(n.title);
    setEditLabel(n.issueLabel ?? "");
    setEditDesc(n.description ?? "");
    setEditUrl(n.externalUrl ?? "");
    setEditDate(new Date(n.publishedAt).toISOString().slice(0, 10));
  }

  async function saveEdit(id: string) {
    setSaving(true);
    const res = await fetch("/api/newsletter", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        title: editTitle,
        issueLabel: editLabel || null,
        description: editDesc || null,
        externalUrl: editUrl || null,
        publishedAt: editDate,
      }),
    });
    setSaving(false);
    if (!res.ok) return;
    const updated = await res.json();
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, ...updated } : n)));
    setEditingId(null);
  }

  async function remove(id: string) {
    const ok = await confirm({
      title: "Delete this issue?",
      body: "Subscribers won't be re-notified, but the issue will disappear from the site.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    await fetch(`/api/newsletter?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((n) => n.id !== id));
  }

  const [latest, ...past] = items;

  return (
    <div className="space-y-16">
      {dialog}
      {/* Latest issue — featured */}
      <section>
        <p className="text-xs uppercase tracking-[0.2em] text-poly-orange mb-5">Latest Issue</p>
        {editingId === latest.id ? (
          <EditForm
            title={editTitle} setTitle={setEditTitle}
            label={editLabel} setLabel={setEditLabel}
            desc={editDesc} setDesc={setEditDesc}
            url={editUrl} setUrl={setEditUrl}
            date={editDate} setDate={setEditDate}
            saving={saving}
            onSave={() => saveEdit(latest.id)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <IssueCard
            issue={latest}
            featured
            canEdit={canEdit}
            onEdit={() => startEdit(latest)}
            onDelete={() => remove(latest.id)}
          />
        )}
      </section>

      {past.length > 0 && (
        <section>
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-5">Past Issues</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((issue) =>
              editingId === issue.id ? (
                <EditForm
                  key={issue.id}
                  title={editTitle} setTitle={setEditTitle}
                  label={editLabel} setLabel={setEditLabel}
                  desc={editDesc} setDesc={setEditDesc}
                  url={editUrl} setUrl={setEditUrl}
                  date={editDate} setDate={setEditDate}
                  saving={saving}
                  onSave={() => saveEdit(issue.id)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  canEdit={canEdit}
                  onEdit={() => startEdit(issue)}
                  onDelete={() => remove(issue.id)}
                />
              )
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function IssueCard({
  issue,
  featured = false,
  canEdit,
  onEdit,
  onDelete,
}: {
  issue: Issue;
  featured?: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`card overflow-hidden p-0 group relative ${featured ? "sm:grid sm:grid-cols-2" : "flex flex-col"}`}>
      {/* Cover image or gradient */}
      {issue.coverUrl ? (
        <div className={`relative w-full ${featured ? "h-full min-h-[280px]" : "h-44"}`}>
          <SmartImage
            src={issue.coverUrl}
            alt={issue.title}
            fill
            sizes={featured ? "(min-width: 640px) 50vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
            className="object-cover"
          />
        </div>
      ) : (
        <div className={`bg-gradient-to-br from-poly-navy to-poly-navyDark flex items-center justify-center ${featured ? "h-64 sm:h-full" : "h-32"}`}>
          <Newspaper size={featured ? 48 : 32} className="text-white/30" />
        </div>
      )}

      {/* Admin controls */}
      {canEdit && (
        <div className="absolute top-3 right-3 z-10 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            title="Edit"
            aria-label="Edit issue"
            className="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-white text-poly-navy hover:bg-poly-navySoft border border-ink-200 active:scale-95 transition-all shadow-sm"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            aria-label="Delete issue"
            className="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-white text-ink-700 hover:bg-poly-orangeSoft hover:text-poly-orangeDark border border-ink-200 hover:border-poly-orange/30 active:scale-95 transition-all shadow-sm"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}

      {/* Content */}
      <div className={`flex flex-col ${featured ? "p-8 sm:p-10" : "p-5 flex-1"}`}>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {issue.issueLabel && (
            <span className="chip border-poly-navy/30 bg-poly-navy/8 text-poly-navy text-[10px]">{issue.issueLabel}</span>
          )}
          <span className="text-xs text-ink-500">{formatPublished(issue.publishedAt)}</span>
        </div>
        <h2 className={`h-display ${featured ? "text-3xl sm:text-4xl mb-4" : "text-xl mb-2"} leading-snug`}>{issue.title}</h2>
        {issue.description && (
          <p className={`text-ink-600 leading-relaxed ${featured ? "text-base mb-6" : "text-sm mb-4 line-clamp-3"}`}>{issue.description}</p>
        )}
        {issue.body && !issue.externalUrl && (
          <div className={featured ? "" : "hidden sm:block"}>
            <p className="text-sm text-ink-500 line-clamp-4 leading-relaxed mb-4 whitespace-pre-line">{issue.body}</p>
          </div>
        )}
        <div className="mt-auto flex flex-wrap gap-2">
          {issue.externalUrl && (
            <a href={issue.externalUrl} target="_blank" rel="noopener noreferrer" className={`btn-primary ${featured ? "" : "text-xs px-4 py-2"}`}>
              Read full issue <ExternalLink size={14} />
            </a>
          )}
          {!issue.externalUrl && issue.body && <span className="text-xs text-ink-500 italic">Full issue above</span>}
        </div>
      </div>
    </div>
  );
}

function EditForm({
  title, setTitle, label, setLabel, desc, setDesc, url, setUrl, date, setDate,
  saving, onSave, onCancel,
}: {
  title: string; setTitle: (v: string) => void;
  label: string; setLabel: (v: string) => void;
  desc: string; setDesc: (v: string) => void;
  url: string; setUrl: (v: string) => void;
  date: string; setDate: (v: string) => void;
  saving: boolean; onSave: () => void; onCancel: () => void;
}) {
  return (
    <div className="card space-y-3 animate-slide-up">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label">Issue label</label>
          <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Vol. 1 No. 1" />
        </div>
      </div>
      <div>
        <label className="label">Description</label>
        <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} />
      </div>
      <div>
        <label className="label">External URL</label>
        <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
      </div>
      <div>
        <label className="label">Published date</label>
        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button onClick={onSave} disabled={saving} className="btn-primary text-xs px-4 py-2">
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
        </button>
        <button onClick={onCancel} className="btn-ghost text-xs px-4 py-2">
          <X size={12} /> Cancel
        </button>
      </div>
    </div>
  );
}
