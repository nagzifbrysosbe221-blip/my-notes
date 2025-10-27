// src/app/page.tsx
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function Dashboard() {
  const session = await auth();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {!session ? (
        <p>
          You are not signed in. Go to{" "}
          <Link className="underline" href="/sign-in">
            /sign-in
          </Link>.
        </p>
      ) : (
        <>
          <p>
            Signed in as <b>{session.user?.email}</b>
          </p>

          <div className="flex gap-3">
            <Link href="/books" className="rounded-md border px-3 py-2">
              Go to Books
            </Link>
            <a href="/api/auth/signout" className="rounded-md border px-3 py-2">
              Sign out (dev)
            </a>
          </div>

          <pre className="rounded-md border p-4 overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}
