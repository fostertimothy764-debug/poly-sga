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
      <header className="mb-10 pb-8 border-b border-ink-200 max-w-2xl">
        <p className="label text-ink-500 mb-3">Updates</p>
        <h1 className="h-display text-4xl sm:text-5xl mb-4">Announcements</h1>
        <p className="text-ink-600 leading-relaxed">
          The latest news from your SGA and class officers, posted as it
          happens.
        </p>
      </header>

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
        viewerGrade={grade && grade !== "guest" ? grade : null}
      />
    </div>
  );
}
