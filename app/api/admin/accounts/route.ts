import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession, isSgaAdmin, AdminRole } from "@/lib/auth";

// GET — list all admin accounts (sga_admin only)
export async function GET() {
  const session = await getSession();
  if (!session || !isSgaAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const accounts = await prisma.admin.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      classYear: true,
      clubId: true,
      teamMemberId: true,
      createdAt: true,
    },
  });
  return NextResponse.json(accounts);
}

// POST — create a new admin account (sga_admin only)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isSgaAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { username, name, password, role, classYear, clubId } = await req.json();
  if (!username?.trim() || !name?.trim() || !password || !role) {
    return NextResponse.json({ error: "username, name, password, and role are required" }, { status: 400 });
  }

  const existing = await prisma.admin.findUnique({
    where: { username: username.toLowerCase().trim() },
  });
  if (existing) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const account = await prisma.admin.create({
    data: {
      username: username.toLowerCase().trim(),
      name: name.trim(),
      passwordHash: await bcrypt.hash(password, 10),
      role: role as AdminRole,
      classYear: classYear || null,
      clubId: clubId || null,
    },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      classYear: true,
      clubId: true,
      teamMemberId: true,
      createdAt: true,
    },
  });

  return NextResponse.json(account, { status: 201 });
}

// PATCH — update an account (sga_admin only; cannot demote self from sga_admin)
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || !isSgaAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, username, name, password, role, classYear, clubId } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Prevent self-demotion
  if (id === session.adminId && role && role !== "sga_admin") {
    return NextResponse.json({ error: "Cannot change your own role away from sga_admin" }, { status: 400 });
  }

  if (username) {
    const taken = await prisma.admin.findFirst({
      where: { username: username.toLowerCase().trim(), id: { not: id } },
    });
    if (taken) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
  }

  const data: Record<string, unknown> = {};
  if (username) data.username = username.toLowerCase().trim();
  if (name) data.name = name.trim();
  if (password) data.passwordHash = await bcrypt.hash(password, 10);
  if (role) data.role = role;
  if (classYear !== undefined) data.classYear = classYear || null;
  if (clubId !== undefined) data.clubId = clubId || null;

  const updated = await prisma.admin.update({
    where: { id },
    data,
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      classYear: true,
      clubId: true,
      teamMemberId: true,
      createdAt: true,
    },
  });

  return NextResponse.json(updated);
}

// DELETE — remove an account (sga_admin only; cannot delete self)
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !isSgaAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (id === session.adminId) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  await prisma.admin.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
