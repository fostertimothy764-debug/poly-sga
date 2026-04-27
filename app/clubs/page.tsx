import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession, isSgaAdmin } from "@/lib/auth";
import { ArrowRight, Clock, MapPin, Settings } from "lucide-react";
import ClubRequestForm from "./request-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Clubs · Poly SGA",
};

export default async function ClubsPage() {
  const [clubs, session] = await Promise.all([
    prisma.club.findMany({ orderBy: { name: "asc" } }),
    getSession(),
  ]);

  const isAdmin = isSgaAdmin(session);

  return (
    <div className="container-page py-12 sm:py-16 animate-fade-in">
      {/* Decorative header */}
      <div className="relative mb-12">
        <div
          className="absolute -top-6 -right-8 h-64 w-64 rounded-full bg-poly-orange/8 blur-3xl pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute top-10 -left-4 h-32 w-32 rounded-full bg-poly-navy/5 blur-2xl pointer-events-none"
          aria-hidden
        />
        <header className="relative max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-3">
            Get involved
          </p>
          <div className="flex items-end gap-4">
            <h1 className="h-display text-5xl sm:text-6xl">Clubs</h1>
            {isAdmin && (
              <Link
                href="/admin#clubs"
                className="mb-1 flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-600 hover:border-ink-400 hover:text-ink-900 transition-colors"
              >
                <Settings size={11} /> Manage clubs
              </Link>
            )}
          </div>
          <p className="text-ink-600 leading-relaxed mt-4">
            Find your people. There&apos;s a club for every kind of Poly student.
          </p>
        </header>
      </div>

      {clubs.length === 0 ? (
        <div className="card text-center text-sm text-ink-500 py-16">
          No clubs listed yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((c) => (
            <Link
              key={c.id}
              href={`/clubs/${c.slug}`}
              className="card card-hover overflow-hidden p-0 group animate-slide-up flex flex-col"
            >
              {/* Visual header — photo or gradient */}
              <div className="relative h-36 bg-ink-100 overflow-hidden flex-shrink-0">
                {c.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.photoUrl}
                    alt={c.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-ink-800 to-poly-navy" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <span className="font-display text-xl text-white leading-tight">
                    {c.name}
                  </span>
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1">
                <p className="text-sm text-ink-600 line-clamp-2 leading-relaxed mb-4 flex-1">
                  {c.description}
                </p>
                <div className="flex flex-col gap-1.5 text-xs text-ink-500 mb-3">
                  {c.meetingTime && (
                    <span className="flex items-center gap-2">
                      <Clock size={11} className="shrink-0" /> {c.meetingTime}
                    </span>
                  )}
                  {c.location && (
                    <span className="flex items-center gap-2">
                      <MapPin size={11} className="shrink-0" /> {c.location}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-ink-700 group-hover:text-poly-orange transition-colors">
                  Learn more <ArrowRight size={12} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <ClubRequestForm />
    </div>
  );
}
