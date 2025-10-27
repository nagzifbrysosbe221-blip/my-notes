// src/app/books/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import NewBook from "./_new-book";

export default async function BooksPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const books = await prisma.book.findMany({
    where: userId ? { ownerId: userId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Books</h1>
        <NewBook />
      </div>

      <ul className="space-y-2">
        {books.map((b) => (
          <li key={b.id} className="rounded-md border p-3">
            <Link href={`/books/${b.id}`} className="font-medium">
              {b.title}
            </Link>
          </li>
        ))}
      </ul>

      {books.length === 0 && (
        <p className="text-sm text-zinc-500">No books yet. Create one above.</p>
      )}
    </div>
  );
}


