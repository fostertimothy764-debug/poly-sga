import Link from "next/link";
import { prisma } from "@/lib/db";
import { getGrade, GRADES } from "@/lib/grade";
import {
  classAccentStyle,
  formatDate,
  formatTime,
  readingTime,
  relativeTime,
} from "@/lib/utils";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import PhotoDesk, { type PhotoDeskItem } from "@/components/photo-desk";
import LeadImage from "@/components/lead-image";
import Reveal from "@/components/reveal";

export const dynamic = "force-dynamic";

function classSub(grade: string) {
  return GRADES.find((g) => g.value === grade)?.sub ?? "Students";
}

function dek(body: string, len = 220) {
  const trimmed = body.trim().replace(/\s+/g, " ");
  if (trimmed.length <= len) return trimmed;
  const slice = trimmed.slice(0, len);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > len * 0.6 ? slice.slice(0, lastSpace) : slice) + "…";
}

function audienceLabel(audience: string) {
  if (audience === "all") return "Schoolwide";
  if (audience === "club") return "Club";
  return `Class of 20${audience}`;
}

function digestSentence(
  upcoming: number,
  newPosts: number,
  classLabel: string,
) {
  if (upcoming > 0 && newPosts > 0) {
    return `${upcoming} event${upcoming !== 1 ? "s" : ""} on the calendar this week, plus ${newPosts} new post${newPosts !== 1 ? "s" : ""} worth reading.`;
  }
  if (upcoming > 0) {
    return `${upcoming} event${upcoming !== 1 ? "s" : ""} coming up this week. Block out the time.`;
  }
  if (newPosts > 0) {
    return `${newPosts} new post${newPosts !== 1 ? "s" : ""} from your SGA this week.`;
  }
  return `A quiet week for the ${classLabel}. New posts land here as they happen.`;
}

export default async function Home() {
  const grade = getGrade();
  const audienceFilter =
    grade && grade !== "guest" ? { audience: { in: ["all", grade] } } : {};

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    announcements,
    events,
    newPostsCount,
    upcomingCount,
    trendingCount,
    totalAnnouncements,
    recentPhotos,
  ] = await Promise.all([
    prisma.announcement.findMany({
      where: audienceFilter,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    prisma.event.findMany({
      where: { ...audienceFilter, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take: 4,
    }),
    prisma.announcement.count({
      where: { ...audienceFilter, createdAt: { gte: weekAgo } },
    }),
    prisma.event.count({
      where: { startsAt: { gte: now, lte: weekAhead } },
    }),
    prisma.suggestion.count({
      where: { private: false, votes: { gte: 5 } },
    }),
    prisma.announcement.count(),
    prisma.photo.findMany({
      where: audienceFilter,
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        url: true,
        title: true,
        caption: true,
        authorName: true,
        eventLabel: true,
        createdAt: true,
      },
    }),
  ]);

  const photoDeskItems: PhotoDeskItem[] = recentPhotos.map((p) => ({
    id: p.id,
    url: p.url,
    title: p.title,
    caption: p.caption,
    authorName: p.authorName,
    eventLabel: p.eventLabel,
    createdAt: p.createdAt.toISOString(),
  }));

  const lead = announcements[0] ?? null;
  const secondary = announcements.slice(1, 4);
  const viewerGrade = grade && grade !== "guest" ? grade : null;

  const today = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Issue numbering — Vol. is school years since the site launched (2023);
  // Issue No. is the running count of announcements. Both update naturally.
  const volume = Math.max(1, now.getFullYear() - 2023 + (now.getMonth() >= 7 ? 1 : 0));
  const issueNo = Math.max(1, totalAnnouncements);
  const monthYear = now.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="container-page py-10 sm:py-14">
      {/* ── Masthead ── */}
      <div className="mb-3 pb-4 border-b-[3px] border-double border-ink-300">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-[11px] uppercase tracking-[0.18em] text-ink-500">
          <span className="font-mono">
            Vol. {volume} · Issue No. {issueNo}
          </span>
          <span className="hidden sm:inline">{today}</span>
          <span className="sm:hidden">
            {now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5">
          <h2 className="font-display text-xl sm:text-2xl tracking-tight text-ink-900">
            The Poly SGA Weekly
          </h2>
          <p className="font-display italic text-sm text-ink-500">
            Reporting from Baltimore Polytechnic Institute · {monthYear}
          </p>
        </div>
      </div>

      {/* spacer between masthead and digest */}
      <div className="mb-9" />

      {/* ── Personalized digest (only when grade set) ── */}
      {grade && grade !== "guest" && (
        <section className="mb-10">
          <div className="rounded-2xl bg-poly-navy text-white p-6 sm:p-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-poly-orange mb-3">
              This week · for {classSub(grade)}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-light leading-snug tracking-tight mb-5 max-w-2xl">
              {digestSentence(upcomingCount, newPostsCount, classSub(grade))}
            </h2>
            <div className="flex flex-wrap gap-x-7 gap-y-2 text-sm text-white/75">
              <span>
                <strong className="font-display text-xl font-normal text-white leading-none mr-1.5">
                  {newPostsCount}
                </strong>
                new posts
              </span>
              <span>
                <strong className="font-display text-xl font-normal text-white leading-none mr-1.5">
                  {upcomingCount}
                </strong>
                events
              </span>
              <span>
                <strong className="font-display text-xl font-normal text-white leading-none mr-1.5">
                  {trendingCount}
                </strong>
                ideas trending
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ── Lead article + sidebar ── */}
      {lead ? (
        <section className="grid gap-10 lg:gap-14 lg:grid-cols-[2fr_1fr] mb-14 pb-14 border-b border-ink-200">
          {/* Lead */}
          <article style={classAccentStyle(lead.audience, viewerGrade)}>
            {lead.leadImage && (
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-ink-100 mb-6 border border-ink-200">
                <LeadImage src={lead.leadImage} alt={lead.title} />
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 mb-4 text-[11px] uppercase tracking-[0.14em]">
              {lead.pinned && (
                <span className="font-mono text-poly-orange">Pinned</span>
              )}
              <span className="text-ink-500">{audienceLabel(lead.audience)}</span>
              <span className="text-ink-400">·</span>
              <span className="text-ink-500">{relativeTime(lead.createdAt)}</span>
            </div>
            <h1 className="h-display text-4xl sm:text-5xl leading-[1.05] mb-5">
              <Link
                href="/announcements"
                className="group inline bg-[linear-gradient(theme(colors.poly.navy),theme(colors.poly.navy))] bg-no-repeat bg-left-bottom bg-[length:0%_2px] hover:bg-[length:100%_2px] focus-visible:bg-[length:100%_2px] transition-[background-size] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] pb-1"
              >
                {lead.title}
              </Link>
            </h1>
            <p className="text-lg text-ink-700 leading-relaxed max-w-prose mb-5 whitespace-pre-line first-letter:font-display first-letter:text-6xl first-letter:font-light first-letter:float-left first-letter:mr-3 first-letter:mt-1.5 first-letter:leading-[0.82] first-letter:text-poly-navy">
              {dek(lead.body, 320)}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-ink-500">
              {lead.authorName && (
                <span>
                  By{" "}
                  <span className="text-ink-800 font-medium">
                    {lead.authorName}
                  </span>
                </span>
              )}
              <span className="hidden sm:inline text-ink-300">·</span>
              <time
                className="hidden sm:inline"
                dateTime={new Date(lead.createdAt).toISOString()}
              >
                {formatDate(lead.createdAt)}
              </time>
              <span className="hidden sm:inline text-ink-300">·</span>
              <span className="hidden sm:inline">{readingTime(lead.body)}</span>
              <Link
                href="/announcements"
                className="ml-auto group flex items-center gap-1 text-poly-navy hover:text-poly-navyDark transition-colors"
              >
                Read more
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </Link>
            </div>
          </article>

          {/* Sidebar — upcoming events */}
          <aside className="lg:border-l lg:border-ink-200 lg:pl-10">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="label text-ink-800">What&apos;s next</h2>
              <Link
                href="/events"
                className="text-[11px] uppercase tracking-[0.14em] text-ink-500 hover:text-poly-navy transition-colors"
              >
                All events
              </Link>
            </div>
            {events.length === 0 ? (
              <p className="text-sm text-ink-500 leading-relaxed">
                Nothing on the calendar yet. SGA events appear here as they
                land.
              </p>
            ) : (
              <ol className="space-y-5">
                {events.map((e) => {
                  const d = new Date(e.startsAt);
                  return (
                    <li
                      key={e.id}
                      style={classAccentStyle(e.audience, viewerGrade)}
                    >
                      <Link href="/events" className="group block">
                        <div className="flex items-baseline gap-3 mb-1.5">
                          <span className="font-display text-2xl font-light text-poly-navy leading-none">
                            {d.getDate()}
                          </span>
                          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-500">
                            {d.toLocaleDateString("en-US", {
                              month: "short",
                              weekday: "short",
                            })}
                          </span>
                        </div>
                        <h3 className="font-display text-lg leading-snug mb-1 group-hover:text-poly-navyDark transition-colors">
                          {e.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={11} />
                            {formatTime(e.startsAt)}
                          </span>
                          {e.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={11} />
                              {e.location}
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </aside>
        </section>
      ) : (
        <section className="mb-14 pb-14 border-b border-ink-200">
          <h1 className="h-display text-4xl sm:text-5xl leading-[1.05] mb-4">
            Nothing on the front page yet.
          </h1>
          <p className="text-lg text-ink-600 leading-relaxed max-w-prose">
            Your SGA will post here as soon as there&apos;s news. In the
            meantime, browse{" "}
            <Link
              href="/suggestions"
              className="text-poly-navy underline underline-offset-2 hover:text-poly-navyDark"
            >
              ideas the student body is voting on
            </Link>
            .
          </p>
        </section>
      )}

      {/* ── Photo desk ── */}
      {photoDeskItems.length > 0 && <PhotoDesk photos={photoDeskItems} />}

      {/* ── Secondary announcements stack ── */}
      {secondary.length > 0 && (
        <section className="mb-14">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="label text-ink-800">More from your SGA</h2>
            <Link
              href="/announcements"
              className="text-[11px] uppercase tracking-[0.14em] text-ink-500 hover:text-poly-navy transition-colors"
            >
              All announcements
            </Link>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {secondary.map((a, i) => {
              const isNew =
                Date.now() - new Date(a.createdAt).getTime() <
                48 * 60 * 60 * 1000;
              const accent = classAccentStyle(a.audience, viewerGrade);
              return (
                <Reveal key={a.id} delayMs={i * 60}>
                  <Link
                    href="/announcements"
                    className="group block border-t border-ink-200 pt-5 transition-[transform,border-color] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-px hover:border-ink-400 focus-visible:outline-none focus-visible:-translate-y-px focus-visible:border-poly-navy"
                    style={accent}
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-3 text-[11px] uppercase tracking-[0.14em] text-ink-500">
                      <span>{audienceLabel(a.audience)}</span>
                      <span className="text-ink-300">·</span>
                      <span>{relativeTime(a.createdAt)}</span>
                      {isNew && !a.pinned && (
                        <span className="font-mono text-poly-green ml-auto">
                          New
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-xl leading-snug mb-2 group-hover:text-poly-navyDark transition-colors">
                      {a.title}
                    </h3>
                    <p className="text-sm text-ink-600 leading-relaxed line-clamp-3">
                      {dek(a.body, 140)}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-500">
                      {a.authorName && (
                        <span>
                          By{" "}
                          <span className="text-ink-700 font-medium">
                            {a.authorName}
                          </span>
                        </span>
                      )}
                      {a.authorName && <span className="text-ink-300">·</span>}
                      <span>{readingTime(a.body)}</span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Tail strip: ideas + footer link ── */}
      <section className="border-t border-ink-300 pt-8 grid gap-6 sm:grid-cols-[1fr_auto] items-end">
        <div className="max-w-md">
          <p className="label text-ink-500 mb-2">From the idea board</p>
          <p className="font-display text-2xl leading-snug text-ink-900">
            {trendingCount > 0
              ? `${trendingCount} idea${trendingCount !== 1 ? "s" : ""} on this week's meeting agenda.`
              : "Have something you'd change about Poly?"}
          </p>
        </div>
        <Link
          href="/suggestions"
          className="btn-primary self-start sm:self-end"
        >
          Share an idea
          <ArrowRight size={14} />
        </Link>
      </section>
    </div>
  );
}
