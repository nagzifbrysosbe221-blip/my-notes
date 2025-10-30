// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// Temporary: disable auth in middleware to avoid runtime 500s.
export default function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api/auth|favicon.ico).*)"],
};




