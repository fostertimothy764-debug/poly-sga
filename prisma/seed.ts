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

  /* ---------- Clubs ---------- */
  const robotics = await prisma.club.create({
    data: {
      slug: "robotics",
      name: "Robotics Team",
      description:
        "Poly's award-winning FRC team. Open to all grades, no experience needed. We build a competition robot every January.",
      meetingTime: "Tuesdays & Thursdays, 3:30 PM",
      location: "Room 312 (Engineering Wing)",
    },
  });
  const debate = await prisma.club.create({
    data: {
      slug: "debate",
      name: "Debate Team",
      description:
        "Compete in policy and Lincoln-Douglas debate at MD state tournaments. We meet to research, drill, and run practice rounds.",
      meetingTime: "Mondays, 3:15 PM",
      location: "Room 207",
    },
  });
  const bsu = await prisma.club.create({
    data: {
      slug: "bsu",
      name: "Black Student Union",
      description:
        "A space for community, advocacy, and celebrating Black culture at Poly. All allies welcome.",
      meetingTime: "Wednesdays, 3:15 PM",
      location: "Room 118",
    },
  });
  const mathTeam = await prisma.club.create({
    data: {
      slug: "math-team",
      name: "Math Team",
      description:
        "Train for AMC, ARML, and the Maryland Math League. We solve cool problems and eat snacks.",
      meetingTime: "Fridays, 3:15 PM",
      location: "Room 205",
    },
  });
  const nhs = await prisma.club.create({
    data: {
      slug: "nhs",
      name: "National Honor Society",
      description:
        "Service, leadership, scholarship, character. Tutor, volunteer, and lead chapter projects.",
      meetingTime: "First Wednesday of the month",
      location: "Auditorium",
    },
  });

  /* ---------- Team members + linked SGA admins ---------- */
  const team = [
    { username: "maya", name: "Maya Thompson", role: "President", grade: "Class of 2027", bio: "Three-year SGA member. Big on transparency and bringing back the Poly–Western rivalry events.", order: 1, adminRole: "sga_admin", password: "maya2026" },
    { username: "jordan", name: "Jordan Reyes", role: "Chief of Staff", grade: "Class of 2027", bio: "Runs internal ops and the suggestion box. Coffee snob.", order: 2, adminRole: "sga_admin", password: "jordan2026" },
    { username: "aisha", name: "Aisha Patel", role: "Vice President", grade: "Class of 2028", bio: "Math team captain, also kind of an Excel wizard.", order: 3, adminRole: "sga_member", password: "aisha2026" },
    { username: "devon", name: "Devon Carter", role: "Treasurer", grade: "Class of 2028", bio: "Tracks every dollar of SGA's budget. Don't try to slip something past him.", order: 4, adminRole: "sga_member", password: "devon2026" },
    { username: "luke", name: "Luke Morrison", role: "Secretary", grade: "Class of 2027", bio: "Takes the meeting notes that actually get read.", order: 5, adminRole: "sga_member", password: "luke2026" },
    { username: "sofia", name: "Sofia Garcia", role: "Communications Director", grade: "Class of 2028", bio: "Runs the @polysga Instagram. If you saw it on the gram, blame her.", order: 6, adminRole: "sga_member", password: "sofia2026" },
  ];

  const linkedAdmins: { username: string; password: string }[] = [];
  for (const m of team) {
    const member = await prisma.teamMember.create({
      data: {
        name: m.name,
        role: m.role,
        grade: m.grade,
        bio: m.bio,
        order: m.order,
        // photoUrl intentionally left null — add real photos from /admin/profile
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
    linkedAdmins.push({ username: m.username, password: m.password });
  }

  // Class reps (no individual login — handled by class<year> account below)
  await prisma.teamMember.createMany({
    data: [
      { name: "Sam Kim", role: "Class of 2027 President", grade: "Class of 2027", order: 10 },
      { name: "Riley Brooks", role: "Class of 2028 President", grade: "Class of 2028", order: 11 },
      { name: "Chris Nguyen", role: "Class of 2029 President", grade: "Class of 2029", order: 12 },
      { name: "Taylor Adams", role: "Class of 2030 President", grade: "Class of 2030", order: 13 },
    ],
  });

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
    { username: "robotics_admin", password: "robotics", clubId: robotics.id, name: "Robotics Captain" },
    { username: "debate_admin", password: "debate", clubId: debate.id, name: "Debate Captain" },
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

  /* ---------- Content ---------- */
  const now = new Date();
  const inDays = (n: number, h = 15, m = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    d.setHours(h, m, 0, 0);
    return d;
  };

  await prisma.announcement.createMany({
    data: [
      { title: "Spring spirit week is here", body: "Theme days run all next week — pajama Monday, jersey Tuesday, decade day Wednesday, class colors Thursday, and orange-and-blue Friday for the pep rally.", pinned: true, audience: "all", authorName: "Maya Thompson" },
      { title: "Open exec board meetings", body: "Every other Wednesday in Room 213, 3:15–4:00 PM. All Poly students welcome.", audience: "all", authorName: "SGA Exec" },
      { title: "Senior cap & gown deadline", body: "Order your cap and gown by next Friday. Late orders cost extra and may not arrive in time.", pinned: true, audience: "27", authorName: "Class of 2027 Officers" },
      { title: "Junior prom committee signups", body: "We need volunteers for decorations, tickets, and DJ liaison. Sign up sheet outside Room 204.", audience: "28", authorName: "Class of 2028 Officers" },
      { title: "Sophomore ring ceremony details", body: "Ceremony is in three weeks. Dress code is business casual.", audience: "29", authorName: "Class of 2029 Officers" },
      { title: "Freshman orientation recap", body: "Thanks to everyone who came to the welcome breakfast! The class group chat is up.", audience: "30", authorName: "Class of 2030 Officers" },
    ],
  });

  await prisma.announcement.create({
    data: {
      title: "Robotics build season kickoff",
      body: "FRC kickoff is this Saturday at 9 AM in the engineering wing. We'll watch the game reveal, eat bagels, and start brainstorming.",
      pinned: true,
      audience: "club",
      clubId: robotics.id,
      authorName: "Robotics Captain",
    },
  });
  await prisma.announcement.create({
    data: {
      title: "State qualifier next weekend",
      body: "Three rounds, then break to elims. Carpool list pinned in our group chat.",
      audience: "club",
      clubId: debate.id,
      authorName: "Debate Captain",
    },
  });

  await prisma.event.createMany({
    data: [
      { title: "Spring pep rally", description: "Class competitions, performances, and the unveiling of this year's homecoming court.", location: "Main gym", audience: "all", startsAt: inDays(5, 14, 0), endsAt: inDays(5, 15, 30) },
      { title: "SGA general meeting", description: "Open to all students. Reviewing this month's suggestions and planning the spring fundraiser.", location: "Room 213", audience: "all", startsAt: inDays(10, 15, 15), endsAt: inDays(10, 16, 0) },
      { title: "Charity bake sale", description: "Proceeds go to the Maryland Food Bank.", location: "Front lobby", audience: "all", startsAt: inDays(14, 11, 0), endsAt: inDays(14, 14, 0) },
      { title: "Senior class trip info night", description: "Senior trip itinerary, payment plans, FAQ. Parents welcome.", location: "Auditorium", audience: "27", startsAt: inDays(21, 18, 30), endsAt: inDays(21, 20, 0) },
      { title: "Junior PSAT prep", description: "Free practice session run by NHS tutors.", location: "Library", audience: "28", startsAt: inDays(7, 16, 0), endsAt: inDays(7, 17, 30) },
      { title: "Sophomore class breakfast", description: "Free bagels and donuts before first period.", location: "Cafeteria", audience: "29", startsAt: inDays(3, 7, 30), endsAt: inDays(3, 8, 15) },
      { title: "Freshman game night", description: "Smash, Mario Kart, board games. Pizza included.", location: "Cafeteria", audience: "30", startsAt: inDays(12, 17, 0), endsAt: inDays(12, 20, 0) },
    ],
  });

  await prisma.event.create({
    data: {
      title: "Robotics scrimmage at Dulaney",
      description: "Bus leaves at 7 AM. Bring snacks and team gear.",
      location: "Dulaney HS",
      audience: "club",
      clubId: robotics.id,
      startsAt: inDays(9, 7, 0),
      endsAt: inDays(9, 18, 0),
    },
  });

  /* ---------- Suggestions ---------- */
  const suggestions = await Promise.all([
    prisma.suggestion.create({
      data: { body: "Can we get a covered area for outside lunch? When it rains there's nowhere to sit.", category: "facilities", target: "sga", votes: 24 },
    }),
    prisma.suggestion.create({
      data: { body: "Bring back the senior–faculty basketball game!! That was the best part of last year.", category: "events", target: "27", contact: "@polysenior2027", votes: 41 },
    }),
    prisma.suggestion.create({
      data: { body: "Wifi in the library is super slow during 5th period.", category: "facilities", target: "sga", votes: 18 },
    }),
    prisma.suggestion.create({
      data: { body: "Robotics needs a bigger tool chest. We keep losing wrenches.", category: "facilities", target: "club", clubId: robotics.id, votes: 8 },
    }),
    prisma.suggestion.create({
      data: { body: "Can we have a school-wide outdoor movie night before finals?", category: "events", target: "sga", votes: 33 },
    }),
    prisma.suggestion.create({
      data: { body: "More vegetarian options at lunch please.", category: "general", target: "sga", votes: 12 },
    }),
  ]);

  for (const s of suggestions) {
    const fakeVotes = Array.from({ length: s.votes }, (_, i) => ({
      suggestionId: s.id,
      voterId: `seed_${s.id}_${i}`,
    }));
    if (fakeVotes.length) {
      await prisma.suggestionVote.createMany({ data: fakeVotes });
    }
  }

  /* ---------- Print logins ---------- */
  console.log("\n✓ Seed complete\n");
  console.log("  SGA Admins (full access):");
  console.log(`    ${siteAdminUser.padEnd(16)} / ${siteAdminPass}   (site admin)`);
  for (const m of team.filter((t) => t.adminRole === "sga_admin")) {
    console.log(`    ${m.username.padEnd(16)} / ${m.password}   (${m.role})`);
  }
  console.log("\n  SGA Officers (post schoolwide, edit own profile only):");
  for (const m of team.filter((t) => t.adminRole === "sga_member")) {
    console.log(`    ${m.username.padEnd(16)} / ${m.password}   (${m.role})`);
  }
  console.log("\n  Class Officers:");
  for (const c of classAccounts) {
    console.log(`    ${c.username.padEnd(16)} / ${c.password}   (Class of 20${c.year})`);
  }
  console.log("\n  Club Officers:");
  for (const c of clubAccounts) {
    console.log(`    ${c.username.padEnd(16)} / ${c.password}   (${c.name})`);
  }
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
