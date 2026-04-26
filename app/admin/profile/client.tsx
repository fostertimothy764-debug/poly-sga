"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Eye, EyeOff, Loader2, Save } from "lucide-react";

export default function ProfileClient({
  account,
  teamMember,
}: {
  account: {
    username: string;
    name: string;
    role: string;
    roleLabel: string;
    clubName: string | null;
    classYear: string | null;
  };
  teamMember: {
    id: string;
    name: string;
    role: string;
    grade: string;
    bio: string | null;
    photoUrl: string | null;
  } | null;
}) {
  const router = useRouter();

  return (
    <div className="container-page py-10 animate-fade-in max-w-3xl">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-900 mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      <header className="mb-10 pb-6 border-b border-ink-200">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-1">
          {account.roleLabel}
        </p>
        <h1 className="h-display text-3xl">Your account</h1>
        <p className="text-sm text-ink-500 mt-2">
          Update your login info and your public profile (if you have one).
        </p>
      </header>

      <AccountForm
        initial={{ username: account.username, name: account.name }}
        onSaved={() => router.refresh()}
      />

      <PasswordForm />

      {teamMember && (
        <TeamProfileForm
          initial={teamMember}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-xl mb-1">{title}</h2>
      {description && (
        <p className="text-sm text-ink-500 mb-5 max-w-md">{description}</p>
      )}
      <div className="card space-y-4">{children}</div>
    </section>
  );
}

function AccountForm({
  initial,
  onSaved,
}: {
  initial: { username: string; name: string };
  onSaved: () => void;
}) {
  const [username, setUsername] = useState(initial.username);
  const [name, setName] = useState(initial.name);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, name }),
    });
    setBusy(false);
    if (res.ok) {
      setMsg({ type: "ok", text: "Saved." });
      onSaved();
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg({ type: "err", text: data.error || "Failed" });
    }
  }

  return (
    <Section
      title="Login"
      description="Your username is how you sign in. You can change it any time."
    >
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="label">Display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input font-mono lowercase"
            pattern="[a-zA-Z0-9_-]{3,32}"
            required
          />
          <p className="text-xs text-ink-500 mt-1">
            3–32 chars. Letters, numbers, underscore, dash.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Save
          </button>
          {msg && (
            <span
              className={`text-xs ${
                msg.type === "ok" ? "text-poly-orangeDark" : "text-red-600"
              }`}
            >
              {msg.text}
            </span>
          )}
        </div>
      </form>
    </Section>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 6) {
      setMsg({ type: "err", text: "New password must be at least 6 chars" });
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: next, currentPassword: current }),
    });
    setBusy(false);
    if (res.ok) {
      setMsg({ type: "ok", text: "Password updated." });
      setCurrent("");
      setNext("");
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg({ type: "err", text: data.error || "Failed" });
    }
  }

  return (
    <Section title="Password">
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="label">Current password</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="input pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
              aria-label="Toggle password visibility"
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div>
          <label className="label">New password</label>
          <input
            type={show ? "text" : "password"}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="input"
            minLength={6}
            required
          />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            Update password
          </button>
          {msg && (
            <span
              className={`text-xs ${
                msg.type === "ok" ? "text-poly-orangeDark" : "text-red-600"
              }`}
            >
              {msg.text}
            </span>
          )}
        </div>
      </form>
    </Section>
  );
}

function TeamProfileForm({
  initial,
  onSaved,
}: {
  initial: {
    id: string;
    name: string;
    role: string;
    grade: string;
    bio: string | null;
    photoUrl: string | null;
  };
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: initial.name,
    role: initial.role,
    grade: initial.grade,
    bio: initial.bio || "",
    photoUrl: initial.photoUrl || "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/team/${initial.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        bio: form.bio || null,
        photoUrl: form.photoUrl || null,
      }),
    });
    setBusy(false);
    if (res.ok) {
      setMsg({ type: "ok", text: "Profile saved." });
      onSaved();
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg({ type: "err", text: data.error || "Failed" });
    }
  }

  return (
    <Section
      title="Public profile"
      description="This is the card students see on the Team page. Only you can edit it."
    >
      <form onSubmit={save} className="space-y-4">
        <div className="flex items-start gap-4">
          {form.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.photoUrl}
              alt={form.name}
              className="h-20 w-20 rounded-2xl object-cover flex-shrink-0 border border-ink-200"
            />
          ) : (
            <div className="h-20 w-20 rounded-2xl bg-ink-100 flex items-center justify-center font-display text-2xl text-ink-500 flex-shrink-0">
              {form.name
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")}
            </div>
          )}
          <div className="flex-1">
            <label className="label">Photo URL</label>
            <input
              value={form.photoUrl}
              onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
              placeholder="https://..."
              className="input"
            />
            <p className="text-xs text-ink-500 mt-1">
              Paste a link to a hosted photo (Imgur, Drive public link, etc).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Display name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Role</label>
            <input
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="input"
            />
          </div>
          <div className="col-span-2">
            <label className="label">Grade</label>
            <input
              value={form.grade}
              onChange={(e) => setForm({ ...form, grade: e.target.value })}
              className="input"
              placeholder="Class of 2027"
            />
          </div>
        </div>

        <div>
          <label className="label">Bio</label>
          <textarea
            rows={3}
            maxLength={400}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="input resize-none"
          />
          <div className="mt-1 text-right text-[11px] text-ink-400">
            {form.bio.length}/400
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Save profile
          </button>
          {msg && (
            <span
              className={`text-xs ${
                msg.type === "ok" ? "text-poly-orangeDark" : "text-red-600"
              }`}
            >
              {msg.text}
            </span>
          )}
        </div>
      </form>
    </Section>
  );
}
