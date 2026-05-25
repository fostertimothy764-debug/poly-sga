"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  CheckCircle2,
  CircleDashed,
  Eye,
  Loader2,
  MessageSquare,
  Search,
  Send,
  Shield,
  Sparkles,
  Ticket,
  XCircle,
} from "lucide-react";
import { cn, relativeTime } from "@/lib/utils";

export type VoiceItem = {
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
  voted: boolean;
  createdAt: string;
};

const TYPES = [
  { value: "suggestion", label: "Suggestion", Icon: Sparkles },
  { value: "question", label: "Question", Icon: MessageSquare },
  { value: "concern", label: "Concern", Icon: Shield },
];

const STATUS_META: Record<
  string,
  { label: string; tone: string; Icon: typeof CircleDashed }
> = {
  received: {
    label: "Received",
    tone: "bg-ink-100 text-ink-700 border-ink-200",
    Icon: CircleDashed,
  },
  under_review: {
    label: "Under review",
    tone: "bg-amber-50 text-amber-800 border-amber-200",
    Icon: Eye,
  },
  addressed: {
    label: "Addressed",
    tone: "bg-emerald-50 text-emerald-800 border-emerald-200",
    Icon: CheckCircle2,
  },
  declined: {
    label: "Declined",
    tone: "bg-rose-50 text-rose-800 border-rose-200",
    Icon: XCircle,
  },
};

type Tab = "open" | "resolved" | "all";

export default function VoiceClient({ initial }: { initial: VoiceItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState<Tab>("open");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [ticketCode, setTicketCode] = useState("");
  const [ticketLookup, setTicketLookup] = useState<
    | { state: "idle" }
    | { state: "loading" }
    | { state: "found"; item: VoiceItem }
    | { state: "error"; message: string }
  >({ state: "idle" });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (tab === "open" && (i.status === "addressed" || i.status === "declined")) return false;
      if (tab === "resolved" && i.status !== "addressed" && i.status !== "declined") return false;
      if (typeFilter !== "all" && i.type !== typeFilter) return false;
      if (!q) return true;
      return (
        i.body.toLowerCase().includes(q) ||
        i.ticket.toLowerCase().includes(q) ||
        i.responseBody?.toLowerCase().includes(q)
      );
    });
  }, [items, tab, typeFilter, query]);

  async function toggleVote(id: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, voted: !i.voted, votes: i.votes + (i.voted ? -1 : 1) } : i
      )
    );
    try {
      const res = await fetch("/api/voice/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Vote failed");
      const data = await res.json();
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, voted: data.voted, votes: data.votes } : i
        )
      );
    } catch {
      // revert optimistic update on error
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, voted: !i.voted, votes: i.votes + (i.voted ? -1 : 1) } : i
        )
      );
    }
  }

  async function lookupTicket(e: React.FormEvent) {
    e.preventDefault();
    const code = ticketCode.trim().toUpperCase();
    if (!code) return;
    setTicketLookup({ state: "loading" });
    try {
      const res = await fetch(`/api/voice/ticket?t=${encodeURIComponent(code)}`);
      if (res.status === 404) {
        setTicketLookup({
          state: "error",
          message: "No submission matches that ticket. Double-check the code.",
        });
        return;
      }
      if (!res.ok) throw new Error("Lookup failed");
      const data = await res.json();
      // Construct a minimal VoiceItem to render the response card
      const item: VoiceItem = {
        id: data.ticket,
        ticket: data.ticket,
        body: data.body,
        type: data.type,
        submitterName: null,
        submitterGrade: null,
        isAnonymous: true,
        status: data.status,
        responseBody: data.responseBody,
        respondedAt: data.respondedAt,
        responderName: data.responderName,
        declineReason: data.declineReason,
        votes: 0,
        voted: false,
        createdAt: data.createdAt,
      };
      setTicketLookup({ state: "found", item });
    } catch (err) {
      setTicketLookup({
        state: "error",
        message: err instanceof Error ? err.message : "Lookup failed",
      });
    }
  }

  const counts = useMemo(() => {
    const open = items.filter(
      (i) => i.status !== "addressed" && i.status !== "declined"
    ).length;
    const resolved = items.length - open;
    return { open, resolved, total: items.length };
  }, [items]);

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="mb-10 pb-6 border-b border-ink-200">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-poly-orange mb-3">
          Transparency · your turn
        </p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="h-display text-4xl sm:text-5xl leading-tight mb-3">
              Speak up.
            </h1>
            <p className="text-ink-600 text-base leading-relaxed">
              Drop a concern, a question, or a suggestion — by name or
              anonymously. You&apos;ll get a ticket number to track the
              response. Boost what others have said instead of restating it.
            </p>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className={cn(showForm ? "btn-ghost" : "btn-accent", "self-start lg:self-end")}
          >
            {showForm ? "Cancel" : "Submit something"}
          </button>
        </div>
      </header>

      {showForm && (
        <SubmissionForm
          onSubmitted={() => {
            setShowForm(false);
            router.refresh();
          }}
        />
      )}

      {/* Ticket lookup */}
      <div className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6 mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Ticket size={16} className="text-poly-navy" />
          <h2 className="font-display text-lg">Track your submission</h2>
        </div>
        <p className="text-xs text-ink-500 mb-4">
          Enter the ticket code you received (e.g. <span className="font-mono">V-A3X9B</span>)
          to see its current status and any SGA response.
        </p>
        <form
          onSubmit={lookupTicket}
          className="flex flex-wrap items-center gap-3"
        >
          <input
            type="text"
            value={ticketCode}
            onChange={(e) => setTicketCode(e.target.value)}
            placeholder="V-XXXXX"
            className="input max-w-[12rem] uppercase font-mono"
            maxLength={12}
            autoCapitalize="characters"
            spellCheck={false}
          />
          <button className="btn-primary" type="submit" disabled={ticketLookup.state === "loading"}>
            {ticketLookup.state === "loading" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Search size={14} />
            )}
            Look up
          </button>
        </form>

        {ticketLookup.state === "found" && (
          <div className="mt-5 animate-fade-in">
            <TicketCard item={ticketLookup.item} />
          </div>
        )}
        {ticketLookup.state === "error" && (
          <p className="mt-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {ticketLookup.message}
          </p>
        )}
      </div>

      {/* Tabs + filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex gap-1 rounded-full bg-ink-100 p-1">
          <TabBtn active={tab === "open"} onClick={() => setTab("open")} label={`Open · ${counts.open}`} />
          <TabBtn
            active={tab === "resolved"}
            onClick={() => setTab("resolved")}
            label={`Resolved · ${counts.resolved}`}
          />
          <TabBtn
            active={tab === "all"}
            onClick={() => setTab("all")}
            label={`All · ${counts.total}`}
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input py-2 text-xs min-w-[10rem]"
          >
            <option value="all">All types</option>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <span className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="input pl-9 py-2 text-xs"
            />
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState empty={items.length === 0} tab={tab} />
      ) : (
        <ul className="space-y-3">
          {filtered.map((i) => (
            <SubmissionCard key={i.id} item={i} onVote={() => toggleVote(i.id)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-full text-xs font-medium transition-colors",
        active ? "bg-white text-ink-900 shadow-sm" : "text-ink-600 hover:text-ink-900"
      )}
    >
      {label}
    </button>
  );
}

function SubmissionCard({
  item,
  onVote,
}: {
  item: VoiceItem;
  onVote: () => void;
}) {
  const status = STATUS_META[item.status] ?? STATUS_META.received;
  const StatusIcon = status.Icon;
  const typeLabel = TYPES.find((t) => t.value === item.type)?.label ?? item.type;

  return (
    <li className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <button
          onClick={onVote}
          className={cn(
            "flex flex-col items-center justify-center w-12 rounded-lg border px-2 py-2 shrink-0 transition-colors",
            item.voted
              ? "border-poly-orange bg-poly-orange/10 text-poly-orange"
              : "border-ink-200 bg-ink-50 text-ink-600 hover:border-ink-300 hover:text-ink-900"
          )}
          aria-pressed={item.voted}
          aria-label={item.voted ? "Remove upvote" : "Upvote"}
        >
          <ArrowUp size={14} strokeWidth={2.5} />
          <span className="font-mono text-xs mt-0.5">{item.votes}</span>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2 text-[11px]">
            <span className="font-mono text-ink-500">{item.ticket}</span>
            <span className="text-ink-300">·</span>
            <span className="text-ink-500">{typeLabel}</span>
            <span className="text-ink-300">·</span>
            <span className="text-ink-500">{relativeTime(item.createdAt)}</span>
            <span
              className={cn(
                "ml-auto inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border",
                status.tone
              )}
            >
              <StatusIcon size={10} />
              {status.label}
            </span>
          </div>

          <p className="text-sm text-ink-900 leading-relaxed whitespace-pre-line">
            {item.body}
          </p>

          <p className="mt-2 text-[11px] text-ink-500">
            {item.isAnonymous
              ? "Submitted anonymously"
              : `Submitted by ${item.submitterName}${item.submitterGrade ? ` (Grade ${item.submitterGrade})` : ""}`}
          </p>

          {(item.responseBody || item.declineReason) && (
            <div
              className={cn(
                "mt-4 rounded-xl border-l-2 pl-4 pr-3 py-3",
                item.status === "declined"
                  ? "border-rose-400 bg-rose-50/60"
                  : "border-poly-navy bg-poly-navy/[0.04]"
              )}
            >
              <p className="text-[10px] uppercase tracking-[0.14em] text-ink-500 font-mono mb-1">
                {item.status === "declined" ? "SGA decline reason" : "SGA response"}
              </p>
              <p className="text-sm text-ink-900 leading-relaxed whitespace-pre-line">
                {item.status === "declined" ? item.declineReason : item.responseBody}
              </p>
              {item.responderName && item.respondedAt && (
                <p className="mt-2 text-[11px] text-ink-500">
                  {item.responderName} · {relativeTime(item.respondedAt)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function TicketCard({ item }: { item: VoiceItem }) {
  const status = STATUS_META[item.status] ?? STATUS_META.received;
  const StatusIcon = status.Icon;
  return (
    <div className="rounded-xl border border-ink-200 bg-ink-50/60 p-4">
      <div className="flex flex-wrap items-center gap-2 text-[11px] mb-3">
        <span className="font-mono text-ink-700">{item.ticket}</span>
        <span className="text-ink-300">·</span>
        <span className="text-ink-500">submitted {relativeTime(item.createdAt)}</span>
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border",
            status.tone
          )}
        >
          <StatusIcon size={10} />
          {status.label}
        </span>
      </div>
      <p className="text-sm text-ink-800 leading-relaxed whitespace-pre-line italic">
        “{item.body}”
      </p>
      {(item.responseBody || item.declineReason) && (
        <div
          className={cn(
            "mt-3 rounded-xl border-l-2 pl-3 py-2",
            item.status === "declined"
              ? "border-rose-400 bg-rose-50/60"
              : "border-poly-navy bg-white"
          )}
        >
          <p className="text-[10px] uppercase tracking-[0.14em] text-ink-500 font-mono mb-1">
            {item.status === "declined" ? "Decline reason" : "Response"}
          </p>
          <p className="text-sm text-ink-900 whitespace-pre-line leading-relaxed">
            {item.status === "declined" ? item.declineReason : item.responseBody}
          </p>
        </div>
      )}
    </div>
  );
}

function SubmissionForm({ onSubmitted }: { onSubmitted: (ticket: string) => void }) {
  const [type, setType] = useState("suggestion");
  const [body, setBody] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (body.trim().length < 8) {
      setError("Tell us a little more — at least a sentence.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          type,
          isAnonymous,
          submitterName: isAnonymous ? null : name,
          submitterGrade: grade,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Submission failed");
      }
      const data = await res.json();
      setTicket(data.ticket);
      setTimeout(() => onSubmitted(data.ticket), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (ticket) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-8 mb-10 text-center animate-fade-in">
        <CheckCircle2 size={28} className="mx-auto text-emerald-600 mb-2" />
        <p className="font-display text-lg text-emerald-900 mb-1">
          Got it. The SGA will take a look.
        </p>
        <p className="text-sm text-emerald-700 mb-3">
          Save this ticket code to check the status later:
        </p>
        <p className="font-mono text-2xl text-emerald-900 tracking-wider">
          {ticket}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6 mb-10 animate-fade-in"
    >
      <h2 className="font-display text-lg mb-1">New submission</h2>
      <p className="text-xs text-ink-500 mb-5">
        Be specific. Concrete asks travel further than vague complaints.
      </p>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        {TYPES.map((t) => {
          const Icon = t.Icon;
          const active = type === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={cn(
                "rounded-xl border px-4 py-3 text-left transition-colors",
                active
                  ? "border-poly-navy bg-poly-navy/5 text-poly-navy"
                  : "border-ink-200 hover:border-ink-300 text-ink-700"
              )}
            >
              <Icon size={14} className="mb-1.5" />
              <p className="text-sm font-medium">{t.label}</p>
            </button>
          );
        })}
      </div>

      <label className="block mb-4">
        <span className="label">What&apos;s on your mind?</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          className="input resize-y"
          placeholder="Be as specific as you can — what's the problem, and what would actually help?"
          maxLength={4000}
          required
        />
      </label>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <label className="flex items-start gap-3 rounded-xl border border-ink-200 px-4 py-3 cursor-pointer hover:bg-ink-50/60 transition-colors">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="mt-1 accent-poly-navy"
          />
          <div>
            <p className="text-sm font-medium text-ink-900">Submit anonymously</p>
            <p className="text-xs text-ink-500 mt-0.5">
              Your name won&apos;t be shown publicly or in the SGA inbox.
            </p>
          </div>
        </label>
        {!isAnonymous && (
          <div className="grid grid-cols-[1fr_5rem] gap-3">
            <label className="block">
              <span className="label">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Your full name"
                maxLength={80}
              />
            </label>
            <label className="block">
              <span className="label">Grade</span>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="input"
                placeholder="11"
                maxLength={4}
              />
            </label>
          </div>
        )}
      </div>

      {error && (
        <p className="mb-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex items-center justify-end">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Send size={14} />
              Send to SGA
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function EmptyState({ empty, tab }: { empty: boolean; tab: Tab }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-300 px-6 py-14 text-center bg-ink-50/60">
      <MessageSquare size={28} className="mx-auto text-ink-400 mb-3" />
      <p className="font-display text-xl text-ink-800 mb-2">
        {empty
          ? "No submissions yet."
          : tab === "open"
            ? "All caught up."
            : tab === "resolved"
              ? "Nothing resolved yet."
              : "Nothing to show."}
      </p>
      <p className="text-sm text-ink-500 max-w-md mx-auto leading-relaxed">
        {empty
          ? "Be the first to put something on the record."
          : tab === "open"
            ? "The SGA has reviewed or addressed everything currently open."
            : "Submissions move to this tab once the SGA addresses or declines them."}
      </p>
    </div>
  );
}
