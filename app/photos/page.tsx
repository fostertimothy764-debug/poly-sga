import { prisma } from "@/lib/db";
import { ImageIcon } from "lucide-react";
import PhotoGallery from "./gallery";

export const dynamic = "force-dynamic";
export const metadata = { title: "Photos · Poly SGA" };

export default async function PhotosPage() {
  const photos = await prisma.photo.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Group by eventLabel for visual sections
  const labelled = new Map<string, typeof photos>();
  const unlabelled: typeof photos = [];

  for (const p of photos) {
    if (p.eventLabel) {
      const group = labelled.get(p.eventLabel) ?? [];
      group.push(p);
      labelled.set(p.eventLabel, group);
    } else {
      unlabelled.push(p);
    }
  }

  return (
    <div className="container-page py-12 sm:py-16 animate-fade-in">
      {/* Decorative header */}
      <div className="relative mb-12">
        <div className="absolute -top-6 -right-8 h-64 w-64 rounded-full bg-poly-orange/6 blur-3xl pointer-events-none" aria-hidden />
        <div className="absolute top-8 -left-4 h-32 w-32 rounded-full bg-poly-navy/6 blur-2xl pointer-events-none" aria-hidden />
        <header className="relative max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-3">Gallery</p>
          <h1 className="h-display text-5xl sm:text-6xl mb-4">Photos</h1>
          <p className="text-ink-600 leading-relaxed">
            Moments from SGA events, school activities, and life at Poly.
          </p>
        </header>
      </div>

      {photos.length === 0 ? (
        <div className="card text-center py-20 flex flex-col items-center gap-3 text-ink-400">
          <ImageIcon size={36} className="text-ink-300" />
          <p className="text-sm">Photos coming soon — check back after the next event.</p>
        </div>
      ) : (
        <PhotoGallery labelled={Object.fromEntries(labelled)} unlabelled={unlabelled} />
      )}
    </div>
  );
}
