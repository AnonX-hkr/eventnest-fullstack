import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js Edge Middleware — runs before every matching request.
 *
 * Protected routes: /dashboard, /create-event
 *   → requires a valid access_token cookie (set by AuthContext after login)
 *   → unauthenticated users are redirected to /login?redirect=<path>
 *
 * Auth routes: /login, /signup
 *   → authenticated users are redirected to / (no double-login)
 */

const PROTECTED_PATHS = ["/dashboard", "/create-event", "/tickets", "/scan", "/checkout"];
const AUTH_PATHS = ["/login", "/signup"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;
  const isAuthenticated = Boolean(token);

  // ── Redirect logged-in users away from auth pages ─────────────────────────
  if (isAuthenticated && AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ── Protect private routes ────────────────────────────────────────────────
  if (!isAuthenticated && PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on every route EXCEPT Next.js internals and static files
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
