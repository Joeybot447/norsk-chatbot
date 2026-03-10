import type { Metadata } from 'next';
import './globals.css';
import CookieConsent from './components/CookieConsent';

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
    <html lang="no">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
