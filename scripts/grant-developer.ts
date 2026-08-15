/**
 * One-off flag flip for the site-owner-only "developer" tier (Admin.isDeveloper).
 *
 * Deliberately NOT exposed through any API or admin UI — app/api/admin/accounts/route.ts
 * never reads or writes this field, so no admin (including a siteAdmin) can grant it to
 * themselves or anyone else through the product. This script is the only path.
 *
 * Run this immediately before registering a passkey for the account (via the Developer
 * tab in /admin) — until a passkey exists, the account is developer-capable on password
 * alone, so minimize that window.
 *
 * Usage:
 *   npx tsx scripts/grant-developer.ts <username>            # dry run — prints the plan
 *   npx tsx scripts/grant-developer.ts <username> --confirm   # flips isDeveloper on for real
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const confirm = process.argv.includes("--confirm");
  const username = process.argv.find((a, i) => i >= 2 && !a.startsWith("--"));

  if (!username) {
    console.error("Usage: npx tsx scripts/grant-developer.ts <username> [--confirm]");
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

  if (admin.isDeveloper) {
    console.log(`\n${admin.username} (${admin.name}) already has isDeveloper=true. Nothing to do.\n`);
    await prisma.$disconnect();
    return;
  }

  console.log(`\nWill set isDeveloper=true for: ${admin.username} (${admin.name})`);

  if (!confirm) {
    console.log(`\nDry run only — nothing changed. Re-run with --confirm to apply.\n`);
    await prisma.$disconnect();
    return;
  }

  await prisma.admin.update({ where: { id: admin.id }, data: { isDeveloper: true } });
  console.log(`\nDone. Log in as ${admin.username} and register a passkey from the Developer tab now.\n`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
