import { prisma } from "@/lib/db";
import { getGrade, gradeLabel } from "@/lib/grade";
import { relativeTime, formatDate } from "@/lib/utils";
import { Pin } from "lucide-react";
import AudienceFilter from "./filter";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const grade = getGrade();
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

      {announcements.length === 0 ? (
        <div className="card text-center text-sm text-ink-500 py-16">
          No announcements here yet.
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <article
              key={a.id}
              className="card card-hover animate-slide-up"
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {a.pinned && (
                  <span className="chip border-poly-orange/30 bg-poly-orange/10 text-poly-orangeDark">
                    <Pin size={11} /> Pinned
                  </span>
                )}
                {a.audience === "all" ? (
                  <span className="chip border-ink-300 bg-ink-100 text-ink-700">
                    Schoolwide
                  </span>
                ) : a.audience === "club" ? (
                  <span className="chip border-poly-orange/30 bg-poly-orange/10 text-poly-orangeDark">
                    Club
                  </span>
                ) : (
                  <span className="chip border-poly-navy/30 bg-poly-navy/5 text-poly-navy">
                    Class of 20{a.audience}
                  </span>
                )}
                <time className="text-xs text-ink-500" dateTime={a.createdAt.toISOString()}>
                  {formatDate(a.createdAt)} · {relativeTime(a.createdAt)}
                </time>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl mb-3">
                {a.title}
              </h2>
              <p className="text-ink-700 leading-relaxed whitespace-pre-line">
                {a.body}
              </p>
              {a.authorName && (
                <p className="mt-4 text-xs text-ink-500">— {a.authorName}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
