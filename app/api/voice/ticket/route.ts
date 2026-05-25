import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public ticket lookup — anyone with the code can check their submission's status.
export async function GET(req: NextRequest) {
  const ticket = new URL(req.url).searchParams.get("t")?.trim().toUpperCase();
  if (!ticket) return NextResponse.json({ error: "ticket required" }, { status: 400 });

  const item = await prisma.voiceSubmission.findUnique({ where: { ticket } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ticket: item.ticket,
    body: item.body,
    type: item.type,
    status: item.status,
    responseBody: item.responseBody,
    respondedAt: item.respondedAt?.toISOString() ?? null,
    responderName: item.responderName,
    declineReason: item.declineReason,
    createdAt: item.createdAt.toISOString(),
  });
}
