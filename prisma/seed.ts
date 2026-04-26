import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Wipe everything to keep the seed deterministic
  await prisma.suggestionVote.deleteMany();
  await prisma.suggestion.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.event.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.club.deleteMany();
  await prisma.clubRequest.deleteMany();

  /* ---------- Clubs (generic placeholders) ---------- */
  const club1 = await prisma.club.create({
    data: {
      slug: "club-1",
      name: "Club 1",
      description: "Add a description for Club 1 from the admin dashboard.",
      meetingTime: "TBD",
      location: "TBD",
    },
  });
  const club2 = await prisma.club.create({
    data: {
      slug: "club-2",
      name: "Club 2",
      description: "Add a description for Club 2 from the admin dashboard.",
      meetingTime: "TBD",
      location: "TBD",
    },
  });
  const club3 = await prisma.club.create({
    data: {
      slug: "club-3",
      name: "Club 3",
      description: "Add a description for Club 3 from the admin dashboard.",
      meetingTime: "TBD",
      location: "TBD",
    },
  });
  const club4 = await prisma.club.create({
    data: {
      slug: "club-4",
      name: "Club 4",
      description: "Add a description for Club 4 from the admin dashboard.",
      meetingTime: "TBD",
      location: "TBD",
    },
  });
  const club5 = await prisma.club.create({
    data: {
      slug: "club-5",
      name: "Club 5",
      description: "Add a description for Club 5 from the admin dashboard.",
      meetingTime: "TBD",
      location: "TBD",
    },
  });

  /* ---------- SGA team + linked admin accounts ---------- */
  const team = [
    {
      username: "president",
      password: "president2026",
      name: "President",
      role: "President",
      grade: "Class of 2027",
      bio: "SGA President.",
      order: 1,
      adminRole: "sga_admin",
    },
    {
      username: "chiefofstaff",
      password: "chief2026",
      name: "Chief of Staff",
      role: "Chief of Staff",
      grade: "Class of 2027",
      bio: "Manages internal SGA operations.",
      order: 2,
      adminRole: "sga_admin",
    },
    {
      username: "uppervp",
      password: "uppervp2026",
      name: "Upper Vice President",
      role: "Upper Vice President",
      grade: "Class of 2028",
      bio: "Upper Vice President.",
      order: 3,
      adminRole: "sga_member",
    },
    {
      username: "lowervp",
      password: "lowervp2026",
      name: "Lower Vice President",
      role: "Lower Vice President",
      grade: "Class of 2028",
      bio: "Lower Vice President.",
      order: 4,
      adminRole: "sga_member",
    },
    {
      username: "secretary",
      password: "secretary2026",
      name: "Secretary",
      role: "Secretary",
      grade: "Class of 2027",
      bio: "Keeps meeting records and official correspondence.",
      order: 5,
      adminRole: "sga_member",
    },
    {
      username: "treasurer",
      password: "treasurer2026",
      name: "Treasurer",
      role: "Treasurer",
      grade: "Class of 2028",
      bio: "Manages the SGA budget.",
      order: 6,
      adminRole: "sga_member",
    },
    {
      username: "historian1",
      password: "historian12026",
      name: "Historian I",
      role: "Historian",
      grade: "Class of 2029",
      bio: "Documents SGA events and history.",
      order: 7,
      adminRole: "sga_member",
    },
    {
      username: "historian2",
      password: "historian22026",
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
    await prisma.admin.create({
      data: {
        username: m.username,
        passwordHash: await bcrypt.hash(m.password, 10),
        name: m.name,
        role: m.adminRole,
        teamMemberId: member.id,
      },
    });
  }

  /* ---------- Site admin (you) ---------- */
  const siteAdminUser = process.env.ADMIN_USERNAME || "admin";
  const siteAdminPass = process.env.ADMIN_PASSWORD || "poly2026";
  await prisma.admin.create({
    data: {
      username: siteAdminUser,
      passwordHash: await bcrypt.hash(siteAdminPass, 10),
      name: "Site Admin",
      role: "sga_admin",
    },
  });

  /* ---------- Class officer logins ---------- */
  const classAccounts = [
    { username: "class27", password: "class27", year: "27" },
    { username: "class28", password: "class28", year: "28" },
    { username: "class29", password: "class29", year: "29" },
    { username: "class30", password: "class30", year: "30" },
  ];
  for (const c of classAccounts) {
    await prisma.admin.create({
      data: {
        username: c.username,
        passwordHash: await bcrypt.hash(c.password, 10),
        name: `Class of 20${c.year} Officer`,
        role: "class",
        classYear: c.year,
      },
    });
  }

  /* ---------- Club officer logins ---------- */
  const clubAccounts = [
    { username: "club1_admin", password: "club1", clubId: club1.id, name: "Club 1 Officer" },
    { username: "club2_admin", password: "club2", clubId: club2.id, name: "Club 2 Officer" },
  ];
  for (const c of clubAccounts) {
    await prisma.admin.create({
      data: {
        username: c.username,
        passwordHash: await bcrypt.hash(c.password, 10),
        name: c.name,
        role: "club",
        clubId: c.clubId,
      },
    });
  }

  /* ---------- Sample content ---------- */
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

  /* ---------- Print logins ---------- */
  console.log("\n✓ Seed complete\n");
  console.log("  Site admin:");
  console.log(`    ${siteAdminUser.padEnd(20)} / ${siteAdminPass}`);
  console.log("\n  SGA Admins:");
  for (const m of team.filter((t) => t.adminRole === "sga_admin")) {
    console.log(`    ${m.username.padEnd(20)} / ${m.password}`);
  }
  console.log("\n  SGA Officers:");
  for (const m of team.filter((t) => t.adminRole === "sga_member")) {
    console.log(`    ${m.username.padEnd(20)} / ${m.password}`);
  }
  console.log("\n  Class Officers:");
  for (const c of classAccounts) {
    console.log(`    ${c.username.padEnd(20)} / ${c.password}   (Class of 20${c.year})`);
  }
  console.log("\n  Club Officers:");
  for (const c of clubAccounts) {
    console.log(`    ${c.username.padEnd(20)} / ${c.password}   (${c.name})`);
  }
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
