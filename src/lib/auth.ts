import { headers } from "next/headers";
import crypto from "crypto";

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");

  if (bufA.length !== bufB.length) {
    // Timing attack mitigation: compare with dummy buffer
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verify Basic Auth header against environment credentials.
 */
export function verifyBasicAuthHeader(authHeader: string | null | undefined): boolean {
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false;
  }

  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPass) {
    console.error("ADMIN_USERNAME or ADMIN_PASSWORD is not set in environment");
    return false;
  }

  try {
    const base64Credentials = authHeader.split(" ")[1];
    const decoded = Buffer.from(base64Credentials, "base64").toString("utf8");
    const [user, ...passParts] = decoded.split(":");
    const pass = passParts.join(":");

    if (!user || pass === undefined) {
      return false;
    }

    const isUserValid = safeCompare(user, expectedUser);
    const isPassValid = safeCompare(pass, expectedPass);

    return isUserValid && isPassValid;
  } catch {
    return false;
  }
}

/**
 * Verify authorization inside Server Actions or route handlers.
 * Throws an error or returns false if unauthorized.
 */
export async function assertAdminAuthorized(): Promise<void> {
  const reqHeaders = await headers();
  const authHeader = reqHeaders.get("authorization");

  if (!verifyBasicAuthHeader(authHeader)) {
    throw new Error("Unauthorized: Admin credentials required");
  }
}

/**
 * Basic in-memory rate limiter for admin and upload routes.
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  identifier: string,
  limit: number = 30,
  windowSeconds: number = 60
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowSeconds * 1000,
    });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: limit - record.count };
}
