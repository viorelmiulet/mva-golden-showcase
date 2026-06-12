import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
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
import {
  Building2,
  Train,
  Euro,
  ArrowRight,
  Phone,
  CheckCircle2,
  MapPin,
  Bus,
} from "lucide-react";

/**
 * SEO comparison guide: Top residential complexes in Sector 6, Bucharest.
 * Targets "apartamente sector 6" and "apartamente de vanzare bucuresti sector 6"
 * (~480 monthly searches) with high-intent comparison content.
 */
const TopAnsambluriRezidentialeSector6 = () => {
  const canonical =
    "https://www.mvaimobiliare.ro/top-ansambluri-rezidentiale-sector-6";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline:
      "Top Ansambluri Rezidențiale Sector 6 — comparatie 2026: Militari, Chiajna și zonele învecinate",
    description:
      "Comparație detaliată a celor mai populare ansambluri rezidențiale din Sector 6 București: Militari Residence, Eurocasa, Renew, Plaza și 21 Residence. Prețuri, transport, facilități.",
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
        name: "Care sunt cele mai bune ansambluri rezidențiale din Sector 6?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Cele mai populare ansambluri din Sector 6 și zona învecinată (Chiajna) sunt: Militari Residence — cel mai mare și mai accesibil; Eurocasa Residence — raport calitate-preț echilibrat; Renew Residence — confort premium; Plaza Residence — poziționare excelentă lângă metrou; și 21 Residence — unități compacte pentru investiție.",
        },
      },
      {
        "@type": "Question",
        name: "Cât costă un apartament cu 2 camere în Sector 6?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "În 2026, prețul unui apartament cu 2 camere în Sector 6 variază între 65.000 și 110.000 € în funcție de complex, etaj, orientare și finisaje. Complexurile din Chiajna (Militari Residence, Eurocasa) pornesc de la 65.000–80.000 €, iar cele din Militari propriu-zis (Renew, Plaza) ajung la 85.000–110.000 €.",
        },
      },
      {
        "@type": "Question",
        name: "Ce metrou deservește zona Sector 6?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sectorul 6 este deservit de Magistrala M3 (Păcii, Gorjului, Lujerului). Stația Păcii este cea mai apropiată de complexurile din Militari și Chiajna. Se lucrează la extinderea metroului către zona Roșu–Chiajna, ceea ce va crește accesibilitatea și valoarea imobilelor.",
        },
      },
      {
        "@type": "Question",
        name: "Este mai bine să cumpăr în Militari sau în Chiajna?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Militari (București) oferă acces mai rapid la metrou, școli și centre comerciale, dar prețuri mai mari. Chiajna (Ilfov) oferă apartamente mai spațioase la prețuri cu 15–25% mai mici, cu acces rapid la autostradă. Alegerea depinde de buget și priorități: naveta zilnică favorizează Militari, iar spațiul și bugetul favorizează Chiajna.",
        },
      },
      {
        "@type": "Question",
        name: "Ce complex din Sector 6 are cel mai bun raport calitate-preț?",
        acceptedAnswer: {
          "@type": "Answer",
          "text": "Pentru raport calitate-preț, Eurocasa Residence și Militari Residence sunt cele mai apreciate. Eurocasa oferă finisaje superioare și parcare subterană la prețuri moderate, în timp ce Militari Residence rămâne cea mai accesibilă intrare în piață pentru primii cumpărători.",
        },
      },
    ],
  };

  const complexes = [
    {
      name: "Militari Residence",
      location: "Roșu, Chiajna (graniță Sector 6)",
      price: "950 – 1.350 €/mp",
      transport: "STB 178, 278, 336 → Metrou Păcii (10–15 min)",
      facilities: "Școală, grădinițe, supermarketuri, parcuri",
      link: "/militari-residence",
      tag: "Cel mai accesibil",
    },
    {
      name: "Eurocasa Residence",
      location: "Chiajna (graniță Sector 6)",
      price: "1.250 – 1.650 €/mp",
      transport: "Autobuz → Metrou Păcii (8–12 min)",
      facilities: "Parcare subterană, spații verzi, loc de joacă",
      link: "/eurocasa-residence",
      tag: "Raport calitate-preț",
    },
    {
      name: "Renew Residence",
      location: "Militari, București (Sector 6)",
      price: "1.400 – 1.850 €/mp",
      transport: "~1,5 km până la Metrou Păcii",
      facilities: "Parc privat, tâmplărie tristrat, lift premium",
      link: "/renew-residence",
      tag: "Confort premium",
    },
    {
      name: "Plaza Residence",
      location: "Militari, București (Sector 6)",
      price: "1.300 – 1.750 €/mp",
      transport: "Apropiere maximă de metrou Păcii",
      facilities: "Mall Plaza România, școli, clinici",
      link: "",
      tag: "Poziție strategică",
    },
    {
      name: "21 Residence",
      location: "Militari, București (Sector 6)",
      price: "1.200 – 1.600 €/mp",
      transport: "STB → Metrou Păcii (10 min)",
      facilities: "Unități compacte, ideal pentru investiție",
      link: "",
      tag: "Investiție",
    },
  ];

  return (
    <>
      <Helmet>
        <title>
          Top Ansambluri Rezidențiale Sector 6 — comparatie 2026 | MVA Imobiliare
        </title>
        <meta
          name="description"
          content="Comparație detaliată a ansamblurilor din Sector 6: Militari Residence, Eurocasa, Renew, Plaza și 21 Residence. Prețuri, metrou, facilități și transport public."
        />
        <meta
          name="keywords"
          content="apartamente sector 6, apartamente de vanzare bucuresti sector 6, ansambluri rezidentiale sector 6, militari residence, eurocasa, renew residence"
        />
        <link rel="canonical" href={canonical} />
        <meta
          property="og:title"
          content="Top Ansambluri Rezidențiale Sector 6 — comparatie 2026"
        />
        <meta
          property="og:description"
          content="Tabel comparativ: prețuri, metrou, facilități pentru cele mai populare complexuri din Sector 6 și zona Militari-Chiajna."
        />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <BreadcrumbSchema
        items={[
          { name: "Acasă", url: "https://www.mvaimobiliare.ro/" },
          { name: "Ghiduri", url: "https://www.mvaimobiliare.ro/blog" },
          {
            name: "Top Ansambluri Sector 6",
            url: canonical,
          },
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
              Top Ansambluri Rezidențiale Sector 6: comparatie completă
            </h1>
            <p className="text-lg text-muted-foreground">
              Analiză detaliată a celor mai căutate complexuri rezidențiale din
              Sectorul 6 al Bucureștiului și zona învecinată Chiajna. Comparăm
              prețurile pe metru pătrat, accesul la metrou, facilitățile și
              calitatea construcției pentru a te ajuta să iei cea mai bună
              decizie.
            </p>
          </header>

          {/* Complex cards */}
          <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {complexes.map((c) => (
              <Card key={c.name} className={c.link ? "" : "opacity-90"}>
                <CardContent className="p-5">
                  <Badge className="mb-2">{c.tag}</Badge>
                  <h2 className="font-semibold text-lg mb-1">{c.name}</h2>
                  <p className="text-sm text-muted-foreground mb-3">
                    {c.location}
                  </p>
                  <p className="text-sm mb-2">
                    <Euro className="inline w-4 h-4 mr-1" />
                    {c.price}
                  </p>
                  {c.link ? (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="w-full"
                    >
                      <Link to={c.link}>
                        Vezi complexul{" "}
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="w-full" disabled>
                      Contactează-ne pentru detalii
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </section>

          {/* Comparison table */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">
              Tabel comparativ: prețuri, transport, facilități
            </h2>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Criteriu</TableHead>
                    <TableHead>Militari Residence</TableHead>
                    <TableHead>Eurocasa</TableHead>
                    <TableHead>Renew</TableHead>
                    <TableHead>Plaza</TableHead>
                    <TableHead>21 Residence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Preț (€/mp)</TableCell>
                    <TableCell>950 – 1.350</TableCell>
                    <TableCell>1.250 – 1.650</TableCell>
                    <TableCell>1.400 – 1.850</TableCell>
                    <TableCell>1.300 – 1.750</TableCell>
                    <TableCell>1.200 – 1.600</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Distanță metrou Păcii
                    </TableCell>
                    <TableCell>~3 km</TableCell>
                    <TableCell>~2 km</TableCell>
                    <TableCell>~1,5 km</TableCell>
                    <TableCell>~1 km</TableCell>
                    <TableCell>~2,5 km</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Parcare</TableCell>
                    <TableCell>Suprateran</TableCell>
                    <TableCell>Subteran + suprateran</TableCell>
                    <TableCell>Subteran + suprateran</TableCell>
                    <TableCell>Subteran</TableCell>
                    <TableCell>Suprateran</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Termoizolație</TableCell>
                    <TableCell>Polistiren 10 cm</TableCell>
                    <TableCell>Vată minerală 10 cm</TableCell>
                    <TableCell>Vată minerală 10 cm</TableCell>
                    <TableCell>Polistiren / vată</TableCell>
                    <TableCell>Polistiren 10 cm</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Întreținere (2 cam)
                    </TableCell>
                    <TableCell>250 – 350 lei</TableCell>
                    <TableCell>300 – 420 lei</TableCell>
                    <TableCell>350 – 450 lei</TableCell>
                    <TableCell>280 – 400 lei</TableCell>
                    <TableCell>250 – 350 lei</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">An construcție</TableCell>
                    <TableCell>2014+</TableCell>
                    <TableCell>2018+</TableCell>
                    <TableCell>2019+</TableCell>
                    <TableCell>2016+</TableCell>
                    <TableCell>2017+</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Prețurile sunt estimative pentru 2026, pe baza tranzacțiilor
              intermediate de MVA Imobiliare și a ofertelor publice din zona
              Sector 6 / Chiajna.
            </p>
          </section>

          {/* Price section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <Euro className="w-6 h-6 text-primary" /> Preț pe metru pătrat în Sector 6 (2026)
            </h2>
            <p className="text-muted-foreground mb-3 leading-relaxed">
              Sectorul 6 rămâne una dintre cele mai accesibile zone ale
              Bucureștiului pentru achiziția de apartamente noi. Prețul mediu pe
              metru pătrat variază între <strong>950 €/mp</strong> în Chiajna
              (Militari Residence) și <strong>1.850 €/mp</strong> în complexele
              premium din Militari (Renew Residence).
            </p>
            <p className="text-muted-foreground mb-3 leading-relaxed">
              Pentru un apartament cu <strong>2 camere de 55 mp</strong>,
              bugetul necesar pornește de la aproximativ{" "}
              <strong>65.000 €</strong> în Chiajna și poate ajunge la{" "}
              <strong>95.000 €</strong> în complexurile premium din Militari.
              Diferența de preț se justifică prin proximitatea față de metrou,
              calitatea finisajelor și densitatea serviciilor din zonă.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Investitorii apreciază Sectorul 6 pentru lichiditatea ridicată a
              proprietăților și cererea constantă de închiriere, generată de
              angajații din polii economici din vestul Bucureștiului și din
              zona de logistică de pe Autostrada A1.
            </p>
          </section>

          {/* Transport section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <Train className="w-6 h-6 text-primary" /> Transport public și metrou
            </h2>
            <p className="text-muted-foreground mb-3 leading-relaxed">
              Magistrala <strong>M3 (Păcii – Anghel Saligny)</strong> este
              coloana vertebrală a transportului în Sectorul 6. Stația{" "}
              <strong>Păcii</strong> deservește majoritatea complexurilor
              rezidențiale din zonă, cu timpi de parcurs de 10–20 minute până
              în centrul orașului.
            </p>
            <p className="text-muted-foreground mb-3 leading-relaxed">
              Complexurile situate în București (Renew, Plaza, 21 Residence) au
              acces direct la autobuzele STB și la o distanță mai mică de
              metrou. Cele din Chiajna (Militari Residence, Eurocasa) necesită
              o etapă suplimentară de transport, dar beneficiază de acces
              rapid la <strong>Autostrada A1</strong> (București–Pitești), un
              avantaj major pentru cei care navetează către zonele industriale
              din vest sau către Pitești.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Extinderea metroului către zona Roșu–Chiajna este un proiect
              aflat în discuție constantă. Realizarea acestuia ar reduce
              semnificativ timpul de navetă din Chiajna și ar crește valoarea
              proprietăților din zonă cu un potențial de 10–20%.
            </p>
          </section>

          {/* Facilities section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" /> Facilități și infrastructură
            </h2>
            <p className="text-muted-foreground mb-3 leading-relaxed">
              <strong>Militari Residence</strong> se remarcă prin densitatea de
              servicii interne: școală gimnazială proprie, grădinițe private,
              supermarketuri (Auchan, Lidl, Mega Image), clinici medicale și
              parcuri amenajate. Este practic un oraș în oraș, ceea ce reduce
              dependența de centrul Bucureștiului pentru activitățile zilnice.
            </p>
            <p className="text-muted-foreground mb-3 leading-relaxed">
              <strong>Plaza Residence</strong> beneficiază de proximitatea față
              de <strong>Plaza România Mall</strong>, unul dintre cele mai mari
              centre comerciale din vestul Bucureștiului, și de acces rapid la
              școli renumite din Sectorul 6 (Tudor Vladimirescu, Grigore
              Moisil).
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Renew Residence</strong> și <strong>Eurocasa</strong>{" "}
              pun accent pe calitatea construcției: tâmplărie PVC tristrat,
              vată minerală pentru termoizolație, lifturi premium și parcări
              subterane. Aceste detalii cresc confortul pe termen lung și
              reduc costurile cu întreținerea și încălzirea.
            </p>
          </section>

          {/* Recommendation cards */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">
              Care ți se potrivește?
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-5">
                  <CheckCircle2 className="w-6 h-6 text-primary mb-2" />
                  <h3 className="font-semibold mb-2">
                    Buget redus + familie
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Alege <strong>Militari Residence</strong> — cel mai mic
                    preț pe metru pătrat, infrastructură completă pentru familie
                    și lichiditate ridicată la revânzare.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <CheckCircle2 className="w-6 h-6 text-primary mb-2" />
                  <h3 className="font-semibold mb-2">
                    Raport calitate-preț
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Alege <strong>Eurocasa Residence</strong> — finisaje
                    superioare, parcare subterană și prețuri moderate, ideal
                    pentru primii cumpărători.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <CheckCircle2 className="w-6 h-6 text-primary mb-2" />
                  <h3 className="font-semibold mb-2">Confort premium</h3>
                  <p className="text-sm text-muted-foreground">
                    Alege <strong>Renew Residence</strong> — cea mai bună
                    termoizolație, parc privat și cea mai mică distanță față de
                    metrou.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <CheckCircle2 className="w-6 h-6 text-primary mb-2" />
                  <h3 className="font-semibold mb-2">
                    Poziție + servicii la pas
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Alege <strong>Plaza Residence</strong> — apropiere maximă
                    de metrou, mall, școli și clinici.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <CheckCircle2 className="w-6 h-6 text-primary mb-2" />
                  <h3 className="font-semibold mb-2">Investiție</h3>
                  <p className="text-sm text-muted-foreground">
                    Alege <strong>21 Residence</strong> — unități compacte cu
                    randament bun la închiriere și intrare accesibilă pe piață.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-muted/40 rounded-xl p-6 md:p-8 text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">
              Vrei să compari direct la fața locului?
            </h2>
            <p className="text-muted-foreground mb-5">
              Consultanții MVA Imobiliare îți pot organiza vizionări la
              multiple complexe din Sector 6 într-o singură zi, pentru o
              decizie informată.
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

          {/* Related links */}
          <nav className="grid sm:grid-cols-2 gap-3">
            <Button asChild variant="outline">
              <Link to="/comparatie-complexuri-militari-chiajna">
                Comparatie Militari vs Chiajna{" "}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/militari-vs-chiajna-comparatie">
                Militari Residence vs Chiajna{" "}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/costuri-tranzactie-imobiliara">
                Costuri tranzacție imobiliară{" "}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/ghid-noua-casa-2024">
                Ghid Noua Casă 2024 <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </nav>
        </article>
      </main>

      <Footer />
    </>
  );
};

export default TopAnsambluriRezidentialeSector6;
