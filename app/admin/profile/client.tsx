"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Eye, EyeOff, Loader2, Save } from "lucide-react";
import PhotoUpload from "@/components/photo-upload";
import { useToast, Toast } from "@/components/toast";

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
    pronouns: string | null;
    askMeAbout: string | null;
    schoolEmail: string | null;
    instagram: string | null;
  } | null;
}) {
  const router = useRouter();
  const { toast, show: showToast, dismiss } = useToast();

  return (
    <>
    <Toast toast={toast} onDismiss={dismiss} />
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
        onSaved={() => { router.refresh(); showToast("Login info saved!"); }}
      />

      <PasswordForm onSaved={() => showToast("Password updated!")} onError={(e) => showToast(e, "error")} />

      {teamMember && (
        <TeamProfileForm
          initial={teamMember}
          onSaved={() => { router.refresh(); showToast("Profile saved!"); }}
          onError={(e) => showToast(e, "error")}
        />
      )}
    </div>
    </>
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

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, name }),
    });
    setBusy(false);
    if (res.ok) onSaved();
  }

  return (
    <Section
      title="Login"
      description="Your username is how you sign in. You can change it any time."
    >
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="label">Display name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
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
          <p className="text-xs text-ink-500 mt-1">3–32 chars. Letters, numbers, underscore, dash.</p>
        </div>
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save
        </button>
      </form>
    </Section>
  );
}

function PasswordForm({ onSaved, onError }: { onSaved: () => void; onError: (e: string) => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 6) { onError("New password must be at least 6 chars"); return; }
    setBusy(true);
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: next, currentPassword: current }),
    });
    setBusy(false);
    if (res.ok) {
      setCurrent(""); setNext("");
      onSaved();
    } else {
      const data = await res.json().catch(() => ({}));
      onError(data.error || "Failed");
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
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Update password
        </button>
      </form>
    </Section>
  );
}

function TeamProfileForm({
  initial,
  onSaved,
  onError,
}: {
  initial: {
    id: string;
    name: string;
    role: string;
    grade: string;
    bio: string | null;
    photoUrl: string | null;
    pronouns: string | null;
    askMeAbout: string | null;
    schoolEmail: string | null;
    instagram: string | null;
  };
  onSaved: () => void;
  onError: (e: string) => void;
}) {
  const [form, setForm] = useState({
    name: initial.name,
    role: initial.role,
    grade: initial.grade,
    bio: initial.bio || "",
    photoUrl: initial.photoUrl || "",
    pronouns: initial.pronouns || "",
    askMeAbout: initial.askMeAbout || "",
    schoolEmail: initial.schoolEmail || "",
    instagram: initial.instagram || "",
  });
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch(`/api/team/${initial.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        bio: form.bio || null,
        photoUrl: form.photoUrl || null,
        pronouns: form.pronouns || null,
        askMeAbout: form.askMeAbout || null,
        schoolEmail: form.schoolEmail || null,
        instagram: form.instagram || null,
      }),
    });
    setBusy(false);
    if (res.ok) onSaved();
    else { const d = await res.json().catch(() => ({})); onError(d.error || "Failed"); }
  }

  return (
    <Section
      title="Public profile"
      description="This is what students see on your /team page card and profile. Only you can edit it."
    >
      <form onSubmit={save} className="space-y-4">
        <div className="flex items-start gap-4">
          <PhotoUpload
            currentUrl={form.photoUrl || null}
            initials={form.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
            onUpload={(url) => setForm({ ...form, photoUrl: url })}
            size="lg"
          />
          <p className="text-xs text-ink-500 pt-1 max-w-xs leading-relaxed">
            Click your photo (or the circle) to upload a new one. JPG, PNG, or WEBP, we&apos;ll compress it automatically.
          </p>
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
          <div>
            <label className="label">Grade</label>
            <input
              value={form.grade}
              onChange={(e) => setForm({ ...form, grade: e.target.value })}
              className="input"
              placeholder="Class of 2027"
            />
          </div>
          <div>
            <label className="label">Pronouns (optional)</label>
            <input
              value={form.pronouns}
              onChange={(e) => setForm({ ...form, pronouns: e.target.value })}
              className="input"
              maxLength={32}
              placeholder="she/her"
            />
          </div>
        </div>

        <div>
          <label className="label">Ask me about (optional)</label>
          <input
            value={form.askMeAbout}
            onChange={(e) => setForm({ ...form, askMeAbout: e.target.value })}
            className="input"
            maxLength={140}
            placeholder="The senior–faculty basketball game I'm trying to bring back"
          />
          <div className="mt-1 flex justify-between text-[11px] text-ink-500">
            <span>One short sentence: gives students something to walk up and say.</span>
            <span>{form.askMeAbout.length}/140</span>
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
          <div className="mt-1 text-right text-[11px] text-ink-500">
            {form.bio.length}/400
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">School email (optional)</label>
            <input
              type="email"
              value={form.schoolEmail}
              onChange={(e) => setForm({ ...form, schoolEmail: e.target.value })}
              className="input font-mono text-sm"
              placeholder="firstlast@bcps.k12.md.us"
            />
          </div>
          <div>
            <label className="label">Instagram (optional)</label>
            <input
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value.replace(/^@/, "") })}
              className="input font-mono text-sm"
              placeholder="handle"
            />
          </div>
        </div>

        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save profile
        </button>
      </form>
    </Section>
  );
}
