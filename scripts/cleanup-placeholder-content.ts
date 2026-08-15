/**
 * Removes confirmed test/placeholder content from the live database, decided with the
 * site owner ahead of launch. Matches by exact title/body text at run time (never
 * hardcodes stale ids), so it's safe to re-run — rows already gone are simply skipped.
 *
 * Deliberately preserved (do not touch):
 *   - Suggestion "more public information on field trips" — real, in-progress, has a vote.
 *
 * Usage:
 *   npx tsx scripts/cleanup-placeholder-content.ts            # dry run — prints the plan
 *   npx tsx scripts/cleanup-placeholder-content.ts --confirm   # deletes for real
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const confirm = process.argv.includes("--confirm");

  const announcements = await prisma.announcement.findMany({
    where: {
      OR: [
        { title: "test announcement" },
        { title: "test global announcement" },
        { title: "Welcome to the 2026–2027 school year" },
        { title: "Senior info update" },
        { title: "Junior class update" },
      ],
    },
    select: { id: true, title: true, pinned: true },
  });

  const clubs = await prisma.club.findMany({
    where: { slug: { in: ["club-1", "club-2", "club-3", "club-4", "club-5"] } },
    select: { id: true, name: true },
  });

  const events = await prisma.event.findMany({
    where: {
      OR: [{ title: "SGA General Meeting" }, { title: "Senior class event" }],
      location: "TBD",
    },
    select: { id: true, title: true },
  });

  const suggestions = await prisma.suggestion.findMany({
    where: { OR: [{ body: "test" }, { body: "idea test private" }] },
    select: { id: true, body: true },
  });

  const links = await prisma.resourceLink.findMany({
    where: { title: "test", url: "https://poly-sga2.vercel.app/" },
    select: { id: true, title: true, url: true },
  });

  console.log("\nPlanned deletions:\n");
  console.log(`  Announcements (${announcements.length}):`);
  announcements.forEach((a) => console.log(`    - "${a.title}"${a.pinned ? " [pinned]" : ""}`));
  console.log(`  Clubs (${clubs.length}):`);
  clubs.forEach((c) => console.log(`    - "${c.name}"`));
  console.log(`  Events (${events.length}):`);
  events.forEach((e) => console.log(`    - "${e.title}"`));
  console.log(`  Suggestions (${suggestions.length}):`);
  suggestions.forEach((s) => console.log(`    - "${s.body}"`));
  console.log(`  Resource links (${links.length}):`);
  links.forEach((l) => console.log(`    - "${l.title}" -> ${l.url}`));

  const total = announcements.length + clubs.length + events.length + suggestions.length + links.length;

  if (!confirm) {
    console.log(`\nDry run only — nothing deleted. Re-run with --confirm to delete these ${total} row(s).\n`);
    await prisma.$disconnect();
    return;
  }

  await prisma.announcement.deleteMany({ where: { id: { in: announcements.map((a) => a.id) } } });
  await prisma.club.deleteMany({ where: { id: { in: clubs.map((c) => c.id) } } });
  await prisma.event.deleteMany({ where: { id: { in: events.map((e) => e.id) } } });
  await prisma.suggestion.deleteMany({ where: { id: { in: suggestions.map((s) => s.id) } } });
  await prisma.resourceLink.deleteMany({ where: { id: { in: links.map((l) => l.id) } } });

  console.log(`\nDeleted ${total} row(s) total.\n`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
