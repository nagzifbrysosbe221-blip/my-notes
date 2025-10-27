declare module "next-auth" {
  interface Session {
    user?: (import("next-auth").DefaultSession["user"] & { id: string }) | null;
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
  }
}
