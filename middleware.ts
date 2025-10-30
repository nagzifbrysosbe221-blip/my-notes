// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth-edge";

// Wrap the auth middleware so we can guard against missing env
const guarded = auth((req: NextRequest & { auth: Session | null }) => {
  const { pathname } = req.nextUrl;

  if (
    pathname === "/sign-in" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  if (!req.auth) {
    const url = new URL("/sign-in", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", req.nextUrl.href);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export default function middleware(req: NextRequest) {
  // If critical envs are missing, avoid crashing and let request through
  if (!process.env.AUTH_SECRET || !process.env.NEXTAUTH_URL) {
    return NextResponse.next();
  }
  try {
    // Delegate to NextAuth middleware
    return guarded(req as any);
  } catch {
    // Fail-open to avoid 500s from middleware
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next|api/auth|favicon.ico).*)"],
};




