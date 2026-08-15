import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

// Set SEED_SAMPLE_CONTENT=true to also create demo clubs/announcements/events/suggestions —
// useful for a fresh local/dev database. Leave unset for a clean production seed with real
// officer accounts only and no placeholder content.
const SEED_SAMPLE_CONTENT = process.env.SEED_SAMPLE_CONTENT === "true";

function randomPassword(): string {
  return crypto.randomBytes(9).toString("base64url"); // 12 chars, URL-safe
}

async function main() {
  // Wipe everything to keep the seed deterministic
  await prisma.suggestionVote.deleteMany();
  await prisma.suggestion.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.event.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.newsletter.deleteMany();
  await prisma.resourceLink.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.club.deleteMany();
  await prisma.clubRequest.deleteMany();

  const credentials: { username: string; password: string; name: string }[] = [];

  /* ---------- Clubs (sample content only) ---------- */
  let club1: { id: string } | null = null;
  let club2: { id: string } | null = null;
  if (SEED_SAMPLE_CONTENT) {
    club1 = await prisma.club.create({
      data: {
        slug: "club-1",
        name: "Club 1",
        description: "Add a description for Club 1 from the admin dashboard.",
        meetingTime: "TBD",
        location: "TBD",
      },
    });
    club2 = await prisma.club.create({
      data: {
        slug: "club-2",
        name: "Club 2",
        description: "Add a description for Club 2 from the admin dashboard.",
        meetingTime: "TBD",
        location: "TBD",
      },
    });
    await prisma.club.create({
      data: {
        slug: "club-3",
        name: "Club 3",
        description: "Add a description for Club 3 from the admin dashboard.",
        meetingTime: "TBD",
        location: "TBD",
      },
    });
    await prisma.club.create({
      data: {
        slug: "club-4",
        name: "Club 4",
        description: "Add a description for Club 4 from the admin dashboard.",
        meetingTime: "TBD",
        location: "TBD",
      },
    });
    await prisma.club.create({
      data: {
        slug: "club-5",
        name: "Club 5",
        description: "Add a description for Club 5 from the admin dashboard.",
        meetingTime: "TBD",
        location: "TBD",
      },
    });
  }

  /* ---------- SGA team + linked admin accounts ---------- */
  const team = [
    {
      username: "president",
      name: "President",
      role: "President",
      grade: "Class of 2027",
      bio: "SGA President.",
      order: 1,
      adminRole: "sga_admin",
    },
    {
      username: "chiefofstaff",
      name: "Chief of Staff",
      role: "Chief of Staff",
      grade: "Class of 2027",
      bio: "Manages internal SGA operations.",
      order: 2,
      adminRole: "sga_admin",
    },
    {
      username: "uppervp",
      name: "Upper Vice President",
      role: "Upper Vice President",
      grade: "Class of 2028",
      bio: "Upper Vice President.",
      order: 3,
      adminRole: "sga_member",
    },
    {
      username: "lowervp",
      name: "Lower Vice President",
      role: "Lower Vice President",
      grade: "Class of 2028",
      bio: "Lower Vice President.",
      order: 4,
      adminRole: "sga_member",
    },
    {
      username: "secretary",
      name: "Secretary",
      role: "Secretary",
      grade: "Class of 2027",
      bio: "Keeps meeting records and official correspondence.",
      order: 5,
      adminRole: "sga_member",
    },
    {
      username: "treasurer",
      name: "Treasurer",
      role: "Treasurer",
      grade: "Class of 2028",
      bio: "Manages the SGA budget.",
      order: 6,
      adminRole: "sga_member",
    },
    {
      username: "historian1",
      name: "Historian I",
      role: "Historian",
      grade: "Class of 2029",
      bio: "Documents SGA events and history.",
      order: 7,
      adminRole: "sga_member",
    },
    {
      username: "historian2",
      name: "Historian II",
      role: "Historian",
      grade: "Class of 2030",
      bio: "Documents SGA events and history.",
      order: 8,
      adminRole: "sga_member",
    },
  ];

  for (const m of team) {
    const member = await prisma.teamMember.create({
      data: {
        name: m.name,
        role: m.role,
        grade: m.grade,
        bio: m.bio,
        order: m.order,
        // photoUrl intentionally null — add real photos from /admin/profile
      },
    });
    const password = randomPassword();
    credentials.push({ username: m.username, password, name: m.name });
    await prisma.admin.create({
      data: {
        username: m.username,
        passwordHash: await bcrypt.hash(password, 10),
        name: m.name,
        role: m.adminRole,
        teamMemberId: member.id,
      },
    });
  }

  /* ---------- Class officer team members (public roster placeholders, sample content only) ---------- */
  if (SEED_SAMPLE_CONTENT) {
    await prisma.teamMember.createMany({
      data: [
        { name: "CO27 Class Officer 1", role: "Class Officer", grade: "Class of 2027", order: 20 },
        { name: "CO27 Class Officer 2", role: "Class Officer", grade: "Class of 2027", order: 21 },
        { name: "CO28 Class Officer 1", role: "Class Officer", grade: "Class of 2028", order: 22 },
        { name: "CO28 Class Officer 2", role: "Class Officer", grade: "Class of 2028", order: 23 },
        { name: "CO29 Class Officer 1", role: "Class Officer", grade: "Class of 2029", order: 24 },
        { name: "CO29 Class Officer 2", role: "Class Officer", grade: "Class of 2029", order: 25 },
        { name: "CO30 Class Officer 1", role: "Class Officer", grade: "Class of 2030", order: 26 },
        { name: "CO30 Class Officer 2", role: "Class Officer", grade: "Class of 2030", order: 27 },
      ],
    });
  }

  /* ---------- Site admin (you) ---------- */
  const siteAdminUser = process.env.ADMIN_USERNAME;
  const siteAdminPass = process.env.ADMIN_PASSWORD;
  if (!siteAdminUser || !siteAdminPass) {
    throw new Error(
      "ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env before seeding — there is no hardcoded fallback."
    );
  }
  await prisma.admin.create({
    data: {
      username: siteAdminUser,
      passwordHash: await bcrypt.hash(siteAdminPass, 10),
      name: "Site Admin",
      role: "sga_admin",
      siteAdmin: true,
    },
  });

  /* ---------- Class officer logins ---------- */
  const classAccounts = ["27", "28", "29", "30"].map((year) => ({
    username: `class${year}`,
    year,
  }));
  for (const c of classAccounts) {
    const password = randomPassword();
    const name = `Class of 20${c.year} Officer`;
    credentials.push({ username: c.username, password, name });
    await prisma.admin.create({
      data: {
        username: c.username,
        passwordHash: await bcrypt.hash(password, 10),
        name,
        role: "class",
        classYear: c.year,
      },
    });
  }

  /* ---------- Club officer logins (sample content only, tied to sample clubs) ---------- */
  if (SEED_SAMPLE_CONTENT && club1 && club2) {
    const clubAccounts = [
      { username: "club1_admin", clubId: club1.id, name: "Club 1 Officer" },
      { username: "club2_admin", clubId: club2.id, name: "Club 2 Officer" },
    ];
    for (const c of clubAccounts) {
      const password = randomPassword();
      credentials.push({ username: c.username, password, name: c.name });
      await prisma.admin.create({
        data: {
          username: c.username,
          passwordHash: await bcrypt.hash(password, 10),
          name: c.name,
          role: "club",
          clubId: c.clubId,
        },
      });
    }
  }

  /* ---------- Sample content (sample content only) ---------- */
  if (SEED_SAMPLE_CONTENT) {
    const now = new Date();
    const inDays = (n: number, h = 15, m = 0) => {
      const d = new Date(now);
      d.setDate(d.getDate() + n);
      d.setHours(h, m, 0, 0);
      return d;
    };

    await prisma.announcement.createMany({
      data: [
        {
          title: "Welcome to the 2026–2027 school year",
          body: "SGA is excited to kick off a great year. Stay tuned for events, announcements, and ways to get involved.",
          pinned: true,
          audience: "all",
          authorName: "SGA President",
        },
        {
          title: "Open exec board meetings",
          body: "All students are welcome to attend our open exec meetings. Check the Events tab for the next date.",
          audience: "all",
          authorName: "SGA",
        },
        {
          title: "Senior info update",
          body: "Important deadlines are coming up for the Class of 2027. Stay tuned for more details.",
          pinned: true,
          audience: "27",
          authorName: "Class of 2027 Officer",
        },
        {
          title: "Junior class update",
          body: "Check back soon for updates from your class officers.",
          audience: "28",
          authorName: "Class of 2028 Officer",
        },
      ],
    });

    await prisma.event.createMany({
      data: [
        {
          title: "SGA General Meeting",
          description: "Open to all students. Reviewing suggestions and planning upcoming events.",
          location: "TBD",
          audience: "all",
          startsAt: inDays(7, 15, 15),
          endsAt: inDays(7, 16, 0),
        },
        {
          title: "Senior class event",
          description: "Details to be announced by class officers.",
          location: "TBD",
          audience: "27",
          startsAt: inDays(14, 16, 0),
        },
      ],
    });

    await prisma.suggestion.create({
      data: {
        body: "Can we get a covered area for outside lunch? When it rains there's nowhere to sit.",
        category: "facilities",
        target: "sga",
        votes: 12,
      },
    });
  }

  /* ---------- Print logins (generated fresh every run — never hardcoded) ---------- */
  console.log("\n✓ Seed complete\n");
  console.log("  Site admin:");
  console.log(`    ${siteAdminUser.padEnd(20)} / ${siteAdminPass}`);
  console.log("\n  Generated officer logins (save these — shown only once):");
  for (const c of credentials) {
    console.log(`    ${c.username.padEnd(20)} / ${c.password}   (${c.name})`);
  }
  if (!SEED_SAMPLE_CONTENT) {
    console.log(
      "\n  Sample clubs/announcements/events/suggestions skipped. Set SEED_SAMPLE_CONTENT=true to include demo data for local dev.\n"
    );
  } else {
    console.log("");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
