import { NextRequest, NextResponse } from "next/server";

/**
 * Lightweight cookie presence check at the edge.
 * Real validation happens in the page/API server components via `getAdminSession()`.
 * The middleware just bounces obviously-unauthenticated traffic away from /admin.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) return NextResponse.next();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-admin-pathname", pathname);

  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  const cookie = req.cookies.get("pl_admin_session")?.value;
  if (!cookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/admin/:path*"],
};
