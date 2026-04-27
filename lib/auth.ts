import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "poly_sga_session";
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-fallback-please-set-jwt-secret-32chars+"
);

export type AdminRole = "sga_admin" | "sga_member" | "class" | "club";

export type SessionPayload = {
  adminId: string;
  username: string;
  name: string;
  role: AdminRole;
  isSiteAdmin: boolean;
  classYear: string | null;
  clubId: string | null;
  teamMemberId: string | null;
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(secret);

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function destroySession() {
  cookies().delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      adminId: payload.adminId as string,
      username: payload.username as string,
      name: payload.name as string,
      role: (payload.role as AdminRole) || "sga_member",
      isSiteAdmin: (payload.isSiteAdmin as boolean) ?? false,
      classYear: (payload.classYear as string | null) ?? null,
      clubId: (payload.clubId as string | null) ?? null,
      teamMemberId: (payload.teamMemberId as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

/* ---------- permission helpers ---------- */

export function isSgaAdmin(s: SessionPayload | null) {
  return s?.role === "sga_admin";
}

export function isSiteAdmin(s: SessionPayload | null) {
  return s?.isSiteAdmin === true;
}

export function isSga(s: SessionPayload | null) {
  return s?.role === "sga_admin" || s?.role === "sga_member";
}

export function canManageTeam(s: SessionPayload | null) {
  return isSgaAdmin(s);
}

export function canManageClubs(s: SessionPayload | null) {
  return isSgaAdmin(s);
}

export function canManageAdmins(s: SessionPayload | null) {
  return isSgaAdmin(s);
}

export function canRedirectSuggestion(s: SessionPayload | null) {
  return isSgaAdmin(s);
}

export function canEditTeamMember(s: SessionPayload | null, memberId: string) {
  if (!s) return false;
  if (s.role === "sga_admin") return true;
  if (s.role === "sga_member" && s.teamMemberId === memberId) return true;
  return false;
}

export function allowedAudiences(s: SessionPayload): string[] {
  if (s.role === "sga_admin" || s.role === "sga_member") {
    return ["all", "27", "28", "29", "30"];
  }
  if (s.role === "class" && s.classYear) {
    return [s.classYear];
  }
  return [];
}

export function canPostAudience(s: SessionPayload, audience: string) {
  return allowedAudiences(s).includes(audience);
}

export function canPostToClub(s: SessionPayload, clubId: string) {
  if (s.role === "sga_admin" || s.role === "sga_member") return true;
  return s.role === "club" && s.clubId === clubId;
}

export function roleLabel(s: { role: AdminRole; classYear?: string | null; clubId?: string | null }) {
  if (s.role === "sga_admin") return "SGA Admin";
  if (s.role === "sga_member") return "SGA Officer";
  if (s.role === "class") return `Class of 20${s.classYear} Officer`;
  if (s.role === "club") return "Club Officer";
  return "Officer";
}

/* inbox visibility — given a suggestion target/club, can the session see it in their inbox? */
export function canSeeInbox(
  s: SessionPayload,
  target: string,
  clubId: string | null
) {
  // SGA always sees everything
  if (s.role === "sga_admin" || s.role === "sga_member") return true;
  // Class officers see their class targets
  if (s.role === "class" && target === s.classYear) return true;
  // Club officers see club targets matching their club
  if (s.role === "club" && target === "club" && clubId === s.clubId) return true;
  return false;
}
