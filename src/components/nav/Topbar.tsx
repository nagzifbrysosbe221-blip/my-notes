"use client";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export default function Topbar() {
  const router = useRouter();
  const { data } = useSession();
  const email = data?.user?.email ?? "Signed in";

  return (
    <header className="sticky top-0 z-10 border-b bg-white/70 dark:bg-zinc-950/70 backdrop-blur p-3">
      <div className="flex items-center gap-3">
        <button className="md:hidden rounded-md border px-3 py-1.5"
          onClick={() => alert("TODO: mobile sidebar")}>
          Menu
        </button>
        <input
          className="flex-1 rounded-md border px-3 py-1.5"
          placeholder="Search (coming soon)…"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const q = (e.target as HTMLInputElement).value;
              router.push(`/search?q=${encodeURIComponent(q)}`);
            }
          }}
        />
        <span className="hidden sm:block text-sm text-zinc-600 dark:text-zinc-300">{email}</span>
        <button className="rounded-md border px-3 py-1.5" onClick={() => signOut({ callbackUrl: "/sign-in" })}>
          Sign out
        </button>
      </div>
    </header>
  );
}

