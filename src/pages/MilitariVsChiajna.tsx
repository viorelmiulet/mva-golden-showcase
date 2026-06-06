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
  Train,
  GraduationCap,
  Euro,
  ArrowRight,
  Phone,
  CheckCircle2,
  XCircle,
} from "lucide-react";

/**
 * SEO comparison guide: Militari Residence vs. Chiajna.
 * Targets "militari residence" (~18.1k vol) with high-intent comparison content
 * covering price/mp, transport (metrou Pacii), școli și infrastructură.
 */
const MilitariVsChiajna = () => {
  const canonical = "https://www.mvaimobiliare.ro/militari-vs-chiajna-comparatie";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline:
      "Militari Residence vs. Chiajna 2026 — comparație prețuri, transport, școli și stil de viață",
    description:
      "Comparație detaliată Militari Residence vs. Chiajna: preț pe metru pătrat, apropierea de metrou, școli, infrastructură și calitatea vieții. Află care zonă ți se potrivește.",
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
        name: "Militari Residence este în București sau în Chiajna?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Militari Residence este situat administrativ în comuna Chiajna, județul Ilfov, dar se află la granița directă cu Sectorul 6 al Bucureștiului, la doar 2 km de stația de metrou Pacii.",
        },
      },
      {
        "@type": "Question",
        name: "Care zonă are prețuri mai mici, Militari Residence sau Chiajna?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "În 2026, prețul mediu în Militari Residence este 1.450–1.700 €/mp, iar în restul comunei Chiajna (Roșu, Dudu, centru) prețurile pornesc de la 1.150–1.400 €/mp pentru apartamente noi. Chiajna este cu 15–25% mai accesibilă, dar Militari Residence oferă infrastructură mai dezvoltată.",
        },
      },
      {
        "@type": "Question",
        name: "Cum ajung de la Chiajna la metrou?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Din Militari Residence ajungi la metrou Pacii (M3) în 10–15 minute cu autobuzele STB 178, 278 sau 336. Din restul Chiajnei (Roșu, Dudu) timpul de transport este de 25–40 de minute, în funcție de trafic.",
        },
      },
      {
        "@type": "Question",
        name: "Există școli și grădinițe în Militari Residence și Chiajna?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Militari Residence are școala generală nouă „Militari Residence”, grădinițe private și acces rapid la Liceul Tudor Vladimirescu. Comuna Chiajna are școli publice în Roșu și Dudu, plus mai multe grădinițe private. Pentru licee și facultăți, ambele zone depind de Sectorul 6.",
        },
      },
      {
        "@type": "Question",
        name: "Ce zonă recomandați pentru familiile cu copii?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Militari Residence este preferat de familii pentru densitatea de servicii (școli, supermarketuri, parcuri, clinici). Chiajna (Roșu, Dudu) este mai potrivită celor care vor case sau apartamente mai mari la preț mai mic, dar cu drum mai lung către serviciile din oraș.",
        },
      },
    ],
  };

  const rows = [
    {
      label: "Preț mediu apartament nou (2 camere)",
      militari: "75.000–95.000 €",
      chiajna: "60.000–78.000 €",
    },
    {
      label: "Preț pe metru pătrat",
      militari: "1.450–1.700 €/mp",
      chiajna: "1.150–1.400 €/mp",
    },
    {
      label: "Distanță până la metrou Pacii (M3)",
      militari: "≈ 2 km / 10–15 min cu autobuzul",
      chiajna: "5–9 km / 25–40 min",
    },
    {
      label: "Autobuze STB directe",
      militari: "178, 278, 336, 138",
      chiajna: "178, 138 (acoperire parțială)",
    },
    {
      label: "Școli și grădinițe în cartier",
      militari: "Da — școala Militari Residence + grădinițe private",
      chiajna: "Da — în Roșu, Dudu, centru",
    },
    {
      label: "Supermarketuri / mall",
      militari: "Auchan, Lidl, Mega Image + APAN, Plaza România la 10 min",
      chiajna: "Penny, Lidl punctual; depinde de localitate",
    },
    {
      label: "Acces autostradă A1",
      militari: "≈ 5 min",
      chiajna: "5–10 min",
    },
    {
      label: "Tip dezvoltare",
      militari: "Compact, blocuri noi 2014+, infrastructură proprie",
      chiajna: "Mix case + blocuri, dezvoltare mai dispersată",
    },
    {
      label: "Ritm de vânzare",
      militari: "Lichiditate ridicată, revânzare rapidă",
      chiajna: "Lichiditate medie, dependent de localitate",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Militari Residence vs. Chiajna 2026 — comparație prețuri, metrou, școli</title>
        <meta
          name="description"
          content="Compară Militari Residence și Chiajna: preț pe metru pătrat, distanța până la metroul Pacii, școli și calitate vieții. Ghid 2026 pentru cumpărători."
        />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Militari Residence vs. Chiajna — comparație 2026" />
        <meta
          property="og:description"
          content="Care zonă e mai bună pentru cumpărători: Militari Residence sau Chiajna? Prețuri, metrou, școli, infrastructură."
        />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://www.mvaimobiliare.ro/og-image.jpg" />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <BreadcrumbSchema
        items={[
          { name: "Acasă", url: "https://www.mvaimobiliare.ro/" },
          { name: "Ghiduri", url: "https://www.mvaimobiliare.ro/blog" },
          { name: "Militari Residence vs. Chiajna", url: canonical },
        ]}
      />

      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-background to-muted/40 border-b">
          <div className="container mx-auto px-4 py-12 lg:py-16 max-w-5xl">
            <Badge variant="secondary" className="mb-4">
              Ghid comparativ 2026
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
              Militari Residence vs. Chiajna —{" "}
              <span className="text-gradient-gold">care zonă alegi?</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl leading-relaxed">
              Comparație detaliată între cel mai mare ansamblu rezidențial din vestul
              Bucureștiului și restul comunei Chiajna: prețuri pe metru pătrat,
              apropiere de metroul Pacii, școli, infrastructură și ce zonă oferă cel
              mai bun raport calitate–preț pentru cumpărători în 2026.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="luxury">
                <Link to="/militari-residence">
                  Vezi apartamente Militari Residence
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="tel:0767941512">
                  <Phone className="w-4 h-4 mr-2" />
                  Consiliere gratuită
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Snapshot cards */}
        <section className="container mx-auto px-4 py-10 lg:py-14 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-5">
            <Card className="border-gold/30">
              <CardContent className="p-6">
                <Badge className="bg-gold/15 text-gold border-gold/30 mb-3">
                  Militari Residence
                </Badge>
                <h2 className="text-xl font-bold mb-3">
                  Ansamblu compact, lichiditate ridicată
                </h2>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    Aproximativ 2 km până la metrou Pacii (M3)
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    Infrastructură proprie: școală, supermarketuri, clinici, parcuri
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    Cerere mare → revânzare rapidă
                  </li>
                  <li className="flex gap-2">
                    <XCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    Densitate ridicată, trafic la orele de vârf
                  </li>
                  <li className="flex gap-2">
                    <XCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    Preț pe metru cu 15–25% peste restul comunei
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Badge variant="secondary" className="mb-3">
                  Chiajna (Roșu, Dudu, centru)
                </Badge>
                <h2 className="text-xl font-bold mb-3">
                  Mai accesibilă, mai spațioasă, mai dispersată
                </h2>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    Preț pe metru cu până la 25% mai mic
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    Apartamente și case mai mari pentru același buget
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    Zone liniștite, ideale pentru familii cu mașină
                  </li>
                  <li className="flex gap-2">
                    <XCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    Drum mai lung către metrou (25–40 min)
                  </li>
                  <li className="flex gap-2">
                    <XCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    Servicii și magazine mai disparate
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Comparison table */}
        <section className="container mx-auto px-4 pb-10 max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            Comparație directă: prețuri, transport, infrastructură
          </h2>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="p-3 font-semibold">Criteriu</th>
                  <th className="p-3 font-semibold">Militari Residence</th>
                  <th className="p-3 font-semibold">Restul comunei Chiajna</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-t">
                    <td className="p-3 font-medium">{r.label}</td>
                    <td className="p-3 text-muted-foreground">{r.militari}</td>
                    <td className="p-3 text-muted-foreground">{r.chiajna}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Prețurile sunt estimative, actualizate pentru 2026 pe baza tranzacțiilor
            intermediate de MVA Imobiliare și a ofertelor publice din zonă.
          </p>
        </section>

        {/* Price per square meter */}
        <section className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex items-center gap-3 mb-4">
            <Euro className="w-6 h-6 text-gold" />
            <h2 className="text-2xl sm:text-3xl font-bold">Preț pe metru pătrat (2026)</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Diferența principală între cele două zone este prețul pe metru pătrat.
            În <strong>Militari Residence</strong> media de tranzacționare este
            <strong> 1.450–1.700 €/mp </strong>pentru apartamente noi, în timp ce în
            zonele învecinate ale <strong>comunei Chiajna</strong> (Roșu, Dudu, centru)
            prețurile variază între <strong>1.150 și 1.400 €/mp</strong>. Diferența se
            justifică prin densitatea de servicii, ritmul de vânzare și apropierea
            mai mare de metrou.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Pentru un apartament cu 2 camere de 55 mp, bugetul total pornește de
            <strong> ~63.000 €</strong> în Chiajna și ajunge la <strong>~95.000 €</strong> în
            Militari Residence, în funcție de bloc, etaj și finisaje.
          </p>
        </section>

        {/* Transport */}
        <section className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex items-center gap-3 mb-4">
            <Train className="w-6 h-6 text-gold" />
            <h2 className="text-2xl sm:text-3xl font-bold">Transport și metrou Pacii</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Cel mai important factor pentru navetiști este distanța față de
            <strong> stația de metrou Pacii (M3)</strong>. Din Militari Residence,
            autobuzele STB 178, 278 și 336 te duc la metrou în <strong>10–15 minute</strong>,
            iar de acolo ajungi în Piața Unirii în aproximativ 20 de minute.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Din zonele Roșu și Dudu (Chiajna) timpul ajunge la <strong>25–40 de minute</strong>,
            cu un transfer suplimentar. Pentru cumpărătorii care merg zilnic în centru
            fără mașină, Militari Residence rămâne opțiunea cu cel mai scurt commute.
          </p>
        </section>

        {/* Schools */}
        <section className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap className="w-6 h-6 text-gold" />
            <h2 className="text-2xl sm:text-3xl font-bold">Școli, grădinițe și familii</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-3">
            <strong>Militari Residence</strong> beneficiază de școala gimnazială
            „Militari Residence”, grădinițe private și acces rapid la liceele din
            Sectorul 6 (Tudor Vladimirescu, Grigore Moisil). Densitatea de servicii
            educaționale este superioară mediei zonei.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <strong>Chiajna</strong> dispune de școli publice în Roșu și Dudu și de
            o ofertă în creștere de grădinițe private, însă pentru liceu părinții
            preferă în continuare unitățile din București.
          </p>
        </section>

        {/* Recommendation */}
        <section className="container mx-auto px-4 py-8 max-w-5xl">
          <Card className="border-gold/40 bg-gold/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="w-6 h-6 text-gold" />
                <h2 className="text-2xl font-bold">Ce zonă ți se potrivește?</h2>
              </div>
              <ul className="space-y-3 text-sm sm:text-base text-muted-foreground">
                <li>
                  <strong className="text-foreground">Alege Militari Residence</strong> dacă
                  navetezi zilnic cu metroul, vrei lichiditate la revânzare și
                  apreciezi serviciile la pas (școală, supermarketuri, clinici).
                </li>
                <li>
                  <strong className="text-foreground">Alege Chiajna (Roșu, Dudu)</strong>
                  {" "}dacă ai mașină, vrei spațiu mai mare pentru același buget sau
                  cauți un cartier mai liniștit și o curte proprie.
                </li>
              </ul>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild variant="luxury">
                  <Link to="/proprietati?zone=Militari">
                    Apartamente Militari Residence
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/proprietati?zone=Chiajna">
                    Apartamente Chiajna
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Internal links */}
        <section className="container mx-auto px-4 py-10 max-w-5xl">
          <h2 className="text-xl font-bold mb-3">Citește mai departe</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>
              <Link className="text-gold hover:underline" to="/ghid-militari-residence">
                Ghid complet Militari Residence — cartier, transport, școli, prețuri
              </Link>
            </li>
            <li>
              <Link className="text-gold hover:underline" to="/militari-residence">
                Apartamente disponibile în Militari Residence
              </Link>
            </li>
            <li>
              <Link className="text-gold hover:underline" to="/apartamente-2-camere-militari">
                Apartamente 2 camere în zona Militari
              </Link>
            </li>
            <li>
              <Link className="text-gold hover:underline" to="/apartamente-3-camere-militari">
                Apartamente 3 camere în zona Militari
              </Link>
            </li>
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default MilitariVsChiajna;
