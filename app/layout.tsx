import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import CookieConsent from './components/CookieConsent';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'NorskBot AI — KI-drevet chatbot for norske bedrifter',
  description: 'Embeddbar AI-drevet kundeservice-chatbot med RAG-kunnskapsbase',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no" className={inter.variable}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className={`${inter.className} antialiased selection:bg-blue-100 selection:text-blue-900`}>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
