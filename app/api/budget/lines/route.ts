import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isSga } from "@/lib/auth";

const CATEGORIES = new Set(["events", "operations", "resources", "reserves", "other"]);

function parseAmount(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!isSga(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.periodId) return NextResponse.json({ error: "periodId required" }, { status: 400 });

  const category = CATEGORIES.has(body.category) ? body.category : "other";
  const label = typeof body.label === "string" ? body.label.trim() : "";
  if (!label) return NextResponse.json({ error: "label required" }, { status: 400 });

  const allocated = parseAmount(body.allocated) ?? 0;
  const spent = parseAmount(body.spent) ?? 0;

  const created = await prisma.budgetLine.create({
    data: {
      periodId: body.periodId,
      category,
      label: label.slice(0, 160),
      allocated,
      spent,
      note: typeof body.note === "string" && body.note.trim() ? body.note.trim() : null,
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

  const updates: Record<string, unknown> = {};
  if (typeof body.category === "string" && CATEGORIES.has(body.category)) updates.category = body.category;
  if (typeof body.label === "string" && body.label.trim()) updates.label = body.label.trim().slice(0, 160);
  if ("allocated" in body) {
    const a = parseAmount(body.allocated);
    if (a !== null) updates.allocated = a;
  }
  if ("spent" in body) {
    const s = parseAmount(body.spent);
    if (s !== null) updates.spent = s;
  }
  if ("note" in body) {
    updates.note = typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;
  }

  const updated = await prisma.budgetLine.update({ where: { id: body.id }, data: updates });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!isSga(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.budgetLine.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
