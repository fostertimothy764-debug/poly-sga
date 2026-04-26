import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, formatTime, relativeTime } from "@/lib/utils";
import { ArrowLeft, Calendar, Clock, MapPin, MessageSquare, Pin } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const club = await prisma.club.findUnique({ where: { slug: params.slug } });
  return { title: club ? `${club.name} · Poly SGA` : "Club · Poly SGA" };
}

export default async function ClubPage({ params }: { params: { slug: string } }) {
  const club = await prisma.club.findUnique({ where: { slug: params.slug } });
  if (!club) notFound();

  const now = new Date();
  const [announcements, upcoming] = await Promise.all([
    prisma.announcement.findMany({
      where: { audience: "club", clubId: club.id },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
    prisma.event.findMany({
      where: { audience: "club", clubId: club.id, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  return (
    <div className="animate-fade-in">
      {/* Header / hero */}
      <section className="relative overflow-hidden bg-ink-900 text-white">
        {club.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={club.photoUrl}
            alt={club.name}
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-900/70 to-ink-900/40" />
        <div className="container-page relative py-16 sm:py-24">
          <Link
            href="/clubs"
            className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={14} /> All clubs
          </Link>
          <h1 className="h-display text-5xl sm:text-6xl mb-4">{club.name}</h1>
          <p className="text-white/80 max-w-2xl leading-relaxed mb-6">
            {club.description}
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
            {club.meetingTime && (
              <span className="flex items-center gap-2">
                <Clock size={14} /> {club.meetingTime}
              </span>
            )}
            {club.location && (
              <span className="flex items-center gap-2">
                <MapPin size={14} /> {club.location}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="container-page py-12 grid lg:grid-cols-[1.4fr_1fr] gap-10">
        <section>
          <h2 className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-5">
            Announcements
          </h2>
          {announcements.length === 0 ? (
            <div className="card text-center text-sm text-ink-500 py-12">
              No club announcements yet.
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <article key={a.id} className="card">
                  <div className="flex items-center gap-2 mb-2 text-xs text-ink-500">
                    {a.pinned && (
                      <span className="chip border-poly-orange/30 bg-poly-orange/10 text-poly-orangeDark">
                        <Pin size={10} /> Pinned
                      </span>
                    )}
                    <span>{relativeTime(a.createdAt)}</span>
                  </div>
                  <h3 className="font-display text-xl mb-2">{a.title}</h3>
                  <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-line">
                    {a.body}
                  </p>
                  {a.authorName && (
                    <p className="mt-3 text-xs text-ink-500">— {a.authorName}</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-8">
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-5">
              Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <div className="card text-center text-sm text-ink-500 py-10">
                Nothing on the calendar.
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map((e) => (
                  <div key={e.id} className="card">
                    <div className="flex items-center gap-2 mb-2 text-xs text-ink-500">
                      <Calendar size={11} /> {formatDate(e.startsAt)} ·{" "}
                      {formatTime(e.startsAt)}
                    </div>
                    <h3 className="font-display text-lg mb-1">{e.title}</h3>
                    <p className="text-xs text-ink-500 mb-2">{e.location}</p>
                    <p className="text-sm text-ink-600 line-clamp-3 leading-relaxed">
                      {e.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            href={`/suggestions?target=club&clubId=${club.id}`}
            className="card card-hover flex items-center gap-3 group"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-100 text-ink-700 group-hover:bg-poly-orange group-hover:text-white transition-colors">
              <MessageSquare size={16} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">Suggest something</div>
              <div className="text-xs text-ink-500">
                Send an idea straight to {club.name}
              </div>
            </div>
          </Link>
        </aside>
      </div>
    </div>
  );
}
