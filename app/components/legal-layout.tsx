import Link from 'next/link';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { Separator } from './ui/separator';
import { Button } from './ui/button';

export function LegalLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-[#e2e8f0] bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563eb]">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-[#0f172a]">NorskBot</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-[#64748b] transition-colors hover:text-[#0f172a]"
            >
              Hjem
            </Link>
            <Link
              href="/auth"
              className="text-sm font-medium text-[#64748b] transition-colors hover:text-[#0f172a]"
            >
              Logg inn
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-[#2563eb] transition-colors hover:text-[#1d4ed8]"
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbake til forsiden
        </Link>

        <h1 className="text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-[#64748b]">Sist oppdatert: {lastUpdated}</p>

        <Separator className="my-8 bg-[#e2e8f0]" />

        <div className="prose-norskbot">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e2e8f0] bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 sm:flex-row sm:justify-between">
          <div className="flex gap-6 text-sm text-[#64748b]">
            <Link href="/personvern" className="hover:text-[#0f172a]">
              Personvern
            </Link>
            <Link href="/brukervilkar" className="hover:text-[#0f172a]">
              Brukervilkar
            </Link>
            <Link href="/cookies" className="hover:text-[#0f172a]">
              Informasjonskapsler
            </Link>
          </div>
          <p className="text-sm text-[#64748b]">2026 NorskBot. Alle rettigheter reservert.</p>
        </div>
      </footer>
    </div>
  );
}
