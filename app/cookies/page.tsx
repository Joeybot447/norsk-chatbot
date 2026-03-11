import Link from 'next/link';
import { LegalLayout } from '../components/legal-layout';
import { Separator } from '../components/ui/separator';

function CookieTable({
  rows,
}: {
  rows: { name: string; purpose: string; duration: string; type: string }[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#e2e8f0]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#0f172a]">
              Navn
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#0f172a]">
              Formal
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#0f172a]">
              Varighet
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#0f172a]">
              Type
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-[#e2e8f0] last:border-0">
              <td className="px-4 py-3 font-medium text-[#0f172a]">{row.name}</td>
              <td className="px-4 py-3 text-[#64748b]">{row.purpose}</td>
              <td className="px-4 py-3 text-[#64748b]">{row.duration}</td>
              <td className="px-4 py-3 text-[#64748b]">{row.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CookiesPage() {
  return (
    <LegalLayout title="Retningslinjer for informasjonskapsler" lastUpdated="10. mars 2026">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">
          1. Hva er informasjonskapsler?
        </h2>
        <p className="leading-relaxed text-[#0f172a]">
          Informasjonskapsler (cookies) er sma tekstfiler som lagres pa din enhet (datamaskin,
          nettbrett eller mobiltelefon) nar du besoker en nettside. De brukes til a huske
          innstillinger, forbedre brukeropplevelsen og samle informasjon om hvordan nettsiden
          brukes.
        </p>
      </section>

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-[#0f172a]">
          2. Hvilke informasjonskapsler vi bruker
        </h2>

        <div className="space-y-3">
          <h3 className="text-base font-semibold text-[#0f172a]">
            2.1 Nodvendige informasjonskapsler
          </h3>
          <p className="text-sm text-[#64748b]">
            Essensielle for at nettsiden skal fungere korrekt. Kan ikke deaktiveres.
          </p>
          <CookieTable
            rows={[
              {
                name: 'nb_session',
                purpose: 'Opprettholder brukersesjonen og autentiseringsstatus',
                duration: 'Sesjon',
                type: 'Forstepart',
              },
              {
                name: 'nb_csrf',
                purpose: 'Beskytter mot CSRF-angrep',
                duration: 'Sesjon',
                type: 'Forstepart',
              },
              {
                name: 'nb_auth',
                purpose: 'Lagrer autentiseringstoken for innloggede brukere',
                duration: '7 dager',
                type: 'Forstepart',
              },
              {
                name: 'nb_cookie_consent',
                purpose: 'Lagrer dine valg for informasjonskapsler',
                duration: '12 maneder',
                type: 'Forstepart',
              },
            ]}
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-semibold text-[#0f172a]">
            2.2 Funksjonelle informasjonskapsler
          </h3>
          <p className="text-sm text-[#64748b]">
            Gjor det mulig a huske valg du gjor for en bedre brukeropplevelse.
          </p>
          <CookieTable
            rows={[
              {
                name: 'nb_lang',
                purpose: 'Lagrer foretrukket sprakinnstilling',
                duration: '12 maneder',
                type: 'Forstepart',
              },
              {
                name: 'nb_theme',
                purpose: 'Lagrer foretrukket visningsinnstilling (lyst/morkt tema)',
                duration: '12 maneder',
                type: 'Forstepart',
              },
              {
                name: 'nb_dashboard_prefs',
                purpose: 'Lagrer kontrollpanelinnstillinger og filtreringsvalg',
                duration: '6 maneder',
                type: 'Forstepart',
              },
            ]}
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-semibold text-[#0f172a]">
            2.3 Analytiske informasjonskapsler
          </h3>
          <p className="text-sm text-[#64748b]">
            Hjelper oss a forsta hvordan besokende bruker nettsiden. All data anonymiseres.
          </p>
          <CookieTable
            rows={[
              {
                name: 'nb_analytics',
                purpose: 'Samler anonymisert bruksstatistikk',
                duration: '12 maneder',
                type: 'Forstepart',
              },
              {
                name: 'nb_perf',
                purpose: 'Maler ytelse og lastetider',
                duration: 'Sesjon',
                type: 'Forstepart',
              },
            ]}
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-semibold text-[#0f172a]">
            2.4 Markedsforingsinformasjonskapsler
          </h3>
          <p className="text-sm text-[#64748b]">
            Vi bruker for oyeblikket ikke markedsforingsinformasjonskapsler. Dersom dette endres,
            vil vi oppdatere denne siden og innhente ditt samtykke.
          </p>
        </div>
      </section>

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">
          3. Hvordan administrere informasjonskapsler
        </h2>
        <p className="leading-relaxed text-[#0f172a]">
          Du kan kontrollere og administrere informasjonskapsler gjennom nettleserinnstillingene
          dine:
        </p>
        <ul className="list-inside list-disc space-y-1 text-[#0f172a]">
          <li>
            <strong>Chrome:</strong> Innstillinger &rarr; Personvern og sikkerhet &rarr;
            Informasjonskapsler
          </li>
          <li>
            <strong>Firefox:</strong> Innstillinger &rarr; Personvern og sikkerhet &rarr;
            Informasjonskapsler og nettstedsdata
          </li>
          <li>
            <strong>Safari:</strong> Innstillinger &rarr; Personvern &rarr; Administrer
            nettstedsdata
          </li>
          <li>
            <strong>Edge:</strong> Innstillinger &rarr; Informasjonskapsler og
            nettstedstillatelser
          </li>
        </ul>
        <p className="text-sm text-[#64748b]">
          Blokkering av nodvendige informasjonskapsler kan pavirke funksjonaliteten.
        </p>
      </section>

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">4. Samtykke</h2>
        <p className="leading-relaxed text-[#0f172a]">
          Nar du besoker var nettside for forste gang, vil du bli bedt om a gi ditt samtykke til
          bruk av ikke-nodvendige informasjonskapsler. Du kan nar som helst endre eller trekke
          tilbake ditt samtykke.
        </p>
      </section>

      <Separator className="my-8 bg-[#e2e8f0]" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0f172a]">5. Endringer og kontakt</h2>
        <p className="leading-relaxed text-[#0f172a]">
          Vi kan oppdatere denne retningslinjen fra tid til annen. Har du sporsmal, kontakt oss
          pa:{' '}
          <a
            href="mailto:josef@plagiatkontroll.no"
            className="text-[#2563eb] hover:underline"
          >
            josef@plagiatkontroll.no
          </a>
        </p>
        <p className="text-sm text-[#64748b]">
          For mer informasjon om personopplysninger, se var{' '}
          <Link href="/personvern" className="text-[#2563eb] hover:underline">
            personvernerklaering
          </Link>
          .
        </p>
      </section>
    </LegalLayout>
  );
}
