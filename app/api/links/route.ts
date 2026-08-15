import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isSga, canPostToClub, type SessionPayload } from "@/lib/auth";

export async function GET() {
  const links = await prisma.resourceLink.findMany({
    include: { club: { select: { name: true, slug: true } } },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const { title, url, description, category, audience, clubId, pinned, authorName } = data;

  if (!title?.trim() || !url?.trim()) {
    return NextResponse.json({ error: "Title and URL are required" }, { status: 400 });
  }

  // Determine audience based on role
  const effectiveAudience =
    session.role === "club" ? "club" :
    session.role === "class" ? (session.classYear || "all") :
    audience || "all";

  const effectiveClubId =
    session.role === "club" ? (session.clubId ?? null) :
    clubId || null;

  const link = await prisma.resourceLink.create({
    data: {
      title: title.trim(),
      url: url.trim(),
      description: description?.trim() || null,
      category: category || "link",
      audience: effectiveAudience,
      clubId: effectiveClubId,
      pinned: isSga(session) ? (pinned ?? false) : false,
      authorName: authorName?.trim() || session.name,
      authorId: session.adminId,
    },
    include: { club: { select: { name: true, slug: true } } },
  });
  return NextResponse.json(link, { status: 201 });
}

// Same-scope check used by both PATCH and DELETE: SGA can touch anything; the
// original author (by stable id, not the spoofable authorName string) can touch
// their own link; a club officer can touch any link scoped to their own club; a
// class officer can touch any link scoped to their own class year.
function canEditLink(
  session: SessionPayload,
  existing: { authorId: string | null; clubId: string | null; audience: string }
) {
  if (isSga(session)) return true;
  if (existing.authorId && existing.authorId === session.adminId) return true;
  if (existing.clubId && canPostToClub(session, existing.clubId)) return true;
  if (session.role === "class" && session.classYear && existing.audience === session.classYear) return true;
  return false;
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const { id, title, url, description, category, audience, pinned } = data;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const existing = await prisma.resourceLink.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEditLink(session, existing)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (url !== undefined) updates.url = url;
  if (description !== undefined) updates.description = description || null;
  if (category !== undefined) updates.category = category;
  if (audience !== undefined && isSga(session)) updates.audience = audience;
  if (pinned !== undefined && isSga(session)) updates.pinned = pinned;

  const updated = await prisma.resourceLink.update({ where: { id }, data: updates });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const existing = await prisma.resourceLink.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEditLink(session, existing)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.resourceLink.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
