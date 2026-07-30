import { Helmet } from "@/lib/helmet-compat";
import { Link } from "@/lib/router-compat";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Ruler,
  Euro,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Phone,
  ArrowRight,
  Building2,
  Wallet,
  Calendar,
  ShieldCheck,
} from "lucide-react";

/**
 * SEO landing: garsoniere in Militari Residence.
 * Targets "garsoniera militari residence" (720/mo, KD ~10) and related long-tail
 * like "garsoniera de vanzare militari residence", "pret garsoniera militari residence".
 */
const GarsoniereMilitariResidence = () => {
  const canonical =
    "https://www.mvaimobiliare.ro/garsoniere-militari-residence";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline:
      "Garsoniere Militari Residence — ghid complet de cumpărare, prețuri și investiție",
    description:
      "Ghid expert pentru cumpărarea unei garsoniere în Militari Residence: layout-uri tipice, prețuri actuale, randament la închiriere și cele mai bune unități disponibile.",
    author: { "@type": "Organization", name: "MVA Imobiliare" },
    publisher: {
      "@type": "Organization",
      name: "MVA Imobiliare",
      logo: {
        "@type": "ImageObject",
        url: "https://www.mvaimobiliare.ro/mva-logo-luxury-horizontal.svg",
      },
    },
    mainEntityOfPage: canonical,
    image: "https://www.mvaimobiliare.ro/og-image.jpg",
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Cât costă o garsonieră în Militari Residence?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Prețurile garsonierelor în Militari Residence pornesc de la aproximativ 55.000 € pentru unități de 30–35 mp utili și pot ajunge până la 75.000 € pentru garsoniere generoase, cu balcon, în blocurile noi sau cu vedere preferențială. Prețul mediu pe mp este de 1.700–2.000 €.",
        },
      },
      {
        "@type": "Question",
        name: "Care este suprafața tipică a unei garsoniere în Militari Residence?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Majoritatea garsonierelor au între 30 și 45 mp utili. Layout-urile standard includ zonă de zi cu bucătărie deschisă, baie cu fereastră și balcon. Există și garsoniere duble (40–48 mp) cu separare clară între dormitor și living.",
        },
      },
      {
        "@type": "Question",
        name: "Este o garsonieră în Militari Residence o investiție bună?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Da. Cererea de închiriere este constantă datorită proximității de stația de metrou Păcii, mall-ului AFI Cotroceni și universităților din zona Politehnica. Chiriile pentru garsoniere variază între 350 și 500 €/lună, ceea ce înseamnă un randament brut anual de 6–8%, peste media Bucureștiului.",
        },
      },
      {
        "@type": "Question",
        name: "Se poate cumpăra o garsonieră în Militari Residence cu Noua Casă?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Da, multe garsoniere din Militari Residence se încadrează în plafonul programului Noua Casă (până la 70.000 €). Avansul minim este de 5%, iar dezvoltatorul colaborează cu principalele bănci participante. Vezi ghidul complet Noua Casă 2024 pentru detalii.",
        },
      },
      {
        "@type": "Question",
        name: "Ce ar trebui să verific înainte de a cumpăra o garsonieră?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Verifică: etajul (etajele 3–7 sunt cele mai căutate la închiriere), orientarea (sud și est sunt preferate), prezența balconului, stadiul finisajelor, costurile lunare de întreținere, locul de parcare inclus sau opțional, și proximitatea de stația de metrou Păcii. Echipa MVA Imobiliare te poate ajuta cu o vizionare informată.",
        },
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>Garsoniere Militari Residence — Prețuri, Layout & ROI | MVA</title>
        <meta
          name="description"
          content="Ghid complet pentru cumpărarea unei garsoniere în Militari Residence: prețuri 55.000–75.000 €, layout-uri tipice, randament 6–8% la închiriere. Vezi oferta MVA Imobiliare."
        />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Garsoniere Militari Residence — Ghid expert de cumpărare" />
        <meta
          property="og:description"
          content="Layout-uri, prețuri actuale și potențial de investiție pentru garsonierele din Militari Residence."
        />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content="ro_RO" />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <BreadcrumbSchema
        items={[
          { name: "Acasă", url: "https://www.mvaimobiliare.ro/" },
          { name: "Ghiduri", url: "https://www.mvaimobiliare.ro/blog" },
          {
            name: "Garsoniere Militari Residence",
            url: canonical,
          },
        ]}
      />

      <Header />

      <main className="min-h-screen bg-background">
        {/* HERO */}
        <section className="relative bg-brass pt-32 pb-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <Badge variant="outline" className="mb-4">
              Ghid expert · Militari Residence
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Garsoniere Militari Residence — ghid de cumpărare, prețuri și
              investiție
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl">
              Tot ce trebuie să știi despre garsonierele din Militari Residence:
              layout-uri tipice, prețuri actuale, costuri de întreținere și
              potențial de randament la închiriere. Un ghid scris de consultanții
              MVA Imobiliare, specializați pe acest ansamblu.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/militari-residence">
                  Vezi apartamentele disponibile <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contact">
                  <Phone className="mr-2 h-4 w-4" /> Programează vizionare
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* KEY METRICS */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Euro, label: "Preț de pornire", value: "≈ 55.000 €" },
                { icon: Ruler, label: "Suprafață utilă", value: "30–45 mp" },
                { icon: TrendingUp, label: "Randament brut", value: "6–8 % / an" },
                { icon: MapPin, label: "Metrou Păcii", value: "5–10 min" },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="p-5 text-center">
                    <s.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-xl font-bold">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* LAYOUTS */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold mb-4">Layout-uri tipice de garsoniere</h2>
            <p className="text-muted-foreground mb-8">
              În Militari Residence vei găsi în principal trei configurații, în
              funcție de bloc, etaj și an de construcție.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Garsonieră standard",
                  surface: "30–34 mp utili",
                  desc: "Open-space cu bucătărie integrată, baie compactă cu fereastră și balcon. Ideală pentru o persoană sau pentru închiriere studențească.",
                  price: "55.000 – 62.000 €",
                },
                {
                  title: "Garsonieră cu zonă de noapte",
                  surface: "35–40 mp utili",
                  desc: "Living separat de zona de dormit printr-un perete parțial sau bibliotecă. Cea mai populară opțiune pentru cupluri tinere.",
                  price: "62.000 – 70.000 €",
                },
                {
                  title: "Garsonieră dublă / studio plus",
                  surface: "40–48 mp utili",
                  desc: "Dormitor complet separat, living spațios, baie generoasă. Apropiată ca utilitate de un apartament 2 camere mic.",
                  price: "68.000 – 75.000 €",
                },
              ].map((l) => (
                <Card key={l.title}>
                  <CardContent className="p-6">
                    <Home className="h-7 w-7 text-primary mb-3" />
                    <h3 className="font-semibold text-lg mb-1">{l.title}</h3>
                    <div className="text-sm text-muted-foreground mb-3">{l.surface}</div>
                    <p className="text-sm mb-4">{l.desc}</p>
                    <div className="font-bold text-primary">{l.price}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* PRICE TREND */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold mb-4">
              Evoluția prețurilor pentru garsoniere
            </h2>
            <p className="text-muted-foreground mb-8 max-w-3xl">
              În ultimii 3 ani, prețul mediu pe mp pentru garsonierele din Militari
              Residence a crescut constant, susținut de extinderea metroului M5 și
              de cererea ridicată de închiriere.
            </p>
            <Card>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-4 gap-4 text-center">
                  {[
                    { year: "2022", price: "1.450 €/mp" },
                    { year: "2023", price: "1.620 €/mp" },
                    { year: "2024", price: "1.800 €/mp" },
                    { year: "2025", price: "1.900 €/mp" },
                  ].map((y) => (
                    <div key={y.year}>
                      <Calendar className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <div className="text-sm text-muted-foreground">{y.year}</div>
                      <div className="font-bold text-lg">{y.price}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-6 text-center">
                  Estimări MVA Imobiliare pe baza tranzacțiilor intermediate în ansamblu.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ROI */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold mb-4">
              Potențial de investiție și randament la închiriere
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <Wallet className="h-7 w-7 text-primary mb-3" />
                  <h3 className="font-semibold text-lg mb-3">Calcul randament tipic</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Preț achiziție: <strong>65.000 €</strong></li>
                    <li>• Chirie lunară: <strong>400–450 €</strong></li>
                    <li>• Venit anual brut: <strong>4.800–5.400 €</strong></li>
                    <li>• Randament brut: <strong>7,4 – 8,3 %</strong></li>
                    <li>• Recuperare investiție: <strong>~12–14 ani</strong></li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <Building2 className="h-7 w-7 text-primary mb-3" />
                  <h3 className="font-semibold text-lg mb-3">De ce se închiriază rapid</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Metrou M5 — stația Păcii la 5–10 min de mers</li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Apropiere de Politehnica și Cotroceni</li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> AFI Cotroceni și Plaza România la 10 min</li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Clădiri noi, costuri de întreținere reduse</li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Cerere ridicată din partea studenților și tinerilor angajați</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CHECKLIST */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold mb-6">
              Cum alegi cea mai bună garsonieră
            </h2>
            <Card>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    "Preferă etajele 3–7 — închiriere mai ușoară și luminozitate bună",
                    "Orientare sud sau est pentru lumină naturală pe tot parcursul zilei",
                    "Verifică prezența balconului — face diferența la revânzare",
                    "Întreabă de costul lunar de mentenanță (asociație + utilități comune)",
                    "Cere locul de parcare în actul de vânzare, nu doar promisiunea",
                    "Confirmă distanța reală pe jos până la metrou Păcii",
                    "Solicită extras de carte funciară și verifică sarcinile",
                    "Negociază mobilierul inclus pentru investiție la închiriere",
                  ].map((item) => (
                    <div key={item} className="flex gap-2 text-sm">
                      <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* RELATED GUIDES */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl font-bold mb-6">Ghiduri conexe</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link to="/ghid-noua-casa-2024" className="block">
                <Card className="h-full hover:border-primary transition-colors">
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-1">Ghid Noua Casă 2024</h3>
                    <p className="text-sm text-muted-foreground">
                      Cumpără garsoniera cu avans de doar 5%.
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/costuri-tranzactie-imobiliara" className="block">
                <Card className="h-full hover:border-primary transition-colors">
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-1">Costuri tranzacție</h3>
                    <p className="text-sm text-muted-foreground">
                      Taxe notariale, intabulare și comisioane explicate.
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/facilitati-militari-residence" className="block">
                <Card className="h-full hover:border-primary transition-colors">
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-1">Facilități Militari Residence</h3>
                    <p className="text-sm text-muted-foreground">
                      Școli, magazine, transport — tot ce e în jurul ansamblului.
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl font-bold mb-4">
              Cauți o garsonieră în Militari Residence?
            </h2>
            <p className="mb-8 opacity-90">
              Avem acces la unități off-market și te însoțim de la prima vizionare
              până la semnarea actelor.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/militari-residence">Vezi ofertele active</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <Link to="/contact">
                  <Phone className="mr-2 h-4 w-4" /> Sună consultantul
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default GarsoniereMilitariResidence;
