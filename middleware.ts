import { NextRequest, NextResponse } from "next/server";

/**
 * Lightweight cookie presence check at the edge.
 * Real validation happens in the page/API server components via `getAdminSession()`.
 * The middleware just bounces obviously-unauthenticated traffic away from /admin.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname === "/admin/login") return NextResponse.next();

  const cookie = req.cookies.get("pl_admin_session")?.value;
  if (!cookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
