import { redirect } from "next/navigation";
import { getSession, isSga } from "@/lib/auth";
import { prisma } from "@/lib/db";
import VoiceAdmin, { type AdminVoiceItem } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminVoicePage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isSga(session)) redirect("/admin");

  const items = await prisma.voiceSubmission.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const dto: AdminVoiceItem[] = items.map((i) => ({
    id: i.id,
    ticket: i.ticket,
    body: i.body,
    type: i.type,
    submitterName: i.submitterName,
    submitterGrade: i.submitterGrade,
    isAnonymous: i.isAnonymous,
    status: i.status,
    responseBody: i.responseBody,
    respondedAt: i.respondedAt?.toISOString() ?? null,
    responderName: i.responderName,
    declineReason: i.declineReason,
    votes: i.votes,
    isPublic: i.isPublic,
    createdAt: i.createdAt.toISOString(),
  }));

  return <VoiceAdmin initial={dto} />;
}
