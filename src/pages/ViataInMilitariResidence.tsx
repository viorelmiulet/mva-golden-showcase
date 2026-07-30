import { Helmet } from "react-helmet-async";
import { Link } from "@/lib/router-compat";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Users,
  Sun,
  Moon,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ArrowRight,
  Phone,
  Calendar,
  Home,
  Car,
  Baby,
  Coffee,
} from "lucide-react";

/**
 * SEO long-form guide for the keyword cluster "viata in militari residence",
 * "cum e sa locuiesti in militari residence", "apartamente militari".
 * Honest, lived-experience angle (pros & cons, daily routine, community)
 * to complement the existing /ghid-militari-residence and
 * /militari-vs-chiajna-comparatie pages.
 */
const ViataInMilitariResidence = () => {
  const canonical = "https://www.mvaimobiliare.ro/viata-in-militari-residence";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline:
      "Viața în Militari Residence — cum e să locuiești aici în 2026: avantaje, dezavantaje și sfaturi",
    description:
      "Ghid onest despre viața în Militari Residence: comunitate, rutină zilnică, trafic, școli, magazine, avantaje și dezavantaje reale, sfaturi pentru cumpărători de apartamente.",
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
        name: "Cum este să locuiești în Militari Residence?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Militari Residence oferă un stil de viață modern, urban, cu acces rapid la magazine, școli și transport. Comunitatea este formată în mare parte din familii tinere și cupluri la prima locuință, iar atmosfera generală este una activă, cu multe servicii la pas — restaurante, cafenele, săli de fitness, farmacii, cabinete medicale.",
        },
      },
      {
        "@type": "Question",
        name: "Care sunt avantajele Militari Residence?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Avantajele principale sunt prețul accesibil pentru apartamente noi, infrastructura comercială completă (Auchan, Carrefour, Cora la câteva minute), apropierea de metroul Pacii, accesul rapid la Autostrada A1 și comunitatea tânără și activă. Apartamentele sunt finalizate, cu finisaje moderne și parcare proprie.",
        },
      },
      {
        "@type": "Question",
        name: "Care sunt dezavantajele Militari Residence?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Cele mai frecvente nemulțumiri sunt traficul în orele de vârf pe Bulevardul Iuliu Maniu, lipsa unei stații de metrou chiar în cartier (cea mai apropiată, Pacii, este la 2 km), densitatea mare a blocurilor și faptul că administrativ ține de comuna Chiajna, nu de București. Aceste aspecte se compensează însă cu prețul foarte bun pe metru pătrat.",
        },
      },
      {
        "@type": "Question",
        name: "Este Militari Residence un loc bun pentru familii cu copii?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Da. Cartierul are mai multe grădinițe private (Smart Kids, Happy Kids, Olga Gudynn), Școala Gimnazială nr. 1 Chiajna, locuri de joacă între blocuri și acces facil la parcurile Liniei și Militari. Comunitatea de familii tinere este unul dintre principalele motive pentru care zona este populară.",
        },
      },
      {
        "@type": "Question",
        name: "Merită să cumperi apartament în Militari Residence pentru investiție?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Da, raportul preț de achiziție / chirie este unul dintre cele mai bune din Bucureștiului-vest. Apartamentele cu 2 camere se închiriază rapid datorită cererii constante din partea tinerilor profesioniști care lucrează în zona Politehnica, AFI sau care folosesc metroul Pacii.",
        },
      },
    ],
  };

  const pros = [
    {
      icon: Home,
      title: "Apartamente noi la preț accesibil",
      text: "Cel mai bun raport preț/suprafață pentru locuințe noi din vestul Bucureștiului. Garsoniere de la 50.000 €, 2 camere de la 70.000 €.",
    },
    {
      icon: Coffee,
      title: "Tot la pas",
      text: "Auchan, Carrefour, Cora, farmacii, cabinete medicale, săli de fitness, restaurante și cafenele — toate la 5–10 minute de mers pe jos sau cu mașina.",
    },
    {
      icon: Users,
      title: "Comunitate tânără",
      text: "Familii tinere, cupluri la prima locuință, mulți copii. Atmosfera este caldă, activă, ușor de integrat.",
    },
    {
      icon: Car,
      title: "Acces rapid la A1 și DN1A",
      text: "Ieșirea din oraș spre Pitești sau nordul Capitalei se face în mai puțin de 5 minute, ideal pentru weekenduri și deplasări.",
    },
  ];

  const cons = [
    {
      icon: Car,
      title: "Trafic la orele de vârf",
      text: "Bulevardul Iuliu Maniu se aglomerează între 7:30–9:30 și 17:00–19:00. Soluția pentru mulți locuitori: metroul Pacii (2 km).",
    },
    {
      icon: MapPin,
      title: "Administrativ în Chiajna",
      text: "Adresa oficială este în comuna Chiajna, Ilfov — nu în București. Acest detaliu poate influența alegerea școlii sau actele auto.",
    },
    {
      icon: Home,
      title: "Densitate mare a blocurilor",
      text: "Blocurile sunt construite aproape unele de altele, iar spațiul verde dintre ele este limitat. Compensarea vine din parcurile Liniei și Militari.",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Viața în Militari Residence 2026 — avantaje, dezavantaje, sfaturi</title>
        <meta
          name="description"
          content="Cum e să locuiești în Militari Residence: comunitate, rutină zilnică, trafic, școli, magazine. Avantajele și dezavantajele reale ale apartamentelor din Militari Residence."
        />
        <link rel="canonical" href={canonical} />
        <meta
          name="keywords"
          content="viata in militari residence, apartamente militari, militari residence pareri, cum e sa locuiesti militari residence, militari residence comunitate"
        />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta
          property="og:title"
          content="Viața în Militari Residence 2026 — avantaje, dezavantaje, sfaturi"
        />
        <meta
          property="og:description"
          content="Ghid onest, lived-in, despre viața în Militari Residence: comunitate, magazine, școli, trafic și sfaturi pentru cumpărători."
        />
        <meta property="og:image" content="https://www.mvaimobiliare.ro/og-image.jpg" />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <BreadcrumbSchema
        items={[
          { name: "Acasă", url: "/" },
          { name: "Viața în Militari Residence", url: "/viata-in-militari-residence" },
        ]}
      />

      <Header />

      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden border-b border-border/50 bg-stone">
          <div className="container mx-auto max-w-5xl px-4 py-16 md:py-24">
            <Badge className="mb-4" variant="secondary">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Ghid lived-in · 2026
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              Viața în Militari Residence — cum e cu adevărat să locuiești aici
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
              Un ghid onest despre viața de zi cu zi în Militari Residence: comunitate, rutină,
              trafic, școli, magazine, avantaje și dezavantaje reale — scris de echipa MVA
              Imobiliare, agenție locală care a finalizat zeci de tranzacții în cartier și
              cunoaște îndeaproape feedbackul rezidenților.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/militari-residence">
                  Apartamente disponibile <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contact">
                  <Phone className="mr-2 h-4 w-4" /> Vorbește cu un consultant
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Intro */}
        <section className="container mx-auto max-w-5xl px-4 py-12">
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Militari Residence este, de mai bine de un deceniu, cel mai mare ansamblu rezidențial
              din vestul Bucureștiului. Construit în comuna Chiajna, la granița cu Sectorul 6,
              cartierul a atras în primul rând tineri profesioniști și familii care căutau o
              primă locuință accesibilă, dar fără să renunțe la confortul orașului.
            </p>
            <p>
              În 2026, comunitatea numără peste 30.000 de locuitori, iar viața de zi cu zi este
              mult mai matură decât în primii ani: există servicii la pas, școli și grădinițe
              private, parcuri amenajate, cabinete medicale și o rețea de transport STB care
              conectează cartierul cu metroul Pacii.
            </p>
          </div>
        </section>

        {/* Daily routine */}
        <section className="container mx-auto max-w-5xl px-4 py-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            O zi obișnuită în Militari Residence
          </h2>
          <div className="mt-6 grid md:grid-cols-2 gap-5">
            <Card>
              <CardContent className="pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sun className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">Dimineața</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Cafenele deschise de la 7:30, mămici cu cărucioare pe aleile dintre blocuri,
                  copii duși la grădinițe private sau la Școala Gimnazială nr. 1 Chiajna. Pentru
                  navetiști, autobuzele 178, 278 și 336 spre metroul Pacii pleacă la 8–15 minute.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Coffee className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">După-amiaza</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Cumpărături la Auchan, Carrefour sau Mega Image, plimbări în Parcul Liniei,
                  antrenamente la sălile de fitness din cartier. Restaurantele și terasele se umplu
                  în weekend cu familii și grupuri de prieteni.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Baby className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">Cu copii</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Locuri de joacă moderne între blocurile noi, grădinițe cu after-school,
                  cluburi de robotică și sport pentru copii. Mulți părinți organizează grupuri
                  comune pentru transportul școlar.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Moon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">Seara</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Cartierul este liniștit după ora 22:00. Iluminat stradal bun pe aleile
                  principale, supermarketuri non-stop și farmacii de gardă în apropiere.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pros / Cons */}
        <section className="container mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Avantaje și dezavantaje reale
          </h2>
          <p className="mt-3 text-muted-foreground">
            Strânse din peste 100 de discuții cu rezidenți și cumpărători, din 2020 până astăzi.
          </p>

          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <ThumbsUp className="h-5 w-5 text-primary" /> Ce le place rezidenților
              </h3>
              <div className="mt-4 space-y-4">
                {pros.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Card key={item.title}>
                      <CardContent className="pt-5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{item.title}</h4>
                            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                              {item.text}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <ThumbsDown className="h-5 w-5 text-muted-foreground" /> Ce găsesc obositor
              </h3>
              <div className="mt-4 space-y-4">
                {cons.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Card key={item.title}>
                      <CardContent className="pt-5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{item.title}</h4>
                            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                              {item.text}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Community feedback */}
        <section className="container mx-auto max-w-5xl px-4 py-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Ce spun rezidenții
          </h2>
          <div className="mt-6 grid md:grid-cols-3 gap-5">
            {[
              {
                quote:
                  "Ne-am mutat acum 3 ani la 2 camere și nu regretăm. Avem tot la pas, iar copilul are unde să se joace.",
                author: "Andreea, 34 ani",
              },
                {
                quote:
                  "Traficul dimineața e singura problemă. Eu folosesc autobuzul până la Pacii și ajung la birou în 35 de minute.",
                author: "Bogdan, 29 ani",
              },
              {
                quote:
                  "Am cumpărat ca investiție un apartament cu 2 camere. Se închiriază în mai puțin de o săptămână de fiecare dată.",
                author: "Mihai, 41 ani",
              },
            ].map((t) => (
              <Card key={t.author}>
                <CardContent className="pt-6">
                  <p className="text-sm italic text-muted-foreground leading-relaxed">
                    „{t.quote}”
                  </p>
                  <p className="mt-3 text-xs font-medium text-foreground">— {t.author}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Comparison teaser */}
        <section className="container mx-auto max-w-5xl px-4 py-12">
          <Card className="bg-brass border-primary/20">
            <CardContent className="py-8 md:py-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Militari Residence vs alte cartiere din vest
              </h2>
              <p className="mt-3 text-muted-foreground">
                Te întrebi dacă Militari Residence este alegerea potrivită față de zonele
                învecinate Chiajna, Roșu sau Militari clasic? Am pregătit comparații detaliate cu
                prețuri, transport, școli și calitatea vieții.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/militari-vs-chiajna-comparatie">
                    Militari vs Chiajna <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/ghid-militari-residence">Ghid complet Militari Residence</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/facilitati-militari-residence">Facilități Militari Residence</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section className="container mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Întrebări frecvente</h2>
          <div className="mt-6 space-y-4">
            {faqSchema.mainEntity.map((q) => (
              <Card key={q.name}>
                <CardContent className="py-5">
                  <h3 className="font-semibold text-foreground">{q.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {q.acceptedAnswer.text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto max-w-5xl px-4 pb-16">
          <Card>
            <CardContent className="py-8 md:py-10 text-center">
              <h2 className="text-2xl font-bold text-foreground">
                Vrei să vezi apartamentele disponibile?
              </h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                Echipa MVA Imobiliare îți poate organiza vizionări într-o singură deplasare, cu
                acces la oferte listate și nelistate public.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link to="/militari-residence">
                    Vezi apartamentele <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/contact">
                    <Calendar className="mr-2 h-4 w-4" /> Programează vizionare
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default ViataInMilitariResidence;
