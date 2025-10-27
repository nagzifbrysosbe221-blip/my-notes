"use client";
import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";

export default function ActiveLink({
  href, children, className = "", exact = false, ...rest
}: LinkProps & { children: React.ReactNode; className?: string; exact?: boolean }) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname?.startsWith(String(href));
  return (
    <Link
      href={href}
      {...rest}
      className={[
        "rounded-md px-3 py-2 transition",
        isActive ? "bg-zinc-100 dark:bg-zinc-800 font-medium" : "hover:bg-zinc-50 dark:hover:bg-zinc-900",
        className,
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

