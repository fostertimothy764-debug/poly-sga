import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { VALID_CLASS_YEARS } from "@/lib/grade";
import { prisma } from "@/lib/db";

const SESSION_COOKIE = "poly_sga_session";
const SESSION_LIFETIME = "30d";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

// No fallback on purpose: this repo is public, so a hardcoded default secret would let
// anyone forge an admin session (role: "sga_admin") the moment JWT_SECRET is ever unset
// on any deployment. Fail loudly instead of signing tokens with a known-public key.
if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is not set. Set a random 32+ character string in your environment " +
      "(e.g. `openssl rand -base64 32`) — there is no default, by design."
  );
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export type AdminRole = "sga_admin" | "sga_member" | "class" | "club";

export type SessionPayload = {
  adminId: string;
  username: string;
  name: string;
  role: AdminRole;
  isSiteAdmin: boolean;
  isDeveloper: boolean;
  // Epoch ms of the last successful passkey step-up, or null if never elevated this
  // session. Distinct from isDeveloper so a stolen/leaked 30-day session cookie can't
  // carry developer privileges indefinitely — see isDeveloperElevated below.
  developerElevatedAt: number | null;
  classYear: string | null;
  clubId: string | null;
  teamMemberId: string | null;
  sessionVersion: number;
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_LIFETIME)
    .sign(secret);

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Clears the browser's cookie AND bumps the account's sessionVersion server-side, so
 * any other copy of this admin's token (a different browser, a stolen/leaked cookie)
 * stops verifying immediately instead of staying valid until its 30-day expiry.
 */
export async function destroySession(adminId?: string) {
  cookies().delete(SESSION_COOKIE);
  if (adminId) {
    await prisma.admin.update({
      where: { id: adminId },
      data: { sessionVersion: { increment: 1 } },
    }).catch(() => {}); // account may already be deleted — cookie clear above still succeeds
  }
}

/** Bumps sessionVersion without touching the current browser's cookie — used when an
 *  admin's password changes, so every OTHER previously-issued token for that account
 *  is invalidated (the caller then issues a fresh session for the current request). */
export async function revokeOtherSessions(adminId: string) {
  await prisma.admin.update({
    where: { id: adminId },
    data: { sessionVersion: { increment: 1 } },
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const adminId = payload.adminId as string;
    const tokenVersion = (payload.sessionVersion as number) ?? 0;

    // Cross-check against the DB so logout / password-change actually revoke old
    // tokens instead of relying purely on client-side cookie deletion + 30-day expiry.
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { sessionVersion: true },
    });
    if (!admin || admin.sessionVersion !== tokenVersion) return null;

    return {
      adminId,
      username: payload.username as string,
      name: payload.name as string,
      role: (payload.role as AdminRole) || "sga_member",
      isSiteAdmin: (payload.isSiteAdmin as boolean) ?? false,
      isDeveloper: (payload.isDeveloper as boolean) ?? false,
      developerElevatedAt: (payload.developerElevatedAt as number | null) ?? null,
      classYear: (payload.classYear as string | null) ?? null,
      clubId: (payload.clubId as string | null) ?? null,
      teamMemberId: (payload.teamMemberId as string | null) ?? null,
      sessionVersion: tokenVersion,
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
  return isSiteAdmin(s);
}

export function isDeveloper(s: SessionPayload | null) {
  return s?.isDeveloper === true;
}

// Passkey step-up expires from use after 30 minutes, independent of the outer 30-day
// session cookie. Bounds how long a leaked/stolen session cookie carries developer
// privileges without the passkey being re-proven — a plain boolean flag wouldn't.
const DEVELOPER_ELEVATION_WINDOW_MS = 30 * 60 * 1000;

export function isDeveloperElevated(s: SessionPayload | null) {
  return (
    isDeveloper(s) &&
    !!s?.developerElevatedAt &&
    Date.now() - s.developerElevatedAt < DEVELOPER_ELEVATION_WINDOW_MS
  );
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
    return ["all", ...VALID_CLASS_YEARS];
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

/* can this session set a status on a suggestion targeted at (target, clubId)? */
export function canSetSuggestionStatus(
  s: SessionPayload | null,
  target: string,
  clubId: string | null
) {
  if (!s) return false;
  if (s.role === "sga_admin" || s.role === "sga_member") return true;
  if (s.role === "class" && target === s.classYear) return true;
  if (s.role === "club" && target === "club" && clubId === s.clubId) return true;
  return false;
}

export const SUGGESTION_STATUSES = [
  "new",
  "under_review",
  "on_the_agenda",
  "in_progress",
  "done",
  "declined",
  "custom",
] as const;

export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number];
