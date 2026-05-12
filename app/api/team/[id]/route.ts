import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, canEditTeamMember, canManageTeam } from "@/lib/auth";

const SELF_EDITABLE = [
  "bio",
  "photoUrl",
  "role",
  "grade",
  "name",
  "pronouns",
  "askMeAbout",
  "schoolEmail",
  "instagram",
];
const ADMIN_EDITABLE = [...SELF_EDITABLE, "order"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEditTeamMember(session, params.id)) {
    return NextResponse.json(
      { error: "You can only edit your own profile" },
      { status: 403 }
    );
  }

  const data = await req.json();

  // Length caps for short profile fields
  if (typeof data.askMeAbout === "string" && data.askMeAbout.length > 140) {
    return NextResponse.json({ error: "askMeAbout too long (max 140)" }, { status: 400 });
  }
  if (typeof data.pronouns === "string" && data.pronouns.length > 32) {
    return NextResponse.json({ error: "pronouns too long (max 32)" }, { status: 400 });
  }
  if (typeof data.bio === "string" && data.bio.length > 400) {
    return NextResponse.json({ error: "bio too long (max 400)" }, { status: 400 });
  }

  const allowed = canManageTeam(session) ? ADMIN_EDITABLE : SELF_EDITABLE;
  const updates: Record<string, string | number | null> = {};
  for (const k of allowed) {
    if (k in data) {
      let value = data[k];
      // Strip leading @ from instagram
      if (k === "instagram" && typeof value === "string") {
        value = value.replace(/^@/, "").trim() || null;
      }
      updates[k] = value ?? null;
    }
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.teamMember.update({
    where: { id: params.id },
    data: updates,
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!canManageTeam(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.teamMember.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
