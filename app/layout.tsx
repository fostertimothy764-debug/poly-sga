import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Shell from "@/components/shell";
import { getGrade } from "@/lib/grade";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { WireItem } from "@/components/news-wire";
import { relativeTime } from "@/lib/utils";
import { getSiteSettings, setting } from "@/lib/site-settings";

const COLOR_SETTING_PREFIX = "color.";
// Only a valid token name may follow "color." — guards the generated custom property
// name below.
const SAFE_TOKEN_NAME = /^[a-zA-Z0-9_-]+$/;

// tailwind.config.ts reads every color as rgb(var(--color-x) / alpha), so overrides
// must be "R G B" triplets, not hex — this is also a safety property, not just a
// format requirement: a hex string can only ever decode to three 0-255 numbers, so
// there's no way for a value here to break out of the injected <style> block below,
// even though these are ultimately developer-supplied (passkey-elevated only, but
// still worth not trusting blindly for something concatenated into raw CSS).
function hexToRgbTriplet(hex: string): string | null {
  const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  const full = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function colorOverrideStyle(settings: Record<string, string>): string | null {
  const declarations = Object.entries(settings)
    .filter(([key]) => key.startsWith(COLOR_SETTING_PREFIX))
    .map(([key, value]) => [key.slice(COLOR_SETTING_PREFIX.length), hexToRgbTriplet(value)] as const)
    .filter((pair): pair is [string, string] => SAFE_TOKEN_NAME.test(pair[0]) && pair[1] !== null)
    .map(([token, rgb]) => `--color-${token}: ${rgb};`);
  if (declarations.length === 0) return null;
  return `:root { ${declarations.join(" ")} }`;
}

function trimText(s: string, len = 90) {
  const t = s.trim().replace(/\s+/g, " ");
  if (t.length <= len) return t;
  const slice = t.slice(0, len);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > len * 0.6 ? slice.slice(0, lastSpace) : slice) + "…";
}

async function getWireItems(): Promise<WireItem[]> {
  try {
    return await fetchWireItems();
  } catch {
    // Graceful empty state if the DB is asleep or unreachable.
    return [];
  }
}

async function fetchWireItems(): Promise<WireItem[]> {
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

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Poly SGA: Baltimore Polytechnic Institute",
  description:
    "Student Government Association of Baltimore Polytechnic Institute. Announcements, events, and your voice: all in one place.",
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
  const [grade, session, wireItems, settings] = await Promise.all([
    getGrade(),
    getSession(),
    getWireItems(),
    getSiteSettings(),
  ]);

  const colorOverrides = colorOverrideStyle(settings);

  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${fraunces.variable}`}>
      <head>
        {colorOverrides && <style dangerouslySetInnerHTML={{ __html: colorOverrides }} />}
      </head>
      <body>
        <Shell
          grade={grade}
          officerName={session?.name ?? null}
          officerRole={session?.role ?? null}
          wireItems={wireItems}
          footer={{
            tagline: setting(
              settings,
              "footer.tagline",
              "Baltimore Polytechnic Institute · Student Government Association. Open by default: every meeting, dollar, and decision in the open."
            ),
            credits: setting(settings, "footer.credits", "Timothy Foster"),
            contactEmail: setting(settings, "footer.contactEmail", "tim.d.foster.jr@gmail.com"),
          }}
        >
          {children}
        </Shell>
      </body>
    </html>
  );
}
