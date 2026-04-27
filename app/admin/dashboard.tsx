"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Calendar,
  ChevronDown,
  Check,
  Edit2,
  ExternalLink,
  File,
  FileText,
  Inbox,
  KeyRound,
  Link2,
  Loader2,
  LogOut,
  Megaphone,
  Pin,
  PinOff,
  Plus,
  Send,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  UserCog,
  UserPlus,
  X,
} from "lucide-react";
import { formatDate, formatTime, relativeTime } from "@/lib/utils";
import type { AdminRole, SessionPayload } from "@/lib/auth";
import PhotoUpload from "@/components/photo-upload";

type Club = {
  id: string;
  slug: string;
  name: string;
  description: string;
  meetingTime: string | null;
  location: string | null;
  photoUrl: string | null;
};

type Account = {
  id: string;
  username: string;
  name: string;
  role: string;
  classYear: string | null;
  clubId: string | null;
  teamMemberId: string | null;
  createdAt: Date | string;
};

type ClubRequest = {
  id: string;
  clubName: string;
  description: string;
  contactName: string | null;
  contactInfo: string | null;
  status: string;
  createdAt: Date | string;
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  audience: string;
  clubId: string | null;
  club: Club | null;
  authorName: string | null;
  createdAt: Date | string;
};
type EventItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  audience: string;
  clubId: string | null;
  club: Club | null;
  startsAt: Date | string;
  endsAt: Date | string | null;
};
type TeamMember = {
  id: string;
  name: string;
  role: string;
  grade: string;
  bio: string | null;
  photoUrl: string | null;
  order: number;
};
type Suggestion = {
  id: string;
  body: string;
  category: string;
  contact: string | null;
  read: boolean;
  private: boolean;
  votes: number;
  target: string;
  clubId: string | null;
  club: Club | null;
  createdAt: Date | string;
};

type ResourceLink = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: string;
  audience: string;
  clubId: string | null;
  club: { name: string; slug: string } | null;
  pinned: boolean;
  authorName: string | null;
  createdAt: Date | string;
};

type Capabilities = {
  canManageTeam: boolean;
  canManageClubs: boolean;
  canRedirect: boolean;
  canManageAccounts: boolean;
  isSiteAdmin: boolean;
};

type Tab = "announcements" | "events" | "links" | "clubs" | "team" | "inbox" | "accounts";

const SCHOOL_AUDIENCES = [
  { value: "all", label: "Schoolwide" },
  { value: "27", label: "Class of 2027" },
  { value: "28", label: "Class of 2028" },
  { value: "29", label: "Class of 2029" },
  { value: "30", label: "Class of 2030" },
];

function audienceOptions(role: AdminRole, classYear: string | null, clubId: string | null) {
  if (role === "sga_admin" || role === "sga_member") {
    // SGA roles can also post to a club (handled separately)
    return SCHOOL_AUDIENCES;
  }
  if (role === "class" && classYear) {
    return [{ value: classYear, label: `Class of 20${classYear}` }];
  }
  if (role === "club" && clubId) {
    return [{ value: "club", label: "Club post" }];
  }
  return [];
}

function audienceLabel(a: Announcement | EventItem) {
  if (a.audience === "all") return "Schoolwide";
  if (a.audience === "club") return a.club?.name || "Club";
  return `Class of 20${a.audience}`;
}

function targetLabel(s: Suggestion) {
  if (s.target === "sga") return "SGA";
  if (s.target === "club") return s.club?.name || "Club";
  return `Class of 20${s.target}`;
}

function roleHeading(s: { role: AdminRole; classYear: string | null }) {
  if (s.role === "sga_admin") return "SGA Admin";
  if (s.role === "sga_member") return "SGA Officer";
  if (s.role === "class") return `Class of 20${s.classYear} Officer`;
  if (s.role === "club") return "Club Officer";
  return "Officer";
}

export default function AdminDashboard({
  session,
  capabilities,
  initial,
}: {
  session: SessionPayload;
  capabilities: Capabilities;
  initial: {
    announcements: Announcement[];
    events: EventItem[];
    team: TeamMember[];
    suggestions: Suggestion[];
    unread: number;
    clubs: Club[];
    accounts: Account[];
    clubRequests: ClubRequest[];
    links: ResourceLink[];
  };
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("announcements");
  const [pending, start] = useTransition();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  function refresh() {
    start(() => router.refresh());
  }

  return (
    <div className="container-page py-10 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 pb-6 border-b border-ink-200">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-1">
            {roleHeading(session)}
          </p>
          <h1 className="h-display text-3xl">
            Hi, {session.name.split(" ")[0]}.
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/profile" className="btn-ghost">
            <UserCog size={14} />
            Profile
          </Link>
          <button onClick={logout} className="btn-ghost">
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-1 mb-8 p-1 rounded-full bg-ink-100 w-fit">
        <TabBtn
          active={tab === "announcements"}
          onClick={() => setTab("announcements")}
          icon={<Megaphone size={14} />}
          label="Announcements"
        />
        <TabBtn
          active={tab === "events"}
          onClick={() => setTab("events")}
          icon={<Calendar size={14} />}
          label="Events"
        />
        <TabBtn
          active={tab === "links"}
          onClick={() => setTab("links")}
          icon={<Link2 size={14} />}
          label="Links"
        />
        {capabilities.canManageClubs && (
          <TabBtn
            active={tab === "clubs"}
            onClick={() => setTab("clubs")}
            icon={<Briefcase size={14} />}
            label="Clubs"
          />
        )}
        {capabilities.canManageTeam && (
          <TabBtn
            active={tab === "team"}
            onClick={() => setTab("team")}
            icon={<Users size={14} />}
            label="Team"
          />
        )}
        <TabBtn
          active={tab === "inbox"}
          onClick={() => setTab("inbox")}
          icon={<Inbox size={14} />}
          label="Inbox"
          badge={initial.unread > 0 ? initial.unread : undefined}
        />
        {capabilities.canManageAccounts && (
          <TabBtn
            active={tab === "accounts"}
            onClick={() => setTab("accounts")}
            icon={<ShieldCheck size={14} />}
            label="Accounts"
          />
        )}
      </div>

      <div className={pending ? "opacity-60 pointer-events-none transition-opacity" : ""}>
        {tab === "announcements" && (
          <AnnouncementsTab
            session={session}
            clubs={initial.clubs}
            items={initial.announcements}
            onChange={refresh}
          />
        )}
        {tab === "events" && (
          <EventsTab
            session={session}
            clubs={initial.clubs}
            items={initial.events}
            onChange={refresh}
          />
        )}
        {tab === "links" && (
          <LinksTab
            session={session}
            clubs={initial.clubs}
            items={initial.links}
            canPin={capabilities.canRedirect}
            onChange={refresh}
          />
        )}
        {tab === "clubs" && capabilities.canManageClubs && (
          <ClubsTab items={initial.clubs} clubRequests={initial.clubRequests} onChange={refresh} />
        )}
        {tab === "team" && capabilities.canManageTeam && (
          <TeamTab items={initial.team} onChange={refresh} />
        )}
        {tab === "inbox" && (
          <InboxTab
            items={initial.suggestions}
            clubs={initial.clubs}
            canRedirect={capabilities.canRedirect}
            onChange={refresh}
          />
        )}
        {tab === "accounts" && capabilities.canManageAccounts && (
          <AccountsTab
            currentAdminId={session.adminId}
            isSiteAdmin={capabilities.isSiteAdmin}
            accounts={initial.accounts}
            clubs={initial.clubs}
            clubRequests={initial.clubRequests}
            onChange={refresh}
          />
        )}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all ${
        active ? "bg-white text-ink-900 shadow-sm" : "text-ink-600 hover:text-ink-900"
      }`}
    >
      {icon}
      {label}
      {badge !== undefined && (
        <span className="ml-1 inline-flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-poly-orange text-white text-[9px] font-bold">
          {badge}
        </span>
      )}
    </button>
  );
}

/* ---------- Announcements ---------- */

function AnnouncementsTab({
  session,
  clubs,
  items,
  onChange,
}: {
  session: SessionPayload;
  clubs: Club[];
  items: Announcement[];
  onChange: () => void;
}) {
  const opts = audienceOptions(session.role, session.classYear, session.clubId);
  const canPostClub =
    session.role === "sga_admin" ||
    session.role === "sga_member" ||
    session.role === "club";

  const initialAudience = session.role === "club" ? "club" : opts[0]?.value || "all";

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [audience, setAudience] = useState(initialAudience);
  const [clubId, setClubId] = useState<string>(session.clubId || clubs[0]?.id || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function create() {
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        body,
        pinned,
        audience,
        clubId: audience === "club" ? clubId : null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Failed");
      return;
    }
    setOpen(false);
    setTitle("");
    setBody("");
    setPinned(false);
    setAudience(initialAudience);
    onChange();
  }

  async function togglePin(id: string, val: boolean) {
    await fetch("/api/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, pinned: val }),
    });
    onChange();
  }

  async function remove(id: string) {
    if (!confirm("Delete this announcement?")) return;
    await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
    onChange();
  }

  function canEdit(a: Announcement) {
    if (session.role === "sga_admin" || session.role === "sga_member") {
      // SGA can edit non-club content; for club content only sga_admin
      if (a.audience === "club") return session.role === "sga_admin";
      return true;
    }
    if (session.role === "class") return a.audience === session.classYear;
    if (session.role === "club") return a.audience === "club" && a.clubId === session.clubId;
    return false;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl">Announcements</h2>
        <button onClick={() => setOpen(!open)} className="btn-primary">
          <Plus size={14} /> {open ? "Cancel" : "New"}
        </button>
      </div>

      {open && (
        <div className="card mb-4 space-y-4 animate-slide-up">
          <div>
            <label className="label">Title</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Spring spirit week schedule"
            />
          </div>
          <div>
            <label className="label">Body</label>
            <textarea
              className="input resize-none"
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Audience</label>
            <div className="flex flex-wrap gap-2">
              {opts.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setAudience(o.value)}
                  disabled={opts.length === 1 && !canPostClub}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    audience === o.value
                      ? "bg-ink-900 text-ink-50"
                      : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                  }`}
                >
                  {o.label}
                </button>
              ))}
              {canPostClub && (
                <button
                  type="button"
                  onClick={() => setAudience("club")}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    audience === "club"
                      ? "bg-ink-900 text-ink-50"
                      : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                  }`}
                >
                  Club post
                </button>
              )}
            </div>
            {audience === "club" && (
              <div className="mt-3 max-w-xs">
                <ClubSelect
                  clubs={
                    session.role === "club" && session.clubId
                      ? clubs.filter((c) => c.id === session.clubId)
                      : clubs
                  }
                  value={clubId}
                  onChange={setClubId}
                />
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
            />
            Pin to top
          </label>
          {err && <ErrorBox message={err} />}
          <button onClick={create} disabled={busy} className="btn-accent">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Publish
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <Empty>No announcements yet.</Empty>
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <div key={a.id} className="card flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5 text-xs">
                  <span
                    className={`chip ${
                      a.audience === "all"
                        ? "border-ink-300 bg-ink-100 text-ink-700"
                        : a.audience === "club"
                          ? "border-poly-orange/30 bg-poly-orange/10 text-poly-orangeDark"
                          : "border-poly-navy/30 bg-poly-navy/5 text-poly-navy"
                    }`}
                  >
                    {audienceLabel(a)}
                  </span>
                  {a.pinned && (
                    <span className="chip border-poly-orange/30 bg-poly-orange/10 text-poly-orangeDark">
                      <Pin size={10} /> Pinned
                    </span>
                  )}
                  <span className="text-ink-500">{relativeTime(a.createdAt)}</span>
                </div>
                <h3 className="font-display text-lg mb-1">{a.title}</h3>
                <p className="text-sm text-ink-600 line-clamp-2">{a.body}</p>
              </div>
              {canEdit(a) ? (
                <div className="flex flex-col gap-1">
                  <IconBtn
                    onClick={() => togglePin(a.id, !a.pinned)}
                    title={a.pinned ? "Unpin" : "Pin"}
                  >
                    {a.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                  </IconBtn>
                  <IconBtn onClick={() => remove(a.id)} title="Delete" danger>
                    <Trash2 size={14} />
                  </IconBtn>
                </div>
              ) : (
                <span className="text-[10px] uppercase tracking-wider text-ink-400 self-center">
                  Read-only
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Events ---------- */

function EventsTab({
  session,
  clubs,
  items,
  onChange,
}: {
  session: SessionPayload;
  clubs: Club[];
  items: EventItem[];
  onChange: () => void;
}) {
  const opts = audienceOptions(session.role, session.classYear, session.clubId);
  const canPostClub =
    session.role === "sga_admin" ||
    session.role === "sga_member" ||
    session.role === "club";

  const initialAudience = session.role === "club" ? "club" : opts[0]?.value || "all";

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    startsAt: "",
    endsAt: "",
    audience: initialAudience,
    clubId: session.clubId || clubs[0]?.id || "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    title?: string;
    description?: string;
    location?: string;
    startsAt?: string;
    endsAt?: string;
  }>({});

  async function create() {
    if (!form.title || !form.description || !form.location || !form.startsAt) return;
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        endsAt: form.endsAt || null,
        clubId: form.audience === "club" ? form.clubId : null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Failed");
      return;
    }
    setOpen(false);
    setForm({
      title: "",
      description: "",
      location: "",
      startsAt: "",
      endsAt: "",
      audience: initialAudience,
      clubId: session.clubId || clubs[0]?.id || "",
    });
    onChange();
  }

  async function remove(id: string) {
    if (!confirm("Delete this event?")) return;
    await fetch(`/api/events?id=${id}`, { method: "DELETE" });
    onChange();
  }

  async function saveEdit(id: string) {
    setBusy(true);
    await fetch("/api/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editForm }),
    });
    setBusy(false);
    setEditingId(null);
    setEditForm({});
    onChange();
  }

  function canEdit(e: EventItem) {
    if (session.role === "sga_admin" || session.role === "sga_member") {
      if (e.audience === "club") return session.role === "sga_admin";
      return true;
    }
    if (session.role === "class") return e.audience === session.classYear;
    if (session.role === "club") return e.audience === "club" && e.clubId === session.clubId;
    return false;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl">Events</h2>
        <button onClick={() => setOpen(!open)} className="btn-primary">
          <Plus size={14} /> {open ? "Cancel" : "New"}
        </button>
      </div>

      {open && (
        <div className="card mb-4 space-y-4 animate-slide-up">
          <div>
            <label className="label">Title</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Location</label>
              <input
                className="input"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Starts at</label>
              <input
                type="datetime-local"
                className="input"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Ends at (optional)</label>
            <input
              type="datetime-local"
              className="input"
              value={form.endsAt}
              onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Audience</label>
            <div className="flex flex-wrap gap-2">
              {opts.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setForm({ ...form, audience: o.value })}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    form.audience === o.value
                      ? "bg-ink-900 text-ink-50"
                      : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                  }`}
                >
                  {o.label}
                </button>
              ))}
              {canPostClub && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, audience: "club" })}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    form.audience === "club"
                      ? "bg-ink-900 text-ink-50"
                      : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                  }`}
                >
                  Club event
                </button>
              )}
            </div>
            {form.audience === "club" && (
              <div className="mt-3 max-w-xs">
                <ClubSelect
                  clubs={
                    session.role === "club" && session.clubId
                      ? clubs.filter((c) => c.id === session.clubId)
                      : clubs
                  }
                  value={form.clubId}
                  onChange={(v) => setForm({ ...form, clubId: v })}
                />
              </div>
            )}
          </div>
          {err && <ErrorBox message={err} />}
          <button onClick={create} disabled={busy} className="btn-accent">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Publish
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <Empty>No events scheduled.</Empty>
      ) : (
        <div className="space-y-2">
          {items.map((e) => (
            <div key={e.id} className="card">
              {editingId === e.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Title</label>
                      <input
                        className="input"
                        defaultValue={e.title}
                        onChange={(ev) => setEditForm((p) => ({ ...p, title: ev.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="label">Location</label>
                      <input
                        className="input"
                        defaultValue={e.location}
                        onChange={(ev) => setEditForm((p) => ({ ...p, location: ev.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea
                      className="input resize-none"
                      rows={2}
                      defaultValue={e.description}
                      onChange={(ev) => setEditForm((p) => ({ ...p, description: ev.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Starts at</label>
                      <input
                        type="datetime-local"
                        className="input"
                        defaultValue={new Date(e.startsAt).toISOString().slice(0, 16)}
                        onChange={(ev) => setEditForm((p) => ({ ...p, startsAt: ev.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="label">Ends at (optional)</label>
                      <input
                        type="datetime-local"
                        className="input"
                        defaultValue={e.endsAt ? new Date(e.endsAt).toISOString().slice(0, 16) : ""}
                        onChange={(ev) => setEditForm((p) => ({ ...p, endsAt: ev.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(e.id)} disabled={busy} className="btn-accent">
                      {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Save
                    </button>
                    <button onClick={() => { setEditingId(null); setEditForm({}); }} className="btn-ghost">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5 text-xs">
                      <span
                        className={`chip ${
                          e.audience === "all"
                            ? "border-ink-300 bg-ink-100 text-ink-700"
                            : e.audience === "club"
                              ? "border-poly-orange/30 bg-poly-orange/10 text-poly-orangeDark"
                              : "border-poly-navy/30 bg-poly-navy/5 text-poly-navy"
                        }`}
                      >
                        {audienceLabel(e)}
                      </span>
                    </div>
                    <h3 className="font-display text-lg mb-1">{e.title}</h3>
                    <p className="text-sm text-ink-600 line-clamp-2 mb-2">{e.description}</p>
                    <div className="text-xs text-ink-500">
                      {formatDate(e.startsAt)} · {formatTime(e.startsAt)} · {e.location}
                    </div>
                  </div>
                  {canEdit(e) ? (
                    <div className="flex flex-col gap-1 shrink-0">
                      <IconBtn
                        onClick={() => { setEditingId(e.id); setEditForm({}); }}
                        title="Edit"
                      >
                        <Settings size={14} />
                      </IconBtn>
                      <IconBtn onClick={() => remove(e.id)} title="Delete" danger>
                        <Trash2 size={14} />
                      </IconBtn>
                    </div>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider text-ink-400 self-center">
                      Read-only
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Clubs (with club requests panel) ---------- */

function ClubsTab({
  items,
  clubRequests,
  onChange,
}: {
  items: Club[];
  clubRequests: ClubRequest[];
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    meetingTime: "",
    location: "",
    photoUrl: "",
  });
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Club>>({});

  async function create() {
    if (!form.name || !form.description) return;
    setBusy(true);
    await fetch("/api/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    setOpen(false);
    setForm({ name: "", slug: "", description: "", meetingTime: "", location: "", photoUrl: "" });
    onChange();
  }

  async function save(id: string) {
    setBusy(true);
    await fetch(`/api/clubs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setBusy(false);
    setEditing(null);
    onChange();
  }

  async function remove(id: string) {
    if (!confirm("Delete this club?")) return;
    await fetch(`/api/clubs/${id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl">Clubs</h2>
        <button onClick={() => setOpen(!open)} className="btn-primary">
          <Plus size={14} /> {open ? "Cancel" : "New"}
        </button>
      </div>

      {open && (
        <div className="card mb-4 space-y-4 animate-slide-up">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Robotics Team"
              />
            </div>
            <div>
              <label className="label">Slug (optional)</label>
              <input
                className="input font-mono lowercase"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="auto-generated from name"
              />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Meeting time</label>
              <input
                className="input"
                value={form.meetingTime}
                onChange={(e) => setForm({ ...form, meetingTime: e.target.value })}
                placeholder="Tuesdays, 3:30 PM"
              />
            </div>
            <div>
              <label className="label">Location</label>
              <input
                className="input"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Room 312"
              />
            </div>
          </div>
          <div>
            <label className="label">Photo URL</label>
            <input
              className="input"
              value={form.photoUrl}
              onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <button onClick={create} disabled={busy} className="btn-accent">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Create club
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <Empty>No clubs yet.</Empty>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((c) => (
            <div key={c.id} className="card">
              {editing === c.id ? (
                <div className="space-y-3">
                  <input
                    className="input"
                    placeholder="Name"
                    defaultValue={c.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  />
                  <textarea
                    className="input resize-none"
                    rows={3}
                    placeholder="Description"
                    defaultValue={c.description}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, description: e.target.value }))
                    }
                  />
                  <input
                    className="input"
                    placeholder="Meeting time"
                    defaultValue={c.meetingTime || ""}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, meetingTime: e.target.value }))
                    }
                  />
                  <input
                    className="input"
                    placeholder="Location"
                    defaultValue={c.location || ""}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, location: e.target.value }))
                    }
                  />
                  <input
                    className="input"
                    placeholder="Photo URL (optional)"
                    defaultValue={c.photoUrl || ""}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, photoUrl: e.target.value }))
                    }
                  />
                  <div className="flex gap-2">
                    <button onClick={() => save(c.id)} className="btn-accent">
                      <Check size={14} /> Save
                    </button>
                    <button
                      onClick={() => {
                        setEditing(null);
                        setEditForm({});
                      }}
                      className="btn-ghost"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  {c.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.photoUrl}
                      alt={c.name}
                      className="h-14 w-14 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-ink-100 flex items-center justify-center text-ink-500 flex-shrink-0">
                      <Briefcase size={18} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-ink-500 truncate">{c.description}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <IconBtn
                      onClick={() => {
                        setEditing(c.id);
                        setEditForm({});
                      }}
                      title="Edit"
                    >
                      <Settings size={14} />
                    </IconBtn>
                    <IconBtn onClick={() => remove(c.id)} title="Delete" danger>
                      <Trash2 size={14} />
                    </IconBtn>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Club requests */}
      <div className="mt-10 pt-8 border-t border-ink-200">
        <h3 className="font-display text-lg mb-4">
          Club Requests
          {clubRequests.filter((r) => r.status === "pending").length > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-poly-orange text-white text-[10px] font-bold">
              {clubRequests.filter((r) => r.status === "pending").length}
            </span>
          )}
        </h3>
        {clubRequests.length === 0 ? (
          <p className="text-sm text-ink-500">No club requests yet.</p>
        ) : (
          <div className="space-y-2">
            {clubRequests.map((r) => (
              <ClubRequestRow key={r.id} r={r} onChange={onChange} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ClubRequestRow({ r, onChange }: { r: ClubRequest; onChange: () => void }) {
  const [busy, setBusy] = useState(false);

  async function setStatus(status: string) {
    setBusy(true);
    await fetch("/api/club-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, status }),
    });
    setBusy(false);
    onChange();
  }

  async function remove() {
    if (!confirm("Delete this request?")) return;
    await fetch(`/api/club-requests?id=${r.id}`, { method: "DELETE" });
    onChange();
  }

  const statusColors: Record<string, string> = {
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    reviewed: "border-green-200 bg-green-50 text-green-700",
    declined: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <div className="card">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={`chip text-xs ${statusColors[r.status] || ""}`}>
              {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
            </span>
            <span className="text-xs text-ink-500">{relativeTime(r.createdAt)}</span>
          </div>
          <div className="font-medium">{r.clubName}</div>
          <p className="text-sm text-ink-600 mt-1 leading-relaxed">{r.description}</p>
          {(r.contactName || r.contactInfo) && (
            <div className="mt-2 text-xs text-ink-500">
              {r.contactName && <span>From: <span className="text-ink-700">{r.contactName}</span></span>}
              {r.contactInfo && <span className="ml-3">Contact: <span className="text-ink-700">{r.contactInfo}</span></span>}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {r.status !== "reviewed" && (
            <IconBtn onClick={() => setStatus("reviewed")} title="Mark reviewed">
              <Check size={14} />
            </IconBtn>
          )}
          {r.status !== "declined" && (
            <IconBtn onClick={() => setStatus("declined")} title="Decline">
              <X size={14} />
            </IconBtn>
          )}
          {r.status === "pending" && (
            <IconBtn onClick={() => setStatus("pending")} title="Reset to pending">
              <Settings size={14} />
            </IconBtn>
          )}
          <IconBtn onClick={remove} title="Delete" danger>
            <Trash2 size={14} />
          </IconBtn>
          {busy && <Loader2 size={14} className="animate-spin text-ink-400 mx-auto" />}
        </div>
      </div>
    </div>
  );
}

/* ---------- Team ---------- */

function TeamTab({
  items,
  onChange,
}: {
  items: TeamMember[];
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    role: "",
    grade: "",
    bio: "",
    photoUrl: "",
    order: "0",
  });
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name?: string; role?: string; grade?: string; bio?: string; photoUrl?: string; order?: string;
  }>({});

  async function saveEdit(id: string) {
    setBusy(true);
    await fetch(`/api/team/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editForm,
        order: editForm.order !== undefined ? parseInt(editForm.order) || 0 : undefined,
        bio: editForm.bio || null,
        photoUrl: editForm.photoUrl || null,
      }),
    });
    setBusy(false);
    setEditingId(null);
    setEditForm({});
    onChange();
  }

  async function create() {
    if (!form.name || !form.role || !form.grade) return;
    setBusy(true);
    await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        order: parseInt(form.order) || 0,
        bio: form.bio || null,
        photoUrl: form.photoUrl || null,
      }),
    });
    setBusy(false);
    setOpen(false);
    setForm({ name: "", role: "", grade: "", bio: "", photoUrl: "", order: "0" });
    onChange();
  }

  async function remove(id: string) {
    if (!confirm("Remove this member?")) return;
    await fetch(`/api/team/${id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl">Team</h2>
        <button onClick={() => setOpen(!open)} className="btn-primary">
          <Plus size={14} /> {open ? "Cancel" : "Add member"}
        </button>
      </div>

      <p className="text-xs text-ink-500 mb-4 max-w-lg">
        SGA officers edit their own profile from <Link href="/admin/profile" className="underline hover:text-ink-900">/admin/profile</Link>. From here you can add new members or remove old ones.
      </p>

      {open && (
        <div className="card mb-4 space-y-4 animate-slide-up">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Role</label>
              <input
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Grade</label>
              <input
                className="input"
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Sort order</label>
              <input
                type="number"
                className="input"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Photo</label>
            <PhotoUpload
              currentUrl={form.photoUrl || null}
              initials={form.name ? form.name.split(" ").map((s: string) => s[0]).slice(0, 2).join("") : "?"}
              onUpload={(url) => setForm({ ...form, photoUrl: url })}
              size="sm"
            />
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
          <button onClick={create} disabled={busy} className="btn-accent">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Add
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <Empty>No team members yet.</Empty>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((m) => (
            <div key={m.id} className="card space-y-3">
              {editingId === m.id ? (
                <div className="space-y-3 animate-slide-up">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label">Name</label>
                      <input className="input" defaultValue={m.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Role</label>
                      <input className="input" defaultValue={m.role}
                        onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Grade</label>
                      <input className="input" defaultValue={m.grade}
                        onChange={(e) => setEditForm((f) => ({ ...f, grade: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Order</label>
                      <input className="input" type="number" defaultValue={m.order}
                        onChange={(e) => setEditForm((f) => ({ ...f, order: e.target.value }))} />
                    </div>
                    <div className="col-span-2">
                      <label className="label">Photo</label>
                      <PhotoUpload
                        currentUrl={editForm.photoUrl !== undefined ? (editForm.photoUrl || null) : (m.photoUrl || null)}
                        initials={m.name.split(" ").map((s: string) => s[0]).slice(0, 2).join("")}
                        onUpload={(url) => setEditForm((f) => ({ ...f, photoUrl: url }))}
                        size="sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="label">Bio</label>
                      <textarea className="input resize-none" rows={2} defaultValue={m.bio || ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(m.id)} disabled={busy} className="btn-primary">
                      {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
                    </button>
                    <button onClick={() => { setEditingId(null); setEditForm({}); }} className="btn-ghost">
                      <X size={13} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  {m.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photoUrl} alt={m.name} className="h-12 w-12 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-ink-100 text-ink-700 flex items-center justify-center font-display flex-shrink-0">
                      {m.name.split(" ").map((s: string) => s[0]).slice(0, 2).join("")}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-sm text-ink-700">{m.role}</div>
                    <div className="text-xs text-ink-500">{m.grade}</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <IconBtn onClick={() => { setEditingId(m.id); setEditForm({}); }} title="Edit">
                      <Edit2 size={14} />
                    </IconBtn>
                    <IconBtn onClick={() => remove(m.id)} title="Delete" danger>
                      <Trash2 size={14} />
                    </IconBtn>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Links ---------- */

const LINK_CATEGORIES = [
  { value: "form", label: "Google Form" },
  { value: "doc", label: "Document" },
  { value: "link", label: "General Link" },
];

function linkCategoryIcon(cat: string) {
  if (cat === "form") return <FileText size={13} className="text-blue-600" />;
  if (cat === "doc") return <File size={13} className="text-violet-600" />;
  return <Link2 size={13} className="text-ink-500" />;
}

function LinksTab({
  session,
  clubs,
  items,
  canPin,
  onChange,
}: {
  session: SessionPayload;
  clubs: Club[];
  items: ResourceLink[];
  canPin: boolean;
  onChange: () => void;
}) {
  const opts = audienceOptions(session.role, session.classYear, session.clubId);
  const initialAudience = session.role === "club" ? "club" : opts[0]?.value || "all";

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    url: "",
    description: "",
    category: "link",
    audience: initialAudience,
    clubId: session.clubId || clubs[0]?.id || "",
    pinned: false,
    authorName: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    title?: string; url?: string; description?: string; category?: string; pinned?: boolean;
  }>({});

  async function create() {
    if (!form.title.trim() || !form.url.trim()) return;
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        description: form.description || null,
        clubId: form.audience === "club" ? form.clubId : null,
        authorName: form.authorName || null,
      }),
    });
    setBusy(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setErr(d.error || "Failed"); return; }
    setOpen(false);
    setForm({ title: "", url: "", description: "", category: "link", audience: initialAudience, clubId: session.clubId || clubs[0]?.id || "", pinned: false, authorName: "" });
    onChange();
  }

  async function saveEdit(id: string) {
    setBusy(true);
    const res = await fetch("/api/links", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editForm }),
    });
    setBusy(false);
    if (!res.ok) return;
    setEditingId(null);
    setEditForm({});
    onChange();
  }

  async function remove(id: string) {
    if (!confirm("Remove this link?")) return;
    await fetch(`/api/links?id=${id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl">Links &amp; Resources</h2>
        <button onClick={() => setOpen((o) => !o)} className="btn-primary">
          <Plus size={14} /> {open ? "Cancel" : "Add link"}
        </button>
      </div>
      <p className="text-xs text-ink-500 mb-4 max-w-lg">
        Post Google Forms, sign-up sheets, documents, or any important URL. Students see these at{" "}
        <a href="/links" className="underline hover:text-ink-900" target="_blank">/links</a>.
      </p>

      {err && <ErrorBox message={err} />}

      {open && (
        <div className="card mb-4 space-y-4 animate-slide-up">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Title <span className="text-red-500">*</span></label>
              <input className="input" placeholder="Senior Survey 2027" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="label">URL <span className="text-red-500">*</span></label>
              <input className="input font-mono text-sm" placeholder="https://forms.gle/…" value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <input className="input" placeholder="Brief note for students (optional)" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Type</label>
              <div className="relative">
                <select className="input appearance-none pr-10" value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {LINK_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
              </div>
            </div>
            {session.role !== "club" && (
              <div>
                <label className="label">Audience</label>
                <div className="relative">
                  <select className="input appearance-none pr-10" value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                    {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                </div>
              </div>
            )}
            <div>
              <label className="label">Author name</label>
              <input className="input" placeholder={session.name} value={form.authorName}
                onChange={(e) => setForm({ ...form, authorName: e.target.value })} />
            </div>
            {canPin && (
              <div className="flex items-center gap-3 pt-6">
                <input id="link-pin" type="checkbox" checked={form.pinned}
                  onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                  className="h-4 w-4 rounded border-ink-300" />
                <label htmlFor="link-pin" className="text-sm font-medium">Pin to top</label>
              </div>
            )}
          </div>
          <button onClick={create} disabled={busy || !form.title.trim() || !form.url.trim()} className="btn-primary">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Post link
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <Empty>No links posted yet.</Empty>
      ) : (
        <div className="space-y-2">
          {items.map((l) => (
            <div key={l.id} className="card">
              {editingId === l.id ? (
                <div className="space-y-3 animate-slide-up">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="label">Title</label>
                      <input className="input" defaultValue={l.title}
                        onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div className="col-span-2">
                      <label className="label">URL</label>
                      <input className="input font-mono text-sm" defaultValue={l.url}
                        onChange={(e) => setEditForm((f) => ({ ...f, url: e.target.value }))} />
                    </div>
                    <div className="col-span-2">
                      <label className="label">Description</label>
                      <input className="input" defaultValue={l.description || ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Type</label>
                      <div className="relative">
                        <select className="input appearance-none pr-10" defaultValue={l.category}
                          onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}>
                          {LINK_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                      </div>
                    </div>
                    {canPin && (
                      <div className="flex items-center gap-2 pt-6">
                        <input type="checkbox" defaultChecked={l.pinned}
                          onChange={(e) => setEditForm((f) => ({ ...f, pinned: e.target.checked }))}
                          className="h-4 w-4 rounded border-ink-300" />
                        <span className="text-sm">Pinned</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(l.id)} disabled={busy} className="btn-primary">
                      {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
                    </button>
                    <button onClick={() => { setEditingId(null); setEditForm({}); }} className="btn-ghost">
                      <X size={13} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-ink-100 mt-0.5">
                    {linkCategoryIcon(l.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-medium">{l.title}</span>
                      {l.pinned && <Pin size={11} className="text-poly-orange" />}
                    </div>
                    <a href={l.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-mono text-ink-400 hover:text-poly-orange truncate block max-w-xs transition-colors">
                      {l.url}
                    </a>
                    {l.description && <p className="text-xs text-ink-500 mt-0.5">{l.description}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <a href={l.url} target="_blank" rel="noopener noreferrer">
                      <IconBtn onClick={() => {}} title="Open link">
                        <ExternalLink size={14} />
                      </IconBtn>
                    </a>
                    <IconBtn onClick={() => { setEditingId(l.id); setEditForm({}); }} title="Edit">
                      <Edit2 size={14} />
                    </IconBtn>
                    <IconBtn onClick={() => remove(l.id)} title="Delete" danger>
                      <Trash2 size={14} />
                    </IconBtn>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Accounts ---------- */

const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: "sga_admin", label: "SGA Admin" },
  { value: "sga_member", label: "SGA Officer" },
  { value: "class", label: "Class Officer" },
  { value: "club", label: "Club Officer" },
];

function roleBadge(role: string) {
  if (role === "sga_admin") return "border-poly-orange/30 bg-poly-orange/10 text-poly-orangeDark";
  if (role === "sga_member") return "border-poly-navy/30 bg-poly-navy/5 text-poly-navy";
  if (role === "class") return "border-ink-300 bg-ink-100 text-ink-700";
  return "border-ink-200 bg-ink-50 text-ink-600";
}

function AccountsTab({
  currentAdminId,
  isSiteAdmin,
  accounts,
  clubs,
  clubRequests,
  onChange,
}: {
  currentAdminId: string;
  isSiteAdmin: boolean;
  accounts: Account[];
  clubs: Club[];
  clubRequests: ClubRequest[];
  onChange: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({
    username: "",
    name: "",
    password: "",
    role: "sga_member" as AdminRole,
    classYear: "",
    clubId: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    username?: string;
    name?: string;
    password?: string;
    role?: string;
    classYear?: string;
    clubId?: string;
  }>({});

  async function createAccount() {
    if (!newForm.username || !newForm.name || !newForm.password) return;
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/admin/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newForm,
        classYear: newForm.classYear || undefined,
        clubId: newForm.clubId || undefined,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Failed");
      return;
    }
    setCreating(false);
    setNewForm({ username: "", name: "", password: "", role: "sga_member", classYear: "", clubId: "" });
    onChange();
  }

  async function saveEdit(id: string) {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/admin/accounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editForm }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Failed");
      return;
    }
    setEditingId(null);
    setEditForm({});
    onChange();
  }

  async function deleteAccount(id: string, name: string) {
    if (!confirm(`Remove ${name}'s account? This cannot be undone.`)) return;
    await fetch(`/api/admin/accounts?id=${id}`, { method: "DELETE" });
    onChange();
  }

  const roleLabel = (r: string, cy: string | null) => {
    if (r === "sga_admin") return "SGA Admin";
    if (r === "sga_member") return "SGA Officer";
    if (r === "class") return `Class of 20${cy} Officer`;
    if (r === "club") return "Club Officer";
    return r;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl">Officer Accounts</h2>
        <button onClick={() => setCreating((o) => !o)} className="btn-primary">
          <UserPlus size={14} />
          {creating ? "Cancel" : "New account"}
        </button>
      </div>

      <p className="text-xs text-ink-500 mb-4 max-w-lg">
        Manage all officer logins. Each officer can also edit their own username and password from{" "}
        <Link href="/admin/profile" className="underline hover:text-ink-900">
          /admin/profile
        </Link>
        .
      </p>

      {creating && (
        <div className="card mb-4 space-y-4 animate-slide-up">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Display name</label>
              <input
                className="input"
                placeholder="Jordan Reyes"
                value={newForm.name}
                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Username</label>
              <input
                className="input font-mono lowercase"
                placeholder="jordan"
                value={newForm.username}
                onChange={(e) => setNewForm({ ...newForm, username: e.target.value.toLowerCase() })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Temporary password</label>
              <input
                className="input font-mono"
                placeholder="They can change it after login"
                value={newForm.password}
                onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Role</label>
              <div className="relative">
                <select
                  className="input appearance-none pr-10"
                  value={newForm.role}
                  onChange={(e) => setNewForm({ ...newForm, role: e.target.value as AdminRole })}
                >
                  {ROLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
              </div>
            </div>
          </div>
          {newForm.role === "class" && (
            <div>
              <label className="label">Class year</label>
              <div className="relative">
                <select
                  className="input appearance-none pr-10"
                  value={newForm.classYear}
                  onChange={(e) => setNewForm({ ...newForm, classYear: e.target.value })}
                >
                  <option value="">Pick a year</option>
                  {["27", "28", "29", "30"].map((y) => (
                    <option key={y} value={y}>Class of 20{y}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
              </div>
            </div>
          )}
          {newForm.role === "club" && (
            <div>
              <label className="label">Club</label>
              <ClubSelect clubs={clubs} value={newForm.clubId} onChange={(v) => setNewForm({ ...newForm, clubId: v })} />
            </div>
          )}
          {err && <ErrorBox message={err} />}
          <button onClick={createAccount} disabled={busy} className="btn-accent">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Create account
          </button>
        </div>
      )}

      {accounts.length === 0 ? (
        <Empty>No accounts yet.</Empty>
      ) : (
        <div className="space-y-2">
          {accounts.map((a) => (
            <div key={a.id} className="card">
              {editingId === a.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Display name</label>
                      <input
                        className="input"
                        defaultValue={a.name}
                        onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="label">Username</label>
                      <input
                        className="input font-mono lowercase"
                        defaultValue={a.username}
                        onChange={(e) => setEditForm((p) => ({ ...p, username: e.target.value.toLowerCase() }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">New password (leave blank to keep)</label>
                      <input
                        className="input font-mono"
                        placeholder="••••••••"
                        onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value || undefined }))}
                      />
                    </div>
                    <div>
                      <label className="label">Role</label>
                      <div className="relative">
                        <select
                          className="input appearance-none pr-10"
                          defaultValue={a.role}
                          disabled={a.id === currentAdminId}
                          onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
                        >
                          {ROLE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  {(editForm.role ?? a.role) === "class" && (
                    <div>
                      <label className="label">Class year</label>
                      <div className="relative">
                        <select
                          className="input appearance-none pr-10"
                          defaultValue={a.classYear || ""}
                          onChange={(e) => setEditForm((p) => ({ ...p, classYear: e.target.value }))}
                        >
                          <option value="">Pick a year</option>
                          {["27", "28", "29", "30"].map((y) => (
                            <option key={y} value={y}>Class of 20{y}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                      </div>
                    </div>
                  )}
                  {(editForm.role ?? a.role) === "club" && (
                    <div>
                      <label className="label">Club</label>
                      <ClubSelect
                        clubs={clubs}
                        value={editForm.clubId ?? a.clubId ?? clubs[0]?.id ?? ""}
                        onChange={(v) => setEditForm((p) => ({ ...p, clubId: v }))}
                      />
                    </div>
                  )}
                  {err && <ErrorBox message={err} />}
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(a.id)} disabled={busy} className="btn-accent">
                      {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Save
                    </button>
                    <button onClick={() => { setEditingId(null); setEditForm({}); setErr(null); }} className="btn-ghost">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 font-display text-sm text-ink-700 shrink-0">
                    {a.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium flex items-center gap-2">
                      {a.name}
                      {a.id === currentAdminId && (
                        <span className="text-[10px] uppercase tracking-wider text-ink-400">(you)</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono text-ink-500">@{a.username}</span>
                      {isSiteAdmin && (
                        <span className={`chip text-[10px] ${roleBadge(a.role)}`}>
                          {roleLabel(a.role, a.classYear)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <IconBtn
                      onClick={() => {
                        setEditingId(a.id);
                        setEditForm({});
                        setErr(null);
                      }}
                      title="Edit account"
                    >
                      <KeyRound size={14} />
                    </IconBtn>
                    {a.id !== currentAdminId && (
                      <IconBtn onClick={() => deleteAccount(a.id, a.name)} title="Delete account" danger>
                        <Trash2 size={14} />
                      </IconBtn>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Inbox ---------- */

function InboxTab({
  items,
  clubs,
  canRedirect,
  onChange,
}: {
  items: Suggestion[];
  clubs: Club[];
  canRedirect: boolean;
  onChange: () => void;
}) {
  async function toggleRead(id: string, read: boolean) {
    await fetch("/api/suggestions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read }),
    });
    onChange();
  }

  async function remove(id: string) {
    if (!confirm("Delete this suggestion?")) return;
    await fetch(`/api/suggestions?id=${id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <div>
      <h2 className="font-display text-xl mb-4">Inbox</h2>
      {items.length === 0 ? (
        <Empty>Nothing in the inbox yet.</Empty>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <SuggestionRow
              key={s.id}
              s={s}
              clubs={clubs}
              canRedirect={canRedirect}
              onToggleRead={() => toggleRead(s.id, !s.read)}
              onDelete={() => remove(s.id)}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SuggestionRow({
  s,
  clubs,
  canRedirect,
  onToggleRead,
  onDelete,
  onChange,
}: {
  s: Suggestion;
  clubs: Club[];
  canRedirect: boolean;
  onToggleRead: () => void;
  onDelete: () => void;
  onChange: () => void;
}) {
  const [showRedirect, setShowRedirect] = useState(false);
  const [target, setTarget] = useState(s.target);
  const [clubId, setClubId] = useState<string>(s.clubId || clubs[0]?.id || "");
  const [busy, setBusy] = useState(false);

  async function redirect() {
    setBusy(true);
    await fetch("/api/suggestions/redirect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: s.id,
        target,
        clubId: target === "club" ? clubId : null,
      }),
    });
    setBusy(false);
    setShowRedirect(false);
    onChange();
  }

  return (
    <div className={`card ${s.read ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center text-center min-w-[2.5rem]">
          <div className="text-[10px] uppercase tracking-wider text-ink-500">votes</div>
          <div className="font-display text-2xl text-ink-900">{s.private ? "—" : s.votes}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
            {!s.read && <span className="h-2 w-2 rounded-full bg-poly-orange" />}
            {s.private && (
              <span className="chip border-poly-navy/40 bg-poly-navy/5 text-poly-navy">
                <KeyRound size={9} /> Private
              </span>
            )}
            <span
              className={`chip ${
                s.target === "sga"
                  ? "border-ink-300 bg-ink-100 text-ink-700"
                  : s.target === "club"
                    ? "border-poly-orange/30 bg-poly-orange/10 text-poly-orangeDark"
                    : "border-poly-navy/30 bg-poly-navy/5 text-poly-navy"
              }`}
            >
              For {targetLabel(s)}
            </span>
            <span className="chip capitalize">{s.category}</span>
            <span className="text-ink-500">{relativeTime(s.createdAt)}</span>
          </div>
          <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-line">
            {s.body}
          </p>
          {s.contact && (
            <div className="mt-2 text-xs text-ink-500">
              Contact: <span className="text-ink-700">{s.contact}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {canRedirect && s.target === "sga" && (
            <IconBtn
              onClick={() => setShowRedirect((o) => !o)}
              title="Redirect to another inbox"
            >
              <Send size={14} />
            </IconBtn>
          )}
          <IconBtn
            onClick={onToggleRead}
            title={s.read ? "Mark unread" : "Mark read"}
          >
            <Check size={14} />
          </IconBtn>
          <IconBtn onClick={onDelete} title="Delete" danger>
            <Trash2 size={14} />
          </IconBtn>
        </div>
      </div>

      {showRedirect && (
        <div className="mt-4 pt-4 border-t border-ink-200 space-y-3 animate-fade-in">
          <div>
            <label className="label">Forward to</label>
            <div className="relative">
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="input appearance-none pr-10"
              >
                <option value="sga">SGA (keep here)</option>
                <option value="27">Class of 2027</option>
                <option value="28">Class of 2028</option>
                <option value="29">Class of 2029</option>
                <option value="30">Class of 2030</option>
                <option value="club">A club…</option>
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
              />
            </div>
          </div>
          {target === "club" && (
            <ClubSelect clubs={clubs} value={clubId} onChange={setClubId} />
          )}
          <p className="text-xs text-ink-500">
            Suggestion will appear in that group&apos;s inbox AND stay in the SGA inbox.
          </p>
          <div className="flex gap-2">
            <button onClick={redirect} disabled={busy} className="btn-accent">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Forward
            </button>
            <button onClick={() => setShowRedirect(false)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Shared ---------- */

function ClubSelect({
  clubs,
  value,
  onChange,
}: {
  clubs: Club[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input appearance-none pr-10"
      >
        {clubs.length === 0 ? (
          <option>(no clubs)</option>
        ) : (
          clubs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))
        )}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
      />
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        danger
          ? "text-ink-400 hover:bg-red-50 hover:text-red-600"
          : "text-ink-500 hover:bg-ink-100 hover:text-ink-900"
      }`}
    >
      {children}
    </button>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="card text-center text-sm text-ink-500 py-12">{children}</div>
  );
}
