import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isSga } from "@/lib/auth";

// Simple email regex for server-side validation
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST — subscribe an email to the mailing list
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email, name } = body;

  if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  try {
    await prisma.mailingList.upsert({
      where: { email: email.toLowerCase().trim() },
      update: { name: name?.trim() || null },   // update name if already subscribed
      create: { email: email.toLowerCase().trim(), name: name?.trim() || null },
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// GET — SGA admins can view the mailing list
export async function GET() {
  const session = await getSession();
  if (!session || !isSga(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscribers = await prisma.mailingList.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  return NextResponse.json(subscribers);
}

// DELETE — SGA admins can remove a subscriber
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !isSga(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.mailingList.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
