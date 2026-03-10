'use client';

export default function Home() {
  const styles = {
    // Root & Layout
    root: {
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      color: '#1f2937',
      lineHeight: '1.6',
    },

    // Navigation
    nav: {
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #f3f4f6',
      padding: '1rem',
      position: 'sticky' as const,
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    },
    navContainer: {
      maxWidth: '80rem',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.5rem 0',
    },
    navBrand: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    },
    navLogo: {
      width: '2.5rem',
      height: '2.5rem',
      backgroundColor: '#2563eb',
      borderRadius: '0.375rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontWeight: '700',
      fontSize: '1.25rem',
      letterSpacing: '-0.025em',
    },
    navTitle: {
      fontWeight: '700',
      fontSize: '1.25rem',
      color: '#1f2937',
      letterSpacing: '-0.01em',
    },
    navLinks: {
      display: 'flex',
      gap: '2rem',
    },
    navLink: {
      color: '#6b7280',
      textDecoration: 'none',
      fontWeight: '500',
      fontSize: '0.95rem',
      cursor: 'pointer',
      transition: 'color 0.2s',
    },

    // Hero Section
    hero: {
      background: 'linear-gradient(135deg, #dbeafe 0%, #ffffff 60%, #ede9fe 100%)',
      padding: '6rem 1rem',
      '@media (max-width: 768px)': {
        padding: '4rem 1rem',
      },
    },
    heroContainer: {
      maxWidth: '56rem',
      margin: '0 auto',
      textAlign: 'center' as const,
    },
    heroTitle: {
      fontSize: '3.5rem',
      fontWeight: '800',
      color: '#1f2937',
      marginBottom: '1.5rem',
      lineHeight: '1.2',
      letterSpacing: '-0.02em',
      '@media (max-width: 768px)': {
        fontSize: '2.25rem',
      },
    },
    heroSubtitle: {
      fontSize: '1.125rem',
      color: '#6b7280',
      marginBottom: '2.5rem',
      maxWidth: '42rem',
      margin: '0 auto 2.5rem',
      lineHeight: '1.8',
      fontWeight: '400',
    },
    heroButtons: {
      display: 'flex',
      flexDirection: 'row' as const,
      gap: '1rem',
      justifyContent: 'center',
      flexWrap: 'wrap' as const,
    },
    heroButton: {
      padding: '0.875rem 2.25rem',
      borderRadius: '0.5rem',
      fontWeight: '600',
      textDecoration: 'none',
      cursor: 'pointer',
      border: 'none',
      fontSize: '1rem',
      transition: 'all 0.3s',
      display: 'inline-block',
    },
    primaryButton: {
      backgroundColor: '#2563eb',
      color: '#ffffff',
      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
      ':hover': {
        backgroundColor: '#1d4ed8',
        boxShadow: '0 6px 16px rgba(37, 99, 235, 0.25)',
      },
    },
    secondaryButton: {
      backgroundColor: '#ffffff',
      color: '#2563eb',
      border: '2px solid #2563eb',
      ':hover': {
        backgroundColor: '#f0f9ff',
      },
    },

    // Features Section
    featuresSection: {
      padding: '6rem 1rem',
      backgroundColor: '#ffffff',
    },
    featuresContainer: {
      maxWidth: '80rem',
      margin: '0 auto',
    },
    sectionTitle: {
      fontSize: '2.25rem',
      fontWeight: '800',
      textAlign: 'center' as const,
      color: '#1f2937',
      marginBottom: '1rem',
      letterSpacing: '-0.01em',
    },
    sectionSubtitle: {
      textAlign: 'center' as const,
      color: '#6b7280',
      marginBottom: '4rem',
      fontSize: '1.0625rem',
      maxWidth: '48rem',
      margin: '0 auto 4rem',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '2rem',
    },
    card: {
      backgroundColor: '#f9fafb',
      padding: '2rem',
      borderRadius: '0.5rem',
      border: '1px solid #e5e7eb',
      transition: 'all 0.3s',
      ':hover': {
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
        borderColor: '#d1d5db',
        transform: 'translateY(-2px)',
      },
    },
    cardIcon: {
      fontSize: '2.5rem',
      marginBottom: '1rem',
      display: 'block',
    },
    cardTitle: {
      fontSize: '1.125rem',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '0.75rem',
      letterSpacing: '-0.01em',
    },
    cardDesc: {
      color: '#6b7280',
      fontSize: '0.95rem',
      lineHeight: '1.6',
    },

    // API Section
    apiSection: {
      padding: '6rem 1rem',
      backgroundColor: '#f9fafb',
    },
    apiContainer: {
      maxWidth: '56rem',
      margin: '0 auto',
    },
    apiEndpoint: {
      backgroundColor: '#ffffff',
      padding: '1.5rem',
      borderRadius: '0.5rem',
      border: '1px solid #e5e7eb',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem',
      transition: 'all 0.2s',
    },
    methodBadge: {
      padding: '0.5rem 0.75rem',
      borderRadius: '0.25rem',
      fontWeight: '700',
      color: '#ffffff',
      fontSize: '0.75rem',
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      minWidth: '50px',
      textAlign: 'center' as const,
      letterSpacing: '0.05em',
    },
    methodGet: {
      backgroundColor: '#3b82f6',
    },
    methodPost: {
      backgroundColor: '#10b981',
    },
    endpointPath: {
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      color: '#1f2937',
      flex: 1,
      fontSize: '0.95rem',
      fontWeight: '500',
    },
    endpointDesc: {
      color: '#6b7280',
      fontSize: '0.9rem',
      whiteSpace: 'nowrap' as const,
    },

    // Stats Section
    statsSection: {
      padding: '6rem 1rem',
      background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
      color: '#ffffff',
    },
    statsContainer: {
      maxWidth: '80rem',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '2rem',
      textAlign: 'center' as const,
    },
    statNumber: {
      fontSize: '2.5rem',
      fontWeight: '800',
      marginBottom: '0.5rem',
      letterSpacing: '-0.01em',
    },
    statLabel: {
      color: '#dbeafe',
      fontSize: '0.95rem',
      fontWeight: '500',
    },

    // Footer
    footer: {
      backgroundColor: '#111827',
      color: '#9ca3af',
      padding: '3rem 1rem',
      textAlign: 'center' as const,
      borderTop: '1px solid #1f2937',
    },
    footerMain: {
      maxWidth: '80rem',
      margin: '0 auto',
    },
    footerText: {
      fontSize: '0.95rem',
      fontWeight: '500',
      marginBottom: '0.5rem',
    },
    footerSecond: {
      fontSize: '0.85rem',
      color: '#6b7280',
      marginTop: '0.75rem',
    },

    // Responsive helpers
    '@media (max-width: 768px)': {
      navLinks: {
        gap: '1rem',
      },
      heroButtons: {
        flexDirection: 'column' as const,
      },
      sectionTitle: {
        fontSize: '1.875rem',
      },
      grid: {
        gridTemplateColumns: '1fr',
        gap: '1.5rem',
      },
      statsContainer: {
        gridTemplateColumns: 'repeat(2, 1fr)',
      },
    },
  };

  const features = [
    {
      icon: '🤖',
      title: 'Claude Opus 4.6',
      desc: 'Avansert språkmodell med overlegen resonnering og kontekstforståelse for presise svar',
    },
    {
      icon: '📚',
      title: 'RAG-kunnskapsbase',
      desc: 'Hent informasjon fra dine dokumenter og data for kontekstualiserte og relevante svar',
    },
    {
      icon: '🌐',
      title: 'Flertenant-arkitektur',
      desc: 'Administrer flere kundesider og organisasjoner fra ett sentralisert kontrollpanel',
    },
    {
      icon: '⚡',
      title: 'Sanntidschat',
      desc: 'WebSocket-basert kommunikasjon med øyeblikkelig meldingsleveranse og live-respons',
    },
    {
      icon: '🔐',
      title: 'Sikkerhet & Samsvar',
      desc: 'Bedriftsgradssikkerhet med JWT-autentisering, dataisolering og kryptering',
    },
    {
      icon: '🚀',
      title: 'Produksjonsklar',
      desc: 'Selvdriftet på din infrastruktur med automatisk omstart og høy tilgjengelighet',
    },
  ];

  const endpoints = [
    { method: 'GET', path: '/api/health', desc: 'Helsesjekk av systemet' },
    { method: 'POST', path: '/api/auth/register', desc: 'Registrer ny bruker' },
    { method: 'POST', path: '/api/auth/login', desc: 'Brukerautentisering' },
    { method: 'POST', path: '/api/chat', desc: 'Send melding til AI' },
    { method: 'POST', path: '/api/ingest', desc: 'Last opp dokumenter' },
    { method: 'GET', path: '/api/widget/:siteId', desc: 'Widgetkonfigurasjon' },
  ];

  const stats = [
    { num: '6+', label: 'API-ruter' },
    { num: '100%', label: 'Oppetid-garanti' },
    { num: 'Next.js', label: 'Rammeverk' },
    { num: 'WebSocket', label: 'Sanntid' },
  ];

  return (
    <div style={styles.root}>
      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navContainer}>
          <div style={styles.navBrand}>
            <div style={styles.navLogo}>N</div>
            <span style={styles.navTitle}>NorskBot</span>
          </div>
          <div style={styles.navLinks}>
            <a href="/dashboard" style={styles.navLink} onMouseOver={(e) => {
              (e.target as HTMLElement).style.color = '#2563eb';
            }} onMouseOut={(e) => {
              (e.target as HTMLElement).style.color = '#6b7280';
            }}>
              Kontrollpanel
            </a>
            <a href="#features" style={styles.navLink} onMouseOver={(e) => {
              (e.target as HTMLElement).style.color = '#2563eb';
            }} onMouseOut={(e) => {
              (e.target as HTMLElement).style.color = '#6b7280';
            }}>
              Funksjoner
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContainer}>
          <h1 style={styles.heroTitle}>Norsk AI-chatbot for næringsliv</h1>
          <p style={styles.heroSubtitle}>
            Profesjonell flertenant SaaS-plattform drevet av Claude Opus 4.6. Innebygd kunnskapsbase, sanntidschat og produksjonsklar API.
          </p>
          <div style={styles.heroButtons}>
            <a
              href="/dashboard"
              style={{ ...styles.heroButton, ...styles.primaryButton }}
              onMouseOver={(e) => {
                const el = e.target as HTMLElement;
                el.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                const el = e.target as HTMLElement;
                el.style.transform = 'translateY(0)';
              }}
            >
              Gå til kontrollpanel
            </a>
            <a
              href="#features"
              style={{ ...styles.heroButton, ...styles.secondaryButton }}
              onMouseOver={(e) => {
                const el = e.target as HTMLElement;
                el.style.backgroundColor = '#f0f9ff';
              }}
              onMouseOut={(e) => {
                const el = e.target as HTMLElement;
                el.style.backgroundColor = '#ffffff';
              }}
            >
              Utforsk funksjoner
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={styles.featuresSection}>
        <div style={styles.featuresContainer}>
          <h2 style={styles.sectionTitle}>Kraftige funksjoner</h2>
          <p style={styles.sectionSubtitle}>
            Altsom du trenger for å bygge og drifte profesjonelle AI-chatbots i produksjon
          </p>
          <div style={styles.grid}>
            {features.map((feature, i) => (
              <div
                key={i}
                style={styles.card}
                onMouseOver={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.08)';
                  el.style.borderColor = '#d1d5db';
                  el.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.boxShadow = '';
                  el.style.borderColor = '#e5e7eb';
                  el.style.transform = '';
                }}
              >
                <div style={styles.cardIcon}>{feature.icon}</div>
                <h3 style={styles.cardTitle}>{feature.title}</h3>
                <p style={styles.cardDesc}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Section */}
      <section style={styles.apiSection}>
        <div style={styles.apiContainer}>
          <h2 style={styles.sectionTitle}>API-endepunkter</h2>
          <p style={styles.sectionSubtitle}>
            Integrer NorskBot med dine systemer via vår RESTful API
          </p>
          {endpoints.map((endpoint, i) => (
            <div
              key={i}
              style={styles.apiEndpoint}
              onMouseOver={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
              }}
              onMouseOut={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.boxShadow = '';
              }}
            >
              <span
                style={{
                  ...styles.methodBadge,
                  ...(endpoint.method === 'GET' ? styles.methodGet : styles.methodPost),
                }}
              >
                {endpoint.method}
              </span>
              <code style={styles.endpointPath}>{endpoint.path}</code>
              <p style={styles.endpointDesc}>{endpoint.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section style={styles.statsSection}>
        <div style={styles.statsContainer}>
          {stats.map((stat, i) => (
            <div key={i}>
              <div style={styles.statNumber}>{stat.num}</div>
              <div style={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerMain}>
          <p style={styles.footerText}>NorskBot • Bygget med Next.js & Claude Opus 4.6</p>
          <p style={styles.footerSecond}>Åpen kildekode • Selvdriftet • Full kontroll over dataene dine</p>
        </div>
      </footer>
    </div>
  );
}
