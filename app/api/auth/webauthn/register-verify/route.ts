import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isDeveloper, isDeveloperElevated } from "@/lib/auth";
import { verifyRegistration, getAndClearChallengeCookie, encodePublicKey } from "@/lib/webauthn";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isDeveloper(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!(await checkRateLimit(`webauthn:${session.adminId}`, 10, 10 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many attempts — try again later." }, { status: 429 });
  }

  const existingCount = await prisma.passkey.count({ where: { adminId: session.adminId } });
  if (existingCount > 0 && !isDeveloperElevated(session)) {
    return NextResponse.json({ error: "Verify with an existing passkey first" }, { status: 403 });
  }

  const { response, deviceLabel } = await req.json();
  const challenge = getAndClearChallengeCookie();
  if (!challenge || !response) {
    return NextResponse.json({ error: "Registration expired — try again" }, { status: 400 });
  }

  let verification;
  try {
    verification = await verifyRegistration(response, challenge);
  } catch {
    return NextResponse.json({ error: "Registration verification failed" }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "Registration could not be verified" }, { status: 400 });
  }

  const { credential } = verification.registrationInfo;

  const dupe = await prisma.passkey.findUnique({ where: { credentialId: credential.id } });
  if (dupe) {
    return NextResponse.json({ error: "This passkey is already registered" }, { status: 409 });
  }

  await prisma.passkey.create({
    data: {
      adminId: session.adminId,
      credentialId: credential.id,
      publicKey: encodePublicKey(credential.publicKey),
      counter: credential.counter,
      deviceLabel:
        typeof deviceLabel === "string" && deviceLabel.trim()
          ? deviceLabel.trim().slice(0, 60)
          : null,
    },
  });

  return NextResponse.json({ ok: true });
}
