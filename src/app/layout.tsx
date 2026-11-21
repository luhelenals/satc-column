import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import StickerOverlay from '../components/StickerOverlay';
import ShareButton from '../components/ShareButton';
import BioBox from '../components/BioBox';
import SpotifyCdWidget from '../components/SpotifyCdWidget';
import GuestbookCanvas from '../components/GuestbookCanvas';

export const metadata: Metadata = {
  title: 'Sex, Tech & The City | Weekly Column',
  description:
    'Weekly dispatches on girly subjects, politics, LGBT life, and tech.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen py-6 px-3 sm:px-6">
        <div className="max-w-6xl mx-auto relative">
          {/* Overlapping Stickers Layer */}
          {/*<StickerOverlay />*/}

          {/* Top 2000s Portal Header */}
          <header className="y2k-window mb-5">
            <div className="bg-gradient-to-r from-[#ff7eb3] via-[#ffb8d9] to-[#ffe6f2] p-5 border-b-2 border-[#c97da3] text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <Link href="/" className="inline-block group">
                  <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#4a1530] drop-shadow-[1px_1px_0px_#ffffff]">
                    The Weekly Column
                  </h1>
                </Link>
                <p className="text-xs font-mono text-[#6b2146] mt-1">
                  ★ broadcast yourself // girly thoughts, politics, lgbt & tech
                </p>
              </div>

              <div className="flex items-center gap-2">
                <ShareButton label="Share Site" />
              </div>
            </div>

            {/* Classic 2000s Tab Navigation Bar */}
            <nav className="bg-[#f7e6ef] px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap gap-1.5">
                <Link href="/" className="y2k-btn">
                  Home
                </Link>
                <Link href="/archive" className="y2k-btn">
                  All Stories
                </Link>
              </div>

              <Link
                href="/admin"
                className="text-[11px] font-mono text-[#8a1c50] hover:underline px-2"
              >
                [admin login]
              </Link>
            </nav>
          </header>

          {/* Layout em 3 Colunas: Esquerda (Bio + Spotify) | Centro (Coluna) | Direita (Paint) */}
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_270px] gap-4 items-start">
            {/* Coluna da Esquerda */}
            <div className="space-y-4">
              <BioBox />
              <SpotifyCdWidget />
            </div>

            {/* Coluna Principal (Centro) */}
            <main className="min-w-0">{children}</main>

            {/* Coluna da Direita */}
            <GuestbookCanvas />
          </div>

          {/* 2000s Footer */}
          <footer className="mt-8 text-center text-[11px] font-mono text-[#7a3556] bg-white/80 border border-[#d68fb0] py-3 px-4">
            established with love &amp; caffeine • best viewed on any screen •{' '}
            <Link href="/archive" className="underline text-[#0033cc]">
              browse story archive
            </Link>
          </footer>
        </div>
      </body>
    </html>
  );
}