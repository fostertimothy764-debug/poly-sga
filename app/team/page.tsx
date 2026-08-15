import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/db";
import SmartImage from "@/components/smart-image";
import Reveal from "@/components/reveal";

export const dynamic = "force-dynamic";

export const metadata = { title: "Team · Poly SGA" };

export default async function TeamPage() {
  const members = await prisma.teamMember.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  // "Class Officer" role → Class Officers section; everything else → Exec Board
  const exec = members.filter((m) => m.role !== "Class Officer");
  const classOfficers = members.filter((m) => m.role === "Class Officer");

  return (
    <div className="container-page py-12 sm:py-16 animate-fade-in">
      <header className="mb-12 pb-8 border-b border-ink-200 max-w-2xl">
        <p className="label text-ink-500 mb-3">People</p>
        <h1 className="h-display text-4xl sm:text-5xl mb-4">Meet the SGA</h1>
        <p className="text-ink-600 leading-relaxed">
          Elected by you, working for you. Tap a name to read more, or stop by
          in the halls. We&apos;re easier to find than you think.
        </p>
      </header>

      {exec.length > 0 && (
        <section className="mb-16">
          <h2 className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-5">
            Executive Board
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {exec.map((m, i) => (
              <Reveal key={m.id} delayMs={(i % 4) * 60}>
                <MemberCard member={m} highlight />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {classOfficers.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-5">
            Class Officers
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {classOfficers.map((m, i) => (
              <Reveal key={m.id} delayMs={(i % 4) * 60}>
                <MemberCard member={m} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {members.length === 0 && (
        <div className="border-t border-ink-200 py-16 max-w-xl">
          <h3 className="font-display text-2xl leading-snug mb-3">
            Roster coming soon.
          </h3>
          <p className="text-sm text-ink-600 leading-relaxed">
            Officers will appear here once elections wrap.
          </p>
        </div>
      )}
    </div>
  );
}

function MemberCard({
  member,
  highlight = false,
}: {
  member: {
    id: string;
    name: string;
    role: string;
    grade: string;
    askMeAbout?: string | null;
    photoUrl: string | null;
  };
  highlight?: boolean;
}) {
  const initials = member.name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Link
      href={`/team/${member.id}`}
      className="card card-hover overflow-hidden p-0 group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-poly-navy focus-visible:ring-offset-2 focus-visible:ring-offset-ink-50"
    >
      <article>
        <div className="relative aspect-[4/5] bg-ink-100 overflow-hidden">
          {member.photoUrl ? (
            <SmartImage
              src={member.photoUrl}
              alt={member.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover grayscale transition-[filter,transform] duration-500 group-hover:grayscale-0 group-hover:scale-105"
            />
          ) : (
            <div
              className={`absolute inset-0 flex items-center justify-center font-display text-6xl ${
                highlight
                  ? "bg-poly-navy text-white"
                  : "bg-ink-200 text-ink-500"
              }`}
            >
              {initials}
            </div>
          )}
          {highlight && (
            <div className="absolute top-3 left-3">
              <span className="chip bg-white border-ink-200 text-ink-900 font-medium">
                Exec
              </span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-poly-navyDark/85 via-poly-navyDark/30 to-transparent p-4 text-white">
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <div className="font-display text-lg leading-tight truncate">
                  {member.name}
                </div>
                <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-poly-orange truncate">
                  {member.role}
                </div>
              </div>
              <ArrowUpRight
                size={14}
                className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0"
              />
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-ink-500 mb-1">{member.grade}</div>
          {member.askMeAbout ? (
            <p className="text-xs text-ink-700 leading-relaxed line-clamp-2 italic">
              &ldquo;{member.askMeAbout}&rdquo;
            </p>
          ) : (
            <p className="text-xs text-ink-500 leading-relaxed">
              Read profile →
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
