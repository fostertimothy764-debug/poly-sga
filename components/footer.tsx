"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function Footer() {
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
        <div className="container-page py-10">
          {/* Top row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            <div className="space-y-1">
              <p className="font-display text-base">
                Poly <span className="text-poly-orange">SGA</span>
              </p>
              <p className="text-xs text-ink-500">
                Baltimore Polytechnic Institute · Student Government Association
              </p>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-500">
              <Link href="/announcements" className="hover:text-poly-navy transition-colors">
                Announcements
              </Link>
              <Link href="/events" className="hover:text-poly-navy transition-colors">
                Events
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
              <Link href="/about" className="hover:text-poly-navy transition-colors">
                Colophon
              </Link>
              <button
                onClick={changeGrade}
                className="hover:text-poly-navy transition-colors"
              >
                Change class
              </button>
              <Link href="/admin/login" className="hover:text-poly-navy transition-colors">
                Officer login
              </Link>
            </div>
          </div>

          {/* Bottom row — credits */}
          <div className="border-t border-ink-100 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-ink-400">
            <p>
              Developed &amp; maintained by{" "}
              <span className="text-ink-600 font-medium">Timothy Foster</span>
            </p>
            <p>
              Issues?{" "}
              <a
                href="mailto:tim.d.foster.jr@gmail.com"
                className="text-ink-500 hover:text-poly-navyDark transition-colors underline underline-offset-2"
              >
                tim.d.foster.jr@gmail.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
