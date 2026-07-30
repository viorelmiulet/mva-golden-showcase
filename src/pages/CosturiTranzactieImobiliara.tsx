import { Helmet } from "@/lib/helmet-compat";
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
import {
  Scale,
  Euro,
  FileText,
  Landmark,
  Home,
  Building,
  ArrowRight,
  Phone,
  AlertCircle,
} from "lucide-react";

/**
 * SEO guide: transaction costs & notary fees for real estate in Bucharest.
 * Targets "taxe notariale apartament bucuresti", "costuri tranzactie imobiliara",
 * "comision agentie imobiliara", "onorariu notarial apartament".
 * Content grounded in the 1%–2% fee range typical for the Bucharest market.
 */
const CosturiTranzactieImobiliara = () => {
  const canonical = "https://www.mvaimobiliare.ro/costuri-tranzactie-imobiliara";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline:
      "Costuri tranzacție imobiliară București 2026 — taxe notariale, comisioane și înscriere ipotecă",
    description:
      "Ghid complet al costurilor de tranzacție pentru apartamente noi și vechi în București: taxe notariale, comision agenție, înscriere ipotecă, ANCPI și cheltuieli suplimentare.",
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
        name: "Cât costă taxele notariale pentru un apartament în București?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Taxele notariale pentru un apartament de 80.000–120.000€ în București se încadrează în general între 1.200–2.500€. Acestea includ onorariul notarului (0,5–1% din valoarea tranzacției), taxa de publicitate imobiliară la ANCPI (0,5–1% pentru vânzare, 0,15% pentru ipotecă) și costurile de autentificare a actelor.",
        },
      },
      {
        "@type": "Question",
        name: "Care este comisionul unei agenții imobiliare în București?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "În București, comisionul standard al unei agenții imobiliare este de 1–2% din prețul de vânzare pentru fiecare parte (cumpărător și vânzător). La MVA Imobiliare, comisionul este transparent și negociat de la început, fără costuri ascunse.",
        },
      },
      {
        "@type": "Question",
        name: "Care este diferența de costuri între un apartament nou și unul vechi?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Apartamentele noi au TVA inclus (19%) în prețul afișat de dezvoltator, dar costuri suplimentare pentru mutații ENEL, apă și gaze. Apartamentele vechi necesită plată integrală a taxei ANCPI (0,5–1% din preț) și pot implica cheltuieli neprevăzute pentru renovare și modernizare, adesea net superioare costurilor notariale.",
        },
      },
      {
        "@type": "Question",
        name: "Ce este înscrierea ipotecii și cât costă?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Înscrierea ipotecii este procedura prin care banca înscrie garanția asupra imobilului în Cartea Funciară. Costul se ridică la aproximativ 0,15–0,5% din valoarea creditului, plus onorariul notarial pentru actul de ipotecă. Pentru un credit de 80.000€, totalul este în jur de 400–800€.",
        },
      },
    ],
  };

  const costBreakdown = [
    {
      label: "Onorariu notarial",
      rate: "0,5% – 1%",
      note: "Din prețul de vânzare; negociabil conform grilei notarului.",
      icon: Scale,
    },
    {
      label: "Taxă ANCPI (vânzare)",
      rate: "0,5% – 1%",
      note: "Din prețul declarat; se plătește o singură dată la autentificare.",
      icon: Landmark,
    },
    {
      label: "Taxă ANCPI (ipotecă)",
      rate: "0,15% – 0,5%",
      note: "Din valoarea creditului; se aplică doar la achiziție cu credit ipotecar.",
      icon: FileText,
    },
    {
      label: "Comision agenție",
      rate: "1% – 2%",
      note: "Standard în București; plătit de cumpărător și/sau vânzător.",
      icon: Euro,
    },
    {
      label: "Evaluare imobil",
      rate: "150 – 400 €",
      note: "Obligatorie pentru credit ipotecar; realizată de evaluator bancar acreditat.",
      icon: Home,
    },
    {
      label: "Asigurare imobil (obligatorie)",
      rate: "0,1% – 0,3%",
      note: "Anual, din valoarea asigurată; obligatorie pentru credite ipotecare.",
      icon: Building,
    },
  ];

  const newVsOld = [
    {
      aspect: "TVA",
      newAp: "19% — inclus în prețul dezvoltatorului",
      oldAp: "Nu se aplică (tranzacție între persoane fizice)",
    },
    {
      aspect: "Taxă ANCPI vânzare",
      newAp: "0,5–1% din preț (plătit o dată)",
      oldAp: "0,5–1% din preț (plătit o dată)",
    },
    {
      aspect: "Taxă mutații utilități",
      newAp: "200–400€ (ENEL, apă, gaze)",
      oldAp: "50–150€ (transfer titular)",
    },
    {
      aspect: "Renovare / modernizare",
      newAp: "Minim — apartament la cheie",
      oldAp: "5.000–25.000€ posibili (în funcție de stare)",
    },
    {
      aspect: "Certificat energetic",
      newAp: "Obligatoriu, inclus de dezvoltator",
      oldAp: "150–300€ dacă nu este actualizat",
    },
    {
      aspect: "Evaluare bancă",
      newAp: "200–300€ (credit nou)",
      oldAp: "150–400€ (credit vechi sau nou)",
    },
    {
      aspect: "Onorariu notarial",
      newAp: "~0,5–0,8% (prețuri fixe la volume)",
      oldAp: "~0,8–1% (negociabil)",
    },
  ];

  return (
    <>
      <Helmet>
        <title>
          Costuri tranzacție imobiliară București 2026 — taxe notariale, comisioane
        </title>
        <meta
          name="description"
          content="Ghid complet al costurilor de tranzacție pentru apartamente noi și vechi în București: taxe notariale, comision agenție 1–2%, înscriere ipotecă, ANCPI și cheltuieli suplimentare."
        />
        <meta
          name="keywords"
          content="taxe notariale apartament bucuresti, costuri tranzactie imobiliara, comision agentie imobiliara, onorariu notarial apartament, taxe cumparare apartament, costuri notariale apartament, cat costa un apartament la notar, inscriere ipoteca costuri"
        />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta
          property="og:title"
          content="Costuri tranzacție imobiliară București 2026 — taxe notariale, comisioane"
        />
        <meta
          property="og:description"
          content="Află exact cât te costă cumpărarea unui apartament în București: notar, ANCPI, comision agenție, ipotecă și costuri ascunse."
        />
        <meta property="og:image" content="https://www.mvaimobiliare.ro/og-image.jpg" />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <BreadcrumbSchema
        items={[
          { name: "Acasă", url: "https://www.mvaimobiliare.ro/" },
          { name: "Ghiduri", url: "https://www.mvaimobiliare.ro/blog" },
          { name: "Costuri tranzacție imobiliară", url: canonical },
        ]}
      />

      <Header />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/50 bg-stone">
          <div className="container mx-auto max-w-5xl px-4 py-16 md:py-24">
            <Badge className="mb-4" variant="secondary">
              <Scale className="mr-1.5 h-3.5 w-3.5" /> Ghid financiar 2026
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              Costuri tranzacție imobiliară în București
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
              Ghid complet al cheltuielilor la achiziția unui apartament — nou sau vechi — în
              București. De la taxe notariale și comisioane de agenție (1–2%), până la înscrierea
              ipotecii și mutațiile de utilități. Fără costuri ascunse, cu exemple concrete de la
              consultanții MVA Imobiliare.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/proprietati">
                  Vezi apartamente disponibile <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/calculator-credit">
                  <Euro className="mr-2 h-4 w-4" /> Calculează creditul
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Quick estimator */}
        <section className="container mx-auto max-w-5xl px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Comision agenție", value: "1–2%" },
              { label: "Taxe notariale", value: "0,5–1%" },
              { label: "Taxă ANCPI", value: "0,5–1%" },
              { label: "Evaluare + ipotecă", value: "400–800 €" },
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

        {/* Cost breakdown cards */}
        <section className="container mx-auto max-w-5xl px-4 py-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Ce costuri implică cumpărarea unui apartament
          </h2>
          <p className="mt-3 text-muted-foreground">
            Fiecare tranzacție imobiliară presupune mai multe categorii de cheltuieli. Mai jos sunt
            estimările pentru piața din București în 2026, valabile pentru apartamente cu prețuri
            între 60.000€ și 150.000€.
          </p>
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {costBreakdown.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label}>
                  <CardContent className="pt-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-semibold text-foreground">{item.label}</h3>
                    <p className="mt-1 text-sm font-medium text-primary">{item.rate}</p>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {item.note}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Comparison table: new vs old */}
        <section className="container mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Costuri: apartament nou vs. apartament vechi
          </h2>
          <p className="mt-3 text-muted-foreground">
            O comparație directă între cheltuielile la achiziția unui apartament nou (la cheie sau
            în stadiu avansat) și unul vechi (în bloc construit înainte de 2000).
          </p>
          <div className="mt-6 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-foreground">Criteriu</th>
                  <th className="px-4 py-3 text-sm font-semibold text-foreground">Apartament nou</th>
                  <th className="px-4 py-3 text-sm font-semibold text-foreground">Apartament vechi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {newVsOld.map((row) => (
                  <tr key={row.aspect}>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{row.aspect}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{row.newAp}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{row.oldAp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              <strong>Notă importantă:</strong> Deși apartamentele noi par mai scumpe la prima
              vedere, costurile ascunse ale apartamentelor vechi (renovare, înlocuire instalații,
              geamuri, reabilitare termică) pot depăși 15.000–25.000€ pe termen de 5 ani. Calculează
              <strong> costul total de proprietate</strong>, nu doar prețul de achiziție.
            </p>
          </div>
        </section>

        {/* Detailed sections */}
        <section className="container mx-auto max-w-5xl px-4 py-8 space-y-12">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Taxe notariale explicate
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>Onorariul notarului public</strong> este prima și cea mai vizibilă cheltuială.
                În București, notarii lucrează cu o grilă de onorarii care variază între 0,5% și 1%
                din valoarea declarată a tranzacției. Pentru un apartament de 100.000€, onorariul se
                încadrează între 500€ și 1.000€. Prețul exact depinde de notar, de volumul actelor și
                de complexitatea situației juridice (ex: succesiune, partaj, ipotecă multiplă).
              </p>
              <p>
                <strong>Taxa de publicitate imobiliară</strong> (ANCPI) este o datorie către stat și
                nu poate fi negociată. Pentru vânzarea unui imobil, cota este de 0,5% pentru
                persoanele fizice și 1% pentru persoanele juridice, aplicată asupra prețului declarat
                sau al valorii impozabile, whichever is higher. Pentru înscrierea unei ipoteci,
                taxa este de 0,15% din valoarea creditului.
              </p>
              <p>
                <strong>Cheltuieli suplimentare notariale</strong> includ taxa de timbru (30–50€),
                copii legalizate ale actelor, și, în cazul creditelor ipotecare, autentificarea
                contractului de credit la același notar. Acestea pot cumula 100–200€ suplimentar.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Comisionul agenției imobiliare în București
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                În piața din București, <strong>comisionul standard este de 1–2%</strong> din prețul de
                vânzare. Acest procentaj se aplică de regulă separat cumpărătorului și vânzătorului,
                deși există și variante în care doar una dintre părți suportă întreg comisionul.
                De exemplu, un apartament de 100.000€ poate genera un comision de 1.000–2.000€ pentru
                cumpărător și același interval pentru vânzător.
              </p>
              <p>
                La <strong>MVA Imobiliare</strong>, comisionul este discutat transparent de la primul
                contact și trecut în contractul de reprezentare. Nu percepem costuri ascunse — toate
                cheltuielile de marketing, fotografie profesională, promovare online și gestionare
                a documentației sunt incluse în procentul agreat. Pentru cumpărători, oferim acces la
                apartamente listate și nelistate, negociere preț și asistență la credit și acte
                notariale.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Înscrierea ipotecii și costurile de credit
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Dacă achiziționezi cu <strong>credit ipotecar</strong>, banca va solicita înscrierea
                unei ipoteci în Cartea Funciară. Acest proces implică: evaluarea imobilului de către
                un evaluator bancar acreditat (150–400€), taxa ANCPI pentru înscriere (0,15–0,5%
                din valoarea creditului), și onorariul notarial pentru autentificarea ipotecii
                (inclus în suma totală notarială sau separat, în funcție de notar).
              </p>
              <p>
                Pentru un credit de 80.000€, costurile totale legate de ipotecă se încadrează în
                400–800€. Unele bănci oferă pachete promoționale care absorb parțial sau total
                aceste cheltuieli — merită comparat ofertele de la 3–4 instituții înainte de
                decizie. MVA Imobiliare colaborează cu consultanți de credit independenți care pot
                prezenta oferte comparative fără cost suplimentar.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Cheltuieli post-tranzacție uitate adesea
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                După autentificare, mulți cumpărători uită de <strong>mutațiile de utilități</strong>:
                ENEL (80–150€), apă/canlizare (50–100€), gaze naturale (100–200€) și internet/TV
                (20–50€). Pentru apartamentele noi, costurile sunt mai mari deoarece se fac
                racorduri noi, nu doar transfer de titular.
              </p>
              <p>
                O altă cheltuială subestimată este <strong>mobilarea și amenajarea</strong>. Un
                apartament la cheie necesită doar mobilă și electrocasnice (8.000–20.000€), în timp ce
                un apartament vechi poate necesita renovare completă: înlocuire geamuri (3.000–6.000€),
                reabilitare termică (5.000–10.000€), refacere instalații electrice și sanitare
                (4.000–8.000€), și finisaje (6.000–12.000€).
              </p>
            </div>
          </div>
        </section>

        {/* Practical example */}
        <section className="container mx-auto max-w-5xl px-4 py-12">
          <Card className="bg-brass border-primary/20">
            <CardContent className="py-8 md:py-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Exemplu practic: buget total pentru un apartament de 90.000€
              </h2>
              <p className="mt-3 text-muted-foreground">
                Iată cum arată costurile totale pentru achiziția unui apartament cu 2 camere în
                București, la prețul de 90.000€, cu plată integrală (fără credit ipotecar):
              </p>
              <div className="mt-6 overflow-x-auto rounded-lg border border-border/60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cheltuială</TableHead>
                      <TableHead className="text-right">Estimare (€)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Preț apartament</TableCell>
                      <TableCell className="text-right font-semibold">90.000</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Onorariu notarial (~0,7%)</TableCell>
                      <TableCell className="text-right">630</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Taxă ANCPI vânzare (~0,5%)</TableCell>
                      <TableCell className="text-right">450</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Comision agenție (1,5% — doar cumpărător)</TableCell>
                      <TableCell className="text-right">1.350</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Evaluare + cheltuieli suplimentare notariale</TableCell>
                      <TableCell className="text-right">250</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Mutări utilități</TableCell>
                      <TableCell className="text-right">200</TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/30">
                      <TableCell className="font-semibold">Total costuri suplimentare</TableCell>
                      <TableCell className="text-right font-semibold">2.880</TableCell>
                    </TableRow>
                    <TableRow className="bg-primary/5">
                      <TableCell className="font-bold">Buget total necesar</TableCell>
                      <TableCell className="text-right font-bold text-primary">92.880 €</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                * Estimările sunt orientative și pot varia în funcție de notar, zonă și complexitatea
                tranzacției. Pentru un calcul personalizat, contactați echipa MVA Imobiliare.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="container mx-auto max-w-5xl px-4 pb-16">
          <div className="rounded-xl bg-muted/40 p-6 md:p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">
              Vrei un calcul personalizat pentru tranzacția ta?
            </h2>
            <p className="text-muted-foreground mb-5 max-w-2xl mx-auto">
              Consultanții MVA Imobiliare îți pot estima costurile exacte pentru apartamentul
              dorit — inclusiv negocierea prețului, compararea ofertelor de credit și programarea
              la notar.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <a href="tel:+40741033677">
                  <Phone className="w-4 h-4 mr-2" /> 0741 033 677
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contact">Programează o consultație gratuită</Link>
              </Button>
            </div>
          </div>

          <nav className="mt-12 grid md:grid-cols-2 gap-3">
            <Button asChild variant="outline">
              <Link to="/calculator-credit">
                Calculator credit ipotecar <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/ghid-militari-residence">
                Ghid Militari Residence <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/apartamente-noi">
                Apartamente noi de vânzare <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/faq">
                Întrebări frecvente <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </nav>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default CosturiTranzactieImobiliara;
