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
      <body className="min-h-dvh bg-slate-50 text-slate-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
        <Providers>
          <div className="relative min-h-dvh overflow-hidden">
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-80">
              <div className="absolute left-1/2 top-[-10%] h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-200 blur-[120px] dark:bg-indigo-500/30" />
              <div className="absolute right-[-10%] bottom-[-10%] h-80 w-80 rounded-full bg-emerald-200 blur-[140px] dark:bg-emerald-500/30" />
              <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.6)_0%,rgba(255,255,255,0.2)_35%,rgba(255,255,255,0)_60%)] dark:bg-[linear-gradient(120deg,rgba(15,15,15,0.8)_0%,rgba(15,15,15,0.4)_40%,transparent_70%)]" />
            </div>
            <div className="grid min-h-dvh grid-cols-1 bg-white/60 shadow-[0_30px_120px_rgb(15_23_42/0.06)] backdrop-blur-xl md:grid-cols-[280px_1fr] dark:bg-zinc-900/70 dark:shadow-[0_20px_80px_rgb(0_0_0/0.4)]">
              <Sidebar />
              <div className="flex min-w-0 flex-col">
                <Topbar />
                <main className="p-6 lg:p-10">{children}</main>
              </div>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
