// src/lib/auth.ts
import NextAuth from "next-auth";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

/**
 * Validate and normalize incoming credentials
 */
const CredentialsSchema = z.object({
  email: z.string().email().transform((s) => s.toLowerCase().trim()),
});

type NextAuthRouteHandler = (
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) => void | Response | Promise<void | Response>;

const initAuth = NextAuth as unknown as (config: Record<string, unknown>) => {
  handlers: {
    GET?: NextAuthRouteHandler;
    POST?: NextAuthRouteHandler;
  };
  auth: (...args: unknown[]) => unknown;
  signIn: (...args: unknown[]) => Promise<unknown>;
  signOut: (...args: unknown[]) => Promise<unknown>;
};

const authConfig = {
  /**
   * v5 recommends trustHost in dev; make sure NEXTAUTH_URL is set in .env
   */
  trustHost: true,

  /**
   * Use stateless JWT sessions for simplicity
   */
  session: { strategy: "jwt" },

  /**
   * Our custom sign-in page
   */
  pages: {
    signIn: "/sign-in",
  },

  /**
   * IMPORTANT: Auth.js v5 expects AUTH_SECRET.
   * We also fall back to NEXTAUTH_SECRET for compatibility.
   */
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,

  /**
   * Providers (dev-only Credentials flow)
   */
  providers: [
    Credentials({
      name: "Dev Email",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      // creds is Record<string, unknown> | undefined in v5
      authorize: async (creds) => {
        const parsed = CredentialsSchema.safeParse(creds);
        if (!parsed.success) return null;

        const email = parsed.data.email;

        // Find or auto-create a user by email
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: { email, name: email },
          });
        }

        // NextAuth expects a plain object with id/email/name
        return { id: user.id, email: user.email, name: user.name ?? user.email };
      },
    }),
  ],

  /**
   * JWT & Session callbacks: attach user id to token and session
   */
  callbacks: {
    async jwt({ token, user }: { token: JWT & { uid?: string }; user?: { id?: string } | null }) {
      if (user && "id" in user && typeof user.id === "string") {
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT & { uid?: string } }) {
      if (session.user && typeof token.uid === "string") {
        session.user.id = token.uid;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = initAuth(authConfig);

/**
 * Helper that returns a typed Session for server routes/components.
 * Avoids repeating casts wherever auth() is used.
 */
export const getSession = async () => (await auth()) as Session | null;
