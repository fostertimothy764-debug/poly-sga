import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, canRedirectSuggestion } from "@/lib/auth";

const VALID_TARGETS = ["sga", "27", "28", "29", "30", "club"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!canRedirectSuggestion(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, target, clubId } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (!VALID_TARGETS.includes(target)) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  let finalClubId: string | null = null;
  if (target === "club") {
    if (!clubId) return NextResponse.json({ error: "clubId required" }, { status: 400 });
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) return NextResponse.json({ error: "Unknown club" }, { status: 400 });
    finalClubId = club.id;
  }

  const updated = await prisma.suggestion.update({
    where: { id },
    data: { target, clubId: finalClubId, read: false },
  });
  return NextResponse.json(updated);
}
