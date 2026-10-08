import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static files, Next.js assets, and API routes are excluded
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for institutional session cookie
  const vidyasutraSession = request.cookies.get("vidyasutra_session")?.value;
  let isAuthenticated = false;
  let userRole = "";

  if (vidyasutraSession) {
    try {
      const sessionUser = JSON.parse(decodeURIComponent(vidyasutraSession));
      if (sessionUser?.id || sessionUser?.email) {
        isAuthenticated = true;
        userRole = (sessionUser?.role || "").trim().toLowerCase();
      }
    } catch {
      isAuthenticated = false;
    }
  }

  // If user is NOT authenticated and trying to access any page other than /login, redirect to /login
  if (!isAuthenticated && pathname !== "/login") {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If user IS authenticated and visits /login, redirect to / (dashboard)
  if (isAuthenticated && pathname === "/login") {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  // Protect all /admin routes: only users with role === 'admin' may enter
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== "admin") {
      // Non-admin attempting direct URL access: redirect to home portal
      const homeUrl = new URL("/", request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  try {
    return createClient(request);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
