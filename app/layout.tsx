import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Timeless Series',
    template: '%s — Timeless Series',
  },
  description:
    'A curated gallery of books, films, and TV shows — organized by the human experiences they illuminate.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="bg-bg text-text min-h-screen font-sans">
        <nav className="border-b border-border sticky top-0 z-50 bg-bg/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <Link
                href="/"
                className="font-serif text-lg tracking-wider text-text hover:text-copper transition-colors"
              >
                Timeless Series
              </Link>
              <div className="flex items-center gap-7">
                <Link
                  href="/submit"
                  className="text-[11px] uppercase tracking-widest text-text-muted hover:text-copper transition-colors"
                >
                  Submit
                </Link>
                <Link
                  href="/admin"
                  className="text-[11px] uppercase tracking-widest text-text-muted hover:text-copper transition-colors"
                >
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
