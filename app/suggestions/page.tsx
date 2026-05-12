import { prisma } from "@/lib/db";
import { getVoterId } from "@/lib/grade";
import SuggestionsClient from "./client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ideas · Poly SGA",
};

export default async function SuggestionsPage({
  searchParams,
}: {
  searchParams: { target?: string; clubId?: string };
}) {
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [items, clubs, winItems] = await Promise.all([
    prisma.suggestion.findMany({
      where: { private: false },
      include: { club: true },
      orderBy: [{ votes: "desc" }, { createdAt: "desc" }],
    }),
    prisma.club.findMany({ orderBy: { name: "asc" } }),
    prisma.suggestion.findMany({
      where: {
        private: false,
        status: "done",
        statusUpdatedAt: { gte: monthAgo },
      },
      orderBy: { statusUpdatedAt: "desc" },
      take: 5,
    }),
  ]);

  const voterId = getVoterId();
  const myVotes = voterId
    ? await prisma.suggestionVote.findMany({
        where: { voterId },
        select: { suggestionId: true },
      })
    : [];
  const votedSet = new Set(myVotes.map((v) => v.suggestionId));

  const initial = items.map((s) => ({
    id: s.id,
    body: s.body,
    category: s.category,
    target: s.target,
    clubId: s.clubId,
    clubName: s.club?.name ?? null,
    clubSlug: s.club?.slug ?? null,
    votes: s.votes,
    createdAt: s.createdAt.toISOString(),
    voted: votedSet.has(s.id),
    status: s.status,
    statusLabel: s.statusLabel,
    statusNote: s.statusNote,
    statusUpdatedByName: s.statusUpdatedByName,
  }));

  const wins = winItems.map((w) => ({
    id: w.id,
    body: w.body,
    statusUpdatedByName: w.statusUpdatedByName,
    statusUpdatedAt: w.statusUpdatedAt?.toISOString() ?? null,
  }));

  return (
    <SuggestionsClient
      initial={initial}
      clubs={clubs.map((c) => ({ id: c.id, name: c.name }))}
      wins={wins}
      preset={{ target: searchParams.target, clubId: searchParams.clubId }}
    />
  );
}
