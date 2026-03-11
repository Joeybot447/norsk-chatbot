import Link from "next/link";
import {
  MessageSquare,
  BookOpen,
  BarChart3,
  Code2,
  ArrowRight,
  Check,
  Zap,
  Shield,
  Globe,
} from "lucide-react";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";

/* ────────────────────────────────────────────────────────────────────────── */
/*  Navigation                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e2e8f0] bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563eb]">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold text-[#0f172a]">NorskBot</span>
        </Link>

        {/* Nav Links — hidden on mobile */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#funksjoner"
            className="text-sm font-medium text-[#64748b] transition-colors hover:text-[#0f172a]"
          >
            Funksjoner
          </a>
          <a
            href="#priser"
            className="text-sm font-medium text-[#64748b] transition-colors hover:text-[#0f172a]"
          >
            Priser
          </a>
          <a
            href="#slik-fungerer-det"
            className="text-sm font-medium text-[#64748b] transition-colors hover:text-[#0f172a]"
          >
            Om oss
          </a>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <Link
            href="/auth"
            className="hidden text-sm font-medium text-[#64748b] transition-colors hover:text-[#0f172a] sm:inline-block"
          >
            Logg inn
          </Link>
          <Button asChild size="sm" className="bg-[#2563eb] hover:bg-[#1d4ed8]">
            <Link href="/auth">Kom i gang</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Hero                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Subtle gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#dbeafe]/40 to-transparent" />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 pb-24 pt-20 md:grid-cols-2 md:items-center md:pb-32 md:pt-28 lg:gap-16">
        {/* Copy */}
        <div className="max-w-xl">
          <Badge
            variant="secondary"
            className="mb-6 border border-[#e2e8f0] bg-[#f1f5f9] text-[#64748b]"
          >
            Bygget for norske bedrifter
          </Badge>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-[#0f172a] sm:text-5xl lg:text-6xl">
            AI-drevet kundeservice som aldri sover
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[#64748b]">
            Gi kundene dine umiddelbare, presise svar — 24 timer i dognet.
            NorskBot larer fra ditt innhold og svarer pa norsk, automatisk.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button
              asChild
              size="lg"
              className="bg-[#2563eb] text-base hover:bg-[#1d4ed8]"
            >
              <Link href="/auth">
                Prøv gratis
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-[#e2e8f0] text-base text-[#0f172a] hover:bg-[#f8fafc]"
            >
              <a href="#slik-fungerer-det">Se hvordan det fungerer</a>
            </Button>
          </div>
        </div>

        {/* Chat widget mockup */}
        <div className="relative mx-auto w-full max-w-md md:mx-0">
          <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-xl">
            {/* Widget header */}
            <div className="flex items-center gap-3 border-b border-[#e2e8f0] bg-[#2563eb] px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">NorskBot</p>
                <p className="text-xs text-white/70">Svarer vanligvis umiddelbart</p>
              </div>
            </div>
            {/* Messages */}
            <div className="space-y-4 bg-[#f8fafc] p-5">
              {/* Bot message */}
              <div className="max-w-[80%]">
                <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm leading-relaxed text-[#0f172a] shadow-sm">
                  Hei! Hvordan kan jeg hjelpe deg i dag?
                </div>
              </div>
              {/* User message */}
              <div className="ml-auto max-w-[80%]">
                <div className="rounded-2xl rounded-tr-sm bg-[#2563eb] px-4 py-3 text-sm leading-relaxed text-white">
                  Hva koster bedriftsabonnementet?
                </div>
              </div>
              {/* Bot reply */}
              <div className="max-w-[80%]">
                <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm leading-relaxed text-[#0f172a] shadow-sm">
                  Pro-planen koster 599 kr/mnd og inkluderer 5 nettsteder, 10 000 meldinger og
                  prioritert støtte. Skal jeg hjelpe deg med å komme i gang?
                </div>
              </div>
            </div>
            {/* Input bar */}
            <div className="border-t border-[#e2e8f0] bg-white px-4 py-3">
              <div className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
                <span className="flex-1 text-sm text-[#94a3b8]">Skriv en melding...</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2563eb]">
                  <ArrowRight className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Trust Bar                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

function TrustBar() {
  return (
    <section className="border-y border-[#e2e8f0] bg-[#f8fafc] py-10">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-sm font-medium text-[#64748b]">
          Brukt av over 100 norske bedrifter innen e-handel, helse, finans og offentlig sektor
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {["E-handel", "Helsevesen", "Finans", "Offentlig", "Teknologi", "Utdanning"].map(
            (industry) => (
              <div
                key={industry}
                className="flex items-center gap-2 text-sm font-medium text-[#94a3b8]"
              >
                <Globe className="h-4 w-4" />
                {industry}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Features                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

const features = [
  {
    icon: MessageSquare,
    title: "AI-chatbot",
    description:
      "Intelligent samtalerobot som førstår norsk og svarer presist basert på ditt innhold. Tilgjengelig 24/7.",
  },
  {
    icon: BookOpen,
    title: "Kunnskapsbase",
    description:
      "Last opp dokumenter, nettsider og FAQ-er. Chatboten larer automatisk og holder seg oppdatert.",
  },
  {
    icon: BarChart3,
    title: "Analyse og innsikt",
    description:
      "Detaljert statistikk over samtaler, kundetilfredshet og vanlige sporsmål. Ta datadrevne beslutninger.",
  },
  {
    icon: Code2,
    title: "Enkel installasjon",
    description:
      "Legg til en enkel kodebit pa nettsiden din. Widgeten er klar pa minutter — ingen teknisk kompetanse krevd.",
  },
];

function Features() {
  return (
    <section id="funksjoner" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
            Alt du trenger for smartere kundeservice
          </h2>
          <p className="mt-4 text-lg text-[#64748b]">
            Kraftige verktoy som gjor det enkelt a automatisere og forbedre kundeopplevelsen.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border-[#e2e8f0] bg-white transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#dbeafe]">
                  <feature.icon className="h-5 w-5 text-[#2563eb]" />
                </div>
                <CardTitle className="text-lg text-[#0f172a]">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-[#64748b]">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  How It Works                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

const steps = [
  {
    number: "1",
    title: "Registrer deg",
    description: "Opprett en gratis konto pa under ett minutt. Ingen kredittkort krevd.",
  },
  {
    number: "2",
    title: "Last opp innhold",
    description:
      "Last opp dokumenter, FAQ-er eller koble til nettsiden din. AI-en larer automatisk.",
  },
  {
    number: "3",
    title: "Installer widgeten",
    description:
      "Kopier en enkel kodebit og lim inn pa nettsiden. Chatboten er klar umiddelbart.",
  },
];

function HowItWorks() {
  return (
    <section id="slik-fungerer-det" className="bg-[#f8fafc] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
            Kom i gang pa tre enkle steg
          </h2>
          <p className="mt-4 text-lg text-[#64748b]">
            Fra registrering til live chatbot pa nettsiden din — pa under 10 minutter.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="relative text-center">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#2563eb] bg-white text-xl font-bold text-[#2563eb]">
                {step.number}
              </div>
              <h3 className="text-lg font-semibold text-[#0f172a]">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#64748b]">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Pricing                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

const plans = [
  {
    name: "Starter",
    price: "299",
    description: "Perfekt for sma bedrifter som vil komme i gang.",
    features: [
      "1 nettsted",
      "1 000 meldinger / mnd",
      "E-poststøtte",
      "Standard kunnskapsbase",
      "Grunnleggende analyse",
    ],
    cta: "Velg plan",
    popular: false,
  },
  {
    name: "Pro",
    price: "599",
    description: "For voksende bedrifter med hoyere krav.",
    features: [
      "5 nettsteder",
      "10 000 meldinger / mnd",
      "Prioritert støtte",
      "Avansert analyse",
      "Tilpasset chatbot-design",
      "API-tilgang",
    ],
    cta: "Kom i gang",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "1 499",
    description: "For store organisasjoner med sarskilte behov.",
    features: [
      "Ubegrenset nettsteder",
      "Ubegrenset meldinger",
      "Dedikert støtte",
      "Tilpasset integrasjon",
      "SLA-avtale",
      "On-premise mulighet",
      "SSO / SAML",
    ],
    cta: "Kontakt oss",
    popular: false,
  },
];

function Pricing() {
  return (
    <section id="priser" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
            Enkle, forutsigbare priser
          </h2>
          <p className="mt-4 text-lg text-[#64748b]">
            Ingen skjulte kostnader. Oppgrader eller nedgrader nar som helst.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col border-[#e2e8f0] bg-white ${
                plan.popular
                  ? "border-2 border-[#2563eb] shadow-lg"
                  : "hover:shadow-md"
              } transition-shadow`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#2563eb] text-white hover:bg-[#2563eb]">
                    Populær
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-[#0f172a]">{plan.name}</CardTitle>
                <CardDescription className="text-[#64748b]">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-[#0f172a]">
                    {plan.price}
                  </span>
                  <span className="ml-1 text-base text-[#64748b]">kr / mnd</span>
                </div>
                <Separator className="mb-6 bg-[#e2e8f0]" />
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-[#0f172a]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2563eb]" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  asChild
                  className={`w-full ${
                    plan.popular
                      ? "bg-[#2563eb] hover:bg-[#1d4ed8]"
                      : "border-[#e2e8f0] bg-white text-[#0f172a] hover:bg-[#f8fafc]"
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  <Link href={plan.name === "Enterprise" ? "mailto:josef@plagiatkontroll.no" : "/auth"}>
                    {plan.cta}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Final CTA                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

function FinalCTA() {
  return (
    <section className="bg-[#dbeafe] py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
          Klar til å automatisere kundeservicen?
        </h2>
        <p className="mt-4 text-lg text-[#64748b]">
          Kom i gang gratis i dag. Ingen kredittkort krevd — opprett konto pa under ett minutt.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-[#2563eb] text-base hover:bg-[#1d4ed8]"
          >
            <Link href="/auth">
              Prøv gratis
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Footer                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

const footerColumns = [
  {
    title: "Produkt",
    links: [
      { label: "Funksjoner", href: "#funksjoner" },
      { label: "Priser", href: "#priser" },
      { label: "Kontrollpanel", href: "/dashboard" },
      { label: "API-dokumentasjon", href: "#" },
    ],
  },
  {
    title: "Selskap",
    links: [
      { label: "Om oss", href: "#slik-fungerer-det" },
      { label: "Kontakt", href: "mailto:josef@plagiatkontroll.no" },
    ],
  },
  {
    title: "Juridisk",
    links: [
      { label: "Personvern", href: "/personvern" },
      { label: "Brukervilkar", href: "/brukervilkar" },
      { label: "Informasjonskapsler", href: "/cookies" },
    ],
  },
];

function Footer() {
  return (
    <footer className="border-t border-[#e2e8f0] bg-white py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand column */}
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563eb]">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-[#0f172a]">NorskBot</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-[#64748b]">
              AI-drevet kundeservice for norske bedrifter. Smartere, raskere, alltid tilgjengelig.
            </p>
            <p className="mt-3 text-sm text-[#64748b]">
              <a
                href="mailto:josef@plagiatkontroll.no"
                className="transition-colors hover:text-[#2563eb]"
              >
                josef@plagiatkontroll.no
              </a>
            </p>
          </div>

          {/* Link columns */}
          {footerColumns.map((column) => (
            <div key={column.title}>
              <p className="mb-4 text-sm font-semibold text-[#0f172a]">{column.title}</p>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#64748b] transition-colors hover:text-[#0f172a]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-10 bg-[#e2e8f0]" />

        <p className="text-center text-sm text-[#64748b]">
          2026 NorskBot. Alle rettigheter reservert.
        </p>
      </div>
    </footer>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Page                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <TrustBar />
      <Features />
      <HowItWorks />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}
