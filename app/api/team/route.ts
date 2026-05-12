import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, canManageTeam } from "@/lib/auth";

export async function GET() {
  const items = await prisma.teamMember.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!canManageTeam(session)) {
    return NextResponse.json({ error: "Only SGA admins can add team members" }, { status: 403 });
  }

  const data = await req.json();
  const { name, role, grade, bio, order, photoUrl, pronouns, askMeAbout, schoolEmail, instagram } = data || {};
  if (!name || !role || !grade) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  if (typeof askMeAbout === "string" && askMeAbout.length > 140) {
    return NextResponse.json({ error: "askMeAbout too long (max 140)" }, { status: 400 });
  }
  if (typeof pronouns === "string" && pronouns.length > 32) {
    return NextResponse.json({ error: "pronouns too long (max 32)" }, { status: 400 });
  }
  const created = await prisma.teamMember.create({
    data: {
      name,
      role,
      grade,
      bio: bio ?? null,
      photoUrl: photoUrl ?? null,
      pronouns: pronouns ?? null,
      askMeAbout: askMeAbout ?? null,
      schoolEmail: schoolEmail ?? null,
      instagram: typeof instagram === "string" ? instagram.replace(/^@/, "") : null,
      order: order ?? 0,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
