import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CSSProperties } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function relativeTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

/**
 * Approximate reading time in minutes for a body of text.
 * 220 wpm is the publishing convention for newspapers / longform.
 * Minimum 1 minute so very short posts don't read as "0 min."
 */
export function readingTime(body: string) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min read`;
}

const CLASS_HEX: Record<string, string> = {
  "27": "#E15A1F",
  "28": "#5D6FB8",
  "29": "#C68A1E",
  "30": "#7BB66B",
};

/**
 * Returns a left-border style if the viewer's grade matches the audience.
 * Identity stays in its lane: schoolwide / club / other-class audiences get nothing.
 * Returns undefined (not an empty style) so the caller can spread conditionally.
 */
export function classAccentStyle(
  audience: string,
  viewerGrade: string | null,
): CSSProperties | undefined {
  if (!viewerGrade || viewerGrade === "guest") return undefined;
  if (audience !== viewerGrade) return undefined;
  const color = CLASS_HEX[audience];
  if (!color) return undefined;
  return { borderLeft: `2px solid ${color}`, paddingLeft: "0.875rem" };
}
