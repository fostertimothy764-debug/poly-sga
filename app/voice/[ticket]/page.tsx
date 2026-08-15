import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  received: { label: "Received", tone: "bg-ink-100 text-ink-700 border-ink-200" },
  under_review: {
    label: "Under review",
    tone: "bg-amber-50 text-amber-800 border-amber-200",
  },
  addressed: {
    label: "Addressed",
    tone: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  declined: {
    label: "Declined",
    tone: "bg-rose-50 text-rose-800 border-rose-200",
  },
};

export default async function TicketPage({
  params,
}: {
  params: { ticket: string };
}) {
  const ticket = decodeURIComponent(params.ticket).toUpperCase();
  const item = await prisma.voiceSubmission.findUnique({ where: { ticket } });
  if (!item) notFound();

  const status = STATUS_LABELS[item.status] ?? STATUS_LABELS.received;

  return (
    <div className="container-page py-10 sm:py-14 max-w-2xl">
      <Link
        href="/voice"
        className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-poly-navy mb-6"
      >
        <ArrowLeft size={12} />
        Back to Student voice
      </Link>

      <header className="mb-8 pb-5 border-b border-ink-200">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-500 mb-2">
          Ticket {item.ticket}
        </p>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="h-display text-3xl">Submission status</h1>
          <span
            className={`inline-flex items-center text-[10px] font-medium uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border ${status.tone}`}
          >
            {status.label}
          </span>
        </div>
        <p className="text-xs text-ink-500 mt-2">
          Submitted {relativeTime(item.createdAt)}
          {item.respondedAt && (
            <>
              <span className="mx-2 text-ink-300">·</span>
              Responded {relativeTime(item.respondedAt)}
            </>
          )}
        </p>
      </header>

      <section className="mb-8">
        <p className="text-xs uppercase tracking-[0.14em] text-ink-500 mb-2 font-mono">
          Your submission
        </p>
        <p className="text-base text-ink-900 leading-relaxed whitespace-pre-line">
          {item.body}
        </p>
      </section>

      {(item.responseBody || item.declineReason) && (
        <section
          className={`rounded-2xl border-l-2 pl-5 pr-5 py-5 ${
            item.status === "declined"
              ? "border-rose-400 bg-rose-50/60"
              : "border-poly-navy bg-poly-navy/[0.04]"
          }`}
        >
          <p className="text-xs uppercase tracking-[0.14em] text-ink-500 mb-2 font-mono">
            {item.status === "declined" ? "Decline reason" : "SGA response"}
          </p>
          <p className="text-base text-ink-900 leading-relaxed whitespace-pre-line">
            {item.status === "declined" ? item.declineReason : item.responseBody}
          </p>
          {item.responderName && (
            <p className="mt-3 text-xs text-ink-500">
              From {item.responderName}
            </p>
          )}
        </section>
      )}

      {!item.responseBody && !item.declineReason && (
        <p className="text-sm text-ink-500 italic">
          The SGA hasn&apos;t responded yet. Check back here: the status
          updates the moment they post a reply.
        </p>
      )}
    </div>
  );
}
