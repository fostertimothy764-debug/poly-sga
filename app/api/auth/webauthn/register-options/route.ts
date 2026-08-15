import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isDeveloper, isDeveloperElevated } from "@/lib/auth";
import { buildRegistrationOptions, setChallengeCookie } from "@/lib/webauthn";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST() {
  const session = await getSession();
  if (!session || !isDeveloper(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!(await checkRateLimit(`webauthn:${session.adminId}`, 10, 10 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many attempts — try again later." }, { status: 429 });
  }

  const existing = await prisma.passkey.findMany({
    where: { adminId: session.adminId },
    select: { credentialId: true },
  });

  // First passkey ever is the bootstrap case, allowed on password alone; registering
  // an additional device requires proving you already hold an existing passkey.
  if (existing.length > 0 && !isDeveloperElevated(session)) {
    return NextResponse.json({ error: "Verify with an existing passkey first" }, { status: 403 });
  }

  const options = await buildRegistrationOptions(
    { id: session.adminId, username: session.username, name: session.name },
    existing.map((p) => p.credentialId)
  );

  setChallengeCookie(options.challenge);

  return NextResponse.json(options);
}
