// src/lib/auth-edge.ts
import NextAuth from "next-auth";

// Keep the middleware auth lightweight: no providers, no Prisma imports
const initAuth: any = NextAuth as any;

export const { auth } = initAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
});

