import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

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

function verifyBasicAuthEdge(authHeader: string | null): boolean {
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false;
  }

  try {
    const base64Credentials = authHeader.split(" ")[1];
    const decoded = atob(base64Credentials);
    const [user, ...passParts] = decoded.split(":");
    const pass = passParts.join(":");
    const expectedUser = process.env.ADMIN_USERNAME;
    const expectedPass = process.env.ADMIN_PASSWORD;

    if (!expectedUser || !expectedPass) {
      return false;
    }

    return (
      user !== undefined &&
      pass !== undefined &&
      timingSafeEqualStr(user, expectedUser) &&
      timingSafeEqualStr(pass, expectedPass)
    );
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow login/logout API endpoints without authentication
  if (pathname === "/api/admin/login" || pathname === "/api/admin/logout") {
    return NextResponse.next();
  }

  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  // 2. Check authentication via session cookie or Basic Auth header
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const authHeader = request.headers.get("authorization");

  const isAuthenticated =
    (sessionCookie ? await verifySessionToken(sessionCookie) : false) ||
    verifyBasicAuthEdge(authHeader);

  // 3. Handle login page (/admin/login)
  if (pathname === "/admin/login") {
    if (isAuthenticated) {
      // If already logged in, redirect to admin dashboard
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // 4. Guard admin pages - redirect to login page (no browser pop-up prompt!)
  if (isAdminPage) {
    if (isAuthenticated) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/admin/login", request.url);
    if (pathname !== "/admin") {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 5. Guard admin API routes - return 401 JSON without WWW-Authenticate header
  if (isAdminApi) {
    if (isAuthenticated) {
      return NextResponse.next();
    }
    return NextResponse.json(
      { error: "Unauthorized: Admin session required" },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
