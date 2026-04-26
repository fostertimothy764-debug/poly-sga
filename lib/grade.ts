import { cookies } from "next/headers";

export const GRADE_COOKIE = "poly_grade";
export const VOTER_COOKIE = "poly_voter";

export type Grade = "27" | "28" | "29" | "30" | "guest";

export const GRADES: { value: Grade; label: string; sub: string }[] = [
  { value: "27", label: "Class of 2027", sub: "Seniors" },
  { value: "28", label: "Class of 2028", sub: "Juniors" },
  { value: "29", label: "Class of 2029", sub: "Sophomores" },
  { value: "30", label: "Class of 2030", sub: "Freshmen" },
  { value: "guest", label: "Just visiting", sub: "Show me everything" },
];

export function getGrade(): Grade | null {
  const v = cookies().get(GRADE_COOKIE)?.value;
  if (!v) return null;
  if (["27", "28", "29", "30", "guest"].includes(v)) return v as Grade;
  return null;
}

export function gradeLabel(g: Grade) {
  if (g === "guest") return "Visiting";
  return `Class of 20${g}`;
}

export function ensureVoterId(): string {
  const store = cookies();
  const existing = store.get(VOTER_COOKIE)?.value;
  if (existing) return existing;
  const id = `v_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  store.set(VOTER_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return id;
}

export function getVoterId(): string | null {
  return cookies().get(VOTER_COOKIE)?.value ?? null;
}
