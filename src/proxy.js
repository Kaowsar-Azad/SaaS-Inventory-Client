import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  // Protect admin dashboard
  if (pathname.startsWith("/admin/dashboard")) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Protect standard dashboard
  if (pathname.startsWith("/dashboard")) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Redirect authenticated users trying to access auth pages
  if (pathname === "/login" || pathname === "/register" || pathname === "/admin/login") {
    if (sessionCookie) {
      if (pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/dashboard/:path*",
    "/login",
    "/register",
    "/admin/login"
  ],
};
