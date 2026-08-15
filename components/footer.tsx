"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export type FooterCopy = {
  tagline: string;
  credits: string;
  contactEmail: string;
};

export default function Footer({ copy }: { copy: FooterCopy }) {
  const router = useRouter();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function changeGrade() {
    await fetch("/api/grade", { method: "DELETE" });
    router.push("/welcome");
    router.refresh();
  }

  return (
    <>
      {/* Scroll-to-top button */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-poly-navy text-white shadow-lg hover:bg-poly-navyDark transition-all hover:scale-110 animate-fade-in"
          aria-label="Scroll to top"
        >
          <ArrowUp size={16} />
        </button>
      )}

      <footer className="border-t border-ink-200 mt-24">
        <div className="container-page py-12">
          {/* Top: brand + grouped link columns */}
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] mb-10">
            <div className="space-y-2">
              <p className="font-display text-base">
                Poly <span className="text-poly-orange">SGA</span>
              </p>
              <p className="text-xs text-ink-500 leading-relaxed max-w-xs">
                {copy.tagline}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-ink-500 font-mono">
                Around the site
              </p>
              <div className="flex flex-col gap-2 text-xs text-ink-500">
                <Link href="/announcements" className="hover:text-poly-navy transition-colors">
                  Announcements
                </Link>
                <Link href="/events" className="hover:text-poly-navy transition-colors">
                  Events
                </Link>
                <Link href="/scoop" className="hover:text-poly-navy transition-colors">
                  Scoop
                </Link>
                <Link href="/photos" className="hover:text-poly-navy transition-colors">
                  Photos
                </Link>
                <Link href="/links" className="hover:text-poly-navy transition-colors">
                  Links
                </Link>
                <Link href="/clubs" className="hover:text-poly-navy transition-colors">
                  Clubs
                </Link>
                <Link href="/team" className="hover:text-poly-navy transition-colors">
                  Team
                </Link>
                <Link href="/suggestions" className="hover:text-poly-navy transition-colors">
                  Ideas
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-ink-500 font-mono">
                Transparency
              </p>
              <div className="flex flex-col gap-2 text-xs text-ink-500">
                <Link href="/minutes" className="hover:text-poly-navy transition-colors">
                  Meeting minutes
                </Link>
                <Link href="/initiatives" className="hover:text-poly-navy transition-colors">
                  Initiatives
                </Link>
                <Link href="/budget" className="hover:text-poly-navy transition-colors">
                  Budget
                </Link>
                <Link href="/accountability" className="hover:text-poly-navy transition-colors">
                  Accountability
                </Link>
                <Link href="/voice" className="hover:text-poly-navy transition-colors">
                  Student voice
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-ink-500 font-mono">
                Behind the scenes
              </p>
              <div className="flex flex-col gap-2 text-xs text-ink-500">
                <Link href="/about" className="hover:text-poly-navy transition-colors">
                  Colophon
                </Link>
                <button
                  onClick={changeGrade}
                  className="text-left hover:text-poly-navy transition-colors"
                >
                  Change class
                </button>
                <Link href="/admin/login" className="hover:text-poly-navy transition-colors">
                  Officer login
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom row — credits + last updated */}
          <div className="border-t border-ink-100 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-ink-500">
            <p>
              Developed &amp; maintained by{" "}
              <span className="text-ink-600 font-medium">{copy.credits}</span>
              <span className="mx-2 text-ink-300">·</span>
              Last updated{" "}
              <span className="text-ink-500" suppressHydrationWarning>
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </p>
            <p>
              Issues?{" "}
              <a
                href={`mailto:${copy.contactEmail}`}
                className="text-ink-500 hover:text-poly-navyDark transition-colors underline underline-offset-2"
              >
                {copy.contactEmail}
              </a>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
