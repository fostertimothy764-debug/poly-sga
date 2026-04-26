import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession, createSession, AdminRole } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await prisma.admin.findUnique({
    where: { id: session.adminId },
    include: { teamMember: true, club: true },
  });
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: admin.id,
    username: admin.username,
    name: admin.name,
    role: admin.role,
    classYear: admin.classYear,
    clubId: admin.clubId,
    club: admin.club,
    teamMember: admin.teamMember,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const { username, name, password, currentPassword } = data || {};

  const admin = await prisma.admin.findUnique({ where: { id: session.adminId } });
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: {
    username?: string;
    name?: string;
    passwordHash?: string;
  } = {};

  if (typeof username === "string" && username.trim() && username !== admin.username) {
    const u = username.toLowerCase().trim();
    if (!/^[a-z0-9_-]{3,32}$/.test(u)) {
      return NextResponse.json(
        { error: "Username must be 3–32 chars, letters/numbers/underscore/dash" },
        { status: 400 }
      );
    }
    const taken = await prisma.admin.findUnique({ where: { username: u } });
    if (taken && taken.id !== admin.id) {
      return NextResponse.json({ error: "Username taken" }, { status: 409 });
    }
    updates.username = u;
  }

  if (typeof name === "string" && name.trim()) {
    updates.name = name.trim();
  }

  if (typeof password === "string" && password) {
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 chars" }, { status: 400 });
    }
    if (!currentPassword || !(await bcrypt.compare(currentPassword, admin.passwordHash))) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }
    updates.passwordHash = await bcrypt.hash(password, 10);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.admin.update({
    where: { id: admin.id },
    data: updates,
  });

  // Refresh JWT so the session reflects username/name changes
  await createSession({
    adminId: updated.id,
    username: updated.username,
    name: updated.name,
    role: updated.role as AdminRole,
    classYear: updated.classYear,
    clubId: updated.clubId,
    teamMemberId: updated.teamMemberId,
  });

  return NextResponse.json({ ok: true, username: updated.username, name: updated.name });
}
