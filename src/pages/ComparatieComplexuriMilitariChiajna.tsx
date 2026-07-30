import { Helmet } from "react-helmet-async";
import { Link } from "@/lib/router-compat";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, Car, Wrench, Euro, ArrowRight, Phone, CheckCircle2 } from "lucide-react";

/**
 * SEO comparison guide: Militari Residence vs Eurocasa vs Renew Residence.
 * Targets "militari residence" (~18.1k vol, KDI 27 RO) with comparison-format content
 * covering parking, building materials, maintenance costs.
 */
const ComparatieComplexuriMilitariChiajna = () => {
  const canonical =
    "https://www.mvaimobiliare.ro/comparatie-complexuri-militari-chiajna";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline:
      "Comparație complexuri Militari & Chiajna 2026 — Militari Residence vs Eurocasa vs Renew Residence",
    description:
      "Comparație detaliată a celor mai populare ansambluri din zona Militari-Chiajna: prețuri, locuri de parcare, materiale de construcție, costuri de întreținere și facilități.",
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
        name: "Care complex din Militari are cele mai multe locuri de parcare?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Eurocasa Residence oferă cel mai bun raport apartamente/locuri de parcare (aproximativ 1:1 subteran), urmat de Renew Residence cu parcări supraterane și subterane. Militari Residence are parcare în general supraterană, suficientă dar mai aglomerată în orele de vârf.",
        },
      },
      {
        "@type": "Question",
        name: "Ce materiale de construcție folosesc complexele din Militari?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Toate cele trei complexe folosesc structură pe cadre din beton armat cu zidărie BCA. Renew Residence și Eurocasa folosesc termoizolație vată minerală de 10 cm și tâmplărie PVC cu geam termopan tristrat. Militari Residence folosește predominant polistiren expandat de 10 cm și termopan dublu stratificat.",
        },
      },
      {
        "@type": "Question",
        name: "Cât costă întreținerea într-un apartament din Militari Residence?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Întreținerea medie variază între 250-450 lei/lună pentru un apartament cu 2 camere, în funcție de complex și sezon. Eurocasa și Renew au costuri ușor mai mari (300-450 lei) datorită facilităților premium, iar Militari Residence se încadrează la 250-350 lei/lună.",
        },
      },
      {
        "@type": "Question",
        name: "Care complex are cel mai bun raport calitate-preț?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Pentru investiție pură, Militari Residence oferă cele mai mici prețuri pe metru pătrat. Pentru locuit confortabil pe termen lung, Renew Residence și Eurocasa oferă un raport calitate-preț superior datorită finisajelor și facilităților incluse.",
        },
      },
    ],
  };

  const complexes = [
    {
      name: "Militari Residence",
      location: "Roșu, Chiajna",
      price: "950 - 1.350 €/mp",
      parking: "Suprateran (1:1)",
      materials: "Beton + BCA, polistiren 10cm",
      maintenance: "250 - 350 lei/lună",
      link: "/militari-residence",
      tag: "Cel mai accesibil",
    },
    {
      name: "Eurocasa Residence",
      location: "Militari, Chiajna",
      price: "1.250 - 1.650 €/mp",
      parking: "Subteran + suprateran (1:1)",
      materials: "Beton + BCA, vată minerală 10cm",
      maintenance: "300 - 420 lei/lună",
      link: "/eurocasa-residence",
      tag: "Premium accesibil",
    },
    {
      name: "Renew Residence",
      location: "Militari, București",
      price: "1.400 - 1.850 €/mp",
      parking: "Subteran + suprateran",
      materials: "Beton + BCA, vată minerală 10cm, tristrat",
      maintenance: "350 - 450 lei/lună",
      link: "/renew-residence",
      tag: "Confort maxim",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Comparație Militari Residence vs Eurocasa vs Renew 2026</title>
        <meta
          name="description"
          content="Comparație detaliată a complexurilor din Militari-Chiajna: Militari Residence, Eurocasa și Renew. Prețuri, parcare, materiale, întreținere. Alege informat."
        />
        <meta
          name="keywords"
          content="militari residence, comparatie complexuri militari, eurocasa vs renew, apartamente militari chiajna, complex rezidential militari"
        />
        <link rel="canonical" href={canonical} />
        <meta
          property="og:title"
          content="Comparație complexuri Militari & Chiajna — Militari Residence vs Eurocasa vs Renew"
        />
        <meta
          property="og:description"
          content="Tabel comparativ: prețuri, parcare, materiale, întreținere pentru cele mai populare ansambluri din zona Militari-Chiajna."
        />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <BreadcrumbSchema
        items={[
          { name: "Acasă", url: "https://www.mvaimobiliare.ro/" },
          { name: "Ghiduri", url: "https://www.mvaimobiliare.ro/blog" },
          { name: "Comparație complexuri Militari-Chiajna", url: canonical },
        ]}
      />

      <Header />

      <main className="container mx-auto max-w-5xl px-4 py-12">
        <article>
          <header className="mb-10">
            <Badge variant="secondary" className="mb-3">
              Ghid comparativ 2026
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Comparație complexuri Militari & Chiajna: Militari Residence vs Eurocasa vs Renew Residence
            </h1>
            <p className="text-lg text-muted-foreground">
              Analiză detaliată a celor mai populare trei ansambluri rezidențiale din zona Militari-Chiajna.
              Comparăm prețuri, locuri de parcare, materiale de construcție și costuri de întreținere
              pentru a te ajuta să alegi apartamentul potrivit.
            </p>
          </header>

          <section className="grid md:grid-cols-3 gap-4 mb-12">
            {complexes.map((c) => (
              <Card key={c.name}>
                <CardContent className="p-5">
                  <Badge className="mb-2">{c.tag}</Badge>
                  <h2 className="font-semibold text-lg mb-1">{c.name}</h2>
                  <p className="text-sm text-muted-foreground mb-3">{c.location}</p>
                  <p className="text-sm mb-4">
                    <Euro className="inline w-4 h-4 mr-1" />
                    {c.price}
                  </p>
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link to={c.link}>
                      Vezi complexul <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Tabel comparativ rapid</h2>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Criteriu</TableHead>
                    <TableHead>Militari Residence</TableHead>
                    <TableHead>Eurocasa</TableHead>
                    <TableHead>Renew Residence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Preț (€/mp)</TableCell>
                    <TableCell>950 - 1.350</TableCell>
                    <TableCell>1.250 - 1.650</TableCell>
                    <TableCell>1.400 - 1.850</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Parcare</TableCell>
                    <TableCell>Suprateran</TableCell>
                    <TableCell>Subteran + suprateran</TableCell>
                    <TableCell>Subteran + suprateran</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Termoizolație</TableCell>
                    <TableCell>Polistiren 10cm</TableCell>
                    <TableCell>Vată minerală 10cm</TableCell>
                    <TableCell>Vată minerală 10cm</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Tâmplărie</TableCell>
                    <TableCell>PVC dublu stratificat</TableCell>
                    <TableCell>PVC tristrat</TableCell>
                    <TableCell>PVC tristrat low-e</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Întreținere (2 cam)</TableCell>
                    <TableCell>250 - 350 lei</TableCell>
                    <TableCell>300 - 420 lei</TableCell>
                    <TableCell>350 - 450 lei</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Lift</TableCell>
                    <TableCell>Standard</TableCell>
                    <TableCell>Standard + de marfă</TableCell>
                    <TableCell>Premium silențios</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Spații verzi</TableCell>
                    <TableCell>Comunitare</TableCell>
                    <TableCell>Amenajate, loc joacă</TableCell>
                    <TableCell>Parc privat, loc joacă</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Distanță metrou Păcii</TableCell>
                    <TableCell>~3 km</TableCell>
                    <TableCell>~2 km</TableCell>
                    <TableCell>~1.5 km</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="mb-12 space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <Car className="w-6 h-6 text-primary" /> Locuri de parcare
              </h2>
              <p className="text-muted-foreground mb-3">
                Parcarea este una dintre cele mai mari probleme în orice complex rezidențial din București.
                <strong> Eurocasa</strong> și <strong>Renew Residence</strong> oferă parcări subterane incluse
                sau opționale (între 6.000-12.000 €), reducând aglomerația din curte. <strong>Militari
                Residence</strong> mizează pe parcări supraterane, suficiente ca număr dar cu trafic intens
                seara și dimineața.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-primary" /> Materiale de construcție
              </h2>
              <p className="text-muted-foreground mb-3">
                Toate trei folosesc structură pe cadre din beton armat cu zidărie BCA — standard pentru
                seismicitate clasa 1. Diferențele apar la termoizolație: <strong>vata minerală</strong>
                folosită la Eurocasa și Renew oferă protecție mai bună la foc și performanță acustică
                superioară față de <strong>polistirenul</strong> de la Militari Residence. Tâmplăria
                tristrat reduce pierderile de căldură cu până la 25% față de dublul stratificat.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <Wrench className="w-6 h-6 text-primary" /> Costuri de întreținere
              </h2>
              <p className="text-muted-foreground mb-3">
                Întreținerea lunară este influențată de mărimea apartamentului, sezon, dar mai ales de
                facilitățile comune. Complexele cu pază 24/7, lift premium, parc amenajat și parcare subterană
                (Eurocasa, Renew) au costuri cu 20-30% mai mari, dar oferă servicii care la individual ar
                costa mult mai mult.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Care complex ți se potrivește?</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-5">
                  <CheckCircle2 className="w-6 h-6 text-primary mb-2" />
                  <h3 className="font-semibold mb-2">Alege Militari Residence dacă...</h3>
                  <p className="text-sm text-muted-foreground">
                    Cauți cea mai bună intrare în piață la cel mai mic preț pe metru pătrat, ești investitor
                    pentru închiriere sau prim-cumpărător cu buget restrâns.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <CheckCircle2 className="w-6 h-6 text-primary mb-2" />
                  <h3 className="font-semibold mb-2">Alege Eurocasa dacă...</h3>
                  <p className="text-sm text-muted-foreground">
                    Vrei un compromis echilibrat între preț și calitate, cu parcare subterană și finisaje
                    premium, mai aproape de metrou.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <CheckCircle2 className="w-6 h-6 text-primary mb-2" />
                  <h3 className="font-semibold mb-2">Alege Renew Residence dacă...</h3>
                  <p className="text-sm text-muted-foreground">
                    Prioritizezi confortul pe termen lung: vată minerală, tâmplărie tristrat, parc privat și
                    distanță minimă față de metrou.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="bg-muted/40 rounded-xl p-6 md:p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Ai nevoie de o opinie personalizată?</h2>
            <p className="text-muted-foreground mb-5">
              Consultanții MVA Imobiliare îți pot organiza vizionări la toate cele trei complexe într-o
              singură zi, pentru o decizie informată.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <a href="tel:+40741033677">
                  <Phone className="w-4 h-4 mr-2" /> 0741 033 677
                </a>
              </Button>
              <Button asChild variant="outline">
                <Link to="/contact">Programează vizionare</Link>
              </Button>
            </div>
          </section>

          <nav className="mt-12 grid md:grid-cols-2 gap-3">
            <Button asChild variant="outline">
              <Link to="/militari-vs-chiajna-comparatie">
                Militari vs Chiajna — comparație de zonă <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/ghid-militari-residence">
                Ghid complet Militari Residence <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/facilitati-militari-residence">
                Facilități Militari Residence <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/viata-in-militari-residence">
                Viața în Militari Residence <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </nav>
        </article>
      </main>

      <Footer />
    </>
  );
};

export default ComparatieComplexuriMilitariChiajna;
