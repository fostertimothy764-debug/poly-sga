import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Colophon · Poly SGA",
  description:
    "About this site — who built it, what it runs on, and why.",
};

export default function AboutPage() {
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="container-page py-12 sm:py-20 animate-fade-in">
      <div className="mb-12 pb-4 border-b-[3px] border-double border-ink-300">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
          Colophon
        </p>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight mt-2">
          About this paper
        </h1>
      </div>

      <div className="grid gap-12 lg:gap-16 lg:grid-cols-[2fr_1fr]">
        <article className="space-y-5 max-w-prose text-ink-700 leading-relaxed text-lg">
          <p className="first-letter:font-display first-letter:text-6xl first-letter:font-light first-letter:float-left first-letter:mr-3 first-letter:mt-1.5 first-letter:leading-[0.82] first-letter:text-poly-navy">
            This is the Poly SGA website. It exists for one reason: to make it
            obvious that student government at Baltimore Polytechnic Institute
            is real work done by real people, not a Linktree and a logo.
          </p>
          <p>
            Every announcement is bylined. Every idea on the board is read by
            an officer, voted on by students, and tracked through a public
            status. When something ships, it shows up under &ldquo;Wins&rdquo;
            so the whole student body can see the receipt.
          </p>
          <p>
            The site is built to read like a small-press paper, not a
            dashboard. Fraunces for the headlines, Plus Jakarta Sans for the
            body. Warm-tinted neutrals throughout. One accent color, used
            sparingly. No mascots, no streak gamification, no Title-Cased
            calls to action.
          </p>
          <p>
            If you&apos;re a student and something here is wrong, or you have
            an idea worth putting on the board, the{" "}
            <Link
              href="/suggestions"
              className="text-poly-navy underline underline-offset-2 hover:text-poly-orange transition-colors"
            >
              idea board
            </Link>{" "}
            is the front door. Anonymous. Read every week.
          </p>
        </article>

        <aside className="space-y-8 text-sm text-ink-600">
          <ColophonSection title="Masthead">
            <Row k="Editor">SGA officers, ex officio</Row>
            <Row k="Built &amp; maintained">Timothy Foster</Row>
            <Row k="Issues">
              <Link
                href="/scoop"
                className="text-poly-navy underline underline-offset-2 hover:text-poly-orange transition-colors"
              >
                The SGA Scoop ↗
              </Link>
            </Row>
            <Row k="Since">{today}</Row>
          </ColophonSection>

          <ColophonSection title="Built with">
            <Row k="Framework">Next.js 14 (App Router)</Row>
            <Row k="Database">PostgreSQL on Neon</Row>
            <Row k="ORM">Prisma</Row>
            <Row k="Styles">Tailwind CSS</Row>
            <Row k="Type">Fraunces, Plus Jakarta Sans</Row>
            <Row k="Hosting">Vercel</Row>
          </ColophonSection>

          <ColophonSection title="Errata">
            <p className="leading-relaxed">
              If a link is broken or a name is misspelled, email{" "}
              <a
                href="mailto:tim.d.foster.jr@gmail.com"
                className="text-poly-navy underline underline-offset-2 hover:text-poly-orange transition-colors"
              >
                tim.d.foster.jr@gmail.com
              </a>{" "}
              and we&apos;ll fix it in the next issue.
            </p>
          </ColophonSection>
        </aside>
      </div>

      <div className="mt-16 pt-8 border-t border-ink-200 flex items-baseline justify-between gap-4">
        <p className="font-display italic text-ink-500 text-sm">
          Read this somewhere unexpected? Tell a friend.
        </p>
        <Link
          href="/"
          className="group inline-flex items-center gap-1 text-sm text-poly-navy hover:text-poly-orange transition-colors"
        >
          Back to the front page
          <ArrowRight
            size={14}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </Link>
      </div>
    </div>
  );
}

function ColophonSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="label text-poly-orange mb-3 pb-2 border-b border-ink-200">
        {title}
      </p>
      <dl className="space-y-2">{children}</dl>
    </div>
  );
}

function Row({ k, children }: { k: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 justify-between">
      <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500 shrink-0">
        {k}
      </dt>
      <dd className="text-right text-ink-700">{children}</dd>
    </div>
  );
}
