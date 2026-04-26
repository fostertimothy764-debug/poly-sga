"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Footer() {
  const router = useRouter();

  async function changeGrade() {
    await fetch("/api/grade", { method: "DELETE" });
    router.push("/welcome");
    router.refresh();
  }

  return (
    <footer className="border-t border-ink-200 mt-24">
      <div className="container-page py-10">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div className="space-y-1">
            <p className="font-display text-base">
              Poly <span className="text-ink-400">SGA</span>
            </p>
            <p className="text-xs text-ink-500">
              Baltimore Polytechnic Institute · Student Government Association
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-500">
            <Link href="/announcements" className="hover:text-ink-900 transition-colors">
              Announcements
            </Link>
            <Link href="/events" className="hover:text-ink-900 transition-colors">
              Events
            </Link>
            <Link href="/clubs" className="hover:text-ink-900 transition-colors">
              Clubs
            </Link>
            <Link href="/team" className="hover:text-ink-900 transition-colors">
              Team
            </Link>
            <Link href="/suggestions" className="hover:text-ink-900 transition-colors">
              Ideas
            </Link>
            <button
              onClick={changeGrade}
              className="hover:text-ink-900 transition-colors"
            >
              Change class
            </button>
            <Link href="/admin/login" className="hover:text-ink-900 transition-colors">
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
              className="text-ink-500 hover:text-poly-orange transition-colors underline underline-offset-2"
            >
              tim.d.foster.jr@gmail.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
