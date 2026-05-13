import type { Metadata, Viewport } from "next";
import "./globals.css";
import Shell from "@/components/shell";
import { getGrade } from "@/lib/grade";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { WireItem } from "@/components/news-wire";
import { relativeTime } from "@/lib/utils";

function trimText(s: string, len = 90) {
  const t = s.trim().replace(/\s+/g, " ");
  if (t.length <= len) return t;
  const slice = t.slice(0, len);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > len * 0.6 ? slice.slice(0, lastSpace) : slice) + "…";
}

async function getWireItems(): Promise<WireItem[]> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [latestAnnouncement, topIdea, nextEvent, latestScoop] = await Promise.all([
    prisma.announcement.findFirst({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      select: { title: true, createdAt: true },
    }),
    prisma.suggestion.findFirst({
      where: { private: false, createdAt: { gte: weekAgo } },
      orderBy: { votes: "desc" },
      select: { body: true, votes: true },
    }),
    prisma.event.findFirst({
      where: { startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      select: { title: true, startsAt: true },
    }),
    prisma.newsletter.findFirst({
      orderBy: { publishedAt: "desc" },
      select: { title: true, issueLabel: true },
    }),
  ]);

  const items: WireItem[] = [];
  if (latestAnnouncement) {
    items.push({
      label: "Front page",
      text: `${trimText(latestAnnouncement.title, 80)} · ${relativeTime(latestAnnouncement.createdAt)}`,
      href: "/announcements",
    });
  }
  if (topIdea && topIdea.votes > 0) {
    items.push({
      label: "Idea board",
      text: `${topIdea.votes} vote${topIdea.votes !== 1 ? "s" : ""} on “${trimText(topIdea.body, 70)}”`,
      href: "/suggestions",
    });
  }
  if (nextEvent) {
    const when = new Date(nextEvent.startsAt).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    items.push({
      label: "On the calendar",
      text: `${trimText(nextEvent.title, 70)} · ${when}`,
      href: "/events",
    });
  }
  if (latestScoop) {
    items.push({
      label: latestScoop.issueLabel || "Scoop",
      text: trimText(latestScoop.title, 90),
      href: "/scoop",
    });
  }
  return items;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Poly SGA — Baltimore Polytechnic Institute",
  description:
    "Student Government Association of Baltimore Polytechnic Institute. Announcements, events, and your voice — all in one place.",
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#f8f8f7",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [grade, session, wireItems] = await Promise.all([
    getGrade(),
    getSession(),
    getWireItems(),
  ]);

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Shell
          grade={grade}
          officerName={session?.name ?? null}
          officerRole={session?.role ?? null}
          wireItems={wireItems}
        >
          {children}
        </Shell>
      </body>
    </html>
  );
}
