import { prisma } from "@/lib/db";
import { ImageIcon } from "lucide-react";
import PhotoGallery from "./gallery";

export const dynamic = "force-dynamic";
export const metadata = { title: "Photos · Poly SGA" };

export default async function PhotosPage() {
  // Public page — only show photos meant for all students
  const photos = await prisma.photo.findMany({
    where: { audience: "all" },
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
      <header className="mb-12 pb-8 border-b border-ink-200 max-w-2xl">
        <p className="label text-ink-500 mb-3">Gallery</p>
        <h1 className="h-display text-4xl sm:text-5xl mb-4">Photos</h1>
        <p className="text-ink-600 leading-relaxed">
          Moments from SGA events, school activities, and life at Poly.
        </p>
      </header>

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
