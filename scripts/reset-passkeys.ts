/**
 * Deletes all Passkey rows for the developer account — the maintenance step needed
 * after WEBAUTHN_RP_ID / WEBAUTHN_ORIGIN change (e.g. moving from the *.vercel.app
 * domain to a custom domain).
 *
 * WebAuthn passkeys are bound to the RP ID they were registered under: a browser
 * won't offer a passkey to an origin it wasn't created for, and the server checks
 * expectedRPID too. So after a domain change, old passkey rows are permanently
 * unusable — but app/api/auth/webauthn/register-options/route.ts still counts them
 * as "existing," which blocks the password-only bootstrap path for registering a
 * replacement. Clearing them out here restores that bootstrap path.
 *
 * Usage:
 *   npx tsx scripts/reset-passkeys.ts <username>            # dry run — prints what would be deleted
 *   npx tsx scripts/reset-passkeys.ts <username> --confirm   # deletes for real
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const confirm = process.argv.includes("--confirm");
  const username = process.argv.find((a, i) => i >= 2 && !a.startsWith("--"));

  if (!username) {
    console.error("Usage: npx tsx scripts/reset-passkeys.ts <username> [--confirm]");
    process.exit(1);
  }

  const admin = await prisma.admin.findUnique({
    where: { username: username.toLowerCase().trim() },
    select: { id: true, username: true, name: true, isDeveloper: true },
  });

  if (!admin) {
    console.error(`No admin account found with username "${username}".`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const passkeys = await prisma.passkey.findMany({
    where: { adminId: admin.id },
    select: { id: true, deviceLabel: true, createdAt: true },
  });

  console.log(`\nFound ${passkeys.length} passkey(s) for ${admin.username} (${admin.name}):\n`);
  for (const p of passkeys) {
    console.log(`  ${(p.deviceLabel || "Unlabeled").padEnd(30)} added ${p.createdAt.toISOString()}`);
  }

  if (passkeys.length === 0) {
    console.log("\nNothing to do.\n");
    await prisma.$disconnect();
    return;
  }

  if (!confirm) {
    console.log(`\nDry run only — nothing deleted. Re-run with --confirm to delete these ${passkeys.length} passkey(s).\n`);
    await prisma.$disconnect();
    return;
  }

  await prisma.passkey.deleteMany({ where: { adminId: admin.id } });
  console.log(`\nDeleted ${passkeys.length} passkey(s). ${admin.username} can register a fresh one from the Developer tab on next login.\n`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
