import ActiveLink from "./ActiveLink";

export default function Sidebar() {
  return (
    <aside className="hidden md:block border-r p-4 min-w-[240px]">
      <h2 className="mb-4 text-base font-semibold">My Notes</h2>
      <nav className="flex flex-col gap-1">
        <ActiveLink href="/" exact>Dashboard</ActiveLink>
        <ActiveLink href="/books">Books</ActiveLink>
      </nav>
      <div className="mt-6 text-xs text-zinc-500">
        <p>v0.1 • local dev</p>
      </div>
    </aside>
  );
}

