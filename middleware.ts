import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("laundry_session")?.value;

  let role: string | null = null;
  if (session) {
    try {
      const decoded = JSON.parse(atob(session));
      role = decoded.role ?? null;
    } catch {
      role = null;
    }
  }

  const isAuthenticated = !!role;

  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(
        new URL(role === "admin" ? "/admin" : "/user", request.url)
      );
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    if (!isAuthenticated)
      return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.redirect(
      new URL(role === "admin" ? "/admin" : "/user", request.url)
    );
  }

  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated)
      return NextResponse.redirect(new URL("/login", request.url));
    if (role !== "admin")
      return NextResponse.redirect(new URL("/user", request.url));
    return NextResponse.next();
  }

  if (pathname.startsWith("/user")) {
    if (!isAuthenticated)
      return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-192.png|icon-512.png|api).*)",
  ],
};
