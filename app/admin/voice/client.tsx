"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  CircleDashed,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";
import { cn, relativeTime } from "@/lib/utils";

export type AdminVoiceItem = {
  id: string;
  ticket: string;
  body: string;
  type: string;
  submitterName: string | null;
  submitterGrade: string | null;
  isAnonymous: boolean;
  status: string;
  responseBody: string | null;
  respondedAt: string | null;
  responderName: string | null;
  declineReason: string | null;
  votes: number;
  isPublic: boolean;
  createdAt: string;
};

const STATUS_TABS = [
  { value: "queue", label: "Queue", match: ["received", "under_review"] },
  { value: "addressed", label: "Addressed", match: ["addressed"] },
  { value: "declined", label: "Declined", match: ["declined"] },
  { value: "all", label: "All", match: null as string[] | null },
];

const STATUS_META: Record<string, { label: string; tone: string }> = {
  received: { label: "Received", tone: "bg-ink-100 text-ink-700 border-ink-200" },
  under_review: {
    label: "Under review",
    tone: "bg-amber-50 text-amber-800 border-amber-200",
  },
  addressed: {
    label: "Addressed",
    tone: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  declined: {
    label: "Declined",
    tone: "bg-rose-50 text-rose-800 border-rose-200",
  },
};

export default function VoiceAdmin({ initial }: { initial: AdminVoiceItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState<string>("queue");

  function refresh() {
    router.refresh();
  }

  function update(updated: AdminVoiceItem) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this submission permanently?")) return;
    const res = await fetch(`/api/voice?id=${id}`, { method: "DELETE" });
    if (!res.ok) return alert("Delete failed.");
    setItems((prev) => prev.filter((i) => i.id !== id));
    refresh();
  }

  const counts = useMemo(() => {
    return {
      queue: items.filter((i) => i.status === "received" || i.status === "under_review").length,
      addressed: items.filter((i) => i.status === "addressed").length,
      declined: items.filter((i) => i.status === "declined").length,
      all: items.length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const meta = STATUS_TABS.find((t) => t.value === tab);
    if (!meta || meta.match === null) return items;
    return items.filter((i) => meta.match!.includes(i.status));
  }, [items, tab]);

  return (
    <div className="container-page py-10 animate-fade-in">
      <Link
        href="/admin/transparency"
        className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-poly-navy mb-6"
      >
        <ArrowLeft size={12} />
        Back to transparency hub
      </Link>

      <header className="mb-8 pb-6 border-b border-ink-200">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-1">
          Admin
        </p>
        <h1 className="h-display text-3xl">Student voice</h1>
        <p className="text-sm text-ink-500 mt-1">
          {items.length} total · public at{" "}
          <Link href="/voice" className="text-poly-navy hover:underline">
            /voice
          </Link>
        </p>
      </header>

      <div className="flex gap-1 p-1 rounded-full bg-ink-100 w-fit mb-6">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-colors",
              tab === t.value
                ? "bg-white text-ink-900"
                : "text-ink-600 hover:text-ink-900"
            )}
          >
            {t.label}
            <span
              className={cn(
                "inline-flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[9px] font-mono",
                tab === t.value ? "bg-ink-100 text-ink-700" : "bg-white/60 text-ink-500"
              )}
            >
              {counts[t.value as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-300 px-6 py-12 text-center bg-ink-50/60">
          <MessageSquare size={28} className="mx-auto text-ink-400 mb-3" />
          <p className="text-sm text-ink-500">
            Nothing in this view yet.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((i) => (
            <SubmissionRow
              key={i.id}
              item={i}
              onUpdate={update}
              onDelete={() => remove(i.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function SubmissionRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: AdminVoiceItem;
  onUpdate: (updated: AdminVoiceItem) => void;
  onDelete: () => void;
}) {
  const [response, setResponse] = useState(item.responseBody ?? "");
  const [decline, setDecline] = useState(item.declineReason ?? "");
  const [busy, setBusy] = useState<string | null>(null);

  async function patch(payload: Record<string, unknown>, busyKey: string) {
    setBusy(busyKey);
    try {
      const res = await fetch("/api/voice", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, ...payload }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Save failed");
      }
      const updated = await res.json();
      onUpdate({
        ...item,
        ...updated,
        respondedAt: updated.respondedAt
          ? new Date(updated.respondedAt).toISOString()
          : null,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  const status = STATUS_META[item.status] ?? STATUS_META.received;

  return (
    <li className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-baseline gap-2 text-xs">
          <span className="font-mono text-ink-700">{item.ticket}</span>
          <span className="text-ink-300">·</span>
          <span className="text-ink-500 uppercase tracking-[0.12em] text-[10px]">
            {item.type}
          </span>
          <span className="text-ink-300">·</span>
          <span className="text-ink-500">{relativeTime(item.createdAt)}</span>
        </div>
        <span
          className={cn(
            "inline-flex items-center text-[10px] font-medium uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border",
            status.tone
          )}
        >
          {status.label}
        </span>
      </div>

      <p className="text-sm text-ink-900 leading-relaxed whitespace-pre-line mb-2">
        {item.body}
      </p>

      <p className="text-xs text-ink-500 mb-4">
        {item.isAnonymous
          ? "Anonymous"
          : `${item.submitterName ?? "(no name)"}${item.submitterGrade ? ` · Grade ${item.submitterGrade}` : ""}`}
        <span className="mx-2 text-ink-300">·</span>
        <ArrowUp size={11} className="inline" /> {item.votes} vote{item.votes !== 1 ? "s" : ""}
        <span className="mx-2 text-ink-300">·</span>
        {item.isPublic ? "Visible publicly" : "Hidden from public feed"}
      </p>

      <div className="border-t border-ink-100 pt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <label className="block">
            <span className="label">SGA response</span>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={3}
              className="input text-sm resize-y"
              placeholder="What's the answer, plan, or action?"
              maxLength={2000}
            />
          </label>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() =>
                patch(
                  { status: "addressed", responseBody: response },
                  "address"
                )
              }
              className="btn-primary text-xs"
              disabled={busy === "address" || !response.trim()}
            >
              {busy === "address" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <CheckCircle2 size={12} />
              )}
              Mark addressed
            </button>
            <button
              onClick={() => patch({ responseBody: response }, "savereply")}
              className="btn-ghost text-xs"
              disabled={busy === "savereply"}
              title="Save response without changing status"
            >
              <Save size={12} />
              Save draft
            </button>
          </div>
        </div>

        <div>
          <label className="block">
            <span className="label">Decline reason</span>
            <textarea
              value={decline}
              onChange={(e) => setDecline(e.target.value)}
              rows={3}
              className="input text-sm resize-y"
              placeholder="Why is the SGA not pursuing this?"
              maxLength={500}
            />
          </label>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() =>
                patch({ status: "declined", declineReason: decline }, "decline")
              }
              className="btn-ghost text-xs text-rose-700"
              disabled={busy === "decline" || !decline.trim()}
            >
              {busy === "decline" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <XCircle size={12} />
              )}
              Decline
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-ink-100 flex flex-wrap items-center gap-2">
        <button
          onClick={() => patch({ status: "under_review" }, "review")}
          className="btn-ghost text-xs"
          disabled={busy === "review" || item.status === "under_review"}
        >
          <CircleDashed size={12} />
          Mark under review
        </button>
        <button
          onClick={() => patch({ isPublic: !item.isPublic }, "visibility")}
          className="btn-ghost text-xs"
          disabled={busy === "visibility"}
        >
          {item.isPublic ? <EyeOff size={12} /> : <Eye size={12} />}
          {item.isPublic ? "Hide from public" : "Show publicly"}
        </button>
        <button
          onClick={onDelete}
          className="btn-ghost text-xs text-rose-600 ml-auto"
        >
          <Trash2 size={12} />
          Delete
        </button>
      </div>
    </li>
  );
}
