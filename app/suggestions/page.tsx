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
  const [items, clubs] = await Promise.all([
    prisma.suggestion.findMany({
      include: { club: true },
      orderBy: [{ votes: "desc" }, { createdAt: "desc" }],
    }),
    prisma.club.findMany({ orderBy: { name: "asc" } }),
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
  }));

  return (
    <SuggestionsClient
      initial={initial}
      clubs={clubs.map((c) => ({ id: c.id, name: c.name }))}
      preset={{ target: searchParams.target, clubId: searchParams.clubId }}
    />
  );
}
