import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "Not found · Poly SGA" };

export default function NotFound() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container-page py-12 sm:py-20 animate-fade-in">
      <div className="flex items-baseline justify-between border-b border-ink-300 pb-3 mb-12 text-[11px] uppercase tracking-[0.18em] text-ink-500">
        <span>The Poly SGA Weekly · Errata</span>
        <span>{today}</span>
      </div>

      <div className="max-w-2xl">
        <p className="label text-poly-orange mb-4">404 — Not found</p>
        <h1 className="h-display text-5xl sm:text-6xl leading-[1.02] mb-6">
          This page isn&apos;t in the paper.
        </h1>
        <p className="text-lg text-ink-700 leading-relaxed mb-8 max-w-prose">
          The link may have moved, the post may have been pulled, or you may
          have typed it from memory. Whichever way, you&apos;re here now.
          Below are some places worth being instead.
        </p>

        <ul className="space-y-3 mb-12 max-w-md">
          <NotFoundLink href="/" label="The front page" />
          <NotFoundLink href="/announcements" label="Announcements" />
          <NotFoundLink href="/events" label="Events" />
          <NotFoundLink href="/suggestions" label="The idea board" />
          <NotFoundLink href="/team" label="Meet the SGA" />
        </ul>

        <p className="text-xs text-ink-500 italic max-w-md leading-relaxed">
          If a link from elsewhere on the site brought you here, that&apos;s a
          bug. Email{" "}
          <a
            href="mailto:tim.d.foster.jr@gmail.com"
            className="text-ink-700 underline underline-offset-2 hover:text-poly-orange transition-colors"
          >
            tim.d.foster.jr@gmail.com
          </a>{" "}
          and we&apos;ll fix it in the next issue.
        </p>
      </div>
    </div>
  );
}

function NotFoundLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-baseline justify-between gap-4 border-b border-ink-200 py-2.5 text-ink-800 hover:text-poly-navy transition-colors"
      >
        <span className="font-display text-xl leading-snug">{label}</span>
        <ArrowRight
          size={16}
          className="text-ink-400 group-hover:text-poly-orange group-hover:translate-x-0.5 transition-all"
        />
      </Link>
    </li>
  );
}
