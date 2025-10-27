import Providers from "./providers";
import Sidebar from "@/components/nav/Sidebar";
import Topbar from "@/components/nav/Topbar";
import "./globals.css";

export const metadata = {
  title: "my-notes",
  description: "Notes + Flashcards",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <Providers>
          <div className="grid min-h-dvh grid-cols-1 md:grid-cols-[260px_1fr]">
            <Sidebar />
            <div className="flex min-w-0 flex-col">
              <Topbar />
              <main className="p-6">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
