"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  Check,
  ChevronDown,
  EyeOff,
  Loader2,
  Lock,
  Plus,
  Send,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { relativeTime } from "@/lib/utils";

type Item = {
  id: string;
  body: string;
  category: string;
  target: string;
  clubId: string | null;
  clubName: string | null;
  clubSlug: string | null;
  votes: number;
  createdAt: string;
  voted: boolean;
};

type Club = { id: string; name: string };

const categories = [
  { value: "all", label: "All" },
  { value: "general", label: "General" },
  { value: "events", label: "Events" },
  { value: "facilities", label: "Facilities" },
  { value: "academics", label: "Academics" },
  { value: "spirit", label: "School spirit" },
];

type Sort = "top" | "new";

function targetLabel(item: Item) {
  if (item.target === "sga") return "SGA";
  if (item.target === "club") return item.clubName ?? "Club";
  return `Class of 20${item.target}`;
}

function targetTone(item: Item) {
  if (item.target === "sga") return "border-ink-300 bg-ink-100 text-ink-700";
  if (item.target === "club") return "border-poly-orange/30 bg-poly-orange/10 text-poly-orangeDark";
  return "border-poly-navy/30 bg-poly-navy/5 text-poly-navy";
}

export default function SuggestionsClient({
  initial,
  clubs,
  preset,
}: {
  initial: Item[];
  clubs: Club[];
  preset?: { target?: string; clubId?: string };
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("top");

  useEffect(() => {
    if (preset?.target) setShowForm(true);
  }, [preset?.target]);

  const filtered = items
    .filter((i) => filter === "all" || i.category === filter)
    .filter((i) => targetFilter === "all" || i.target === targetFilter)
    .sort((a, b) => {
      if (sort === "new")
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (b.votes !== a.votes) return b.votes - a.votes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  function onCreated(item: Item | null) {
    // Private suggestions don't go on the public board
    if (item) setItems((prev) => [item, ...prev]);
    setShowForm(false);
    router.refresh();
  }

  async function vote(id: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, voted: !i.voted, votes: i.votes + (i.voted ? -1 : 1) }
          : i
      )
    );
    const res = await fetch("/api/suggestions/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      const data = await res.json();
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, voted: data.voted, votes: data.votes } : i
        )
      );
    }
  }

  return (
    <div className="container-page py-12 sm:py-16 animate-fade-in">
      <div className="relative">
        <div
          className="absolute -top-6 -right-8 h-64 w-64 rounded-full bg-poly-orange/8 blur-3xl pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute top-8 -left-4 h-32 w-32 rounded-full bg-poly-navy/5 blur-2xl pointer-events-none"
          aria-hidden
        />
      <header className="relative grid lg:grid-cols-[1.1fr_1fr] gap-10 items-end mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-3">
            Your voice
          </p>
          <h1 className="h-display text-5xl sm:text-6xl mb-4">
            Ideas, voted by you.
          </h1>
          <p className="text-ink-600 leading-relaxed max-w-lg">
            See what other Poly students want to change. Upvote what you agree
            with. The most-voted ideas land on our weekly meeting agenda. Want
            to send something directly without posting publicly?{" "}
            <button
              onClick={() => setShowForm(true)}
              className="text-poly-orange underline underline-offset-2 hover:text-poly-orangeDark"
            >
              Use the private form.
            </button>
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 lg:max-w-md lg:ml-auto">
          <Stat icon={<Lock size={14} />} label="Anonymous" value="Always" />
          <Stat icon={<Users size={14} />} label="Sent to" value="Right inbox" />
          <Stat icon={<Sparkles size={14} />} label="Top ideas" value="On agenda" />
        </div>
      </header>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Pills options={categories} value={filter} onChange={setFilter} />

        <select
          value={targetFilter}
          onChange={(e) => setTargetFilter(e.target.value)}
          className="rounded-full bg-ink-100 px-3.5 py-1.5 text-xs font-medium text-ink-700 border-0 focus:ring-2 focus:ring-ink-900 focus:outline-none"
        >
          <option value="all">All inboxes</option>
          <option value="sga">SGA</option>
          <option value="27">Class of 2027</option>
          <option value="28">Class of 2028</option>
          <option value="29">Class of 2029</option>
          <option value="30">Class of 2030</option>
          <option value="club">Clubs</option>
        </select>

        <div className="flex gap-1 p-1 rounded-full bg-ink-100 ml-auto">
          {(["top", "new"] as Sort[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all capitalize ${
                sort === s
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              {s === "top" ? "Top" : "Newest"}
            </button>
          ))}
        </div>

        <button onClick={() => setShowForm(true)} className="btn-accent">
          <Plus size={14} />
          New idea
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center text-sm text-ink-500 py-16">
          No ideas in this filter yet — be the first to share one.
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map((s) => (
            <SuggestionRow key={s.id} item={s} onVote={() => vote(s.id)} />
          ))}
        </div>
      )}

      {showForm && (
        <SubmitModal
          clubs={clubs}
          preset={preset}
          onClose={() => setShowForm(false)}
          onCreated={onCreated}
        />
      )}
    </div>
  );
}

function Pills({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 p-1 rounded-full bg-ink-100">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
            value === o.value
              ? "bg-white text-ink-900 shadow-sm"
              : "text-ink-600 hover:text-ink-900"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="card text-center py-4 px-2">
      <div className="mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink-100 text-ink-700">
        {icon}
      </div>
      <div className="text-xs text-ink-500">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function SuggestionRow({ item, onVote }: { item: Item; onVote: () => void }) {
  return (
    <div className="card flex items-start gap-4 transition-all">
      <button
        onClick={onVote}
        className={`flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-3 py-2 min-w-[3.5rem] transition-all active:scale-95 ${
          item.voted
            ? "bg-poly-orange text-white shadow-[0_4px_12px_-4px_rgba(242,101,34,0.5)]"
            : "bg-ink-100 text-ink-700 hover:bg-ink-200"
        }`}
        aria-label={item.voted ? "Remove upvote" : "Upvote"}
      >
        <ArrowUp size={16} strokeWidth={2.5} />
        <span className="text-sm font-bold mt-0.5">{item.votes}</span>
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`chip ${targetTone(item)}`}>
            For {targetLabel(item)}
          </span>
          <span className="chip capitalize">{item.category}</span>
          <span className="text-xs text-ink-500">{relativeTime(item.createdAt)}</span>
        </div>
        <p className="text-sm text-ink-800 leading-relaxed whitespace-pre-line">
          {item.body}
        </p>
      </div>
    </div>
  );
}

function SubmitModal({
  clubs,
  preset,
  onClose,
  onCreated,
}: {
  clubs: Club[];
  preset?: { target?: string; clubId?: string };
  onClose: () => void;
  onCreated: (item: Item | null) => void;
}) {
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [contact, setContact] = useState("");
  const [target, setTarget] = useState<string>(preset?.target || "sga");
  const [clubId, setClubId] = useState<string>(preset?.clubId || clubs[0]?.id || "");
  const [isPrivate, setIsPrivate] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [wasPrivate, setWasPrivate] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    const submittingPrivate = isPrivate;
    start(async () => {
      try {
        const res = await fetch("/api/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body: body.trim(),
            category,
            contact: contact.trim() || null,
            target,
            clubId: target === "club" ? clubId : null,
            private: isPrivate,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to submit");
        }
        const data = await res.json();
        setWasPrivate(submittingPrivate);
        setDone(true);

        if (!submittingPrivate) {
          const club = clubs.find((c) => c.id === clubId);
          const newItem: Item = {
            id: data.id,
            body: body.trim(),
            category,
            target,
            clubId: target === "club" ? clubId : null,
            clubName: target === "club" ? (club?.name ?? null) : null,
            clubSlug: null,
            votes: 1,
            createdAt: new Date().toISOString(),
            voted: true,
          };
          setTimeout(() => onCreated(newItem), 700);
        } else {
          // Private — don't add to board
          setTimeout(() => onCreated(null), 700);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  const targetOptions = [
    { value: "sga", label: "SGA (school government)" },
    { value: "27", label: "Class of 2027 officers" },
    { value: "28", label: "Class of 2028 officers" },
    { value: "29", label: "Class of 2029 officers" },
    { value: "30", label: "Class of 2030 officers" },
    { value: "club", label: "A specific club…" },
  ];

  const inboxDesc =
    target === "sga"
      ? "Sent to the SGA inbox only."
      : target === "club"
        ? "Sent to the club's inbox AND the SGA inbox."
        : "Sent to that class's inbox AND the SGA inbox.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-ink-900/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl animate-slide-up max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="p-10 text-center">
            <div
              className={`mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full ${
                wasPrivate
                  ? "bg-poly-navy/10 text-poly-navy"
                  : "bg-poly-orange/10 text-poly-orange"
              }`}
            >
              {wasPrivate ? <EyeOff size={20} /> : <Check size={20} />}
            </div>
            <h3 className="font-display text-2xl mb-1">
              {wasPrivate ? "Sent privately." : "Posted."}
            </h3>
            <p className="text-sm text-ink-500">
              {wasPrivate
                ? "Your message went straight to the selected inbox — it won't appear on the public board."
                : "Your idea is live for everyone to vote on."}
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 sm:p-7 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-2xl">
                  {isPrivate ? "Private message" : "Share an idea"}
                </h3>
                <p className="text-xs text-ink-500 mt-1">
                  {isPrivate
                    ? "Goes directly to the selected inbox. Never shown publicly."
                    : "Posted anonymously. Your idea starts with one upvote (yours)."}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -m-2 text-ink-400 hover:text-ink-900 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Private toggle */}
            <div
              className={`flex items-center justify-between rounded-2xl border p-4 cursor-pointer transition-all ${
                isPrivate
                  ? "border-poly-navy/40 bg-poly-navy/5"
                  : "border-ink-200 bg-ink-50 hover:border-ink-300"
              }`}
              onClick={() => setIsPrivate((p) => !p)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                    isPrivate ? "bg-poly-navy text-white" : "bg-ink-200 text-ink-500"
                  }`}
                >
                  <EyeOff size={14} />
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {isPrivate ? "Private message" : "Keep private"}
                  </div>
                  <div className="text-xs text-ink-500">
                    {isPrivate
                      ? "Won't appear on the public board"
                      : "Send directly without posting publicly"}
                  </div>
                </div>
              </div>
              <div
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  isPrivate ? "bg-poly-navy" : "bg-ink-200"
                }`}
              >
                <div
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    isPrivate ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="label">
                {isPrivate ? "Message" : "Idea"}
              </label>
              <textarea
                required
                rows={4}
                maxLength={2000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  isPrivate
                    ? "Write your private message here…"
                    : "Bring back the senior–faculty basketball game..."
                }
                className="input resize-none"
              />
              <div className="mt-1 text-right text-[11px] text-ink-400">
                {body.length}/2000
              </div>
            </div>

            <div>
              <label className="label">Send this to</label>
              <div className="relative">
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="input appearance-none pr-10"
                >
                  {targetOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
                />
              </div>
              <p className="text-xs text-ink-500 mt-2">{inboxDesc}</p>
            </div>

            {target === "club" && (
              <div>
                <label className="label">Which club?</label>
                {clubs.length === 0 ? (
                  <div className="text-sm text-ink-500">No clubs yet.</div>
                ) : (
                  <div className="relative">
                    <select
                      value={clubId}
                      onChange={(e) => setClubId(e.target.value)}
                      className="input appearance-none pr-10"
                    >
                      {clubs.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
                    />
                  </div>
                )}
              </div>
            )}

            {!isPrivate && (
              <div>
                <label className="label">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.slice(1).map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                        category === c.value
                          ? "bg-ink-900 text-ink-50"
                          : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="label">
                Contact{" "}
                <span className="font-normal text-ink-400">
                  (optional — only officers see this)
                </span>
              </label>
              <input
                type="text"
                maxLength={120}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Email or @ handle if you want a reply"
                className="input"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending || !body.trim()}
              className={`w-full ${isPrivate ? "btn bg-poly-navy text-white hover:bg-poly-navy/90" : "btn-accent"}`}
            >
              {pending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending…
                </>
              ) : isPrivate ? (
                <>
                  <EyeOff size={14} />
                  Send privately
                </>
              ) : (
                <>
                  <Send size={14} />
                  Post idea
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
