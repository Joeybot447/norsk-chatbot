'use client';

import React, { useState, useEffect } from 'react';

// ─── Style Constants ────────────────────────────────────────────────────────
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const BLUE = '#2563eb';
const BLUE_DARK = '#1d4ed8';
const BLUE_LIGHT = '#dbeafe';
const DARK = '#0f172a';
const GRAY_50 = '#f8fafc';
const GRAY_100 = '#f1f5f9';
const GRAY_200 = '#e2e8f0';
const GRAY_300 = '#cbd5e1';
const GRAY_400 = '#94a3b8';
const GRAY_500 = '#64748b';
const GRAY_600 = '#475569';
const GRAY_700 = '#334155';
const GRAY_800 = '#1e293b';
const WHITE = '#ffffff';
const GREEN = '#10b981';
const PURPLE = '#7c3aed';
const ORANGE = '#f59e0b';

const SHADOW_SM = '0 1px 2px 0 rgba(0,0,0,0.05)';
const SHADOW = '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)';
const SHADOW_MD = '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)';
const SHADOW_LG = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)';
const SHADOW_XL = '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)';

// ─── Reusable Button Component ──────────────────────────────────────────────
function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  style: extraStyle,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  style?: React.CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);

  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '8px 16px', fontSize: 14 },
    md: { padding: '12px 24px', fontSize: 16 },
    lg: { padding: '16px 32px', fontSize: 18 },
  };

  const base: React.CSSProperties = {
    fontFamily: FONT,
    fontWeight: 600,
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    lineHeight: 1.5,
    ...sizes[size],
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: hovered ? BLUE_DARK : BLUE,
      color: WHITE,
      boxShadow: hovered ? SHADOW_MD : SHADOW_SM,
      transform: hovered ? 'translateY(-1px)' : 'none',
    },
    secondary: {
      background: hovered ? GRAY_100 : WHITE,
      color: DARK,
      border: `1px solid ${GRAY_200}`,
      boxShadow: hovered ? SHADOW_MD : SHADOW_SM,
      transform: hovered ? 'translateY(-1px)' : 'none',
    },
    outline: {
      background: hovered ? 'rgba(37,99,235,0.05)' : 'transparent',
      color: BLUE,
      border: `1.5px solid ${BLUE}`,
    },
  };

  const s = { ...base, ...variants[variant], ...extraStyle };

  const Tag = href ? 'a' : 'button';
  return (
    <Tag
      href={href}
      style={s}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </Tag>
  );
}

// ─── Feature Card ───────────────────────────────────────────────────────────
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: WHITE,
        borderRadius: 16,
        padding: '32px 28px',
        border: `1px solid ${hovered ? BLUE : GRAY_200}`,
        boxShadow: hovered ? SHADOW_LG : SHADOW,
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-4px)' : 'none',
        cursor: 'default',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${BLUE_LIGHT}, ${WHITE})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          marginBottom: 20,
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontFamily: FONT,
          fontSize: 20,
          fontWeight: 700,
          color: DARK,
          margin: '0 0 10px 0',
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: FONT,
          fontSize: 15,
          color: GRAY_600,
          margin: 0,
          lineHeight: 1.65,
        }}
      >
        {description}
      </p>
    </div>
  );
}

// ─── Step Card ──────────────────────────────────────────────────────────────
function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div style={{ textAlign: 'center', flex: '1 1 280px', maxWidth: 360, padding: '0 16px' }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})`,
          color: WHITE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          fontWeight: 800,
          margin: '0 auto 20px',
          fontFamily: FONT,
        }}
      >
        {number}
      </div>
      <h3
        style={{
          fontFamily: FONT,
          fontSize: 22,
          fontWeight: 700,
          color: DARK,
          margin: '0 0 10px 0',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: FONT,
          fontSize: 16,
          color: GRAY_500,
          margin: 0,
          lineHeight: 1.65,
        }}
      >
        {description}
      </p>
    </div>
  );
}

// ─── API Endpoint Badge ─────────────────────────────────────────────────────
function EndpointBadge({
  method,
  path,
  description,
}: {
  method: string;
  path: string;
  description: string;
}) {
  const [hovered, setHovered] = useState(false);
  const methodColors: Record<string, string> = {
    GET: GREEN,
    POST: BLUE,
    PUT: ORANGE,
    DELETE: '#ef4444',
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px 20px',
        background: hovered ? GRAY_50 : WHITE,
        borderRadius: 10,
        border: `1px solid ${GRAY_200}`,
        transition: 'all 0.15s ease',
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontFamily: '"SF Mono", "Fira Code", "Consolas", monospace',
          fontSize: 12,
          fontWeight: 700,
          color: WHITE,
          background: methodColors[method] || GRAY_500,
          padding: '4px 10px',
          borderRadius: 6,
          letterSpacing: 0.5,
          flexShrink: 0,
        }}
      >
        {method}
      </span>
      <code
        style={{
          fontFamily: '"SF Mono", "Fira Code", "Consolas", monospace',
          fontSize: 14,
          color: DARK,
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        {path}
      </code>
      <span
        style={{
          fontSize: 14,
          color: GRAY_500,
          fontFamily: FONT,
          marginLeft: 'auto',
        }}
      >
        {description}
      </span>
    </div>
  );
}

// ─── Nav Link ───────────────────────────────────────────────────────────────
function NavLink({ children, href }: { children: React.ReactNode; href: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: FONT,
        fontSize: 15,
        fontWeight: 500,
        color: hovered ? BLUE : GRAY_700,
        textDecoration: 'none',
        transition: 'color 0.15s ease',
        padding: '6px 12px',
        borderRadius: 6,
        background: hovered ? GRAY_50 : 'transparent',
      }}
    >
      {children}
    </a>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sectionPadding: React.CSSProperties = {
    padding: '100px 24px',
    maxWidth: 1200,
    margin: '0 auto',
  };

  return (
    <div style={{ fontFamily: FONT, color: DARK, background: WHITE, overflowX: 'hidden' as const }}>
      {/* ═══ NAV ═══ */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: scrolled ? 'rgba(255,255,255,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? `1px solid ${GRAY_200}` : '1px solid transparent',
          transition: 'all 0.3s ease',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 24px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <a
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: WHITE,
                fontSize: 18,
                fontWeight: 800,
                fontFamily: FONT,
              }}
            >
              N
            </div>
            <span
              style={{
                fontFamily: FONT,
                fontSize: 20,
                fontWeight: 700,
                color: DARK,
                letterSpacing: -0.5,
              }}
            >
              NorskBot
            </span>
          </a>

          {/* Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <NavLink href="/dashboard">Kontrollpanel</NavLink>
            <NavLink href="#api">API</NavLink>
            <NavLink href="#priser">Priser</NavLink>
            <Button variant="primary" size="sm" href="/auth">
              Logg inn
            </Button>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section
        style={{
          background: `linear-gradient(135deg, ${GRAY_50} 0%, ${BLUE_LIGHT} 50%, ${WHITE} 100%)`,
          paddingTop: 140,
          paddingBottom: 100,
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Decorative gradient orbs */}
        <div
          style={{
            position: 'absolute',
            top: 80,
            left: '10%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 200,
            right: '5%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: WHITE,
              border: `1px solid ${GRAY_200}`,
              borderRadius: 100,
              padding: '6px 16px 6px 8px',
              fontSize: 13,
              fontWeight: 500,
              color: GRAY_600,
              marginBottom: 32,
              boxShadow: SHADOW_SM,
            }}
          >
            <span
              style={{
                background: `linear-gradient(135deg, ${GREEN}, #059669)`,
                color: WHITE,
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 100,
                letterSpacing: 0.5,
              }}
            >
              NYHET
            </span>
            Nå med Claude AI &amp; RAG-kunnskapsbase
          </div>

          <h1
            style={{
              fontFamily: FONT,
              fontSize: 56,
              fontWeight: 800,
              color: DARK,
              lineHeight: 1.1,
              margin: '0 0 24px 0',
              letterSpacing: -1.5,
            }}
          >
            AI-chatbot for{' '}
            <span
              style={{
                background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              norske bedrifter
            </span>
          </h1>

          <p
            style={{
              fontFamily: FONT,
              fontSize: 20,
              color: GRAY_500,
              lineHeight: 1.6,
              margin: '0 0 40px 0',
              maxWidth: 600,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Bygg intelligente chatbots med norsk språkstøtte. Integrer kunnskapsbasen din,
            tilpass merkevaren, og gi kundene svar på sekunder — ikke timer.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Button variant="primary" size="lg" href="/auth">
              Kom i gang gratis →
            </Button>
            <Button variant="secondary" size="lg" href="#api">
              Se API-dokumentasjon
            </Button>
          </div>

          {/* Terminal preview */}
          <div
            style={{
              marginTop: 60,
              background: GRAY_800,
              borderRadius: 16,
              padding: 0,
              boxShadow: SHADOW_XL,
              textAlign: 'left',
              overflow: 'hidden',
              maxWidth: 640,
              marginLeft: 'auto',
              marginRight: 'auto',
              border: `1px solid ${GRAY_700}`,
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                background: GRAY_700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: ORANGE }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: GREEN }} />
              <span
                style={{
                  color: GRAY_400,
                  fontSize: 13,
                  fontFamily: '"SF Mono", monospace',
                  marginLeft: 8,
                }}
              >
                terminal
              </span>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <code
                style={{
                  fontFamily: '"SF Mono", "Fira Code", "Consolas", monospace',
                  fontSize: 14,
                  lineHeight: 1.8,
                  color: GRAY_300,
                }}
              >
                <span style={{ color: GRAY_500 }}>$</span>{' '}
                <span style={{ color: GREEN }}>curl</span>{' '}
                <span style={{ color: GRAY_400 }}>-X POST</span> https://api.norskbot.no/v1/chat
                <br />
                <span style={{ color: GRAY_500 }}>{'  '}-H</span>{' '}
                <span style={{ color: ORANGE }}>{'"Authorization: Bearer sk-..."'}</span>
                <br />
                <span style={{ color: GRAY_500 }}>{'  '}-d</span>{' '}
                <span style={{ color: ORANGE }}>
                  {"'{\"message\": \"Hva er returpolicyen?\"}'"}
                </span>
                <br />
                <br />
                <span style={{ color: GRAY_500 }}>{'// '}</span>
                <span style={{ color: GREEN }}>✓ 200 OK</span>
                <span style={{ color: GRAY_500 }}> — 120ms</span>
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF ═══ */}
      <section style={{ background: WHITE, borderBottom: `1px solid ${GRAY_100}` }}>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '40px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 48,
            flexWrap: 'wrap',
          }}
        >
          {[
            { number: '50+', label: 'Norske organisasjoner' },
            { number: '100K+', label: 'Meldinger håndtert' },
            { number: '99.9%', label: 'Oppetid' },
            { number: '<200ms', label: 'Svartid' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center', minWidth: 140 }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: BLUE,
                  fontFamily: FONT,
                  letterSpacing: -0.5,
                }}
              >
                {stat.number}
              </div>
              <div style={{ fontSize: 14, color: GRAY_500, fontFamily: FONT, marginTop: 4 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section style={{ background: GRAY_50 }}>
        <div style={sectionPadding}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p
              style={{
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: 600,
                color: BLUE,
                textTransform: 'uppercase' as const,
                letterSpacing: 1.5,
                margin: '0 0 12px 0',
              }}
            >
              Funksjoner
            </p>
            <h2
              style={{
                fontFamily: FONT,
                fontSize: 40,
                fontWeight: 800,
                color: DARK,
                margin: '0 0 16px 0',
                letterSpacing: -1,
                lineHeight: 1.2,
              }}
            >
              Alt du trenger for intelligent
              <br />
              kundeservice
            </h2>
            <p
              style={{
                fontFamily: FONT,
                fontSize: 18,
                color: GRAY_500,
                margin: 0,
                maxWidth: 560,
                marginLeft: 'auto',
                marginRight: 'auto',
                lineHeight: 1.6,
              }}
            >
              Kraftige verktøy bygget for norske bedrifter som vil automatisere
              kundedialog med AI.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 24,
            }}
          >
            <FeatureCard
              icon="🧠"
              title="Claude AI-motor"
              description="Drevet av Anthropic Claude — verdens sikreste og mest kapable AI-modell. Forstår norsk kontekst og nyanser."
            />
            <FeatureCard
              icon="📚"
              title="RAG Kunnskapsbase"
              description="Last opp dokumenter, PDF-er og nettsider. AI-en svarer basert på din egen kunnskapsbase med kildehenvisninger."
            />
            <FeatureCard
              icon="🏢"
              title="Flertenant-arkitektur"
              description="Administrer flere chatbots fra ett kontrollpanel. Perfekt for byråer og bedrifter med flere merkevarer."
            />
            <FeatureCard
              icon="⚡"
              title="Sanntidschat"
              description="Lynrask responstid under 200ms. Streaming-svar gir en naturlig samtaleopplevelse for brukerne."
            />
            <FeatureCard
              icon="🔒"
              title="Sikkerhet & GDPR"
              description="Data lagres i Norge. Fullstendig GDPR-kompatibel med kryptering, tilgangskontroll og dataminimering."
            />
            <FeatureCard
              icon="🚀"
              title="Produksjonsklar"
              description="Enterprise-grade infrastruktur med 99.9% oppetid, automatisk skalering, og profesjonell support."
            />
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section style={{ background: WHITE }}>
        <div style={sectionPadding}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p
              style={{
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: 600,
                color: BLUE,
                textTransform: 'uppercase' as const,
                letterSpacing: 1.5,
                margin: '0 0 12px 0',
              }}
            >
              Slik fungerer det
            </p>
            <h2
              style={{
                fontFamily: FONT,
                fontSize: 40,
                fontWeight: 800,
                color: DARK,
                margin: 0,
                letterSpacing: -1,
                lineHeight: 1.2,
              }}
            >
              I gang på minutter, ikke uker
            </h2>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 48,
              flexWrap: 'wrap',
            }}
          >
            <StepCard
              number={1}
              title="Opprett konto"
              description="Registrer deg gratis og sett opp din første chatbot med egendefinert navn, farger og velkomstmelding."
            />
            <StepCard
              number={2}
              title="Last opp kunnskap"
              description="Last opp dokumenter, FAQ-er og nettsider. AI-en indekserer innholdet og lærer å svare på dine kunders spørsmål."
            />
            <StepCard
              number={3}
              title="Integrer og lanser"
              description="Legg til én linje JavaScript på nettsiden din, eller bruk REST-API-et for full kontroll. Klar på sekunder."
            />
          </div>
        </div>
      </section>

      {/* ═══ API SECTION ═══ */}
      <section id="api" style={{ background: GRAY_50 }}>
        <div style={sectionPadding}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: 64,
              alignItems: 'center',
            }}
          >
            {/* Left: text */}
            <div>
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 600,
                  color: BLUE,
                  textTransform: 'uppercase' as const,
                  letterSpacing: 1.5,
                  margin: '0 0 12px 0',
                }}
              >
                Utvikler-API
              </p>
              <h2
                style={{
                  fontFamily: FONT,
                  fontSize: 36,
                  fontWeight: 800,
                  color: DARK,
                  margin: '0 0 16px 0',
                  letterSpacing: -0.5,
                  lineHeight: 1.2,
                }}
              >
                Bygget for utviklere
              </h2>
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: 17,
                  color: GRAY_500,
                  margin: '0 0 32px 0',
                  lineHeight: 1.65,
                }}
              >
                Enkelt REST-API med full dokumentasjon. Integrer chatbot-funksjonalitet
                direkte i dine eksisterende systemer med få linjer kode.
              </p>
              <Button variant="primary" href="/dashboard">
                Utforsk API-dokumentasjonen →
              </Button>
            </div>

            {/* Right: endpoints */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <EndpointBadge
                method="POST"
                path="/api/chat"
                description="Send melding til chatbot"
              />
              <EndpointBadge
                method="POST"
                path="/api/ingest"
                description="Last opp dokumenter"
              />
              <EndpointBadge
                method="GET"
                path="/api/health"
                description="Sjekk systemstatus"
              />
              <EndpointBadge
                method="POST"
                path="/api/auth/login"
                description="Autentisering"
              />
              <EndpointBadge
                method="GET"
                path="/api/widget/:id"
                description="Hent widget-konfig"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRICING / CTA ═══ */}
      <section
        id="priser"
        style={{
          background: `linear-gradient(135deg, ${DARK} 0%, ${GRAY_800} 100%)`,
        }}
      >
        <div
          style={{
            ...sectionPadding,
            padding: '100px 24px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: FONT,
              fontSize: 14,
              fontWeight: 600,
              color: BLUE,
              textTransform: 'uppercase' as const,
              letterSpacing: 1.5,
              margin: '0 0 12px 0',
            }}
          >
            Kom i gang
          </p>
          <h2
            style={{
              fontFamily: FONT,
              fontSize: 44,
              fontWeight: 800,
              color: WHITE,
              margin: '0 0 20px 0',
              letterSpacing: -1,
              lineHeight: 1.2,
            }}
          >
            Klar til å transformere
            <br />
            kundeservicen din?
          </h2>
          <p
            style={{
              fontFamily: FONT,
              fontSize: 18,
              color: GRAY_400,
              margin: '0 0 48px 0',
              maxWidth: 520,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.6,
            }}
          >
            Start gratis i dag. Ingen kredittkort kreves. Oppgrader når du er klar
            til å skalere.
          </p>

          {/* Pricing cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 24,
              maxWidth: 900,
              margin: '0 auto 48px',
            }}
          >
            {/* Free */}
            <div
              style={{
                background: GRAY_800,
                border: `1px solid ${GRAY_700}`,
                borderRadius: 16,
                padding: '36px 28px',
                textAlign: 'left',
              }}
            >
              <p style={{ fontFamily: FONT, fontSize: 14, color: GRAY_400, margin: '0 0 8px 0', fontWeight: 500 }}>
                Gratis
              </p>
              <p style={{ fontFamily: FONT, fontSize: 40, fontWeight: 800, color: WHITE, margin: '0 0 4px 0' }}>
                0 kr
                <span style={{ fontSize: 16, fontWeight: 400, color: GRAY_500 }}> /mnd</span>
              </p>
              <p style={{ fontFamily: FONT, fontSize: 14, color: GRAY_500, margin: '0 0 24px 0' }}>
                Perfekt for testing
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {['1 chatbot', '100 meldinger/mnd', 'Grunnleggende kunnskapsbase', 'Community-support'].map(
                  (f) => (
                    <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ color: GREEN, fontSize: 16 }}>✓</span>
                      <span style={{ fontFamily: FONT, fontSize: 14, color: GRAY_300 }}>{f}</span>
                    </div>
                  )
                )}
              </div>
              <Button variant="outline" style={{ width: '100%' }} href="/auth">
                Start gratis
              </Button>
            </div>

            {/* Pro */}
            <div
              style={{
                background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`,
                borderRadius: 16,
                padding: '36px 28px',
                textAlign: 'left',
                position: 'relative',
                border: `1px solid rgba(255,255,255,0.2)`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: WHITE,
                  color: BLUE,
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '4px 14px',
                  borderRadius: 100,
                  fontFamily: FONT,
                  letterSpacing: 0.5,
                }}
              >
                POPULÆR
              </div>
              <p style={{ fontFamily: FONT, fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: '0 0 8px 0', fontWeight: 500 }}>
                Pro
              </p>
              <p style={{ fontFamily: FONT, fontSize: 40, fontWeight: 800, color: WHITE, margin: '0 0 4px 0' }}>
                990 kr
                <span style={{ fontSize: 16, fontWeight: 400, color: 'rgba(255,255,255,0.6)' }}> /mnd</span>
              </p>
              <p style={{ fontFamily: FONT, fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 0 24px 0' }}>
                For voksende bedrifter
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {[
                  '5 chatbots',
                  '10 000 meldinger/mnd',
                  'Avansert RAG-kunnskapsbase',
                  'Widget-tilpasning',
                  'Prioritert support',
                ].map((f) => (
                  <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: WHITE, fontSize: 16 }}>✓</span>
                    <span style={{ fontFamily: FONT, fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>{f}</span>
                  </div>
                ))}
              </div>
              <Button
                variant="secondary"
                style={{ width: '100%', background: WHITE, color: BLUE, fontWeight: 700 }}
                href="/auth"
              >
                Start 14-dagers prøveperiode
              </Button>
            </div>

            {/* Enterprise */}
            <div
              style={{
                background: GRAY_800,
                border: `1px solid ${GRAY_700}`,
                borderRadius: 16,
                padding: '36px 28px',
                textAlign: 'left',
              }}
            >
              <p style={{ fontFamily: FONT, fontSize: 14, color: GRAY_400, margin: '0 0 8px 0', fontWeight: 500 }}>
                Enterprise
              </p>
              <p style={{ fontFamily: FONT, fontSize: 40, fontWeight: 800, color: WHITE, margin: '0 0 4px 0' }}>
                Tilpasset
              </p>
              <p style={{ fontFamily: FONT, fontSize: 14, color: GRAY_500, margin: '0 0 24px 0' }}>
                For store organisasjoner
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {[
                  'Ubegrenset chatbots',
                  'Ubegrenset meldinger',
                  'Dedikert infrastruktur',
                  'SSO & rollestyring',
                  'SLA & dedikert support',
                ].map((f) => (
                  <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: GREEN, fontSize: 16 }}>✓</span>
                    <span style={{ fontFamily: FONT, fontSize: 14, color: GRAY_300 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" style={{ width: '100%' }} href="mailto:hei@norskbot.no">
                Kontakt salg
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ background: DARK, borderTop: `1px solid ${GRAY_800}` }}>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '64px 24px 40px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 48,
              marginBottom: 48,
            }}
          >
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: WHITE,
                    fontSize: 16,
                    fontWeight: 800,
                    fontFamily: FONT,
                  }}
                >
                  N
                </div>
                <span style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: WHITE }}>
                  NorskBot
                </span>
              </div>
              <p style={{ fontFamily: FONT, fontSize: 14, color: GRAY_500, lineHeight: 1.6, margin: 0 }}>
                AI-drevet kundeservice for norske bedrifter. Bygget med sikkerhet og personvern i fokus.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4
                style={{
                  fontFamily: FONT,
                  fontSize: 13,
                  fontWeight: 600,
                  color: GRAY_400,
                  textTransform: 'uppercase' as const,
                  letterSpacing: 1,
                  margin: '0 0 16px 0',
                }}
              >
                Produkt
              </h4>
              {['Funksjoner', 'Priser', 'API-dokumentasjon', 'Integrasjoner', 'Endringslogg'].map(
                (link) => (
                  <a
                    key={link}
                    href="#"
                    style={{
                      display: 'block',
                      fontFamily: FONT,
                      fontSize: 14,
                      color: GRAY_500,
                      textDecoration: 'none',
                      marginBottom: 10,
                      transition: 'color 0.15s',
                    }}
                  >
                    {link}
                  </a>
                )
              )}
            </div>

            {/* Company */}
            <div>
              <h4
                style={{
                  fontFamily: FONT,
                  fontSize: 13,
                  fontWeight: 600,
                  color: GRAY_400,
                  textTransform: 'uppercase' as const,
                  letterSpacing: 1,
                  margin: '0 0 16px 0',
                }}
              >
                Selskap
              </h4>
              {['Om oss', 'Blogg', 'Karriere', 'Kontakt', 'Partnere'].map((link) => (
                <a
                  key={link}
                  href="#"
                  style={{
                    display: 'block',
                    fontFamily: FONT,
                    fontSize: 14,
                    color: GRAY_500,
                    textDecoration: 'none',
                    marginBottom: 10,
                    transition: 'color 0.15s',
                  }}
                >
                  {link}
                </a>
              ))}
            </div>

            {/* Legal */}
            <div>
              <h4
                style={{
                  fontFamily: FONT,
                  fontSize: 13,
                  fontWeight: 600,
                  color: GRAY_400,
                  textTransform: 'uppercase' as const,
                  letterSpacing: 1,
                  margin: '0 0 16px 0',
                }}
              >
                Juridisk
              </h4>
              {['Personvern', 'Vilkår', 'Informasjonskapsler', 'GDPR', 'Sikkerhet'].map(
                (link) => (
                  <a
                    key={link}
                    href="#"
                    style={{
                      display: 'block',
                      fontFamily: FONT,
                      fontSize: 14,
                      color: GRAY_500,
                      textDecoration: 'none',
                      marginBottom: 10,
                      transition: 'color 0.15s',
                    }}
                  >
                    {link}
                  </a>
                )
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              borderTop: `1px solid ${GRAY_800}`,
              paddingTop: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <p style={{ fontFamily: FONT, fontSize: 13, color: GRAY_600, margin: 0 }}>
              © {new Date().getFullYear()} NorskBot AI. Alle rettigheter reservert.
            </p>
            <div style={{ display: 'flex', gap: 20 }}>
              {['GitHub', 'LinkedIn', 'Twitter'].map((s) => (
                <a
                  key={s}
                  href="#"
                  style={{
                    fontFamily: FONT,
                    fontSize: 13,
                    color: GRAY_600,
                    textDecoration: 'none',
                    transition: 'color 0.15s',
                  }}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
