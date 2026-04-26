import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isSgaAdmin } from "@/lib/auth";

// GET — admin only, list all club requests
export async function GET() {
  const session = await getSession();
  if (!session || !isSgaAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const requests = await prisma.clubRequest.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(requests);
}

// POST — public, submit a club request
export async function POST(req: NextRequest) {
  const { clubName, description, contactName, contactInfo } = await req.json();
  if (!clubName?.trim() || !description?.trim()) {
    return NextResponse.json(
      { error: "Club name and description are required" },
      { status: 400 }
    );
  }
  const request = await prisma.clubRequest.create({
    data: {
      clubName: clubName.trim(),
      description: description.trim(),
      contactName: contactName?.trim() || null,
      contactInfo: contactInfo?.trim() || null,
    },
  });
  return NextResponse.json(request, { status: 201 });
}

// PATCH — admin only, update status
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || !isSgaAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id, status } = await req.json();
  if (!id || !["pending", "reviewed", "declined"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const updated = await prisma.clubRequest.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json(updated);
}

// DELETE — admin only
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !isSgaAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.clubRequest.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
