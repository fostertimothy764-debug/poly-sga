import { cache } from "react";
import { prisma } from "@/lib/db";

/** Cached per-request so footer/layout/colophon can each call this independently
 *  without issuing duplicate queries within the same render. */
export const getSiteSettings = cache(async (): Promise<Record<string, string>> => {
  const rows = await prisma.siteSetting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
});

export function setting(
  settings: Record<string, string>,
  key: string,
  fallback: string
): string {
  const value = settings[key];
  return value && value.trim() ? value : fallback;
}
