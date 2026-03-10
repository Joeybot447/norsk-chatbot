'use client';

import { useState } from 'react';
import Link from 'next/link';

const fontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const SidebarNav = ({ currentPage }: { currentPage: string }) => (
  <div style={{ width: '250px', backgroundColor: '#0f172a', color: 'white', minHeight: '100vh', padding: '20px 0', fontFamily: fontStack }}>
    <div style={{ padding: '0 20px', marginBottom: '30px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>NorskBot</h2>
      <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Admin Dashboard</p>
    </div>
    <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {[
        { href: '/dashboard', label: 'Dashboard', icon: '📊' },
        { href: '/dashboard/sites', label: 'Nettsteder', icon: '🌐' },
        { href: '/dashboard/knowledge', label: 'Kunnskapsbase', icon: '📚' },
        { href: '/dashboard/widget', label: 'Widget', icon: '💬' },
        { href: '/dashboard/analytics', label: 'Analyse', icon: '📈' },
        { href: '/dashboard/billing', label: 'Fakturering', icon: '💳' },
        { href: '/dashboard/settings', label: 'Innstillinger', icon: '⚙️' },
      ].map((item) => (
        <Link key={item.href} href={item.href} style={{ textDecoration: 'none', color: 'white' }}>
          <div
            style={{
              padding: '12px 20px',
              backgroundColor: currentPage === item.label ? '#1e293b' : 'transparent',
              cursor: 'pointer',
              borderLeft: currentPage === item.label ? '4px solid #2563eb' : '4px solid transparent',
              fontSize: '14px',
            }}
          >
            <span style={{ marginRight: '10px' }}>{item.icon}</span>
            {item.label}
          </div>
        </Link>
      ))}
    </nav>
  </div>
);

interface Document {
  id: number;
  name: string;
  size: string;
  type: string;
  status: 'Behandler' | 'Klar' | 'Feil';
  uploadedAt: string;
}

export default function UploadKnowledgePage() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [documents, setDocuments] = useState<Document[]>([
    { id: 1, name: 'Produktkatalog_2024.pdf', size: '2.4 MB', type: 'PDF', status: 'Klar', uploadedAt: '2024-03-01' },
    { id: 2, name: 'FAQ_Kundeservice.txt', size: '128 KB', type: 'TXT', status: 'Klar', uploadedAt: '2024-03-02' },
    { id: 3, name: 'Retningslinjer_Retur.docx', size: '890 KB', type: 'DOCX', status: 'Behandler', uploadedAt: '2024-03-05' },
    { id: 4, name: 'Prisliste_Bedrift.pdf', size: '1.1 MB', type: 'PDF', status: 'Feil', uploadedAt: '2024-03-04' },
    { id: 5, name: 'Teknisk_Dokumentasjon.pdf', size: '5.7 MB', type: 'PDF', status: 'Klar', uploadedAt: '2024-02-28' },
  ]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    simulateUpload();
  };

  const simulateUpload = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setDocuments((docs) => [
              { id: Date.now(), name: 'Nytt_Dokument.pdf', size: '1.3 MB', type: 'PDF', status: 'Behandler', uploadedAt: new Date().toISOString().split('T')[0] },
              ...docs,
            ]);
            setUploadProgress(null);
          }, 500);
          return 100;
        }
        return prev + 8;
      });
    }, 120);
  };

  const handleDelete = (id: number) => {
    setDocuments((docs) => docs.filter((d) => d.id !== id));
  };

  const statusStyle = (status: Document['status']) => {
    const map = {
      Klar: { bg: '#d1fae5', color: '#065f46', icon: '✅' },
      Behandler: { bg: '#fef3c7', color: '#92400e', icon: '⏳' },
      Feil: { bg: '#fee2e2', color: '#991b1b', icon: '❌' },
    };
    return map[status];
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: fontStack }}>
      <SidebarNav currentPage="Kunnskapsbase" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Link href="/dashboard/knowledge" style={{ color: '#64748b', textDecoration: 'none', fontSize: '13px' }}>← Tilbake til kunnskapsbase</Link>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '4px 0 0 0' }}>Last opp dokumenter</h1>
          </div>
        </div>

        <main style={{ padding: '24px', flex: 1, overflow: 'auto', maxWidth: '900px' }}>
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={simulateUpload}
            style={{
              backgroundColor: isDragging ? '#eff6ff' : 'white',
              borderRadius: '12px',
              border: isDragging ? '2px dashed #2563eb' : '2px dashed #cbd5e1',
              padding: '48px 32px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📁</div>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: '0 0 8px 0' }}>
              Dra og slipp filer her
            </p>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 16px 0' }}>
              eller klikk for å velge filer
            </p>
            <div style={{ display: 'inline-flex', gap: '8px' }}>
              {['PDF', 'TXT', 'DOCX'].map((fmt) => (
                <span key={fmt} style={{ padding: '4px 12px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '12px', fontWeight: '500', color: '#64748b' }}>
                  {fmt}
                </span>
              ))}
            </div>
          </div>

          {/* Upload Progress */}
          {uploadProgress !== null && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>Laster opp...</span>
                <span style={{ fontSize: '14px', color: '#64748b' }}>{Math.min(uploadProgress, 100)}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(uploadProgress, 100)}%`, height: '100%', backgroundColor: '#2563eb', borderRadius: '4px', transition: 'width 0.15s ease' }} />
              </div>
            </div>
          )}

          {/* Supported Formats Info */}
          <div style={{ backgroundColor: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '20px' }}>ℹ️</span>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af', margin: '0 0 4px 0' }}>Støttede formater</p>
              <p style={{ fontSize: '13px', color: '#1e40af', margin: 0 }}>
                <strong>PDF</strong> — Produktkataloger, manualer, rapporter &nbsp;|&nbsp;
                <strong>TXT</strong> — Vanlige tekstfiler, FAQ-er &nbsp;|&nbsp;
                <strong>DOCX</strong> — Word-dokumenter, retningslinjer
              </p>
              <p style={{ fontSize: '12px', color: '#3b82f6', margin: '6px 0 0 0' }}>Maks filstørrelse: 25 MB per fil</p>
            </div>
          </div>

          {/* Documents List */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>Opplastede dokumenter ({documents.length})</h3>
            </div>

            {documents.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <p style={{ fontSize: '14px' }}>Ingen dokumenter lastet opp ennå</p>
              </div>
            ) : (
              <div>
                {documents.map((doc, i) => {
                  const st = statusStyle(doc.status);
                  return (
                    <div
                      key={doc.id}
                      style={{
                        padding: '16px 20px',
                        borderBottom: i < documents.length - 1 ? '1px solid #f1f5f9' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                          {doc.type === 'PDF' ? '📄' : doc.type === 'TXT' ? '📝' : '📃'}
                        </div>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a', margin: 0 }}>{doc.name}</p>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>{doc.size} · {doc.type} · Lastet opp {doc.uploadedAt}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', backgroundColor: st.bg, color: st.color }}>
                          {st.icon} {doc.status}
                        </span>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          style={{
                            padding: '6px 12px', backgroundColor: 'transparent', color: '#ef4444',
                            border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer',
                            fontSize: '12px', fontFamily: fontStack, transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          Slett
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
