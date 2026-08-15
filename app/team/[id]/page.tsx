import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import ContactStrip from "./contact-strip";
import SmartImage from "@/components/smart-image";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const m = await prisma.teamMember.findUnique({ where: { id: params.id } });
  if (!m) return { title: "Officer · Poly SGA" };
  return { title: `${m.name} · Poly SGA` };
}

export default async function OfficerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const member = await prisma.teamMember.findUnique({
    where: { id: params.id },
  });
  if (!member) notFound();

  const initials = member.name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="container-page py-10 sm:py-14 animate-fade-in">
      <div className="flex items-baseline justify-between border-b border-ink-300 pb-3 mb-10 text-[11px] uppercase tracking-[0.18em] text-ink-500">
        <Link
          href="/team"
          className="inline-flex items-center gap-1.5 hover:text-poly-navy transition-colors"
        >
          <ArrowLeft size={12} />
          Back to the team
        </Link>
        <span>Officer profile</span>
      </div>

      <div className="grid gap-10 lg:gap-14 lg:grid-cols-[1fr_1.3fr]">
        {/* Photo */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="relative aspect-[4/5] rounded-2xl bg-ink-100 overflow-hidden border border-ink-200">
            {member.photoUrl ? (
              <SmartImage
                src={member.photoUrl}
                alt={member.name}
                fill
                sizes="(min-width: 1024px) 38vw, 100vw"
                priority
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center font-display text-7xl bg-poly-navy text-white">
                {initials}
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div>
          <p className="label text-ink-500 mb-3">
            {member.role}
            {member.grade && (
              <>
                {" · "}
                <span className="text-ink-500">{member.grade}</span>
              </>
            )}
          </p>
          <h1 className="h-display text-4xl sm:text-5xl leading-[1.05] mb-2">
            {member.name}
          </h1>
          {member.pronouns && (
            <p className="text-sm text-ink-500 mb-6">{member.pronouns}</p>
          )}

          {member.askMeAbout && (
            <p className="font-display text-2xl sm:text-3xl font-light leading-snug text-ink-800 mb-8 max-w-prose">
              &ldquo;Ask me about {member.askMeAbout}.&rdquo;
            </p>
          )}

          {member.bio && (
            <p className="text-base text-ink-700 leading-relaxed whitespace-pre-line max-w-prose mb-8">
              {member.bio}
            </p>
          )}

          <ContactStrip
            schoolEmail={member.schoolEmail}
            instagram={member.instagram}
          />

          {!member.bio && !member.askMeAbout && (
            <div className="border-l-2 border-ink-200 pl-4 py-1 text-sm text-ink-500 italic">
              {member.name.split(" ")[0]} hasn&apos;t filled out a profile yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
