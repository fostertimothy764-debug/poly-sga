import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, canPostAudience, canPostToClub } from "@/lib/auth";

export async function GET() {
  const items = await prisma.event.findMany({
    include: { club: true },
    orderBy: { startsAt: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const { title, description, location, startsAt, endsAt, audience, clubId } = data || {};
  if (!title || !description || !location || !startsAt) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  let finalAudience: string;
  let finalClubId: string | null = null;

  if (audience === "club") {
    if (!clubId) return NextResponse.json({ error: "clubId required" }, { status: 400 });
    if (!canPostToClub(session, clubId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    finalAudience = "club";
    finalClubId = clubId;
  } else {
    const audienceVal =
      typeof audience === "string" && ["all", "27", "28", "29", "30"].includes(audience)
        ? audience
        : session.role === "class" && session.classYear
          ? session.classYear
          : "all";
    if (!canPostAudience(session, audienceVal)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    finalAudience = audienceVal;
  }

  const created = await prisma.event.create({
    data: {
      title,
      description,
      location,
      audience: finalAudience,
      clubId: finalClubId,
      startsAt: new Date(startsAt),
      endsAt: endsAt ? new Date(endsAt) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const { id, title, description, location, startsAt, endsAt } = data || {};
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Re-use same permission check as delete
  if (existing.audience === "club") {
    if (!existing.clubId || !canPostToClub(session, existing.clubId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    if (!canPostAudience(session, existing.audience)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description && { description }),
      ...(location && { location }),
      ...(startsAt && { startsAt: new Date(startsAt) }),
      endsAt: endsAt ? new Date(endsAt) : null,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existing.audience === "club") {
    if (!existing.clubId || !canPostToClub(session, existing.clubId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    if (!canPostAudience(session, existing.audience)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
