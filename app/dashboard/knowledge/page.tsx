'use client';

import { useState } from 'react';

const fontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState('sources');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: fontStack }}>
      {/* Top Bar */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px 0' }}>Kunnskapsbase</h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
          Administrer kilder og dokumenter som boten skal laere fra
        </p>
      </div>

      {/* Main Content */}
      <main style={{ padding: '24px', flex: 1, overflow: 'auto', maxWidth: '720px' }}>
        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            <button
              onClick={() => setActiveTab('sources')}
              style={{
                paddingBottom: '12px',
                fontWeight: activeTab === 'sources' ? '600' : '400',
                fontSize: '14px',
                borderBottom: activeTab === 'sources' ? '2px solid #2563eb' : '2px solid transparent',
                color: activeTab === 'sources' ? '#2563eb' : '#64748b',
                background: 'none',
                border: 'none',
                borderBottomWidth: '2px',
                borderBottomStyle: 'solid',
                borderBottomColor: activeTab === 'sources' ? '#2563eb' : 'transparent',
                cursor: 'pointer',
                fontFamily: fontStack,
                transition: 'color 0.15s',
              }}
            >
              Kilder
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              style={{
                paddingBottom: '12px',
                fontWeight: activeTab === 'settings' ? '600' : '400',
                fontSize: '14px',
                borderBottom: activeTab === 'settings' ? '2px solid #2563eb' : '2px solid transparent',
                color: activeTab === 'settings' ? '#2563eb' : '#64748b',
                background: 'none',
                border: 'none',
                borderBottomWidth: '2px',
                borderBottomStyle: 'solid',
                borderBottomColor: activeTab === 'settings' ? '#2563eb' : 'transparent',
                cursor: 'pointer',
                fontFamily: fontStack,
                transition: 'color 0.15s',
              }}
            >
              Innstillinger
            </button>
          </div>
        </div>

        {/* Sources Tab */}
        {activeTab === 'sources' && (
          <div>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontWeight: '600', color: '#0f172a', fontSize: '16px', marginBottom: '16px', marginTop: 0 }}>Legg til kilder</h3>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>
                    URL eller filbane
                  </label>
                  <input
                    type="text"
                    placeholder="https://eksempel.no eller /sti/til/fil.pdf"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      backgroundColor: '#f8fafc',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box' as const,
                      fontFamily: fontStack,
                    }}
                  />
                </div>
                <button style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '14px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: fontStack,
                  transition: 'background-color 0.2s',
                }}>
                  Legg til kilde
                </button>
              </div>
            </div>

            <div>
              <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>Aktiverte kilder:</p>
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', textAlign: 'center' as const, color: '#64748b', fontSize: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                Ingen kilder lagt til enna
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontWeight: '600', color: '#0f172a', fontSize: '16px', marginBottom: '16px', marginTop: 0 }}>Innstillinger</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Mer kommer snart...</p>
          </div>
        )}
      </main>
    </div>
  );
}
