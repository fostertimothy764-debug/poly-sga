import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isSga } from "@/lib/auth";

const COLUMNS = new Set(["proposed", "in_progress", "completed", "archived"]);
const CATEGORIES = new Set(["academic", "facilities", "events", "policy", "resources"]);

function parseDate(v: unknown): Date | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET() {
  const items = await prisma.initiative.findMany({
    include: { updates: { orderBy: { createdAt: "desc" } } },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!isSga(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const owner = typeof body.owner === "string" ? body.owner.trim() : "";
  if (!title || !description || !owner) {
    return NextResponse.json({ error: "title, description, owner required" }, { status: 400 });
  }

  const column = COLUMNS.has(body.column) ? body.column : "proposed";
  const category = CATEGORIES.has(body.category) ? body.category : "academic";

  const created = await prisma.initiative.create({
    data: {
      title: title.slice(0, 160),
      description,
      owner: owner.slice(0, 120),
      column,
      category,
      startedAt: parseDate(body.startedAt) ?? (column !== "proposed" ? new Date() : null),
      expectedAt: parseDate(body.expectedAt),
      completedAt: column === "completed" ? parseDate(body.completedAt) ?? new Date() : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!isSga(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await prisma.initiative.findUnique({ where: { id: body.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) updates.title = body.title.trim().slice(0, 160);
  if (typeof body.description === "string" && body.description.trim()) updates.description = body.description.trim();
  if (typeof body.owner === "string" && body.owner.trim()) updates.owner = body.owner.trim().slice(0, 120);
  if (typeof body.category === "string" && CATEGORIES.has(body.category)) updates.category = body.category;
  if ("expectedAt" in body) updates.expectedAt = parseDate(body.expectedAt);
  if ("startedAt" in body) updates.startedAt = parseDate(body.startedAt);

  if (typeof body.column === "string" && COLUMNS.has(body.column)) {
    updates.column = body.column;
    // Auto-stamp lifecycle dates when column changes
    if (body.column !== "proposed" && !existing.startedAt) {
      updates.startedAt = new Date();
    }
    if (body.column === "completed" && !existing.completedAt) {
      updates.completedAt = new Date();
    }
    if (body.column !== "completed") {
      updates.completedAt = null;
    }
  }
  if (typeof body.order === "number") updates.order = body.order;

  const updated = await prisma.initiative.update({ where: { id: body.id }, data: updates });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!isSga(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.initiative.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
