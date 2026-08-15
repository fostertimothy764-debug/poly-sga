import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, createSession, isDeveloper } from "@/lib/auth";
import { verifyAuthentication, getAndClearChallengeCookie, decodePublicKey } from "@/lib/webauthn";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isDeveloper(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!(await checkRateLimit(`webauthn:${session.adminId}`, 10, 10 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const { response } = await req.json();
  const challenge = getAndClearChallengeCookie();
  if (!challenge || !response?.id) {
    return NextResponse.json({ error: "Verification expired. Try again" }, { status: 400 });
  }

  const passkey = await prisma.passkey.findUnique({ where: { credentialId: response.id } });
  if (!passkey || passkey.adminId !== session.adminId) {
    return NextResponse.json({ error: "Unknown passkey" }, { status: 400 });
  }

  let verification;
  try {
    verification = await verifyAuthentication(response, challenge, {
      id: passkey.credentialId,
      publicKey: decodePublicKey(passkey.publicKey),
      counter: passkey.counter,
    });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  if (!verification.verified) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  await prisma.passkey.update({
    where: { id: passkey.id },
    data: { counter: verification.authenticationInfo.newCounter, lastUsedAt: new Date() },
  });

  // Re-issues the session cookie in place with a fresh elevation timestamp — same
  // pattern lib/auth.ts already uses for password changes in profile/route.ts.
  await createSession({
    ...session,
    developerElevatedAt: Date.now(),
  });

  return NextResponse.json({ ok: true });
}
