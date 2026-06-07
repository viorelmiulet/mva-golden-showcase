import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Trees,
  Dumbbell,
  ShoppingBag,
  GraduationCap,
  Stethoscope,
  UtensilsCrossed,
  Bus,
  ArrowRight,
  Phone,
  Coffee,
  Baby,
} from "lucide-react";

/**
 * SEO landing page focused on lifestyle and amenities in Militari Residence.
 * Targets high-intent searches from buyers researching the area before choosing
 * a specific property. Distinct from GhidMilitariResidence (general guide + prices).
 */
const FacilitatiMilitariResidence = () => {
  const canonical = "https://www.mvaimobiliare.ro/facilitati-militari-residence";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Facilități și stil de viață în Militari Residence — tot ce oferă zona",
    description:
      "Descoperă facilitățile din Militari Residence: parcuri, săli de fitness, centre comerciale, școli, restaurante și viața de cartier. Ghid complet pentru viitori locuitori.",
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
        name: "Ce facilități există în Militari Residence?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Militari Residence oferă parcuri și spații verzi, centre comerciale (Auchan, Carrefour, Cora), săli de fitness, clinici private, școli și grădinițe, restaurante și cafenele, plus acces rapid la metrou și autostradă.",
        },
      },
      {
        "@type": "Question",
        name: "Unde poți face cumpărături în Militari Residence?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "În zonă găsești Auchan Militari, Carrefour, Cora Lujerului, Militari Shopping Center, La Strada și numeroase magazine de proximitate. Sunt disponibile și piețe agroalimentare pentru producători locali.",
        },
      },
      {
        "@type": "Question",
        name: "Există școli și grădinițe în apropiere?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Da. În și lângă Militari Residence funcționează Școala Gimnazială nr. 1 Chiajna, grădinițe private (Smart Kids, Happy Kids, Olga Gudynn) și creșe. Liceele din Sectorul 6 sunt la 10–15 minute.",
        },
      },
      {
        "@type": "Question",
        name: "Ce opțiuni de sport și relaxare există?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Zona dispune de săli de fitness, centre Wellness & Spa, parcuri cu alei pentru alergare și plimbări, locuri de joacă pentru copii și terenuri de sport în interiorul cartierului.",
        },
      },
    ],
  };

  const lifestyleSections = [
    {
      icon: Trees,
      title: "Parcuri și spații verzi",
      items: [
        "Parcul Liniei — alei pentru plimbări, zona de relaxare",
        "Parcul Militari — spații de joacă moderne pentru copii",
        "Zone verzi amenajate între blocuri cu bănci și iluminat",
        "Apropiere de pădurea și lacurile din nord-vestul Bucureștiului",
      ],
    },
    {
      icon: ShoppingBag,
      title: "Centre comerciale și cumpărături",
      items: [
        "Auchan Militari — hipermarket complet la câțiva minute",
        "Carrefour și Cora Lujerului — alternative pentru cumpărături",
        "Militari Shopping Center — magazine, servicii și food court",
        "La Strada — retail de proximitate și cafenele",
        "Mega Image, Lidl și piețe agroalimentare zilnice",
      ],
    },
    {
      icon: Dumbbell,
      title: "Sport, fitness și wellness",
      items: [
        "Săli de fitness moderne în și lângă cartier",
        "Centre Wellness & Spa pentru relaxare după program",
        "Terenuri de sport și spații pentru activități în aer liber",
        "Alergare și ciclism în parcurile din vecinătate",
        "Acces rapid la complexe sportive din Sectorul 6",
      ],
    },
    {
      icon: GraduationCap,
      title: "Educație și școli",
      items: [
        "Școala Gimnazială nr. 1 Chiajna — în proximitatea cartierului",
        "Grădinițe private: Smart Kids, Happy Kids, Olga Gudynn",
        "Creșe particulare cu program prelungit pentru părinți activi",
        "Licee importante din Sectorul 6 la 10–15 minute",
        "After-school și centre de meditații în zonă",
      ],
    },
    {
      icon: Stethoscope,
      title: "Sănătate și farmacii",
      items: [
        "Clinici Regina Maria, MedLife și Sanador la 10 minute",
        "Farmacii Catena și Sensiblu în interiorul cartierului",
        "Cabinete stomatologice și de medicină de familie",
        "Spitale de urgență în Sectorul 6 la distanță scurtă",
        "Ambulanță și servicii medicale la domiciliu disponibile",
      ],
    },
    {
      icon: UtensilsCrossed,
      title: "Restaurante, cafenele și divertisment",
      items: [
        "Terase și restaurante cu bucătărie românească și internațională",
        "Cafenele și cowork spaces pentru remote work",
        "AFI Cotroceni și Plaza România la 15–20 de minute",
        "Cinematografe, bowling și spații de joacă pentru copii",
        "Livrare rapidă de la majoritatea restaurantelor din vestul orașului",
      ],
    },
  ];

  const transportPerks = [
    {
      icon: Bus,
      title: "Metrou și STB",
      text: "Stația Pacii (M3) la 2 km, conectată cu liniile 178, 278 și 336. Centrul orașului în 30–40 de minute.",
    },
    {
      icon: MapPin,
      title: "Acces auto rapid",
      text: "A1, DN1A și Bulevardul Iuliu Maniu pentru ieșire rapidă din oraș sau către centrul Capitalei.",
    },
    {
      icon: Coffee,
      title: "Viață de cartier",
      text: "Blocații au creat natural un ecosistem de proximitate: frizerii, service auto, florării și service-uri la parter.",
    },
    {
      icon: Baby,
      title: "Familii tinere",
      text: "Majoritatea locuitorilor sunt familii tinere și cupluri la prima locuință, cu o comunitate activă și dinamică.",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Facilități Militari Residence — stil de viață, magazine, școli, parcuri</title>
        <meta
          name="description"
          content="Descoperă facilitățile din Militari Residence: parcuri, centre comerciale, săli fitness, școli, restaurante și viața de cartier. Ghid complet pentru viitori locuitori."
        />
        <link rel="canonical" href={canonical} />
        <meta
          name="keywords"
          content="facilitati militari residence, militari residence lifestyle, parcuri militari residence, scoli chiajna, centre comerciale militari, wellness spa militari, la strada militari"
        />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta
          property="og:title"
          content="Facilități și stil de viață în Militari Residence"
        />
        <meta
          property="og:description"
          content="Descoperă ce oferă viața în Militari Residence: parcuri, magazine, fitness, școli și restaurante — ghid complet MVA Imobiliare."
        />
        <meta property="og:image" content="https://www.mvaimobiliare.ro/og-image.jpg" />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <BreadcrumbSchema
        items={[
          { name: "Acasă", url: "/" },
          { name: "Facilități Militari Residence", url: "/facilitati-militari-residence" },
        ]}
      />

      <Header />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/50 bg-gradient-to-b from-muted/40 to-background">
          <div className="container mx-auto max-w-5xl px-4 py-16 md:py-24">
            <Badge className="mb-4" variant="secondary">
              <MapPin className="mr-1.5 h-3.5 w-3.5" /> Chiajna, Ilfov · Lifestyle & facilități
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              Facilități și stil de viață în Militari Residence
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
              Militari Residence nu este doar un ansamblu de blocuri — este o comunitate
              completă. Descoperă parcurile, centrele comerciale, școlile, sălile de fitness
              și restaurantele care fac din acest cartier una dintre cele mai atractive zone
              pentru familiile tinere din vestul Bucureștiului.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/militari-residence">
                  Vezi apartamentele disponibile <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contact">
                  <Phone className="mr-2 h-4 w-4" /> Programează o vizionare
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Quick intro */}
        <section className="container mx-auto max-w-5xl px-4 py-12">
          <p className="text-muted-foreground leading-relaxed text-lg">
            Când alegi o zonă pentru noua ta locuință, facilitățile din jur contează la fel de
            mult ca apartamentul în sine. Militari Residence a crescut organic în jurul
            nevoilor rezidenților: de la hipermarketuri și farmacii până la parcuri, școli și
            centre de wellness, totul este la maxim 10–15 minute de mers pe jos sau cu mașina.
            Mai jos îți prezentăm tot ce oferă zona, ca să îți faci o imagine completă despre
            viața de zi cu zi aici.
          </p>
        </section>

        {/* Lifestyle sections */}
        <section className="container mx-auto max-w-5xl px-4 py-8">
          <div className="space-y-16">
            {lifestyleSections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                      {section.title}
                    </h2>
                  </div>
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {section.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-muted-foreground"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* Transport & community */}
        <section className="container mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
            Conexiuni și comunitate
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {transportPerks.map((perk) => {
              const Icon = perk.icon;
              return (
                <Card key={perk.title}>
                  <CardContent className="pt-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-semibold text-foreground">{perk.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {perk.text}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Lifestyle callout */}
        <section className="container mx-auto max-w-5xl px-4 py-12">
          <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20">
            <CardContent className="py-8 md:py-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                De ce este Militari Residence alegerea potrivită pentru stilul tău de viață
              </h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Fie că ești la prima locuință, fie că te muți cu familia, Militari Residence
                oferă un echilibru rar în București: prețuri accesibile, natură la doi pași,
                infrastructură comercială dezvoltată și acces rapid la oraș. Comunitatea
                tânără și dinamică a atras rapid serviciile esențiale — de la cafenele și
                restaurante până la grădinițe și clinici private — astfel că aici poți trăi
                confortabil fără să faci zilnic drumuri lung spre centru.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/militari-residence">
                    Explorează ofertele de apartamente <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/ghid-militari-residence">
                    Ghid complet prețuri și transport
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section className="container mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
            Întrebări frecvente despre facilități
          </h2>
          <div className="space-y-6">
            {faqSchema.mainEntity.map((faq) => (
              <Card key={faq.name}>
                <CardContent className="py-5">
                  <h3 className="font-semibold text-foreground">{faq.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {faq.acceptedAnswer.text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default FacilitatiMilitariResidence;
