import { prisma } from "@/lib/db";
import { getGrade, gradeLabel } from "@/lib/grade";
import { ExternalLink, FileText, File, Link2, Pin } from "lucide-react";
import AudienceFilter from "../announcements/filter";

export const dynamic = "force-dynamic";

export const metadata = { title: "Links & Resources · Poly SGA" };

function categoryIcon(cat: string) {
  if (cat === "form") return <FileText size={16} className="text-blue-600" />;
  if (cat === "doc") return <File size={16} className="text-violet-600" />;
  return <Link2 size={16} className="text-ink-500" />;
}

function categoryChip(cat: string) {
  if (cat === "form")
    return (
      <span className="chip border-blue-200 bg-blue-50 text-blue-700">
        Google Form
      </span>
    );
  if (cat === "doc")
    return (
      <span className="chip border-violet-200 bg-violet-50 text-violet-700">
        Document
      </span>
    );
  return (
    <span className="chip border-ink-200 bg-ink-50 text-ink-600">Link</span>
  );
}

export default async function LinksPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const grade = getGrade();
  const view = searchParams.view || "mine";

  let where: { audience?: { in?: string[]; equals?: string } } = {};
  if (view === "school") {
    where = { audience: { equals: "all" } };
  } else if (view !== "all" && grade && grade !== "guest") {
    where = { audience: { in: ["all", grade] } };
  }

  const links = await prisma.resourceLink.findMany({
    where,
    include: { club: { select: { name: true } } },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  const pinned = links.filter((l) => l.pinned);
  const rest = links.filter((l) => !l.pinned);

  return (
    <div className="container-page py-12 sm:py-16 animate-fade-in">
      {/* Decorative header */}
      <div className="relative mb-10">
        <div
          className="absolute -top-6 -right-8 h-64 w-64 rounded-full bg-blue-500/6 blur-3xl pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute top-8 -left-4 h-32 w-32 rounded-full bg-poly-orange/6 blur-2xl pointer-events-none"
          aria-hidden
        />
        <header className="relative max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-3">
            Resources
          </p>
          <h1 className="h-display text-5xl sm:text-6xl mb-4">
            Links &amp; Forms
          </h1>
          <p className="text-ink-600 leading-relaxed">
            Google Forms, sign-up sheets, important documents, and other links
            posted by SGA and your class officers.
          </p>
        </header>
      </div>

      <AudienceFilter
        currentView={view}
        gradeLabel={grade && grade !== "guest" ? gradeLabel(grade) : undefined}
      />

      {links.length === 0 ? (
        <div className="card text-center text-sm text-ink-500 py-16">
          No links posted yet — check back soon.
        </div>
      ) : (
        <div className="space-y-10">
          {pinned.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-4 flex items-center gap-2">
                <Pin size={11} /> Pinned
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pinned.map((l) => (
                  <LinkCard key={l.id} link={l} />
                ))}
              </div>
            </section>
          )}
          {rest.length > 0 && (
            <section>
              {pinned.length > 0 && (
                <h2 className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-4">
                  All Links
                </h2>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((l) => (
                  <LinkCard key={l.id} link={l} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function LinkCard({
  link,
}: {
  link: {
    id: string;
    title: string;
    url: string;
    description: string | null;
    category: string;
    audience: string;
    pinned: boolean;
    authorName: string | null;
    club: { name: string } | null;
  };
}) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card card-hover group flex flex-col gap-3 p-5 animate-slide-up"
    >
      {/* Top row: category icon + chips */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-ink-100 group-hover:bg-ink-200 transition-colors">
          {categoryIcon(link.category)}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categoryChip(link.category)}
          {link.audience !== "all" && link.audience !== "club" && (
            <span className="chip border-poly-navy/30 bg-poly-navy/5 text-poly-navy text-[10px]">
              Class of 20{link.audience}
            </span>
          )}
          {link.audience === "club" && link.club && (
            <span className="chip border-poly-orange/30 bg-poly-orange/5 text-poly-orangeDark text-[10px]">
              {link.club.name}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <h3 className="font-display text-lg leading-snug group-hover:text-poly-orange transition-colors">
          {link.title}
        </h3>
        {link.description && (
          <p className="text-xs text-ink-500 mt-1 line-clamp-2 leading-relaxed">
            {link.description}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between text-xs text-ink-400">
        {link.authorName && <span>— {link.authorName}</span>}
        <span className="ml-auto flex items-center gap-1 text-poly-orange opacity-0 group-hover:opacity-100 transition-opacity font-medium">
          Open <ExternalLink size={11} />
        </span>
      </div>
    </a>
  );
}
