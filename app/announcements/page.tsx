import { prisma } from "@/lib/db";
import { getGrade, gradeLabel } from "@/lib/grade";
import { getSession } from "@/lib/auth";
import AudienceFilter from "./filter";
import AnnouncementList from "./announcement-list";
import AdminModeBanner from "@/components/admin-mode-banner";

export const metadata = { title: "Announcements · Poly SGA" };

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const grade = getGrade();
  const session = await getSession();
  const view = searchParams.view || "mine";

  let where: { audience?: { in?: string[]; equals?: string } } = {};
  if (view === "all") {
    where = {};
  } else if (view === "school") {
    where = { audience: { equals: "all" } };
  } else if (grade && grade !== "guest") {
    where = { audience: { in: ["all", grade] } };
  }

  const announcements = await prisma.announcement.findMany({
    where,
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="container-page py-12 sm:py-16 animate-fade-in">
      {/* Decorative header */}
      <div className="relative mb-10">
        <div
          className="absolute -top-6 -right-8 h-64 w-64 rounded-full bg-poly-orange/8 blur-3xl pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute top-8 -left-4 h-32 w-32 rounded-full bg-poly-navy/5 blur-2xl pointer-events-none"
          aria-hidden
        />
        <header className="relative max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-3">
            Updates
          </p>
          <h1 className="h-display text-5xl sm:text-6xl mb-4">Announcements</h1>
          <p className="text-ink-600 leading-relaxed">
            The latest news from your SGA and class officers — meeting notes,
            deadlines, wins, and everything in between.
          </p>
        </header>
      </div>

      <AudienceFilter
        currentView={view}
        gradeLabel={
          grade && grade !== "guest" ? gradeLabel(grade) : undefined
        }
      />

      {session && (
        <AdminModeBanner name={session.name} />
      )}

      <AnnouncementList
        initial={announcements}
        admin={session ? {
          name: session.name,
          role: session.role,
          classYear: session.classYear,
          clubId: session.clubId,
        } : null}
      />
    </div>
  );
}
