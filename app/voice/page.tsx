import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import VoiceClient, { type VoiceItem } from "./client";

export const dynamic = "force-dynamic";

export default async function VoicePage() {
  const voterId = cookies().get("poly_voter")?.value ?? null;

  // Public listing: only public-flagged, with addressed/declined surfaced and received/under_review labeled.
  const submissions = await prisma.voiceSubmission.findMany({
    where: { isPublic: true },
    orderBy: [{ votes: "desc" }, { createdAt: "desc" }],
    include: voterId
      ? { votesList: { where: { voterId }, select: { id: true } } }
      : undefined,
  });

  const dto: VoiceItem[] = submissions.map((i) => {
    const exposeName = !i.isAnonymous && !!i.submitterName;
    return {
      id: i.id,
      ticket: i.ticket,
      body: i.body,
      type: i.type,
      submitterName: exposeName ? i.submitterName : null,
      submitterGrade: exposeName ? i.submitterGrade : null,
      isAnonymous: i.isAnonymous,
      status: i.status,
      responseBody: i.responseBody,
      respondedAt: i.respondedAt?.toISOString() ?? null,
      responderName: i.responderName,
      declineReason: i.declineReason,
      votes: i.votes,
      voted: voterId
        ? ((i as unknown as { votesList?: { id: string }[] }).votesList?.length ?? 0) > 0
        : false,
      createdAt: i.createdAt.toISOString(),
    };
  });

  return <VoiceClient initial={dto} />;
}
