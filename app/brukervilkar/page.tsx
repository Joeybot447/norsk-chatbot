'use client';

import Link from 'next/link';
import {
  navStyle, logoStyle, navLinksStyle, navLinkStyle,
  containerStyle, h1Style, h2Style,
  sectionStyle, lastSectionStyle, updatedStyle,
  ulStyle, liStyle, linkStyle,
  footerStyle, footerInnerStyle, footerColStyle,
  footerLabelStyle, footerLinkStyle, footerCopyStyle,
} from '../styles/legalPageStyles';

export default function BrukervilkarPage() {
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
        <h1 style={h1Style}>Brukervilkår</h1>
        <p style={updatedStyle}>Sist oppdatert: 10. mars 2026</p>

        <div style={sectionStyle}>
          <h2 style={h2Style}>1. Aksept av vilkår</h2>
          <p>
            Ved å opprette en konto, få tilgang til eller bruke NorskBot AI-plattformen («Tjenesten»),
            aksepterer du å være bundet av disse brukervilkårene («Vilkårene»). Dersom du inngår
            denne avtalen på vegne av en bedrift eller annen juridisk enhet, bekrefter du at du har
            fullmakt til å binde enheten til disse Vilkårene.
          </p>
          <p style={{ marginTop: '12px' }}>
            Dersom du ikke aksepterer Vilkårene, har du ikke rett til å bruke Tjenesten.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>2. Tjenestebeskrivelse</h2>
          <p>
            NorskBot AI tilbyr en skybasert AI chatbot-plattform (SaaS) designet for norske
            bedrifter. Tjenesten inkluderer:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}><strong>AI-drevet chatbot:</strong> En intelligent samtalerobot som kan integreres på din nettside for kundeservice, salg og informasjon</li>
            <li style={liStyle}><strong>Kunnskapsbase:</strong> Mulighet til å laste opp og administrere dokumenter, nettsider og annen informasjon som chatboten bruker til å svare på henvendelser</li>
            <li style={liStyle}><strong>API-tilgang:</strong> Programmatisk integrasjon med dine eksisterende systemer via et REST API</li>
            <li style={liStyle}><strong>Kontrollpanel:</strong> Et nettbasert administrasjonspanel for konfigurasjon, analyse og administrasjon av chatboten</li>
            <li style={liStyle}><strong>Widget:</strong> En innebygbar chat-widget for integrering på nettsider</li>
          </ul>
          <p>
            Tjenestens tilgjengelighet og funksjonalitet kan variere basert på valgt abonnementsplan.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>3. Brukerkontoer</h2>
          <p>
            For å bruke Tjenesten må du opprette en brukerkonto. Ved registrering forplikter du deg til å:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>Oppgi korrekt og fullstendig informasjon ved registrering</li>
            <li style={liStyle}>Holde kontoinformasjonen oppdatert til enhver tid</li>
            <li style={liStyle}>Beskytte passordet ditt og holde det konfidensielt</li>
            <li style={liStyle}>Umiddelbart varsle oss om uautorisert bruk av kontoen din</li>
            <li style={liStyle}>Ta fullt ansvar for all aktivitet som skjer under din konto</li>
          </ul>
          <p>
            Vi forbeholder oss retten til å suspendere eller avslutte kontoer som bruker falsk
            informasjon, eller som bryter disse Vilkårene.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>4. Akseptabel bruk</h2>
          <p>
            Ved bruk av Tjenesten forplikter du deg til å ikke:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>Bruke Tjenesten til ulovlige formål eller i strid med norsk lov</li>
            <li style={liStyle}>Laste opp innhold som er støtende, diskriminerende, truende eller på annen måte ulovlig</li>
            <li style={liStyle}>Forsøke å omgå sikkerhetstiltak, autentisering eller tilgangskontroller</li>
            <li style={liStyle}>Overbelaste, forstyrre eller skade Tjenestens infrastruktur</li>
            <li style={liStyle}>Bruke automatiserte verktøy (bots, scrapere) for å hente data fra Tjenesten uten tillatelse</li>
            <li style={liStyle}>Videreselge, underlisensiere eller overføre tilgangen til Tjenesten uten skriftlig samtykke</li>
            <li style={liStyle}>Bruke Tjenesten til å trene eller utvikle konkurrerende AI-modeller</li>
            <li style={liStyle}>Lagre eller behandle sensitive personopplysninger (helseopplysninger, personnummer o.l.) gjennom chatboten uten separat databehandleravtale</li>
          </ul>
          <p>
            Brudd på disse retningslinjene kan medføre umiddelbar suspensjon eller oppsigelse av
            kontoen din.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>5. Betaling og abonnement</h2>
          <p>
            Tjenesten tilbys gjennom ulike abonnementsplaner. Ved tegning av et betalt abonnement
            gjelder følgende:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}><strong>Priser:</strong> Alle priser er oppgitt i norske kroner (NOK) eksklusiv merverdiavgift, med mindre annet er spesifisert</li>
            <li style={liStyle}><strong>Fakturering:</strong> Fakturering skjer forskuddsvis, månedlig eller årlig, avhengig av valgt plan</li>
            <li style={liStyle}><strong>Fornyelse:</strong> Abonnementer fornyes automatisk ved utløp av gjeldende periode, med mindre det sies opp før fornyelsesdato</li>
            <li style={liStyle}><strong>Prisendringer:</strong> Vi forbeholder oss retten til å endre priser med 30 dagers skriftlig varsel. Nye priser trer i kraft ved neste fornyelsesperiode</li>
            <li style={liStyle}><strong>Refusjon:</strong> Forskuddsbetalte beløp refunderes ikke ved oppsigelse midt i en abonnementsperiode, med mindre annet følger av forbrukerkjøpsloven eller angrerettloven</li>
          </ul>
          <p>
            Ved manglende betaling forbeholder vi oss retten til å suspendere tilgangen til Tjenesten
            inntil utestående beløp er betalt.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>6. Immaterielle rettigheter</h2>
          <p>
            <strong>NorskBot AIs rettigheter:</strong> Alle immaterielle rettigheter knyttet til
            Tjenesten, inkludert programvare, design, logoer, varemerker og dokumentasjon, tilhører
            NorskBot AI eller våre lisensgivere. Ingenting i disse Vilkårene overfører eierskap til
            deg.
          </p>
          <p style={{ marginTop: '12px' }}>
            <strong>Dine rettigheter:</strong> Du beholder alle rettigheter til ditt innhold,
            inkludert dokumenter du laster opp til kunnskapsbasen, chatlogger og bedriftsdata.
            Du gir oss en begrenset lisens til å behandle ditt innhold utelukkende for å levere
            Tjenesten.
          </p>
          <p style={{ marginTop: '12px' }}>
            <strong>Tilbakemelding:</strong> Eventuelle forslag, tilbakemeldinger eller idéer du
            deler med oss kan vi fritt benytte til videreutvikling av Tjenesten, uten plikt til
            kompensasjon.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>7. Ansvarsbegrensning</h2>
          <p>
            Tjenesten leveres «som den er» og «som tilgjengelig». Vi garanterer ikke at Tjenesten
            vil være feilfri, uavbrutt eller oppfylle alle dine spesifikke behov.
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>NorskBot AI er ikke ansvarlig for innholdet i svar generert av AI-chatboten. Svarene er basert på tilgjengelig data og kan inneholde unøyaktigheter</li>
            <li style={liStyle}>Vi er ikke ansvarlig for indirekte tap, følgeskader, tapt fortjeneste eller tap av data som følge av bruk av Tjenesten</li>
            <li style={liStyle}>Vårt samlede erstatningsansvar er under enhver omstendighet begrenset til beløpet du har betalt for Tjenesten de siste 12 månedene</li>
            <li style={liStyle}>Ansvarsbegrensningen gjelder ikke ved forsett eller grov uaktsomhet fra vår side</li>
          </ul>
          <p>
            Du er selv ansvarlig for å verifisere at chatbotens svar er korrekte og egnet for ditt
            bruksområde.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>8. Databehandling og personvern</h2>
          <p>
            Vi tar personvern på alvor. Vår behandling av personopplysninger er beskrevet i vår{' '}
            <Link href="/personvern" style={linkStyle}>personvernerklæring</Link>, som utgjør en
            integrert del av disse Vilkårene.
          </p>
          <p style={{ marginTop: '12px' }}>
            For bedriftskunder som bruker Tjenesten til å behandle personopplysninger om sine
            sluttbrukere, vil en separat databehandleravtale i henhold til GDPR artikkel 28 inngås
            ved behov.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>9. Oppsigelse</h2>
          <p>
            <strong>Din rett til oppsigelse:</strong> Du kan når som helst si opp abonnementet ditt
            gjennom kontrollpanelet eller ved å kontakte oss. Oppsigelsen trer i kraft ved utløpet
            av gjeldende betalingsperiode.
          </p>
          <p style={{ marginTop: '12px' }}>
            <strong>Vår rett til oppsigelse:</strong> Vi kan si opp eller suspendere din tilgang til
            Tjenesten med umiddelbar virkning dersom:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>Du bryter disse Vilkårene vesentlig</li>
            <li style={liStyle}>Du bruker Tjenesten til ulovlige formål</li>
            <li style={liStyle}>Du ikke betaler utestående fakturaer innen 30 dager etter forfall</li>
          </ul>
          <p>
            <strong>Konsekvenser ved oppsigelse:</strong> Ved oppsigelse vil din tilgang til Tjenesten
            opphøre. Du vil ha 30 dager fra oppsigelsesdato til å eksportere dine data. Etter denne
            perioden slettes dine data permanent, med unntak av data vi er lovpålagt å beholde.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>10. Endringer i vilkårene</h2>
          <p>
            Vi forbeholder oss retten til å endre disse Vilkårene. Vesentlige endringer vil bli
            varslet via e-post og/eller gjennom en melding i Tjenesten minst 30 dager før de trer
            i kraft.
          </p>
          <p style={{ marginTop: '12px' }}>
            Fortsatt bruk av Tjenesten etter at endringene har trådt i kraft, anses som aksept av
            de oppdaterte Vilkårene. Dersom du ikke aksepterer endringene, kan du si opp
            abonnementet ditt i henhold til punkt 9.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>11. Tvister og lovvalg</h2>
          <p>
            Disse Vilkårene er underlagt og skal tolkes i samsvar med norsk lov.
          </p>
          <p style={{ marginTop: '12px' }}>
            Eventuelle tvister som springer ut av eller er i forbindelse med disse Vilkårene eller
            bruken av Tjenesten, skal søkes løst gjennom forhandlinger mellom partene. Dersom
            forhandlinger ikke fører frem innen 30 dager, skal tvisten avgjøres ved de ordinære
            domstolene med <strong>Bergen tingrett</strong> som verneting.
          </p>
        </div>

        <div style={lastSectionStyle}>
          <h2 style={h2Style}>12. Kontaktinformasjon</h2>
          <p>
            Har du spørsmål om disse Vilkårene, kontakt oss:
          </p>
          <p style={{ marginTop: '12px' }}>
            <strong>NorskBot AI</strong><br />
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
