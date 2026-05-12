import { prisma } from "@/lib/db";
import { getGrade, gradeLabel } from "@/lib/grade";
import { formatDate } from "@/lib/utils";
import { getSession } from "@/lib/auth";
import AudienceFilter from "../announcements/filter";
import EventList from "./event-list";
import AdminModeBanner from "@/components/admin-mode-banner";

export const dynamic = "force-dynamic";

export const metadata = { title: "Events · Poly SGA" };

export default async function EventsPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const grade = getGrade();
  const session = await getSession();
  const view = searchParams.view || "mine";
  const now = new Date();

  let audienceWhere: { audience?: { in?: string[]; equals?: string } } = {};
  if (view === "school") {
    audienceWhere = { audience: { equals: "all" } };
  } else if (view !== "all" && grade && grade !== "guest") {
    audienceWhere = { audience: { in: ["all", grade] } };
  }

  const [upcoming, past, clubEvents] = await Promise.all([
    prisma.event.findMany({
      where: { ...audienceWhere, startsAt: { gte: now }, NOT: { audience: "club" } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.event.findMany({
      where: { ...audienceWhere, startsAt: { lt: now }, NOT: { audience: "club" } },
      orderBy: { startsAt: "desc" },
      take: 6,
    }),
    prisma.event.findMany({
      where: { audience: "club", startsAt: { gte: now } },
      include: { club: { select: { name: true } } },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  return (
    <div className="container-page py-12 sm:py-16 animate-fade-in">
      <header className="mb-10 pb-8 border-b border-ink-200 max-w-2xl">
        <p className="label text-ink-500 mb-3">Calendar</p>
        <h1 className="h-display text-4xl sm:text-5xl mb-4">Events</h1>
        <p className="text-ink-600 leading-relaxed">
          Spirit weeks, fundraisers, meetings, and everything else SGA and
          your class officers are putting on.
        </p>
      </header>

      <AudienceFilter
        currentView={view}
        gradeLabel={grade && grade !== "guest" ? gradeLabel(grade) : undefined}
      />

      {session && <AdminModeBanner name={session.name} />}

      {/* Pass admin context to client components so they can show inline edit controls */}
      {(() => {
        const adminCtx = session ? {
          name: session.name,
          role: session.role,
          classYear: session.classYear,
          clubId: session.clubId,
        } : null;
        return (
          <>
            <section className="mb-16">
              <h2 className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-5">Upcoming</h2>
              {upcoming.length === 0 ? (
                <div className="border-t border-ink-200 py-12 max-w-xl">
                  <h3 className="font-display text-2xl leading-snug mb-3">
                    Nothing on the calendar yet.
                  </h3>
                  <p className="text-sm text-ink-600 leading-relaxed">
                    SGA events will appear here as they&apos;re scheduled.
                    Check back before the week starts.
                  </p>
                </div>
              ) : (
                <EventList initial={upcoming} admin={adminCtx} section="upcoming" viewerGrade={grade && grade !== "guest" ? grade : null} />
              )}
            </section>

            {clubEvents.length > 0 && (
              <section className="mb-16">
                <h2 className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-5">Club Events</h2>
                <EventList initial={clubEvents} admin={adminCtx} section="club" viewerGrade={grade && grade !== "guest" ? grade : null} />
              </section>
            )}

            {past.length > 0 && (
              <section>
                <h2 className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-5">Recently</h2>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {past.map((e) => (
                    <div key={e.id} className="card opacity-70 hover:opacity-100 transition-opacity">
                      <div className="text-xs text-ink-500 mb-2">{formatDate(e.startsAt)}</div>
                      <h3 className="font-display text-lg mb-1">{e.title}</h3>
                      <p className="text-xs text-ink-500">{e.location}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        );
      })()}
    </div>
  );
}
