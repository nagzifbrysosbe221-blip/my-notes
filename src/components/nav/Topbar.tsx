"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/books", label: "Books" },
];

export default function Topbar() {
  const router = useRouter();
  const { data } = useSession();
  const email = data?.user?.email ?? "Signed in";
  const displayName = data?.user?.name ?? email;
  const initials = displayName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSearch = (value: string) => {
    if (!value.trim()) return;
    router.push(`/search?q=${encodeURIComponent(value.trim())}`);
  };

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60 sm:px-6">
        <div className="flex w-full flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-400 md:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div className="hidden flex-1 items-center gap-3 md:flex">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 dark:bg-zinc-900/70 dark:text-zinc-300">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                Streak: 0 days
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 dark:bg-zinc-900/70 dark:text-zinc-300">
                Next session ready
              </div>
            </div>
          </div>
          <div className="flex min-w-[220px] flex-1 items-center justify-end gap-3">
            <div className="relative hidden w-full max-w-lg items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-slate-200 dark:bg-zinc-900/80 dark:ring-zinc-800 sm:flex">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="m16.5 16.5 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Search notes, cards, chapters"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch((e.target as HTMLInputElement).value);
                  }
                }}
              />
              <kbd className="hidden rounded border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500 sm:inline-block dark:border-zinc-800 dark:text-zinc-300">
                Ctrl K
              </kbd>
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-400 sm:hidden"
              onClick={() => {
                const value = prompt("Search your workspace") ?? "";
                handleSearch(value);
              }}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="m16.5 16.5 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-3 py-1.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="hidden text-right text-xs sm:block">
                <p className="font-semibold text-slate-700 dark:text-zinc-50">{displayName}</p>
                <p className="text-slate-500 dark:text-zinc-400">Ready to study</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold uppercase text-white">
                {initials || "S"}
              </div>
              <button
                className="hidden rounded-full border border-indigo-100 px-3 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 dark:border-indigo-500/30 dark:text-indigo-300 dark:hover:bg-indigo-500/10 sm:inline-flex"
                onClick={() => signOut({ callbackUrl: "/sign-in" })}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-30">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur" onClick={() => setDrawerOpen(false)} />
          <div className="relative h-full w-72 max-w-[85vw] bg-white p-6 shadow-2xl dark:bg-zinc-950">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-indigo-500">My Notes</p>
                <p className="text-sm text-slate-500 dark:text-zinc-400">Navigate your workspace</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-slate-200 p-2 dark:border-zinc-800"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                  <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <nav className="space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                  onClick={() => setDrawerOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <button
              className="mt-8 w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900"
              onClick={() => signOut({ callbackUrl: "/sign-in" })}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  );
}

