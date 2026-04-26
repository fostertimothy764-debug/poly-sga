import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureVoterId, getVoterId } from "@/lib/grade";

const VALID_TARGETS = ["sga", "27", "28", "29", "30", "club"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") || "top";
  const session = await getSession();

  const orderBy =
    sort === "new"
      ? { createdAt: "desc" as const }
      : [{ votes: "desc" as const }, { createdAt: "desc" as const }];

  // Public view only shows non-private suggestions
  const where = session ? {} : { private: false };

  const items = await prisma.suggestion.findMany({
    where,
    include: { club: true },
    orderBy,
  });

  const voterId = getVoterId();
  const myVotes = voterId
    ? await prisma.suggestionVote.findMany({
        where: { voterId },
        select: { suggestionId: true },
      })
    : [];
  const votedSet = new Set(myVotes.map((v) => v.suggestionId));

  const data = items.map((s) => ({
    id: s.id,
    body: s.body,
    category: s.category,
    target: s.target,
    clubId: s.clubId,
    club: s.club ? { id: s.club.id, name: s.club.name, slug: s.club.slug } : null,
    votes: s.votes,
    createdAt: s.createdAt,
    voted: votedSet.has(s.id),
    private: s.private,
    contact: session ? s.contact : null,
    read: session ? s.read : undefined,
  }));

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { body, category, contact, target, clubId, private: isPrivate } = data || {};
  if (!body || typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }
  if (body.length > 2000) {
    return NextResponse.json({ error: "body too long" }, { status: 400 });
  }

  const finalTarget = VALID_TARGETS.includes(target) ? target : "sga";
  let finalClubId: string | null = null;
  if (finalTarget === "club") {
    if (!clubId || typeof clubId !== "string") {
      return NextResponse.json({ error: "clubId required for club target" }, { status: 400 });
    }
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) return NextResponse.json({ error: "Unknown club" }, { status: 400 });
    finalClubId = club.id;
  }

  const created = await prisma.suggestion.create({
    data: {
      body: body.trim(),
      category: typeof category === "string" ? category : "general",
      contact: typeof contact === "string" && contact.trim() ? contact.trim() : null,
      target: finalTarget,
      clubId: finalClubId,
      private: isPrivate === true,
    },
  });

  // Private suggestions don't get an auto-upvote (no vote count on private items)
  if (!isPrivate) {
    const voterId = ensureVoterId();
    await prisma.suggestionVote.create({ data: { suggestionId: created.id, voterId } });
    await prisma.suggestion.update({
      where: { id: created.id },
      data: { votes: { increment: 1 } },
    });
  }

  return NextResponse.json({ id: created.id, private: created.private }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, read } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updated = await prisma.suggestion.update({
    where: { id },
    data: { read: !!read },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.suggestion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
