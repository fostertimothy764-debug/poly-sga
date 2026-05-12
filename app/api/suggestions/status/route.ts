import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getSession,
  canSetSuggestionStatus,
  SUGGESTION_STATUSES,
  type SuggestionStatus,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, status, statusLabel, statusNote } = body || {};

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  if (!status || !(SUGGESTION_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  if (status === "custom") {
    if (typeof statusLabel !== "string" || !statusLabel.trim()) {
      return NextResponse.json(
        { error: "statusLabel required for custom status" },
        { status: 400 },
      );
    }
    if (statusLabel.length > 32) {
      return NextResponse.json(
        { error: "statusLabel too long (max 32)" },
        { status: 400 },
      );
    }
  }
  if (typeof statusNote === "string" && statusNote.length > 240) {
    return NextResponse.json(
      { error: "statusNote too long (max 240)" },
      { status: 400 },
    );
  }

  const existing = await prisma.suggestion.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (!canSetSuggestionStatus(session, existing.target, existing.clubId)) {
    return NextResponse.json(
      { error: "You can't update this idea's status" },
      { status: 403 },
    );
  }

  const updated = await prisma.suggestion.update({
    where: { id },
    data: {
      status: status as SuggestionStatus,
      statusLabel: status === "custom" ? statusLabel.trim() : null,
      statusNote:
        typeof statusNote === "string" && statusNote.trim()
          ? statusNote.trim()
          : null,
      statusUpdatedById: session.adminId,
      statusUpdatedByName: session.name,
      statusUpdatedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
