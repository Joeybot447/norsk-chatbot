'use client';

import React, { useState, useEffect } from 'react';

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('norskbot-cookie-consent');
    if (!consent) {
      setVisible(true);
      // Trigger animation after mount
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimateIn(true);
        });
      });
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('norskbot-cookie-consent', 'all');
    setAnimateIn(false);
    setTimeout(() => setVisible(false), 300);
  };

  const handleEssentialOnly = () => {
    localStorage.setItem('norskbot-cookie-consent', 'essential');
    setAnimateIn(false);
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        transform: animateIn ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        style={{
          background: '#1e293b',
          borderTop: '1px solid #334155',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          {/* Left: Text */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flex: '1 1 400px',
              minWidth: 0,
            }}
          >
            <p
              style={{
                fontFamily: FONT,
                fontSize: 14,
                color: '#cbd5e1',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Vi bruker informasjonskapsler for å forbedre din opplevelse. Les vår{' '}
              <a
                href="/cookies"
                style={{
                  color: '#60a5fa',
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                }}
              >
                informasjonskapsel-policy
              </a>
              .
            </p>
          </div>

          {/* Right: Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexShrink: 0,
              flexWrap: 'wrap',
            }}
          >
            <a
              href="/cookies"
              style={{
                fontFamily: FONT,
                fontSize: 13,
                color: '#94a3b8',
                textDecoration: 'none',
                padding: '8px 12px',
                transition: 'color 0.15s',
              }}
            >
              Innstillinger
            </a>
            <button
              onClick={handleEssentialOnly}
              style={{
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: 600,
                color: '#e2e8f0',
                background: 'transparent',
                border: '1.5px solid #475569',
                borderRadius: 8,
                padding: '10px 20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              Bare nødvendige
            </button>
            <button
              onClick={handleAcceptAll}
              style={{
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: 600,
                color: '#ffffff',
                background: '#2563eb',
                border: 'none',
                borderRadius: 8,
                padding: '10px 24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(37,99,235,0.4)',
                whiteSpace: 'nowrap',
              }}
            >
              Godta alle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
