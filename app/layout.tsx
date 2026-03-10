import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NorskBot - AI Chatbot for Norwegian Businesses',
  description: 'Embeddable AI-powered customer service chatbot with RAG knowledge base',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
