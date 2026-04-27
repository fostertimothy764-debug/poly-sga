import Link from "next/link";
import { prisma } from "@/lib/db";
import { getGrade, gradeLabel } from "@/lib/grade";
import { formatDateShort, formatTime, relativeTime } from "@/lib/utils";
import {
  ArrowRight,
  Calendar,
  MessageSquare,
  Megaphone,
  Users,
  Briefcase,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const grade = getGrade();
  const audienceFilter =
    grade && grade !== "guest"
      ? { audience: { in: ["all", grade] } }
      : {};

  const [announcements, events, teamCount, clubCount] = await Promise.all([
    prisma.announcement.findMany({
      where: audienceFilter,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 3,
    }),
    prisma.event.findMany({
      where: { ...audienceFilter, startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 3,
    }),
    prisma.teamMember.count(),
    prisma.club.count(),
  ]);

  const greeting =
    grade && grade !== "guest" ? gradeLabel(grade) : null;

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-ink-50">
        <div className="absolute inset-0 dot-grid opacity-40" aria-hidden />
        {/* Accent blob */}
        <div
          className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-poly-orange/10 blur-3xl pointer-events-none"
          aria-hidden
        />
        {/* Decorative stars */}
        <StarIcon className="absolute top-12 right-[12%] text-poly-orange opacity-70" size={28} />
        <StarIcon className="absolute top-32 right-[22%] text-poly-navy opacity-40" size={16} />
        <StarIcon className="absolute bottom-24 right-[8%] text-poly-orange opacity-50" size={20} />
        <StarIcon className="absolute top-20 left-[6%] text-poly-navy opacity-25" size={14} />
        <SparkleIcon className="absolute top-40 right-[35%] text-poly-orange opacity-30" size={22} />
        <SparkleIcon className="absolute bottom-32 left-[15%] text-poly-navy opacity-20" size={18} />
        <div className="container-page relative pt-20 pb-28 sm:pt-28 sm:pb-36">
          <div className="max-w-3xl animate-slide-up">
            {greeting && (
              <span className="chip mb-5 inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-poly-orange" />
                {greeting}
              </span>
            )}
            <h1 className="h-display text-5xl sm:text-[4.5rem] leading-[0.92] tracking-tight mb-6">
              Your school.
              <br />
              <span className="gradient-text italic">Your voice.</span>
            </h1>
            <p className="text-lg sm:text-xl text-ink-600 max-w-2xl mb-10 leading-relaxed">
              {greeting
                ? `Everything happening at Poly, filtered for the ${gradeLabel(grade!).toLowerCase()}.`
                : "The Student Government Association of Baltimore Polytechnic Institute — stay updated, get involved, and tell us what matters."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/announcements" className="btn-primary">
                What&apos;s new
                <ArrowRight size={16} />
              </Link>
              <Link href="/suggestions" className="btn-ghost">
                Share an idea
              </Link>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-ink-200/80 bg-white/60 backdrop-blur-sm">
          <div className="container-page py-4">
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-ink-600">
              <span className="flex items-center gap-2">
                <Users size={14} className="text-poly-orange" />
                <strong className="text-ink-900 font-semibold">{teamCount}</strong> officers
              </span>
              <span className="flex items-center gap-2">
                <Briefcase size={14} className="text-poly-orange" />
                <strong className="text-ink-900 font-semibold">{clubCount}</strong> clubs
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-ink-500">2026–2027 school year</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick nav cards ── */}
      <section className="container-page pt-12 pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickCard
            href="/announcements"
            icon={<Megaphone size={20} />}
            label="Announcements"
            color="bg-amber-50 text-amber-700"
          />
          <QuickCard
            href="/events"
            icon={<Calendar size={20} />}
            label="Events"
            color="bg-sky-50 text-sky-700"
          />
          <QuickCard
            href="/clubs"
            icon={<Briefcase size={20} />}
            label="Clubs"
            color="bg-violet-50 text-violet-700"
          />
          <QuickCard
            href="/suggestions"
            icon={<MessageSquare size={20} />}
            label="Ideas"
            color="bg-green-50 text-green-700"
          />
        </div>
      </section>

      {/* ── Latest announcements ── */}
      <section className="container-page py-16">
        <SectionHeader eyebrow="Latest" title="Announcements" href="/announcements" />
        {announcements.length === 0 ? (
          <EmptyState message="No announcements yet — check back soon." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {announcements.map((a, i) => (
              <Link
                key={a.id}
                href="/announcements"
                className={`card card-hover group flex flex-col ${
                  i === 0 ? "sm:col-span-2 lg:col-span-1" : ""
                }`}
              >
                {/* Coloured top accent */}
                <div
                  className={`-mx-5 -mt-5 mb-4 h-1.5 rounded-t-2xl ${
                    a.pinned ? "bg-poly-orange" : "bg-ink-200"
                  }`}
                />
                <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                  {a.pinned && (
                    <span className="chip border-poly-orange/30 bg-poly-orange/10 text-poly-orangeDark">
                      Pinned
                    </span>
                  )}
                  {a.audience !== "all" && a.audience !== "club" && (
                    <span className="chip border-poly-navy/30 bg-poly-navy/5 text-poly-navy">
                      Class of 20{a.audience}
                    </span>
                  )}
                  {a.audience === "club" && (
                    <span className="chip border-poly-orange/30 bg-poly-orange/10 text-poly-orangeDark">
                      Club
                    </span>
                  )}
                  <span className="text-ink-500 ml-auto">{relativeTime(a.createdAt)}</span>
                </div>
                <h3 className="font-display text-xl mb-2 group-hover:text-poly-orange transition-colors leading-snug">
                  {a.title}
                </h3>
                <p className="text-sm text-ink-600 line-clamp-3 leading-relaxed flex-1">
                  {a.body}
                </p>
                {a.authorName && (
                  <p className="mt-3 text-xs text-ink-400">— {a.authorName}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Upcoming events ── */}
      <section className="container-page pb-16">
        <SectionHeader eyebrow="Coming up" title="Events" href="/events" />
        {events.length === 0 ? (
          <EmptyState message="No upcoming events scheduled." />
        ) : (
          <div className="space-y-3">
            {events.map((e) => {
              const d = new Date(e.startsAt);
              return (
                <Link
                  key={e.id}
                  href="/events"
                  className="card card-hover flex items-start gap-5 group"
                >
                  {/* Date block */}
                  <div className="flex-shrink-0 w-14 text-center">
                    <div className="rounded-xl bg-ink-900 text-white py-2">
                      <div className="font-display text-2xl leading-none">
                        {d.getDate()}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider mt-0.5 text-ink-300">
                        {d.toLocaleDateString("en-US", { month: "short" })}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <h3 className="font-display text-lg mb-1 group-hover:text-poly-orange transition-colors">
                      {e.title}
                    </h3>
                    <p className="text-sm text-ink-600 line-clamp-1 mb-1.5">
                      {e.description}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-500">
                      <span>{formatTime(e.startsAt)}</span>
                      <span>·</span>
                      <span>{e.location}</span>
                      {e.audience !== "all" && e.audience !== "club" && (
                        <span className="text-poly-navy font-medium">
                          · Class of 20{e.audience}
                        </span>
                      )}
                      {e.audience === "club" && (
                        <span className="text-poly-orangeDark font-medium">
                          · Club Event
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    className="shrink-0 self-center text-ink-300 group-hover:text-poly-orange group-hover:translate-x-0.5 transition-all"
                  />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── CTA banner ── */}
      <section className="container-page pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-ink-900 text-ink-50 px-10 py-12 sm:px-14 sm:py-16">
          {/* decorative blobs */}
          <div
            className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-poly-orange/20 blur-3xl"
            aria-hidden
          />
          <div
            className="absolute -left-12 top-0 h-48 w-48 rounded-full bg-poly-navy/50 blur-3xl"
            aria-hidden
          />
          <div
            className="absolute left-1/2 bottom-0 h-32 w-64 -translate-x-1/2 rounded-full bg-poly-orange/10 blur-2xl"
            aria-hidden
          />
          {/* Stars */}
          <StarIcon className="absolute top-6 right-[45%] text-poly-orange opacity-50" size={18} />
          <StarIcon className="absolute bottom-10 left-[38%] text-white opacity-15" size={12} />
          <SparkleIcon className="absolute top-10 right-10 text-poly-orange opacity-40" size={22} />
          <SparkleIcon className="absolute bottom-6 right-[25%] text-white opacity-15" size={16} />

          <div className="relative grid sm:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-poly-orange mb-4">
                Make an impact
              </p>
              <h2 className="h-display text-4xl sm:text-5xl mb-4">
                Open to every{" "}
                <em className="text-ink-300">Poly student.</em>
              </h2>
              <p className="text-ink-400 leading-relaxed mb-6">
                SGA meetings are open to all students — bring questions, ideas, or
                just curiosity. Your input drives what we work on next.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/team"
                  className="btn bg-poly-orange text-white hover:bg-poly-orangeDark"
                >
                  Meet the team
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/suggestions"
                  className="btn border border-white/20 text-ink-300 hover:text-white hover:border-white/40 transition-colors"
                >
                  Submit an idea
                </Link>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                <div className="font-display text-4xl text-poly-orange mb-1">{teamCount}</div>
                <div className="text-sm text-ink-400">elected officers</div>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                <div className="font-display text-4xl text-poly-orange mb-1">{clubCount}</div>
                <div className="text-sm text-ink-400">clubs on campus</div>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-5 col-span-2 flex items-center gap-3">
                <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-poly-orange/20 text-poly-orange">
                  <Calendar size={16} />
                </div>
                <div>
                  <div className="text-xs text-ink-400 mb-0.5">Next open meeting</div>
                  <div className="text-sm text-ink-200">
                    {events[0]?.title ?? "Check the Events tab for dates"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function QuickCard({
  href,
  icon,
  label,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <Link href={href} className="card card-hover group flex flex-col items-center gap-3 py-6 text-center">
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${color}`}
      >
        {icon}
      </span>
      <span className="text-sm font-medium text-ink-800">{label}</span>
    </Link>
  );
}

function SectionHeader({
  eyebrow,
  title,
  href,
}: {
  eyebrow: string;
  title: string;
  href: string;
}) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-2">{eyebrow}</p>
        <h2 className="h-display text-3xl sm:text-4xl">{title}</h2>
      </div>
      <Link
        href={href}
        className="group flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900 transition-colors pb-1"
      >
        View all{" "}
        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="card text-center text-sm text-ink-500 py-14">{message}</div>
  );
}

/* Decorative SVG helpers */
function StarIcon({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M10 1l2.39 6.26L19 9l-5.5 4.74L15.18 20 10 16.77 4.82 20l1.68-6.26L1 9l6.61-1.74z" />
    </svg>
  );
}

function SparkleIcon({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M10 0 L11.5 8.5 L20 10 L11.5 11.5 L10 20 L8.5 11.5 L0 10 L8.5 8.5 Z" />
    </svg>
  );
}
