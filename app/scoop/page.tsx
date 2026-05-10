import { prisma } from "@/lib/db";
import { ExternalLink, Newspaper } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "SGA Scoop · Poly SGA" };

function formatPublished(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ScoopPage() {
  const issues = await prisma.newsletter.findMany({
    orderBy: { publishedAt: "desc" },
  });

  const [latest, ...past] = issues;

  return (
    <div className="container-page py-12 sm:py-16 animate-fade-in">
      {/* Header */}
      <div className="relative mb-12">
        <div className="absolute -top-6 -right-8 h-64 w-64 rounded-full bg-poly-navy/6 blur-3xl pointer-events-none" aria-hidden />
        <div className="absolute top-8 -left-4 h-32 w-32 rounded-full bg-poly-orange/6 blur-2xl pointer-events-none" aria-hidden />
        <header className="relative max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-3">Newsletter</p>
          <h1 className="h-display text-5xl sm:text-6xl mb-4">SGA Scoop</h1>
          <p className="text-ink-600 leading-relaxed">
            The official SGA newsletter — updates, spotlights, and everything
            happening at Poly, straight from your student government.
          </p>
        </header>
      </div>

      {issues.length === 0 ? (
        <div className="card text-center py-20 flex flex-col items-center gap-3 text-ink-400">
          <Newspaper size={36} className="text-ink-300" />
          <p className="text-sm">The first issue is coming soon — stay tuned.</p>
        </div>
      ) : (
        <div className="space-y-16">
          {/* Latest issue — featured */}
          <section>
            <p className="text-xs uppercase tracking-[0.2em] text-poly-orange mb-5">Latest Issue</p>
            <IssueCard issue={latest} featured />
          </section>

          {/* Past issues */}
          {past.length > 0 && (
            <section>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-5">Past Issues</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {past.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function IssueCard({
  issue,
  featured = false,
}: {
  issue: {
    id: string;
    title: string;
    issueLabel: string | null;
    description: string | null;
    body: string | null;
    externalUrl: string | null;
    coverUrl: string | null;
    publishedAt: Date | string;
  };
  featured?: boolean;
}) {
  return (
    <div
      className={`card overflow-hidden p-0 ${
        featured ? "sm:grid sm:grid-cols-2" : "flex flex-col"
      }`}
    >
      {/* Cover image */}
      {issue.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={issue.coverUrl}
          alt={issue.title}
          className={`w-full object-cover ${featured ? "h-full min-h-[280px]" : "h-44"}`}
        />
      ) : (
        <div
          className={`bg-gradient-to-br from-poly-navy to-poly-navyDark flex items-center justify-center ${
            featured ? "h-64 sm:h-full" : "h-32"
          }`}
        >
          <Newspaper size={featured ? 48 : 32} className="text-white/30" />
        </div>
      )}

      {/* Content */}
      <div className={`flex flex-col ${featured ? "p-8 sm:p-10" : "p-5 flex-1"}`}>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {issue.issueLabel && (
            <span className="chip border-poly-navy/30 bg-poly-navy/8 text-poly-navy text-[10px]">
              {issue.issueLabel}
            </span>
          )}
          <span className="text-xs text-ink-400">{formatPublished(issue.publishedAt)}</span>
        </div>

        <h2 className={`h-display ${featured ? "text-3xl sm:text-4xl mb-4" : "text-xl mb-2"} leading-snug`}>
          {issue.title}
        </h2>

        {issue.description && (
          <p
            className={`text-ink-600 leading-relaxed ${featured ? "text-base mb-6" : "text-sm mb-4 line-clamp-3"}`}
          >
            {issue.description}
          </p>
        )}

        {/* Body preview */}
        {issue.body && !issue.externalUrl && (
          <div className={`${featured ? "" : "hidden sm:block"}`}>
            <p className="text-sm text-ink-500 line-clamp-4 leading-relaxed mb-4 whitespace-pre-line">
              {issue.body}
            </p>
          </div>
        )}

        <div className="mt-auto flex flex-wrap gap-2">
          {issue.externalUrl && (
            <a
              href={issue.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn-primary ${featured ? "" : "text-xs px-4 py-2"}`}
            >
              Read full issue
              <ExternalLink size={14} />
            </a>
          )}
          {!issue.externalUrl && issue.body && (
            <span className="text-xs text-ink-400 italic">Full issue above</span>
          )}
        </div>
      </div>
    </div>
  );
}
