// src/lib/auth-edge.ts
import NextAuth from "next-auth";

type MinimalNextAuthResult = {
  auth: (...args: unknown[]) => unknown;
};

const initAuth = NextAuth as unknown as (config: Record<string, unknown>) => MinimalNextAuthResult;

// Keep the middleware auth lightweight: no providers, no Prisma imports
const edgeConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
};

export const { auth } = initAuth(edgeConfig);
