import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isDeveloper } from "@/lib/auth";
import { buildAuthenticationOptions, setChallengeCookie } from "@/lib/webauthn";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST() {
  const session = await getSession();
  if (!session || !isDeveloper(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!(await checkRateLimit(`webauthn:${session.adminId}`, 10, 10 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many attempts — try again later." }, { status: 429 });
  }

  const passkeys = await prisma.passkey.findMany({
    where: { adminId: session.adminId },
    select: { credentialId: true },
  });

  if (passkeys.length === 0) {
    return NextResponse.json({ error: "No passkeys registered yet" }, { status: 400 });
  }

  const options = await buildAuthenticationOptions(passkeys.map((p) => p.credentialId));
  setChallengeCookie(options.challenge);

  return NextResponse.json(options);
}
