import { prisma } from "@/lib/db";
import { getGrade, gradeLabel } from "@/lib/grade";
import { formatDate, formatTime } from "@/lib/utils";
import { Calendar, Clock, MapPin } from "lucide-react";
import AudienceFilter from "../announcements/filter";

export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const grade = getGrade();
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
      <header className="mb-10 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-3">
          Calendar
        </p>
        <h1 className="h-display text-5xl sm:text-6xl mb-4">Events</h1>
        <p className="text-ink-600 leading-relaxed">
          Spirit weeks, fundraisers, meetings, and everything else SGA and your
          class officers are putting on.
        </p>
      </header>

      <AudienceFilter
        currentView={view}
        gradeLabel={grade && grade !== "guest" ? gradeLabel(grade) : undefined}
      />

      <section className="mb-16">
        <h2 className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-5">
          Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <div className="card text-center text-sm text-ink-500 py-16">
            Nothing on the calendar right now.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {upcoming.map((e) => (
              <article key={e.id} className="card card-hover animate-slide-up">
                <div className="flex items-start gap-5">
                  <DateBlock date={e.startsAt} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {e.audience === "all" ? (
                        <span className="chip">Schoolwide</span>
                      ) : (
                        <span className="chip border-poly-navy/30 bg-poly-navy/5 text-poly-navy">
                          Class of 20{e.audience}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-xl mb-2">{e.title}</h3>
                    <p className="text-sm text-ink-600 leading-relaxed mb-4">
                      {e.description}
                    </p>
                    <div className="flex flex-col gap-1.5 text-xs text-ink-500">
                      <span className="flex items-center gap-2">
                        <Calendar size={12} /> {formatDate(e.startsAt)}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock size={12} /> {formatTime(e.startsAt)}
                        {e.endsAt && ` — ${formatTime(e.endsAt)}`}
                      </span>
                      <span className="flex items-center gap-2">
                        <MapPin size={12} /> {e.location}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {clubEvents.length > 0 && (
        <section className="mb-16">
          <h2 className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-5">
            Club Events
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {clubEvents.map((e) => (
              <article key={e.id} className="card card-hover animate-slide-up">
                <div className="flex items-start gap-5">
                  <DateBlock date={e.startsAt} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="chip border-poly-orange/30 bg-poly-orange/5 text-poly-orangeDark">
                        {e.club?.name ?? "Club Event"}
                      </span>
                    </div>
                    <h3 className="font-display text-xl mb-2">{e.title}</h3>
                    <p className="text-sm text-ink-600 leading-relaxed mb-4">
                      {e.description}
                    </p>
                    <div className="flex flex-col gap-1.5 text-xs text-ink-500">
                      <span className="flex items-center gap-2">
                        <Calendar size={12} /> {formatDate(e.startsAt)}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock size={12} /> {formatTime(e.startsAt)}
                        {e.endsAt && ` — ${formatTime(e.endsAt)}`}
                      </span>
                      <span className="flex items-center gap-2">
                        <MapPin size={12} /> {e.location}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-5">
            Recently
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((e) => (
              <div
                key={e.id}
                className="card opacity-70 hover:opacity-100 transition-opacity"
              >
                <div className="text-xs text-ink-500 mb-2">
                  {formatDate(e.startsAt)}
                </div>
                <h3 className="font-display text-lg mb-1">{e.title}</h3>
                <p className="text-xs text-ink-500">{e.location}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function DateBlock({ date }: { date: Date }) {
  const d = new Date(date);
  return (
    <div className="flex-shrink-0 w-14 rounded-xl bg-ink-900 text-ink-50 overflow-hidden text-center">
      <div className="bg-poly-orange text-white text-[9px] uppercase tracking-wider py-1 font-semibold">
        {d.toLocaleDateString("en-US", { month: "short" })}
      </div>
      <div className="font-display text-2xl py-2">{d.getDate()}</div>
    </div>
  );
}
