import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureVoterId } from "@/lib/grade";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (!(await checkRateLimit(`voice-vote:${clientIp(req)}`, 20, 5 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many votes — slow down." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const id = body?.id;
  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const voterId = ensureVoterId();

  // Toggle: insert vote if absent, delete if present.
  const existing = await prisma.voiceVote.findUnique({
    where: { submissionId_voterId: { submissionId: id, voterId } },
  });

  if (existing) {
    await prisma.voiceVote.delete({ where: { id: existing.id } });
    const updated = await prisma.voiceSubmission.update({
      where: { id },
      data: { votes: { decrement: 1 } },
    });
    return NextResponse.json({ voted: false, votes: updated.votes });
  }

  await prisma.voiceVote.create({
    data: { submissionId: id, voterId },
  });
  const updated = await prisma.voiceSubmission.update({
    where: { id },
    data: { votes: { increment: 1 } },
  });
  return NextResponse.json({ voted: true, votes: updated.votes });
}
