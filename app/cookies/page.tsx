'use client';

import Link from 'next/link';

export default function CookiesPage() {
  const navStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const logoStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    color: '#0f172a',
    textDecoration: 'none',
  };

  const navLinksStyle: React.CSSProperties = {
    display: 'flex',
    gap: '24px',
  };

  const navLinkStyle: React.CSSProperties = {
    color: '#64748b',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '48px 24px 64px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#334155',
    fontSize: '16px',
    lineHeight: 1.7,
  };

  const h1Style: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '8px',
    lineHeight: 1.3,
  };

  const h2Style: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 600,
    color: '#1e293b',
    marginTop: '40px',
    marginBottom: '16px',
    lineHeight: 1.3,
  };

  const h3Style: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1e293b',
    marginTop: '24px',
    marginBottom: '12px',
  };

  const sectionStyle: React.CSSProperties = {
    paddingBottom: '32px',
    marginBottom: '32px',
    borderBottom: '1px solid #e2e8f0',
  };

  const lastSectionStyle: React.CSSProperties = {
    paddingBottom: '32px',
    marginBottom: '32px',
  };

  const updatedStyle: React.CSSProperties = {
    color: '#94a3b8',
    fontSize: '14px',
    marginBottom: '40px',
  };

  const linkStyle: React.CSSProperties = {
    color: '#2563eb',
    textDecoration: 'underline',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: '16px',
    marginBottom: '16px',
    fontSize: '14px',
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left' as const,
    padding: '12px 16px',
    backgroundColor: '#f8fafc',
    borderBottom: '2px solid #e2e8f0',
    fontWeight: 600,
    color: '#1e293b',
    fontSize: '13px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: '1px solid #e2e8f0',
    verticalAlign: 'top' as const,
    color: '#334155',
  };

  const ulStyle: React.CSSProperties = {
    paddingLeft: '24px',
    marginBottom: '16px',
  };

  const liStyle: React.CSSProperties = {
    marginBottom: '8px',
  };

  const footerStyle: React.CSSProperties = {
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
    padding: '32px 24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const footerInnerStyle: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap' as const,
    gap: '24px',
  };

  const footerColStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  };

  const footerLabelStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '4px',
  };

  const footerLinkStyle: React.CSSProperties = {
    color: '#64748b',
    textDecoration: 'none',
    fontSize: '14px',
  };

  const footerCopyStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#94a3b8',
    marginTop: '24px',
    width: '100%',
    textAlign: 'center' as const,
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <nav style={navStyle}>
        <Link href="/" style={logoStyle}>NorskBot</Link>
        <div style={navLinksStyle}>
          <Link href="/" style={navLinkStyle}>Hjem</Link>
          <Link href="/dashboard" style={navLinkStyle}>Kontrollpanel</Link>
        </div>
      </nav>

      <main style={containerStyle}>
        <h1 style={h1Style}>Retningslinjer for informasjonskapsler</h1>
        <p style={updatedStyle}>Sist oppdatert: 10. mars 2026</p>

        <div style={sectionStyle}>
          <h2 style={h2Style}>1. Hva er informasjonskapsler?</h2>
          <p>
            Informasjonskapsler (cookies) er små tekstfiler som lagres på din enhet (datamaskin,
            nettbrett eller mobiltelefon) når du besøker en nettside. De brukes til å huske
            innstillinger, forbedre brukeropplevelsen og samle informasjon om hvordan nettsiden
            brukes.
          </p>
          <p style={{ marginTop: '12px' }}>
            Informasjonskapsler kan være «førsteparts» (satt av vår nettside) eller «tredjeparts»
            (satt av eksterne tjenester vi bruker). De kan være «sesjonsbaserte» (slettes når du
            lukker nettleseren) eller «vedvarende» (lagres i en bestemt tidsperiode).
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>2. Hvilke informasjonskapsler vi bruker</h2>

          <h3 style={h3Style}>2.1 Nødvendige informasjonskapsler</h3>
          <p>
            Disse informasjonskapslene er essensielle for at nettsiden skal fungere korrekt. De kan
            ikke deaktiveres uten at grunnleggende funksjonalitet påvirkes.
          </p>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Navn</th>
                <th style={thStyle}>Formål</th>
                <th style={thStyle}>Varighet</th>
                <th style={thStyle}>Type</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}>nb_session</td>
                <td style={tdStyle}>Opprettholder brukersesjonen og autentiseringsstatus</td>
                <td style={tdStyle}>Sesjon</td>
                <td style={tdStyle}>Førstepart</td>
              </tr>
              <tr>
                <td style={tdStyle}>nb_csrf</td>
                <td style={tdStyle}>Beskytter mot CSRF-angrep (Cross-Site Request Forgery)</td>
                <td style={tdStyle}>Sesjon</td>
                <td style={tdStyle}>Førstepart</td>
              </tr>
              <tr>
                <td style={tdStyle}>nb_auth</td>
                <td style={tdStyle}>Lagrer autentiseringstoken for innloggede brukere</td>
                <td style={tdStyle}>7 dager</td>
                <td style={tdStyle}>Førstepart</td>
              </tr>
              <tr>
                <td style={tdStyle}>nb_cookie_consent</td>
                <td style={tdStyle}>Lagrer dine valg for informasjonskapsler</td>
                <td style={tdStyle}>12 måneder</td>
                <td style={tdStyle}>Førstepart</td>
              </tr>
            </tbody>
          </table>

          <h3 style={h3Style}>2.2 Funksjonelle informasjonskapsler</h3>
          <p>
            Disse informasjonskapslene gjør det mulig å huske valg du gjør, som språk, region
            og andre preferanser, for å gi deg en bedre brukeropplevelse.
          </p>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Navn</th>
                <th style={thStyle}>Formål</th>
                <th style={thStyle}>Varighet</th>
                <th style={thStyle}>Type</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}>nb_lang</td>
                <td style={tdStyle}>Lagrer foretrukket språkinnstilling</td>
                <td style={tdStyle}>12 måneder</td>
                <td style={tdStyle}>Førstepart</td>
              </tr>
              <tr>
                <td style={tdStyle}>nb_theme</td>
                <td style={tdStyle}>Lagrer foretrukket visningsinnstilling (lyst/mørkt tema)</td>
                <td style={tdStyle}>12 måneder</td>
                <td style={tdStyle}>Førstepart</td>
              </tr>
              <tr>
                <td style={tdStyle}>nb_dashboard_prefs</td>
                <td style={tdStyle}>Lagrer kontrollpanelinnstillinger og filtreringsvalg</td>
                <td style={tdStyle}>6 måneder</td>
                <td style={tdStyle}>Førstepart</td>
              </tr>
            </tbody>
          </table>

          <h3 style={h3Style}>2.3 Analytiske informasjonskapsler</h3>
          <p>
            Disse informasjonskapslene hjelper oss å forstå hvordan besøkende bruker nettsiden,
            slik at vi kan forbedre innhold og funksjonalitet. All data anonymiseres.
          </p>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Navn</th>
                <th style={thStyle}>Formål</th>
                <th style={thStyle}>Varighet</th>
                <th style={thStyle}>Type</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}>nb_analytics</td>
                <td style={tdStyle}>Samler anonymisert bruksstatistikk (sidevisninger, navigasjon)</td>
                <td style={tdStyle}>12 måneder</td>
                <td style={tdStyle}>Førstepart</td>
              </tr>
              <tr>
                <td style={tdStyle}>nb_perf</td>
                <td style={tdStyle}>Måler ytelse og lastetider for å forbedre hastighet</td>
                <td style={tdStyle}>Sesjon</td>
                <td style={tdStyle}>Førstepart</td>
              </tr>
            </tbody>
          </table>

          <h3 style={h3Style}>2.4 Markedsføringsinformasjonskapsler</h3>
          <p>
            Vi bruker for øyeblikket ikke markedsføringsinformasjonskapsler. Dersom dette endres i
            fremtiden, vil vi oppdatere denne siden og innhente ditt samtykke før slike
            informasjonskapsler aktiveres.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>3. Hvordan administrere informasjonskapsler</h2>
          <p>
            Du kan kontrollere og administrere informasjonskapsler gjennom nettleserinnstillingene
            dine. De fleste nettlesere lar deg:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>Se hvilke informasjonskapsler som er lagret og slette dem enkeltvis</li>
            <li style={liStyle}>Blokkere tredjeparts informasjonskapsler</li>
            <li style={liStyle}>Blokkere informasjonskapsler fra bestemte nettsider</li>
            <li style={liStyle}>Blokkere alle informasjonskapsler</li>
            <li style={liStyle}>Slette alle informasjonskapsler når du lukker nettleseren</li>
          </ul>
          <p>
            Vær oppmerksom på at blokkering av nødvendige informasjonskapsler kan påvirke
            funksjonaliteten til nettsiden, og du kan oppleve at enkelte tjenester ikke fungerer
            som forventet.
          </p>
          <p style={{ marginTop: '12px' }}>
            Instruksjoner for de mest brukte nettleserne:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}><strong>Chrome:</strong> Innstillinger → Personvern og sikkerhet → Informasjonskapsler</li>
            <li style={liStyle}><strong>Firefox:</strong> Innstillinger → Personvern og sikkerhet → Informasjonskapsler og nettstedsdata</li>
            <li style={liStyle}><strong>Safari:</strong> Innstillinger → Personvern → Administrer nettstedsdata</li>
            <li style={liStyle}><strong>Edge:</strong> Innstillinger → Informasjonskapsler og nettstedstillatelser</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>4. Samtykke</h2>
          <p>
            Når du besøker vår nettside for første gang, vil du bli bedt om å gi ditt samtykke til
            bruk av ikke-nødvendige informasjonskapsler. Du kan når som helst endre eller trekke
            tilbake ditt samtykke ved å:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>Justere innstillingene i samtykkedialogen (cookie-banneret)</li>
            <li style={liStyle}>Endre nettleserinnstillingene som beskrevet ovenfor</li>
            <li style={liStyle}>Kontakte oss direkte for å be om tilbaketrekking av samtykke</li>
          </ul>
          <p>
            Nødvendige informasjonskapsler krever ikke samtykke, da de er strengt nødvendige for at
            tjenesten skal fungere.
          </p>
        </div>

        <div style={lastSectionStyle}>
          <h2 style={h2Style}>5. Endringer og kontakt</h2>
          <p>
            Vi kan oppdatere denne retningslinjen fra tid til annen for å reflektere endringer i
            vår bruk av informasjonskapsler. Vesentlige endringer vil bli varslet gjennom
            samtykkedialogen.
          </p>
          <p style={{ marginTop: '16px' }}>
            Har du spørsmål om vår bruk av informasjonskapsler, kontakt oss på:{' '}
            <a href="mailto:josef@plagiatkontroll.no" style={linkStyle}>josef@plagiatkontroll.no</a>
          </p>
          <p style={{ marginTop: '12px' }}>
            For mer informasjon om hvordan vi behandler personopplysninger, se vår{' '}
            <Link href="/personvern" style={linkStyle}>personvernerklæring</Link>.
          </p>
        </div>
      </main>

      <footer style={footerStyle}>
        <div style={footerInnerStyle}>
          <div style={footerColStyle}>
            <span style={footerLabelStyle}>NorskBot AI</span>
            <Link href="/" style={footerLinkStyle}>Hjem</Link>
            <Link href="/dashboard" style={footerLinkStyle}>Kontrollpanel</Link>
          </div>
          <div style={footerColStyle}>
            <span style={footerLabelStyle}>Juridisk</span>
            <Link href="/personvern" style={footerLinkStyle}>Personvernerklæring</Link>
            <Link href="/cookies" style={footerLinkStyle}>Informasjonskapsler</Link>
            <Link href="/brukervilkar" style={footerLinkStyle}>Brukervilkår</Link>
          </div>
          <div style={footerColStyle}>
            <span style={footerLabelStyle}>Kontakt</span>
            <a href="mailto:josef@plagiatkontroll.no" style={footerLinkStyle}>josef@plagiatkontroll.no</a>
          </div>
          <p style={footerCopyStyle}>© 2026 NorskBot AI. Alle rettigheter reservert.</p>
        </div>
      </footer>
    </div>
  );
}
