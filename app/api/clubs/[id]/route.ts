import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, canManageClubs } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!canManageClubs(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const data = await req.json();
  const allowed = ["name", "description", "meetingTime", "location", "photoUrl"];
  const updates: Record<string, string | null> = {};
  for (const k of allowed) {
    if (k in data) updates[k] = data[k] ?? null;
  }
  const updated = await prisma.club.update({
    where: { id: params.id },
    data: updates,
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!canManageClubs(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.club.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
