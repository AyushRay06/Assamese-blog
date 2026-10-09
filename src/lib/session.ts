export const SESSION_COOKIE_NAME = "admin_session";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

function bufToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Generate a signed session token: username.expiresAt.signature
 */
export async function createSessionToken(username: string): Promise<string> {
  const expectedPass = process.env.ADMIN_PASSWORD || "";
  const expectedUser = process.env.ADMIN_USERNAME || "";
  const secret = `${expectedPass}:${expectedUser}`;
  const key = await getHmacKey(secret);
  const enc = new TextEncoder();

  const expiresAt = Date.now() + SESSION_COOKIE_OPTIONS.maxAge * 1000;
  const payload = `${username}.${expiresAt}`;
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const signatureHex = bufToHex(signatureBuffer);

  return `${payload}.${signatureHex}`;
}

/**
 * Verify a signed session token against environment credentials.
 */
export async function verifySessionToken(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [username, expiresAtStr, signatureHex] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt) || expiresAt < Date.now()) {
    return false;
  }

  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPass) {
    return false;
  }

  if (username !== expectedUser) {
    return false;
  }

  const secret = `${expectedPass}:${expectedUser}`;
  const key = await getHmacKey(secret);
  const enc = new TextEncoder();
  const payload = `${username}.${expiresAtStr}`;
  const expectedSigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const expectedSigHex = bufToHex(expectedSigBuffer);

  return constantTimeEqual(signatureHex, expectedSigHex);
}
