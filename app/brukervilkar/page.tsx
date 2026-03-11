import Link from 'next/link';
import { LegalLayout } from '../components/legal-layout';
import { Separator } from '../components/ui/separator';

export default function BrukervilkarPage() {
  return (
    <LegalLayout title="Brukervilkar" lastUpdated="10. mars 2026">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">1. Aksept av vilkar</h2>
        <p className="leading-relaxed text-[#0f172a]">
          Ved a opprette en konto, fa tilgang til eller bruke NorskBot AI-plattformen
          (&laquo;Tjenesten&raquo;), aksepterer du a vaere bundet av disse brukervilkarene
          (&laquo;Vilkarene&raquo;). Dersom du inngår denne avtalen pa vegne av en bedrift
          eller annen juridisk enhet, bekrefter du at du har fullmakt til a binde enheten til
          disse Vilkarene.
        </p>
        <p className="text-sm text-[#64748b]">
          Dersom du ikke aksepterer Vilkarene, har du ikke rett til a bruke Tjenesten.
        </p>
      </section>

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">2. Tjenestebeskrivelse</h2>
        <p className="leading-relaxed text-[#0f172a]">
          NorskBot AI tilbyr en skybasert AI chatbot-plattform (SaaS) designet for norske
          bedrifter. Tjenesten inkluderer:
        </p>
        <ul className="list-inside list-disc space-y-2 text-[#0f172a]">
          <li>
            <strong>AI-drevet chatbot:</strong> En intelligent samtalerobot for kundeservice,
            salg og informasjon
          </li>
          <li>
            <strong>Kunnskapsbase:</strong> Mulighet til a laste opp og administrere dokumenter
            og informasjon
          </li>
          <li>
            <strong>API-tilgang:</strong> Programmatisk integrasjon via et REST API
          </li>
          <li>
            <strong>Kontrollpanel:</strong> Nettbasert administrasjonspanel for konfigurasjon og
            analyse
          </li>
          <li>
            <strong>Widget:</strong> En innebygbar chat-widget for integrering pa nettsider
          </li>
        </ul>
      </section>

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">3. Brukerkontoer</h2>
        <p className="leading-relaxed text-[#0f172a]">
          For a bruke Tjenesten ma du opprette en brukerkonto. Ved registrering forplikter du
          deg til a:
        </p>
        <ul className="list-inside list-disc space-y-1 text-[#0f172a]">
          <li>Oppgi korrekt og fullstendig informasjon ved registrering</li>
          <li>Holde kontoinformasjonen oppdatert til enhver tid</li>
          <li>Beskytte passordet ditt og holde det konfidensielt</li>
          <li>Umiddelbart varsle oss om uautorisert bruk av kontoen din</li>
          <li>Ta fullt ansvar for all aktivitet som skjer under din konto</li>
        </ul>
      </section>

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">4. Akseptabel bruk</h2>
        <p className="leading-relaxed text-[#0f172a]">
          Ved bruk av Tjenesten forplikter du deg til a ikke:
        </p>
        <ul className="list-inside list-disc space-y-1 text-[#0f172a]">
          <li>Bruke Tjenesten til ulovlige formal eller i strid med norsk lov</li>
          <li>Laste opp innhold som er stotende, diskriminerende eller truende</li>
          <li>Forsoke a omga sikkerhetstiltak, autentisering eller tilgangskontroller</li>
          <li>Overbelaste, førstyrre eller skade Tjenestens infrastruktur</li>
          <li>Videreselge eller underlisensiere tilgangen uten skriftlig samtykke</li>
          <li>Bruke Tjenesten til a trene konkurrerende AI-modeller</li>
        </ul>
      </section>

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">5. Betaling og abonnement</h2>
        <p className="leading-relaxed text-[#0f172a]">
          Tjenesten tilbys gjennom ulike abonnementsplaner. Ved tegning av et betalt abonnement
          gjelder folgende:
        </p>
        <ul className="list-inside list-disc space-y-2 text-[#0f172a]">
          <li>
            <strong>Priser:</strong> Alle priser er oppgitt i norske kroner (NOK) eksklusiv
            merverdiavgift
          </li>
          <li>
            <strong>Fakturering:</strong> Fakturering skjer forskuddsvis, månedlig eller årlig
          </li>
          <li>
            <strong>Fornyelse:</strong> Abonnementer fornyes automatisk ved utlop av gjeldende
            periode
          </li>
          <li>
            <strong>Prisendringer:</strong> Vi forbeholder oss retten til a endre priser med 30
            dagers skriftlig varsel
          </li>
          <li>
            <strong>Refusjon:</strong> Forskuddsbetalte belop refunderes ikke ved oppsigelse
            midt i en abonnementsperiode
          </li>
        </ul>
      </section>

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">
          6. Immaterielle rettigheter
        </h2>
        <p className="leading-relaxed text-[#0f172a]">
          <strong>NorskBot AIs rettigheter:</strong> Alle immaterielle rettigheter knyttet til
          Tjenesten tilhorer NorskBot AI eller vare lisensgivere.
        </p>
        <p className="leading-relaxed text-[#0f172a]">
          <strong>Dine rettigheter:</strong> Du beholder alle rettigheter til ditt innhold. Du
          gir oss en begrenset lisens til a behandle ditt innhold utelukkende for å levere
          Tjenesten.
        </p>
      </section>

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">7. Ansvarsbegrensning</h2>
        <p className="leading-relaxed text-[#0f172a]">
          Tjenesten leveres &laquo;som den er&raquo; og &laquo;som tilgjengelig&raquo;. Vi
          garanterer ikke at Tjenesten vil vaere feilfri eller uavbrutt.
        </p>
        <ul className="list-inside list-disc space-y-1 text-[#0f172a]">
          <li>NorskBot AI er ikke ansvårlig for innholdet i AI-genererte svar</li>
          <li>Vi er ikke ansvårlig for indirekte tap eller folgeskader</li>
          <li>
            Vart samlede erstatningsansvar er begrenset til belopet betalt de siste 12 månedene
          </li>
        </ul>
      </section>

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">
          8. Databehandling og personvern
        </h2>
        <p className="leading-relaxed text-[#0f172a]">
          Var behandling av personopplysninger er beskrevet i var{' '}
          <Link href="/personvern" className="text-[#2563eb] hover:underline">
            personvernerklaering
          </Link>
          , som utgjor en integrert del av disse Vilkarene.
        </p>
      </section>

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">9. Oppsigelse</h2>
        <p className="leading-relaxed text-[#0f172a]">
          Du kan nar som helst si opp abonnementet ditt gjennom kontrollpanelet eller ved a
          kontakte oss. Oppsigelsen trer i kraft ved utlopet av gjeldende betalingsperiode.
        </p>
        <p className="leading-relaxed text-[#0f172a]">
          Ved oppsigelse vil du ha 30 dager til a eksportere dine data. Etter denne perioden
          slettes dine data permanent.
        </p>
      </section>

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">10. Endringer i vilkarene</h2>
        <p className="leading-relaxed text-[#0f172a]">
          Vi forbeholder oss retten til a endre disse Vilkarene. Vesentlige endringer vil bli
          varslet via e-post minst 30 dager for de trer i kraft.
        </p>
      </section>

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">11. Tvister og lovvalg</h2>
        <p className="leading-relaxed text-[#0f172a]">
          Disse Vilkarene er underlagt norsk lov. Tvister skal avgjores ved de ordinaere
          domstolene med <strong>Bergen tingrett</strong> som verneting.
        </p>
      </section>

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">12. Kontaktinformasjon</h2>
        <p className="leading-relaxed text-[#0f172a]">
          Har du sporsmal om disse Vilkarene, kontakt oss:
        </p>
        <p className="text-sm text-[#64748b]">
          <strong className="text-[#0f172a]">NorskBot AI</strong>
          <br />
          E-post:{' '}
          <a
            href="mailto:josef@plagiatkontroll.no"
            className="text-[#2563eb] hover:underline"
          >
            josef@plagiatkontroll.no
          </a>
        </p>
      </section>
    </LegalLayout>
  );
}
