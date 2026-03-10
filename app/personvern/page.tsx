'use client';

import Link from 'next/link';
import {
  navStyle, logoStyle, navLinksStyle, navLinkStyle,
  containerStyle, h1Style, h2Style, h3Style,
  sectionStyle, lastSectionStyle, updatedStyle,
  ulStyle, liStyle, linkStyle,
  footerStyle, footerInnerStyle, footerColStyle,
  footerLabelStyle, footerLinkStyle, footerCopyStyle,
} from '../styles/legalPageStyles';

export default function PersonvernPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <nav style={navStyle}>
        <Link href="/" style={logoStyle}>NorskBot</Link>
        <div style={navLinksStyle}>
          <Link href="/" style={navLinkStyle}>Hjem</Link>
          <Link href="/dashboard" style={navLinkStyle}>Kontrollpanel</Link>
          <Link href="/auth" style={navLinkStyle}>Logg inn</Link>
        </div>
      </nav>

      <main style={containerStyle}>
        <h1 style={h1Style}>Personvernerklæring</h1>
        <p style={updatedStyle}>Sist oppdatert: 10. mars 2026</p>

        <div style={sectionStyle}>
          <h2 style={h2Style}>1. Hvem vi er</h2>
          <p>
            NorskBot AI («NorskBot», «vi», «oss» eller «vår») er et norsk teknologiselskap som
            leverer AI-drevne chatbot-løsninger til bedrifter. Vi er behandlingsansvarlig for
            personopplysninger som samles inn gjennom vår plattform og nettside.
          </p>
          <p style={{ marginTop: '12px' }}>
            <strong>Kontaktinformasjon:</strong><br />
            E-post: <a href="mailto:josef@plagiatkontroll.no" style={linkStyle}>josef@plagiatkontroll.no</a>
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>2. Hvilke personopplysninger vi samler inn</h2>
          <p>Vi samler inn følgende kategorier av personopplysninger:</p>

          <h3 style={h3Style}>Kontoinformasjon</h3>
          <ul style={ulStyle}>
            <li style={liStyle}>Navn og kontaktinformasjon (e-postadresse, telefonnummer)</li>
            <li style={liStyle}>Bedriftsinformasjon (firmanavn, organisasjonsnummer, bransje)</li>
            <li style={liStyle}>Påloggingsinformasjon og kontoinnstillinger</li>
          </ul>

          <h3 style={h3Style}>Bruksdata</h3>
          <ul style={ulStyle}>
            <li style={liStyle}>Chatlogger og samtalehistorikk mellom chatboten og sluttbrukere</li>
            <li style={liStyle}>Opplastede dokumenter og kunnskapsbasemateriale</li>
            <li style={liStyle}>Bruksmønstre, funksjonsinteraksjoner og tidsbruk i plattformen</li>
          </ul>

          <h3 style={h3Style}>Tekniske data</h3>
          <ul style={ulStyle}>
            <li style={liStyle}>IP-adresse, nettlesertype og operativsystem</li>
            <li style={liStyle}>Enhetsinformasjon og skjermoppløsning</li>
            <li style={liStyle}>Informasjonskapsler og lignende sporingsteknologier</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>3. Hvorfor vi samler inn personopplysninger</h2>
          <p>Vi behandler personopplysninger for følgende formål:</p>
          <ul style={ulStyle}>
            <li style={liStyle}><strong>Tjenesteleveranse:</strong> For å levere, vedlikeholde og forbedre vår AI chatbot-plattform, inkludert kunnskapsbase og API-tilgang</li>
            <li style={liStyle}><strong>Forbedring av tjenesten:</strong> For å analysere bruksmønstre, feilsøke tekniske problemer og utvikle nye funksjoner</li>
            <li style={liStyle}><strong>Sikkerhet:</strong> For å beskytte plattformen mot misbruk, svindel og uautorisert tilgang</li>
            <li style={liStyle}><strong>Kommunikasjon:</strong> For å sende servicerelaterte meldinger, oppdateringer og svar på henvendelser</li>
            <li style={liStyle}><strong>Juridiske forpliktelser:</strong> For å oppfylle krav i gjeldende lovgivning, inkludert regnskap og skatt</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>4. Rettslig grunnlag for behandlingen</h2>
          <p>
            I henhold til personvernforordningen (GDPR) artikkel 6, behandler vi personopplysninger
            basert på følgende rettslige grunnlag:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}><strong>Samtykke (art. 6 nr. 1 bokstav a):</strong> Når du aktivt samtykker til behandling, for eksempel ved aksept av informasjonskapsler eller påmelding til nyhetsbrev</li>
            <li style={liStyle}><strong>Oppfyllelse av avtale (art. 6 nr. 1 bokstav b):</strong> Når behandlingen er nødvendig for å oppfylle en avtale med deg, herunder levering av våre tjenester</li>
            <li style={liStyle}><strong>Berettiget interesse (art. 6 nr. 1 bokstav f):</strong> Når vi har en legitim interesse i behandlingen, for eksempel for å forbedre tjenesten, forhindre misbruk eller drive markedsføring til eksisterende kunder</li>
            <li style={liStyle}><strong>Rettslig forpliktelse (art. 6 nr. 1 bokstav c):</strong> Når behandlingen er påkrevd etter norsk lov eller EU/EØS-regelverk</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>5. Deling av personopplysninger</h2>
          <p>
            Vi selger aldri personopplysninger til tredjeparter. Vi kan dele opplysninger med
            følgende kategorier av mottakere, under strenge databehandleravtaler:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}><strong>AI-modell-leverandører:</strong> Chatmeldinger sendes til Anthropic (Claude) for å generere svar. Data behandles i henhold til Anthropics databehandleravtale og slettes etter behandling</li>
            <li style={liStyle}><strong>Hosting- og infrastrukturleverandører:</strong> Våre servere og databaser hostes hos pålitelige skyleverandører innenfor EØS eller med tilstrekkelig beskyttelsesnivå</li>
            <li style={liStyle}><strong>Analyseverktøy:</strong> Vi bruker anonymiserte analyser for å forstå bruksmønstre og forbedre tjenesten</li>
            <li style={liStyle}><strong>Myndigheter:</strong> Når vi er rettslig forpliktet til å utlevere opplysninger</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>6. Lagring og sletting</h2>
          <p>
            Vi lagrer personopplysninger kun så lenge det er nødvendig for formålet de ble samlet
            inn for, eller så lenge vi er pålagt ved lov.
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}><strong>Kontoinformasjon:</strong> Lagres så lenge du har en aktiv konto, og i inntil 12 måneder etter kontosletting</li>
            <li style={liStyle}><strong>Chatlogger:</strong> Lagres i henhold til kundens valgte oppbevaringsperiode, standard 12 måneder</li>
            <li style={liStyle}><strong>Bruksdata og logger:</strong> Lagres i inntil 24 måneder</li>
            <li style={liStyle}><strong>Regnskapsdata:</strong> Lagres i 5 år i henhold til bokføringsloven</li>
          </ul>
          <p style={{ marginTop: '12px' }}>
            Når lagringsperioden utløper, slettes eller anonymiseres opplysningene. Du kan når som
            helst be om sletting av dine opplysninger ved å kontakte oss.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>7. Dine rettigheter</h2>
          <p>
            I henhold til GDPR har du følgende rettigheter knyttet til dine personopplysninger:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}><strong>Rett til innsyn:</strong> Du kan be om en kopi av alle personopplysninger vi har registrert om deg</li>
            <li style={liStyle}><strong>Rett til retting:</strong> Du kan be om at uriktige eller ufullstendige opplysninger korrigeres</li>
            <li style={liStyle}><strong>Rett til sletting:</strong> Du kan be om at dine personopplysninger slettes, med mindre vi har lovpålagt plikt til å beholde dem</li>
            <li style={liStyle}><strong>Rett til begrensning:</strong> Du kan be om at behandlingen av dine opplysninger begrenses i visse situasjoner</li>
            <li style={liStyle}><strong>Rett til dataportabilitet:</strong> Du kan be om å motta dine opplysninger i et strukturert, maskinlesbart format</li>
            <li style={liStyle}><strong>Rett til å protestere:</strong> Du kan protestere mot behandling basert på berettiget interesse</li>
            <li style={liStyle}><strong>Rett til å trekke tilbake samtykke:</strong> Dersom behandlingen er basert på samtykke, kan du når som helst trekke dette tilbake</li>
          </ul>
          <p style={{ marginTop: '12px' }}>
            For å utøve dine rettigheter, kontakt oss på{' '}
            <a href="mailto:josef@plagiatkontroll.no" style={linkStyle}>josef@plagiatkontroll.no</a>.
            Vi vil besvare henvendelsen din innen 30 dager.
          </p>
          <p style={{ marginTop: '12px' }}>
            Dersom du mener at vår behandling av personopplysninger ikke er i samsvar med
            gjeldende regelverk, har du rett til å klage til{' '}
            <strong>Datatilsynet</strong> (
            <a href="https://www.datatilsynet.no" style={linkStyle} target="_blank" rel="noopener noreferrer">
              www.datatilsynet.no
            </a>
            ).
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>8. Informasjonskapsler</h2>
          <p>
            Vi bruker informasjonskapsler (cookies) og lignende teknologier på vår nettside. For
            detaljert informasjon om hvilke informasjonskapsler vi bruker og hvordan du kan
            administrere dem, se vår{' '}
            <Link href="/cookies" style={linkStyle}>retningslinje for informasjonskapsler</Link>.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>9. Sikkerhet</h2>
          <p>
            Vi tar sikkerheten til dine personopplysninger på alvor og har implementert tekniske
            og organisatoriske tiltak for å beskytte dem mot uautorisert tilgang, endring,
            utlevering eller sletting. Dette inkluderer kryptering av data under overføring og
            lagring, tilgangskontroll, regelmessige sikkerhetsgjennomganger og opplæring av ansatte.
          </p>
        </div>

        <div style={lastSectionStyle}>
          <h2 style={h2Style}>10. Endringer i personvernerklæringen</h2>
          <p>
            Vi kan oppdatere denne personvernerklæringen fra tid til annen. Vesentlige endringer
            vil bli varslet via e-post eller gjennom en melding i plattformen. Vi anbefaler at du
            gjennomgår denne erklæringen jevnlig. Den gjeldende versjonen vil alltid være
            tilgjengelig på denne siden.
          </p>
          <p style={{ marginTop: '16px' }}>
            <strong>Kontakt oss:</strong><br />
            E-post: <a href="mailto:josef@plagiatkontroll.no" style={linkStyle}>josef@plagiatkontroll.no</a>
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
