import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, isSga, isSgaAdmin, isSiteAdmin, isDeveloper, isDeveloperElevated } from "@/lib/auth";
// isSga covers both sga_admin and sga_member roles
import { prisma } from "@/lib/db";
import AdminDashboard from "./dashboard";
import {
  ArrowRight,
  CalendarClock,
  Lightbulb,
  MessageSquare,
  PiggyBank,
  ShieldCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  // Audience filter for what THIS admin sees in the dashboard
  let audienceWhere: object = {};
  if (session.role === "class" && session.classYear) {
    audienceWhere = { audience: { in: ["all", session.classYear] } };
  } else if (session.role === "club" && session.clubId) {
    audienceWhere = {
      OR: [
        { audience: { in: ["all"] } },
        { audience: "club", clubId: session.clubId },
      ],
    };
  }

  // Suggestions that this admin should see in their inbox
  let suggestionWhere: object = {};
  if (session.role === "class" && session.classYear) {
    suggestionWhere = { target: session.classYear };
  } else if (session.role === "club" && session.clubId) {
    suggestionWhere = { target: "club", clubId: session.clubId };
  }
  // SGA roles see everything

  const isAdmin = isSgaAdmin(session);
  const siteAdminUser = isSiteAdmin(session);
  const developerUser = isDeveloper(session);
  const developerElevated = isDeveloperElevated(session);

  const [announcements, events, team, suggestions, unread, clubs, accounts, clubRequests, links, photos, newsletters, passkeys, siteSettings] =
    await Promise.all([
      prisma.announcement.findMany({
        where: audienceWhere,
        include: { club: true },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      }),
      prisma.event.findMany({
        where: audienceWhere,
        include: { club: true },
        orderBy: { startsAt: "asc" },
      }),
      isSga(session)
        ? prisma.teamMember.findMany({
            orderBy: [{ order: "asc" }, { name: "asc" }],
          })
        : Promise.resolve([]),
      prisma.suggestion.findMany({
        where: suggestionWhere,
        include: { club: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.suggestion.count({ where: { ...suggestionWhere, read: false } }),
      prisma.club.findMany({ orderBy: { name: "asc" } }),
      // Accounts & club requests — sga_admin only
      isAdmin
        ? prisma.admin.findMany({
            orderBy: [{ role: "asc" }, { name: "asc" }],
            select: {
              id: true,
              username: true,
              name: true,
              role: true,
              classYear: true,
              clubId: true,
              teamMemberId: true,
              createdAt: true,
            },
          })
        : Promise.resolve([]),
      isAdmin
        ? prisma.clubRequest.findMany({ orderBy: { createdAt: "desc" } })
        : Promise.resolve([]),
      // Links — all officers can see/manage their own links
      prisma.resourceLink.findMany({
        include: { club: { select: { name: true, slug: true } } },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      }),
      // Photos — all officers can upload
      prisma.photo.findMany({ orderBy: { createdAt: "desc" } }),
      // Newsletter — SGA only manages, but all see
      prisma.newsletter.findMany({ orderBy: { publishedAt: "desc" } }),
      // Developer tier only — every other admin gets empty arrays here
      developerUser
        ? prisma.passkey.findMany({
            where: { adminId: session.adminId },
            orderBy: { createdAt: "asc" },
            select: { id: true, deviceLabel: true, createdAt: true, lastUsedAt: true },
          })
        : Promise.resolve([]),
      developerElevated
        ? prisma.siteSetting.findMany({ orderBy: { key: "asc" } })
        : Promise.resolve([]),
    ]);

  // Transparency-suite stats — visible to SGA roles only, surfaced as a launcher panel.
  const showTransparency = isSga(session);
  const [meetingsCount, openVoice, pendingSuggestions, activeInitiatives, currentBudget] =
    showTransparency
      ? await Promise.all([
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
        ])
      : [0, 0, 0, 0, null];

  return (
    <>
      <AdminDashboard
        session={session}
        capabilities={{
          canManageTeam: isAdmin,
          canManageClubs: isAdmin,
          canManageNewsletter: isSga(session), // sga_admin + sga_member can manage the Scoop
          canRedirect: isAdmin,
          canManageAccounts: siteAdminUser,
          isSiteAdmin: siteAdminUser,
          isDeveloper: developerUser,
          isDeveloperElevated: developerElevated,
        }}
        initial={{ announcements, events, team, suggestions, unread, clubs, accounts, clubRequests, links, photos, newsletters, passkeys, siteSettings }}
      />

      {showTransparency && (
        <div className="container-page pb-16">
          <section className="mt-6 rounded-2xl border border-poly-navy/15 bg-gradient-to-br from-poly-navy/[0.04] to-poly-orange/[0.04] p-6 sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-1">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-poly-navy" />
                <h2 className="font-display text-xl text-ink-900">
                  Transparency suite
                </h2>
              </div>
              <Link
                href="/admin/transparency"
                className="text-xs text-poly-navy hover:text-poly-navyDark inline-flex items-center gap-1"
              >
                Open hub
                <ArrowRight size={12} />
              </Link>
            </div>
            <p className="text-sm text-ink-600 max-w-2xl mb-6">
              Manage the public transparency pages from one place — meetings,
              initiatives, budget, and the student voice queue.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <LauncherTile
                href="/admin/minutes"
                Icon={CalendarClock}
                title="Minutes"
                stat={`${meetingsCount} on the record`}
              />
              <LauncherTile
                href="/admin/initiatives"
                Icon={Lightbulb}
                title="Initiatives"
                stat={`${activeInitiatives} active`}
                badge={pendingSuggestions > 0 ? pendingSuggestions : undefined}
                badgeLabel="suggestion(s)"
              />
              <LauncherTile
                href="/admin/budget"
                Icon={PiggyBank}
                title="Budget"
                stat={currentBudget ? `Current: ${currentBudget.label}` : "No active period"}
              />
              <LauncherTile
                href="/admin/voice"
                Icon={MessageSquare}
                title="Voice"
                stat={`${openVoice} open`}
                badge={openVoice > 0 ? openVoice : undefined}
                badgeLabel="open"
              />
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function LauncherTile({
  href,
  Icon,
  title,
  stat,
  badge,
  badgeLabel,
}: {
  href: string;
  Icon: typeof CalendarClock;
  title: string;
  stat: string;
  badge?: number;
  badgeLabel?: string;
}) {
  return (
    <Link
      href={href}
      className="group relative rounded-xl border border-ink-200 bg-white p-4 hover:border-poly-navy/40 hover:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] transition-all"
    >
      {badge !== undefined && (
        <span
          className="absolute top-3 right-3 inline-flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-poly-orange text-white text-[10px] font-bold"
          title={badgeLabel}
        >
          {badge}
        </span>
      )}
      <Icon size={14} className="text-poly-navy mb-2" />
      <p className="font-display text-base text-ink-900">{title}</p>
      <p className="text-[11px] text-ink-500 mt-0.5 font-mono">{stat}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-[11px] text-poly-navy group-hover:gap-2 transition-all">
        Open
        <ArrowRight size={11} />
      </span>
    </Link>
  );
}
