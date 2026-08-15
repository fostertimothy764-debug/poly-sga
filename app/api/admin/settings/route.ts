import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isDeveloperElevated } from "@/lib/auth";

const MAX_KEY_LENGTH = 100;
const MAX_VALUE_LENGTH = 10_000;

// GET — list all site settings (developer, passkey-elevated only). Gating reads too:
// no reason to expose stored values to a merely-logged-in developer session that
// hasn't proven the passkey this window.
export async function GET() {
  const session = await getSession();
  if (!session || !isDeveloperElevated(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const settings = await prisma.siteSetting.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json(settings);
}

// POST — create or overwrite a setting by key (upsert; keys are the primary key)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isDeveloperElevated(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { key, value } = await req.json();
  if (typeof key !== "string" || !key.trim() || key.length > MAX_KEY_LENGTH) {
    return NextResponse.json({ error: `key is required, max ${MAX_KEY_LENGTH} chars` }, { status: 400 });
  }
  if (typeof value !== "string" || value.length > MAX_VALUE_LENGTH) {
    return NextResponse.json({ error: `value is required, max ${MAX_VALUE_LENGTH} chars` }, { status: 400 });
  }

  const setting = await prisma.siteSetting.upsert({
    where: { key: key.trim() },
    create: { key: key.trim(), value, updatedByName: session.name },
    update: { value, updatedByName: session.name },
  });

  return NextResponse.json(setting, { status: 201 });
}

// PATCH — update an existing setting's value
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || !isDeveloperElevated(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { key, value } = await req.json();
  if (typeof key !== "string" || !key.trim()) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }
  if (typeof value !== "string" || value.length > MAX_VALUE_LENGTH) {
    return NextResponse.json({ error: `value is required, max ${MAX_VALUE_LENGTH} chars` }, { status: 400 });
  }

  const existing = await prisma.siteSetting.findUnique({ where: { key: key.trim() } });
  if (!existing) {
    return NextResponse.json({ error: "Setting not found" }, { status: 404 });
  }

  const updated = await prisma.siteSetting.update({
    where: { key: key.trim() },
    data: { value, updatedByName: session.name },
  });

  return NextResponse.json(updated);
}

// DELETE — remove a setting (site falls back to hardcoded defaults once gone)
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !isDeveloperElevated(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  await prisma.siteSetting.deleteMany({ where: { key } });
  return NextResponse.json({ ok: true });
}
