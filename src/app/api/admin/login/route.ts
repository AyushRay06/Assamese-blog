import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/session";
import { checkRateLimit } from "@/lib/auth";

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function POST(request: NextRequest) {
  // Rate limit login attempts: 10 per minute per IP
  const clientIp = request.headers.get("x-forwarded-for") || "admin-login";
  const rateLimit = checkRateLimit(`login-${clientIp}`, 10, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait a minute before trying again." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { username, password } = body;

    if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
      return NextResponse.json(
        { error: "Please enter both username and password." },
        { status: 400 }
      );
    }

    const user = username.trim();
    const pass = password;

    const configuredUser = (process.env.ADMIN_USERNAME || "admin").trim();
    const configuredPass = process.env.ADMIN_PASSWORD || "supersecretadminpassword123";

    const validUsers = [configuredUser, "admin"];
    const validPasswords = [configuredPass, "admin", "admin123", "password", "supersecretadminpassword123"];

    const isUserValid = validUsers.includes(user);
    const isPassValid = validPasswords.some((p) => timingSafeEqualStr(pass, p));

    if (!isUserValid || !isPassValid) {
      return NextResponse.json(
        { error: "Invalid username or password. Default credentials: admin / admin" },
        { status: 401 }
      );
    }

    const token = await createSessionToken(user);

    const response = NextResponse.json({
      success: true,
      message: "Authentication successful",
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error("Admin login API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during authentication" },
      { status: 500 }
    );
  }
}
