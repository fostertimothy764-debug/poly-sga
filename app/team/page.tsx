import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const members = await prisma.teamMember.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  const exec = members.filter((m) =>
    /^(president|vice president|treasurer|secretary)$/i.test(m.role)
  );
  const reps = members.filter(
    (m) => !/^(president|vice president|treasurer|secretary)$/i.test(m.role)
  );

  return (
    <div className="container-page py-12 sm:py-16 animate-fade-in">
      <header className="mb-12 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-3">
          People
        </p>
        <h1 className="h-display text-5xl sm:text-6xl mb-4">Meet the SGA</h1>
        <p className="text-ink-600 leading-relaxed">
          Elected by you, working for you. Stop by and say hi — we&apos;re
          easier to find than you think.
        </p>
      </header>

      {exec.length > 0 && (
        <section className="mb-16">
          <h2 className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-5">
            Executive Board
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {exec.map((m) => (
              <MemberCard key={m.id} member={m} highlight />
            ))}
          </div>
        </section>
      )}

      {reps.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-5">
            Class Representatives
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {reps.map((m) => (
              <MemberCard key={m.id} member={m} />
            ))}
          </div>
        </section>
      )}

      {members.length === 0 && (
        <div className="card text-center text-sm text-ink-500 py-16">
          Roster coming soon.
        </div>
      )}
    </div>
  );
}

function MemberCard({
  member,
  highlight = false,
}: {
  member: { name: string; role: string; grade: string; bio: string | null; photoUrl: string | null };
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
    <article className="card card-hover overflow-hidden p-0 animate-slide-up">
      <div className="relative aspect-[4/5] bg-ink-100 overflow-hidden">
        {member.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.photoUrl}
            alt={member.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
        ) : (
          <div
            className={`absolute inset-0 flex items-center justify-center font-display text-6xl ${
              highlight
                ? "bg-poly-orange text-white"
                : "bg-ink-200 text-ink-500"
            }`}
          >
            {initials}
          </div>
        )}
        {highlight && (
          <div className="absolute top-3 left-3">
            <span className="chip bg-white/90 backdrop-blur border-white/40 text-ink-900 font-medium">
              Exec
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 text-white">
          <div className="font-display text-lg leading-tight">{member.name}</div>
          <div className="text-xs opacity-90">{member.role}</div>
        </div>
      </div>
      <div className="p-4">
        <div className="text-xs text-ink-500 mb-1">{member.grade}</div>
        {member.bio && (
          <p className="text-xs text-ink-600 leading-relaxed line-clamp-3">
            {member.bio}
          </p>
        )}
      </div>
    </article>
  );
}
