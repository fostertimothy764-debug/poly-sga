import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureVoterId } from "@/lib/grade";

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const voterId = ensureVoterId();

  const existing = await prisma.suggestionVote.findUnique({
    where: { suggestionId_voterId: { suggestionId: id, voterId } },
  });

  if (existing) {
    // toggle off
    await prisma.suggestionVote.delete({ where: { id: existing.id } });
    const updated = await prisma.suggestion.update({
      where: { id },
      data: { votes: { decrement: 1 } },
    });
    return NextResponse.json({ voted: false, votes: updated.votes });
  }

  await prisma.suggestionVote.create({ data: { suggestionId: id, voterId } });
  const updated = await prisma.suggestion.update({
    where: { id },
    data: { votes: { increment: 1 } },
  });
  return NextResponse.json({ voted: true, votes: updated.votes });
}
