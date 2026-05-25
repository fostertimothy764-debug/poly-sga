import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isSga } from "@/lib/auth";

function parseDate(v: unknown): Date | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function parseAmount(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function GET() {
  const periods = await prisma.budgetPeriod.findMany({
    include: { lines: { orderBy: [{ category: "asc" }, { label: "asc" }] } },
    orderBy: [{ current: "desc" }, { startsAt: "desc" }],
  });
  return NextResponse.json(periods);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!isSga(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const label = typeof body.label === "string" ? body.label.trim() : "";
  const startsAt = parseDate(body.startsAt);
  const endsAt = parseDate(body.endsAt);
  if (!label || !startsAt || !endsAt) {
    return NextResponse.json({ error: "label, startsAt, endsAt required" }, { status: 400 });
  }
  const total = parseAmount(body.total) ?? 0;
  const setCurrent = !!body.current;

  if (setCurrent) {
    await prisma.budgetPeriod.updateMany({
      where: { current: true },
      data: { current: false },
    });
  }

  try {
    const created = await prisma.budgetPeriod.create({
      data: {
        label: label.slice(0, 60),
        startsAt,
        endsAt,
        total,
        current: setCurrent,
        notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "A period with that label already exists" }, { status: 409 });
    }
    throw err;
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!isSga(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof body.label === "string" && body.label.trim()) updates.label = body.label.trim().slice(0, 60);
  if ("startsAt" in body) {
    const d = parseDate(body.startsAt);
    if (d) updates.startsAt = d;
  }
  if ("endsAt" in body) {
    const d = parseDate(body.endsAt);
    if (d) updates.endsAt = d;
  }
  if ("total" in body) {
    const t = parseAmount(body.total);
    if (t !== null) updates.total = t;
  }
  if ("notes" in body) {
    updates.notes =
      typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;
  }
  if (typeof body.current === "boolean") {
    updates.current = body.current;
    if (body.current) {
      await prisma.budgetPeriod.updateMany({
        where: { current: true, NOT: { id: body.id } },
        data: { current: false },
      });
    }
  }

  const updated = await prisma.budgetPeriod.update({ where: { id: body.id }, data: updates });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!isSga(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.budgetPeriod.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
