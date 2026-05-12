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
      {/* Decorative header */}
      <div className="relative mb-10">
        <div
          className="absolute -top-6 -right-8 h-64 w-64 rounded-full bg-poly-navy/6 blur-3xl pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute top-8 -left-4 h-32 w-32 rounded-full bg-poly-orange/6 blur-2xl pointer-events-none"
          aria-hidden
        />
        <header className="relative max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-3">
            Calendar
          </p>
          <h1 className="h-display text-5xl sm:text-6xl mb-4">Events</h1>
          <p className="text-ink-600 leading-relaxed">
            Spirit weeks, fundraisers, meetings, and everything else SGA and your
            class officers are putting on.
          </p>
        </header>
      </div>

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
                <div className="card flex flex-col items-center text-center gap-4 py-16">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-poly-orangeSoft text-poly-orange text-3xl select-none">
                    ◧
                  </div>
                  <h3 className="font-display text-xl font-medium tracking-tight">Nothing on the calendar yet.</h3>
                  <p className="text-sm text-ink-500 max-w-xs leading-relaxed">
                    SGA events will show up here. Check back before the week starts!
                  </p>
                </div>
              ) : (
                <EventList initial={upcoming} admin={adminCtx} section="upcoming" />
              )}
            </section>

            {clubEvents.length > 0 && (
              <section className="mb-16">
                <h2 className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-5">Club Events</h2>
                <EventList initial={clubEvents} admin={adminCtx} section="club" />
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
