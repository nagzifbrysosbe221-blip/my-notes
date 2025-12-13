import Link from "next/link";
import ActiveLink from "./ActiveLink";

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    exact: true,
    description: "Plan your study sprint",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-indigo-500" aria-hidden>
        <path
          d="M12 5v14M5 12h14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Books",
    href: "/books",
    description: "All subjects & chapters",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-500" aria-hidden>
        <path
          d="M6 4h9a3 3 0 0 1 3 3v10a3 3 0 0 0-3-3H6v-8a2 2 0 0 1 2-2h9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M6 18h11"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function Sidebar() {
  return (
    <aside className="hidden min-w-[260px] flex-col border-r bg-white/80 px-6 py-8 dark:bg-zinc-950/40 md:flex">
      <div className="mb-8 space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-500">My Notes</p>
        <h2 className="text-lg font-semibold">Student Workspace</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Track books, chapters, and your daily focus.
        </p>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <ActiveLink
            key={item.href}
            href={item.href}
            exact={item.exact}
            className="flex items-center gap-3 border border-transparent bg-white/70 text-sm text-slate-600 hover:border-indigo-100 hover:bg-indigo-50/80 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10"
          >
            <span className="rounded-full bg-indigo-50 p-2 dark:bg-indigo-500/10">
              {item.icon}
            </span>
            <span className="flex-1">
              <span className="block font-medium text-slate-900 dark:text-zinc-50">{item.label}</span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">{item.description}</span>
            </span>
          </ActiveLink>
        ))}
      </nav>

      <div className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
          Study summary
        </p>
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-slate-500 dark:text-zinc-400">Cards due</dt>
            <dd className="text-base font-semibold text-slate-900 dark:text-zinc-50">--</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500 dark:text-zinc-400">New notes</dt>
            <dd className="text-base font-semibold text-slate-900 dark:text-zinc-50">--</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500 dark:text-zinc-400">Streak</dt>
            <dd className="text-base font-semibold text-slate-900 dark:text-zinc-50">0 days</dd>
          </div>
        </dl>
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          Stats will appear as you add books, chapters, and practice sessions.
        </p>
      </div>

      <div className="mt-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 p-4 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-white/80">Focus Today</p>
        <h3 className="mt-2 text-lg font-semibold">Warm-up session</h3>
        <p className="text-sm text-white/80">
          Spend 10 minutes reviewing flashcards to keep your streak alive.
        </p>
        <Link
          href="/books"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/30"
        >
          Jump back in &gt;
        </Link>
      </div>

      <div className="mt-6 text-xs text-slate-400">
        <p>v0.1 - local dev build</p>
      </div>
    </aside>
  );
}
