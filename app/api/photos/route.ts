import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const photos = await prisma.photo.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(photos);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const { url, title, caption, audience, authorName, eventLabel } = data;

  if (!url?.trim()) {
    return NextResponse.json({ error: "Photo URL or data is required" }, { status: 400 });
  }

  const photo = await prisma.photo.create({
    data: {
      url: url.trim(),
      title: title?.trim() || null,
      caption: caption?.trim() || null,
      audience: audience || "all",
      authorName: authorName?.trim() || session.name,
      eventLabel: eventLabel?.trim() || null,
    },
  });
  return NextResponse.json(photo, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const { id, title, caption, audience, eventLabel } = data;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updated = await prisma.photo.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title || null }),
      ...(caption !== undefined && { caption: caption || null }),
      ...(audience !== undefined && { audience }),
      ...(eventLabel !== undefined && { eventLabel: eventLabel || null }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.photo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
