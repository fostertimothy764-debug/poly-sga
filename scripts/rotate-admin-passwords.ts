/**
 * One-off credential rotation for the live production Admin table.
 *
 * The GitHub repo is public and prisma/seed.ts historically contained plaintext
 * default passwords for every seeded account. This script rotates every current
 * Admin row to a fresh random password so those leaked defaults stop working.
 *
 * Usage:
 *   npx tsx scripts/rotate-admin-passwords.ts            # dry run — prints the plan only
 *   npx tsx scripts/rotate-admin-passwords.ts --confirm   # rotates for real, writes results
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function randomPassword(): string {
  return crypto.randomBytes(9).toString("base64url"); // 12 chars, URL-safe
}

async function main() {
  const confirm = process.argv.includes("--confirm");
  const admins = await prisma.admin.findMany({
    orderBy: { username: "asc" },
    select: { id: true, username: true, name: true, role: true, siteAdmin: true },
  });

  console.log(`\nFound ${admins.length} Admin account(s):\n`);
  for (const a of admins) {
    console.log(`  ${a.username.padEnd(20)} ${a.name.padEnd(28)} role=${a.role}${a.siteAdmin ? " siteAdmin" : ""}`);
  }

  if (!confirm) {
    console.log(`\nDry run only — no passwords changed. Re-run with --confirm to rotate all ${admins.length} accounts.\n`);
    await prisma.$disconnect();
    return;
  }

  const results: { username: string; name: string; password: string }[] = [];
  for (const a of admins) {
    const password = randomPassword();
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.admin.update({ where: { id: a.id }, data: { passwordHash } });
    results.push({ username: a.username, name: a.name, password });
  }

  const outDir = path.join(__dirname, "..", "credentials");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `rotated-passwords-${Date.now()}.txt`);
  const lines = results.map((r) => `${r.username.padEnd(20)} ${r.name.padEnd(28)} ${r.password}`);
  fs.writeFileSync(outFile, lines.join("\n") + "\n");

  console.log(`\nRotated ${results.length} account(s). New credentials:\n`);
  console.log(lines.join("\n"));
  console.log(`\nAlso written to: ${outFile} (gitignored — do not commit)\n`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
