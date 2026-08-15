import { cookies } from "next/headers";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  WebAuthnCredential,
  Uint8Array_,
} from "@simplewebauthn/server";

const CHALLENGE_COOKIE = "poly_webauthn_challenge";
const CHALLENGE_MAX_AGE_SECONDS = 2 * 60;

// Checked lazily inside the handful of developer-only routes that call rpConfig(),
// not at module import time — unlike JWT_SECRET in lib/auth.ts, these only matter
// once a passkey ceremony is actually attempted, so an unset value shouldn't break
// every other page on a deployment that never uses the developer tier.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Passkey (WebAuthn) support requires WEBAUTHN_RP_ID and ` +
        "WEBAUTHN_ORIGIN to be configured — there is no default, by design."
    );
  }
  return value;
}

function rpConfig() {
  return {
    rpName: process.env.WEBAUTHN_RP_NAME || "Poly SGA",
    rpID: requireEnv("WEBAUTHN_RP_ID"),
    origin: requireEnv("WEBAUTHN_ORIGIN"),
  };
}

export async function buildRegistrationOptions(
  admin: { id: string; username: string; name: string },
  existingCredentialIds: string[]
) {
  const { rpName, rpID } = rpConfig();
  return generateRegistrationOptions({
    rpName,
    rpID,
    userName: admin.username,
    userDisplayName: admin.name,
    attestationType: "none",
    excludeCredentials: existingCredentialIds.map((id) => ({ id })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });
}

export async function verifyRegistration(
  response: RegistrationResponseJSON,
  expectedChallenge: string
) {
  const { rpID, origin } = rpConfig();
  return verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });
}

export async function buildAuthenticationOptions(
  credentialIds: string[]
) {
  const { rpID } = rpConfig();
  return generateAuthenticationOptions({
    rpID,
    allowCredentials: credentialIds.map((id) => ({ id })),
    userVerification: "preferred",
  });
}

export async function verifyAuthentication(
  response: AuthenticationResponseJSON,
  expectedChallenge: string,
  credential: WebAuthnCredential
) {
  const { rpID, origin } = rpConfig();
  return verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential,
  });
}

export function encodePublicKey(publicKey: Uint8Array_): string {
  return isoBase64URL.fromBuffer(publicKey);
}

export function decodePublicKey(encoded: string): Uint8Array_ {
  return isoBase64URL.toBuffer(encoded);
}

/** Round-trips the random ceremony challenge through a short-lived httpOnly cookie —
 *  not secret, only single-use and short-lived, so no separate signing is needed
 *  (mirrors how the session cookie is managed in lib/auth.ts). */
export function setChallengeCookie(challenge: string) {
  cookies().set(CHALLENGE_COOKIE, challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CHALLENGE_MAX_AGE_SECONDS,
  });
}

export function getAndClearChallengeCookie(): string | null {
  const value = cookies().get(CHALLENGE_COOKIE)?.value ?? null;
  cookies().delete(CHALLENGE_COOKIE);
  return value;
}
