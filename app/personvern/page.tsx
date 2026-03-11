import Link from 'next/link';
import { LegalLayout } from '../components/legal-layout';
import { Separator } from '../components/ui/separator';

export default function PersonvernPage() {
  return (
    <LegalLayout title="Personvernerklaering" lastUpdated="10. mars 2026">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">1. Hvem vi er</h2>
        <p className="leading-relaxed text-[#0f172a]">
          NorskBot AI (&laquo;NorskBot&raquo;, &laquo;vi&raquo;, &laquo;oss&raquo; eller
          &laquo;var&raquo;) er et norsk teknologiselskap som leverer AI-drevne
          chatbot-losninger til bedrifter. Vi er behandlingsansvarlig for personopplysninger som
          samles inn gjennom var plattform og nettside.
        </p>
        <p className="text-sm text-[#64748b]">
          <strong className="text-[#0f172a]">Kontaktinformasjon:</strong>
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

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">
          2. Hvilke personopplysninger vi samler inn
        </h2>
        <p className="leading-relaxed text-[#0f172a]">
          Vi samler inn folgende kategorier av personopplysninger:
        </p>

        <h3 className="text-base font-semibold text-[#0f172a]">Kontoinformasjon</h3>
        <ul className="list-inside list-disc space-y-1 text-[#0f172a]">
          <li>Navn og kontaktinformasjon (e-postadresse, telefonnummer)</li>
          <li>Bedriftsinformasjon (firmanavn, organisasjonsnummer, bransje)</li>
          <li>Paloggingsinformasjon og kontoinnstillinger</li>
        </ul>

        <h3 className="text-base font-semibold text-[#0f172a]">Bruksdata</h3>
        <ul className="list-inside list-disc space-y-1 text-[#0f172a]">
          <li>Chatlogger og samtalehistorikk mellom chatboten og sluttbrukere</li>
          <li>Opplastede dokumenter og kunnskapsbasemateriale</li>
          <li>Bruksmonster, funksjonsinteraksjoner og tidsbruk i plattformen</li>
        </ul>

        <h3 className="text-base font-semibold text-[#0f172a]">Tekniske data</h3>
        <ul className="list-inside list-disc space-y-1 text-[#0f172a]">
          <li>IP-adresse, nettlesertype og operativsystem</li>
          <li>Enhetsinformasjon og skjermopplosning</li>
          <li>Informasjonskapsler og lignende sporingsteknologier</li>
        </ul>
      </section>

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">
          3. Hvorfor vi samler inn personopplysninger
        </h2>
        <p className="leading-relaxed text-[#0f172a]">
          Vi behandler personopplysninger for folgende formal:
        </p>
        <ul className="list-inside list-disc space-y-2 text-[#0f172a]">
          <li>
            <strong>Tjenesteleveranse:</strong> For a levere, vedlikeholde og forbedre var AI
            chatbot-plattform, inkludert kunnskapsbase og API-tilgang
          </li>
          <li>
            <strong>Forbedring av tjenesten:</strong> For a analysere bruksmonster, feilsoke
            tekniske problemer og utvikle nye funksjoner
          </li>
          <li>
            <strong>Sikkerhet:</strong> For a beskytte plattformen mot misbruk, svindel og
            uautorisert tilgang
          </li>
          <li>
            <strong>Kommunikasjon:</strong> For a sende servicerelaterte meldinger, oppdateringer
            og svar pa henvendelser
          </li>
          <li>
            <strong>Juridiske forpliktelser:</strong> For a oppfylle krav i gjeldende lovgivning,
            inkludert regnskap og skatt
          </li>
        </ul>
      </section>

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">
          4. Rettslig grunnlag for behandlingen
        </h2>
        <p className="leading-relaxed text-[#0f172a]">
          I henhold til personvernforordningen (GDPR) artikkel 6, behandler vi
          personopplysninger basert pa folgende rettslige grunnlag:
        </p>
        <ul className="list-inside list-disc space-y-2 text-[#0f172a]">
          <li>
            <strong>Samtykke (art. 6 nr. 1 bokstav a):</strong> Nar du aktivt samtykker til
            behandling, for eksempel ved aksept av informasjonskapsler
          </li>
          <li>
            <strong>Oppfyllelse av avtale (art. 6 nr. 1 bokstav b):</strong> Nar behandlingen er
            nodvendig for a oppfylle en avtale med deg
          </li>
          <li>
            <strong>Berettiget interesse (art. 6 nr. 1 bokstav f):</strong> Nar vi har en
            legitim interesse i behandlingen
          </li>
          <li>
            <strong>Rettslig forpliktelse (art. 6 nr. 1 bokstav c):</strong> Nar behandlingen er
            pakrevd etter norsk lov eller EU/EOS-regelverk
          </li>
        </ul>
      </section>

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">
          5. Deling av personopplysninger
        </h2>
        <p className="leading-relaxed text-[#0f172a]">
          Vi selger aldri personopplysninger til tredjeparter. Vi kan dele opplysninger med
          folgende kategorier av mottakere, under strenge databehandleravtaler:
        </p>
        <ul className="list-inside list-disc space-y-2 text-[#0f172a]">
          <li>
            <strong>AI-modell-leverandorer:</strong> Chatmeldinger sendes til OpenAI for a
            generere svar
          </li>
          <li>
            <strong>Hosting- og infrastrukturleverandorer:</strong> Vare servere og databaser
            hostes hos palitelige skyleverandorer innenfor EOS
          </li>
          <li>
            <strong>Analyseverktoy:</strong> Vi bruker anonymiserte analyser for a forsta
            bruksmonster
          </li>
          <li>
            <strong>Myndigheter:</strong> Nar vi er rettslig forpliktet til a utlevere
            opplysninger
          </li>
        </ul>
      </section>

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">6. Lagring og sletting</h2>
        <p className="leading-relaxed text-[#0f172a]">
          Vi lagrer personopplysninger kun sa lenge det er nodvendig for formalet de ble samlet
          inn for, eller sa lenge vi er palagt ved lov.
        </p>
        <ul className="list-inside list-disc space-y-1 text-[#0f172a]">
          <li>
            <strong>Kontoinformasjon:</strong> Lagres sa lenge du har en aktiv konto, og i inntil
            12 maneder etter kontosletting
          </li>
          <li>
            <strong>Chatlogger:</strong> Lagres i henhold til kundens valgte oppbevaringsperiode,
            standard 12 maneder
          </li>
          <li>
            <strong>Bruksdata og logger:</strong> Lagres i inntil 24 maneder
          </li>
          <li>
            <strong>Regnskapsdata:</strong> Lagres i 5 ar i henhold til bokforingsloven
          </li>
        </ul>
      </section>

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">7. Dine rettigheter</h2>
        <p className="leading-relaxed text-[#0f172a]">
          I henhold til GDPR har du folgende rettigheter knyttet til dine personopplysninger:
        </p>
        <ul className="list-inside list-disc space-y-1 text-[#0f172a]">
          <li>Rett til innsyn</li>
          <li>Rett til retting</li>
          <li>Rett til sletting</li>
          <li>Rett til begrensning</li>
          <li>Rett til dataportabilitet</li>
          <li>Rett til a protestere</li>
          <li>Rett til a trekke tilbake samtykke</li>
        </ul>
        <p className="text-sm text-[#64748b]">
          For a utove dine rettigheter, kontakt oss pa{' '}
          <a
            href="mailto:josef@plagiatkontroll.no"
            className="text-[#2563eb] hover:underline"
          >
            josef@plagiatkontroll.no
          </a>
          . Vi vil besvare henvendelsen din innen 30 dager.
        </p>
      </section>

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">8. Informasjonskapsler</h2>
        <p className="leading-relaxed text-[#0f172a]">
          Vi bruker informasjonskapsler (cookies) og lignende teknologier pa var nettside. Se
          var{' '}
          <Link href="/cookies" className="text-[#2563eb] hover:underline">
            retningslinje for informasjonskapsler
          </Link>{' '}
          for detaljer.
        </p>
      </section>

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">9. Sikkerhet</h2>
        <p className="leading-relaxed text-[#0f172a]">
          Vi tar sikkerheten til dine personopplysninger pa alvor og har implementert tekniske og
          organisatoriske tiltak for a beskytte dem mot uautorisert tilgang, endring, utlevering
          eller sletting.
        </p>
      </section>

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">
          10. Endringer i personvernerkleringen
        </h2>
        <p className="leading-relaxed text-[#0f172a]">
          Vi kan oppdatere denne personvernerkleringen fra tid til annen. Vesentlige endringer
          vil bli varslet via e-post eller gjennom en melding i plattformen.
        </p>
        <p className="text-sm text-[#64748b]">
          <strong className="text-[#0f172a]">Kontakt oss:</strong>
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
