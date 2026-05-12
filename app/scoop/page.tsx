import { prisma } from "@/lib/db";
import { getSession, isSga } from "@/lib/auth";
import { Newspaper } from "lucide-react";
import AdminModeBanner from "@/components/admin-mode-banner";
import ScoopList from "./scoop-list";

export const dynamic = "force-dynamic";
export const metadata = { title: "SGA Scoop · Poly SGA" };

export default async function ScoopPage() {
  const [issues, session] = await Promise.all([
    prisma.newsletter.findMany({ orderBy: { publishedAt: "desc" } }),
    getSession(),
  ]);

  const canEdit = session ? isSga(session) : false;

  return (
    <div className="container-page py-12 sm:py-16 animate-fade-in">
      <header className="mb-12 pb-8 border-b border-ink-200 max-w-2xl">
        <p className="label text-ink-500 mb-3">Newsletter</p>
        <h1 className="h-display text-4xl sm:text-5xl mb-4">SGA Scoop</h1>
        <p className="text-ink-600 leading-relaxed">
          The official SGA newsletter: updates, spotlights, and everything
          happening at Poly, straight from your student government.
        </p>
      </header>

      {session && <AdminModeBanner name={session.name} />}

      {issues.length === 0 ? (
        <div className="card text-center py-20 flex flex-col items-center gap-3 text-ink-400">
          <Newspaper size={36} className="text-ink-300" />
          <p className="text-sm">The first issue is coming soon — stay tuned.</p>
        </div>
      ) : (
        <ScoopList initial={issues} canEdit={canEdit} />
      )}
    </div>
  );
}
