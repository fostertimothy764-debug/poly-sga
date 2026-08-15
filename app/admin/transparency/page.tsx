import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isSga } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Lightbulb,
  MessageSquare,
  PiggyBank,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TransparencyHub() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isSga(session)) redirect("/admin");

  const [meetings, openVoice, pendingSuggestions, activeInitiatives, currentBudget] =
    await Promise.all([
      prisma.meeting.count(),
      prisma.voiceSubmission.count({
        where: { status: { in: ["received", "under_review"] } },
      }),
      prisma.initiativeSuggestion.count({ where: { status: "pending" } }),
      prisma.initiative.count({
        where: { column: { in: ["proposed", "in_progress"] } },
      }),
      prisma.budgetPeriod.findFirst({
        where: { current: true },
        select: { label: true },
      }),
    ]);

  const tiles = [
    {
      href: "/admin/minutes",
      Icon: CalendarClock,
      title: "Meeting minutes",
      blurb: "Log meetings, attendees, decisions, and action items.",
      stat: `${meetings} on the record`,
    },
    {
      href: "/admin/initiatives",
      Icon: Lightbulb,
      title: "Initiatives",
      blurb: "Move work across columns, post updates, review suggestions.",
      stat: `${activeInitiatives} active${pendingSuggestions > 0 ? ` · ${pendingSuggestions} suggestion${pendingSuggestions !== 1 ? "s" : ""} pending` : ""}`,
      badge: pendingSuggestions > 0 ? pendingSuggestions : undefined,
    },
    {
      href: "/admin/budget",
      Icon: PiggyBank,
      title: "Budget",
      blurb: "Maintain semester totals and line items.",
      stat: currentBudget ? `Current: ${currentBudget.label}` : "No active period",
    },
    {
      href: "/admin/voice",
      Icon: MessageSquare,
      title: "Student voice",
      blurb: "Respond to submissions, change status, gate visibility.",
      stat: `${openVoice} open`,
      badge: openVoice > 0 ? openVoice : undefined,
    },
  ];

  return (
    <div className="container-page py-10 animate-fade-in">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-poly-navy mb-6"
      >
        <ArrowLeft size={12} />
        Back to dashboard
      </Link>
      <header className="mb-10 pb-6 border-b border-ink-200">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-1">
          Admin · transparency suite
        </p>
        <h1 className="h-display text-3xl mb-2">Open by default.</h1>
        <p className="text-sm text-ink-600 max-w-2xl leading-relaxed">
          Manage the public transparency pages from here — meetings, initiatives,
          budget, and the student voice queue. Public pages read this data live;
          edits land instantly.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map((t) => {
          const Icon = t.Icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="group relative rounded-2xl border border-ink-200 bg-white p-6 hover:border-poly-navy/40 hover:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] transition-all"
            >
              {t.badge !== undefined && (
                <span className="absolute top-4 right-4 inline-flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-poly-orange text-white text-[10px] font-bold">
                  {t.badge}
                </span>
              )}
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-poly-navy/5 text-poly-navy">
                  <Icon size={16} />
                </span>
                <h2 className="font-display text-lg text-ink-900">{t.title}</h2>
              </div>
              <p className="text-sm text-ink-600 leading-relaxed mb-3">
                {t.blurb}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-500 font-mono">{t.stat}</span>
                <span className="inline-flex items-center gap-1 text-poly-navy group-hover:gap-2 transition-all">
                  Open
                  <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
