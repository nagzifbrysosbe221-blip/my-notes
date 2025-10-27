import Link from "next/link";
import { prisma } from "@/lib/prisma";
import NewBook from "./_new-book";

export default async function BooksPage() {
  const books = await prisma.book.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Books</h1>
        <NewBook />
      </div>
      <ul className="space-y-2">
        {books.map((b) => (
          <li key={b.id} className="rounded-md border p-3">
            <Link href={`/books/${b.id}`} className="font-medium">{b.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
