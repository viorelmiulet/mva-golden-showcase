import { Helmet } from "@/lib/helmet-compat";
import { Link } from "@/lib/router-compat";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Bus,
  ShoppingBag,
  GraduationCap,
  Stethoscope,
  Trees,
  Building2,
  Euro,
  ArrowRight,
  Calendar,
  Phone,
} from "lucide-react";

/**
 * SEO landing guide for the keyword "militari residence" (~18.1k vol / KDI 27).
 * Long-form, top-of-funnel content covering amenities, transport, schools,
 * lifestyle and prices. Internally links to the offer page /militari-residence
 * and the agency contact page.
 */
const GhidMilitariResidence = () => {
  const canonical = "https://www.mvaimobiliare.ro/ghid-militari-residence";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Ghid complet Militari Residence 2026 — cartier, prețuri, transport, școli și viață",
    description:
      "Ghid complet despre Militari Residence: locație, transport STB și metrou, școli, magazine, parcuri, prețuri apartamente și sfaturi pentru cumpărători.",
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
        name: "Unde este Militari Residence?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Militari Residence se află în comuna Chiajna, județul Ilfov, la granița directă cu Sectorul 6 din București, în zona de vest a Capitalei, la aproximativ 2 km de stația de metrou Pacii.",
        },
      },
      {
        "@type": "Question",
        name: "Cât costă un apartament în Militari Residence în 2026?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "În 2026, prețurile pornesc de la aproximativ 50.000€ pentru garsoniere, 70.000–90.000€ pentru apartamente cu 2 camere și 95.000–130.000€ pentru cele cu 3 camere, în funcție de bloc, etaj și finisaje.",
        },
      },
      {
        "@type": "Question",
        name: "Cum ajungi din Militari Residence în centrul Bucureștiului?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Cu mașina pe Autostrada A1 și Bulevardul Iuliu Maniu durează 20–30 de minute. Cu transportul în comun, autobuzele STB 178, 278 și 336 conectează cartierul cu stația de metrou Pacii (M3), de unde ajungi în Piața Unirii în circa 20 de minute.",
        },
      },
      {
        "@type": "Question",
        name: "Sunt școli și grădinițe în Militari Residence?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Da. În cartier funcționează Școala Gimnazială nr. 1 Chiajna, mai multe grădinițe private (Smart Kids, Happy Kids, Olga Gudynn) și creșe particulare. Liceele importante din Sectorul 6 sunt la 10–15 minute distanță.",
        },
      },
      {
        "@type": "Question",
        name: "Merită să cumperi în Militari Residence?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Da, pentru raportul preț/suprafață imbatabil în vestul Bucureștiului, infrastructură comercială completă (Auchan, Carrefour, Cora la câțiva pași) și acces rapid la metroul Pacii. Este o alegere potrivită pentru prima locuință și pentru investiție în închiriere.",
        },
      },
    ],
  };

  const amenities = [
    {
      icon: ShoppingBag,
      title: "Cumpărături la pas",
      text: "Auchan Militari, Carrefour Militari, Cora Lujerului, Decathlon, Mega Image și piețe agroalimentare la 5–10 minute cu mașina.",
    },
    {
      icon: GraduationCap,
      title: "Școli și grădinițe",
      text: "Școala Gimnazială nr. 1 Chiajna, grădinițe Smart Kids, Happy Kids, Olga Gudynn, plus creșe private în interiorul cartierului.",
    },
    {
      icon: Stethoscope,
      title: "Sănătate aproape",
      text: "Clinici Regina Maria, MedLife și Sanador la 10 minute, plus farmacii Catena și Sensiblu chiar în Militari Residence.",
    },
    {
      icon: Trees,
      title: "Spații verzi",
      text: "Parcul Liniei și Parcul Militari pentru plimbări, alei pietonale și locuri de joacă noi între blocuri.",
    },
    {
      icon: Bus,
      title: "Transport STB & metrou",
      text: "Autobuzele 178, 278 și 336 spre metroul Pacii (M3). Acces direct la A1 și DN1A pentru ieșire rapidă din oraș.",
    },
    {
      icon: Building2,
      title: "Apartamente moderne",
      text: "Blocuri noi cu finisaje contemporane, lift, parcare proprie, balcon și boxe la subsol. Disponibile garsoniere, 2 și 3 camere.",
    },
  ];

  const priceRows = [
    { type: "Garsonieră (1 cameră)", surface: "30–40 mp", price: "50.000 – 65.000 €" },
    { type: "Apartament 2 camere", surface: "48–60 mp", price: "70.000 – 90.000 €" },
    { type: "Apartament 3 camere", surface: "65–80 mp", price: "95.000 – 130.000 €" },
    { type: "Apartament 4 camere", surface: "85–110 mp", price: "130.000 – 170.000 €" },
  ];

  return (
    <>
      <Helmet>
        <title>Ghid Militari Residence 2026 — cartier, prețuri, transport</title>
        <meta
          name="description"
          content="Ghid complet Militari Residence: locație, transport STB și metrou Pacii, școli, magazine, parcuri și prețuri apartamente 2026. Sfaturi MVA Imobiliare."
        />
        <link rel="canonical" href={canonical} />
        <meta
          name="keywords"
          content="militari residence, ghid militari residence, apartamente militari residence, chiajna apartamente, militari residence pret, militari residence harta"
        />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta
          property="og:title"
          content="Ghid Militari Residence 2026 — cartier, prețuri, transport"
        />
        <meta
          property="og:description"
          content="Tot ce trebuie să știi înainte să cumperi în Militari Residence: locație, amenajări, transport, școli, prețuri și sfaturi din partea MVA Imobiliare."
        />
        <meta property="og:image" content="https://www.mvaimobiliare.ro/og-image.jpg" />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <BreadcrumbSchema
        items={[
          { name: "Acasă", url: "/" },
          { name: "Ghid Militari Residence", url: "/ghid-militari-residence" },
        ]}
      />

      <Header />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/50 bg-stone">
          <div className="container mx-auto max-w-5xl px-4 py-16 md:py-24">
            <Badge className="mb-4" variant="secondary">
              <MapPin className="mr-1.5 h-3.5 w-3.5" /> Chiajna, Ilfov · Vestul Bucureștiului
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              Ghid complet Militari Residence 2026
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
              Tot ce trebuie să știi înainte să cumperi sau să te muți în Militari Residence:
              locație, transport, școli, magazine, parcuri, prețurile actuale ale apartamentelor și
              sfaturi practice de la consultanții MVA Imobiliare, agenție locală cu zeci de
              tranzacții finalizate în acest cartier.
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

        {/* Quick facts */}
        <section className="container mx-auto max-w-5xl px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Locație", value: "Chiajna, Ilfov" },
              { label: "Distanță metrou Pacii", value: "≈ 2 km" },
              { label: "Preț de la", value: "50.000 €" },
              { label: "Tip locuințe", value: "1–4 camere" },
            ].map((stat) => (
              <Card key={stat.label} className="text-center">
                <CardContent className="py-6">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-foreground">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Where is it */}
        <section className="container mx-auto max-w-5xl px-4 py-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Unde este Militari Residence?
          </h2>
          <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Militari Residence este unul dintre cele mai mari ansambluri rezidențiale din vestul
              Bucureștiului, situat în comuna Chiajna, județul Ilfov, exact la granița cu Sectorul
              6. Cartierul s-a dezvoltat începând cu 2010 în jurul DN1A și al bulevardului Iuliu
              Maniu, devenind un punct de reper pentru tinerii care își cumpără prima locuință în
              Capitală.
            </p>
            <p>
              Accesul în oraș se face prin Bulevardul Iuliu Maniu, Autostrada A1 și DN1A, iar
              stația de metrou <strong>Pacii (M3)</strong> se află la aproximativ 2 kilometri.
              Centrul Bucureștiului (Piața Unirii) este la 20–30 de minute cu mașina în afara
              orelor de vârf și la circa 35–40 de minute cu transportul în comun.
            </p>
          </div>
        </section>

        {/* Amenities */}
        <section className="container mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Ce găsești în Militari Residence
          </h2>
          <p className="mt-3 text-muted-foreground">
            Cartierul este complet din punct de vedere al serviciilor de zi cu zi: cumpărături,
            școli, sănătate, spații verzi și transport public.
          </p>
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {amenities.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title}>
                  <CardContent className="pt-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {item.text}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Transport */}
        <section className="container mx-auto max-w-5xl px-4 py-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Transport: cum ajungi în oraș
          </h2>
          <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Cea mai bună veste pentru locuitorii din Militari Residence este apropierea de stația
              de metrou <strong>Pacii (M3)</strong>. Liniile STB <strong>178, 278 și 336</strong>{" "}
              conectează cartierul de stația de metrou la intervale de 10–15 minute, iar de acolo
              ajungi în Piața Victoriei sau Unirii fără schimbare.
            </p>
            <p>
              Pentru cei care preferă mașina, accesul la <strong>Autostrada A1</strong> spre Pitești
              și ieșirea spre Centura Bucureștiului este la mai puțin de 5 minute. Bulevardul Iuliu
              Maniu este artera principală spre centru, iar DN1A te duce rapid spre Buftea și
              nordul Capitalei.
            </p>
          </div>
        </section>

        {/* Prices */}
        <section className="container mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Prețuri apartamente Militari Residence în 2026
          </h2>
          <p className="mt-3 text-muted-foreground">
            Prețurile orientative pentru apartamente noi, finalizate sau în stadiu avansat de
            construcție. Variațiile țin de bloc, etaj, orientare și pachetul de finisaje.
          </p>
          <div className="mt-6 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-foreground">Tip locuință</th>
                  <th className="px-4 py-3 text-sm font-semibold text-foreground">Suprafață utilă</th>
                  <th className="px-4 py-3 text-sm font-semibold text-foreground">Preț orientativ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {priceRows.map((row) => (
                  <tr key={row.type}>
                    <td className="px-4 py-3 text-sm text-foreground">{row.type}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{row.surface}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      <Euro className="inline h-3.5 w-3.5 mr-1 text-primary" />
                      {row.price.replace("€", "").trim()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            * Prețuri orientative, actualizate de echipa MVA Imobiliare. Pentru ofertele active de
            astăzi, vezi pagina noastră dedicată cu{" "}
            <Link to="/militari-residence" className="text-primary underline">
              apartamente de vânzare în Militari Residence
            </Link>
            .
          </p>
        </section>

        {/* Lifestyle */}
        <section className="container mx-auto max-w-5xl px-4 py-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Cum se trăiește în Militari Residence
          </h2>
          <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Comunitatea din Militari Residence este în mare parte formată din familii tinere și
              cupluri la prima locuință. Atmosfera este una activă: terase, săli de fitness,
              cabinete medicale, frizerii, restaurante și magazine de proximitate au apărut natural
              în jurul blocurilor.
            </p>
            <p>
              Pentru timpul liber, Parcul Liniei și Parcul Militari oferă spațiu pentru alergare și
              plimbări cu copiii, iar mall-urile AFI Cotroceni și Plaza România sunt la 15–20 de
              minute. Pentru ieșiri în afara orașului, accesul la A1 face din weekenduri o
              chestiune simplă.
            </p>
          </div>
        </section>

        {/* Why MVA */}
        <section className="container mx-auto max-w-5xl px-4 py-12">
          <Card className="bg-brass border-primary/20">
            <CardContent className="py-8 md:py-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                De ce să cumperi prin MVA Imobiliare
              </h2>
              <p className="mt-3 text-muted-foreground">
                Suntem agenția locală cu cele mai multe tranzacții finalizate în Militari Residence
                și ansamblurile învecinate. Cunoaștem fiecare bloc, fiecare dezvoltator și fiecare
                etapă a procesului — de la vizionare până la semnarea actelor la notariat.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                <li>• Acces la apartamente listate și nelistate public</li>
                <li>• Evaluare gratuită și comparație cu alte ansambluri din zonă</li>
                <li>• Asistență la credit ipotecar și acte notariale</li>
                <li>• Vizionări coordonate într-o singură deplasare</li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/militari-residence">
                    Vezi ofertele Militari Residence <ArrowRight className="ml-2 h-4 w-4" />
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

        {/* Related links */}
        <section className="container mx-auto max-w-5xl px-4 pb-16">
          <h2 className="text-xl font-bold text-foreground">Continuă să explorezi</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/militari-residence"
              className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-muted transition"
            >
              Apartamente Militari Residence
            </Link>
            <Link
              to="/renew-residence"
              className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-muted transition"
            >
              Renew Residence
            </Link>
            <Link
              to="/eurocasa-residence"
              className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-muted transition"
            >
              Eurocasa Residence
            </Link>
            <Link
              to="/complexe"
              className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-muted transition"
            >
              Toate ansamblurile
            </Link>
            <Link
              to="/blog"
              className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-muted transition"
            >
              Blog imobiliar
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default GhidMilitariResidence;
