import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Guard admin pages and admin API routes
  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin");

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPass) {
    console.error("ADMIN_USERNAME or ADMIN_PASSWORD is not set in environment.");
    return new NextResponse("Server configuration error", { status: 500 });
  }

  if (authHeader && authHeader.startsWith("Basic ")) {
    try {
      const base64Credentials = authHeader.split(" ")[1];
      // Decode base64 in edge-compatible standard
      const decoded = atob(base64Credentials);
      const [user, ...passParts] = decoded.split(":");
      const pass = passParts.join(":");

      if (
        user !== undefined &&
        pass !== undefined &&
        timingSafeEqualStr(user, expectedUser) &&
        timingSafeEqualStr(pass, expectedPass)
      ) {
        return NextResponse.next();
      }
    } catch {
      // Invalid format falls through to 401
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin Area", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
