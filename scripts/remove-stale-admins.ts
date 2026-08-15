/**
 * Removes admin accounts that no longer belong on production:
 *   - test_admin: unexplained account, not from prisma/seed.ts, confirmed unlinked to any
 *     TeamMember/Club (safe to delete outright).
 *   - club1_admin / club2_admin: logins for the placeholder "Club 1"/"Club 2" rows being
 *     removed in the content-cleanup pass.
 *
 * Usage:
 *   npx tsx scripts/remove-stale-admins.ts            # dry run — prints what would be deleted
 *   npx tsx scripts/remove-stale-admins.ts --confirm   # deletes for real
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const USERNAMES_TO_REMOVE = ["test_admin", "club1_admin", "club2_admin"];

async function main() {
  const confirm = process.argv.includes("--confirm");
  const rows = await prisma.admin.findMany({
    where: { username: { in: USERNAMES_TO_REMOVE } },
    select: { id: true, username: true, name: true, role: true, clubId: true, teamMemberId: true },
  });

  console.log(`\nFound ${rows.length} account(s) to remove:\n`);
  for (const r of rows) {
    console.log(`  ${r.username.padEnd(20)} ${r.name.padEnd(28)} role=${r.role} clubId=${r.clubId ?? "-"} teamMemberId=${r.teamMemberId ?? "-"}`);
  }

  if (!confirm) {
    console.log(`\nDry run only — nothing deleted. Re-run with --confirm to delete these ${rows.length} account(s).\n`);
    await prisma.$disconnect();
    return;
  }

  const result = await prisma.admin.deleteMany({ where: { username: { in: USERNAMES_TO_REMOVE } } });
  console.log(`\nDeleted ${result.count} account(s).\n`);

  const remaining = await prisma.admin.findMany({ select: { username: true }, orderBy: { username: "asc" } });
  console.log(`Remaining ${remaining.length} account(s): ${remaining.map((a) => a.username).join(", ")}\n`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
