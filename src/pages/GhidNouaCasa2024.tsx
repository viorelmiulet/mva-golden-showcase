import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  FileCheck,
  Landmark,
  Users,
  PiggyBank,
  ShieldCheck,
  ArrowRight,
  Phone,
  AlertCircle,
  Calendar,
  TrendingDown,
  Scale,
} from "lucide-react";

/**
 * SEO guide: Programul "Noua Casă" 2024 — government-backed mortgage for first-time buyers.
 * Targets "noua casa", "programul noua casa 2024", "credit noua casa", "conditii noua casa",
 * "banci participante noua casa", "avans noua casa".
 */
const GhidNouaCasa2024 = () => {
  const canonical = "https://www.mvaimobiliare.ro/ghid-noua-casa-2024";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline:
      "Ghid complet Noua Casă 2024 — condiții, acte necesare și bănci participante",
    description:
      "Află totul despre programul Noua Casă 2024: cine este eligibil, ce acte sunt necesare, care sunt băncile participante și cum obții un credit garantat de stat pentru prima locuință.",
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
        name: "Ce este programul Noua Casă?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Noua Casă este un program guvernamental românesc care susține achiziția primei locuințe prin credite ipotecare cu garanție de stat. Statul garantează o parte din credit, ceea ce permite băncilor să ofere condiții mai avantajoase: avans redus (de la 5%), dobânzi mai mici și termene mai lungi de rambursare (până la 30 de ani).",
        },
      },
      {
        "@type": "Question",
        name: "Cine este eligibil pentru programul Noua Casă 2024?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sunt eligibile persoanele fizice care nu dețin nicio locuință sau dețin o locuință mai mică de 50 mp și vor să-și achiziționeze una nouă. Vârsta maximă la finalizarea creditului este de 70 de ani. Tinerii sub 35 de ani, familiile cu copii și angajații din sistemul public pot beneficia de condiții preferențiale sau avans redus.",
        },
      },
      {
        "@type": "Question",
        name: "Cât este avansul la Noua Casă?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Avansul minim pentru programul Noua Casă este de 5% din prețul de achiziție al locuinței. Pentru anumite categorii (tineri sub 35 de ani, familii cu copii), avansul poate fi redus la 0% în anumite condiții, în funcție de banca aleasă și de politica FNGCIMM.",
        },
      },
      {
        "@type": "Question",
        name: "Care este plafonul maxim de finanțare la Noua Casă?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Plafonul maxim de finanțare prin programul Noua Casă este de aproximativ 500.000 RON (cca. 100.000 EUR) pentru locuințe obișnuite. Pentru locuințe eficiente energetic (clasa A sau B), plafonul poate crește până la aproximativ 700.000 RON (cca. 140.000 EUR). Suma exactă variază în funcție de anul programului și de legislația în vigoare.",
        },
      },
      {
        "@type": "Question",
        name: "Ce acte sunt necesare pentru creditul Noua Casă?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Actele necesare includ: actul de identitate, adeverință de venit de la angajator sau declarații de venit pentru PFA/liber profesioniști, extras de cont, certificat de căsătorie (dacă e cazul), declarație pe proprie răspundere că nu deții alte locuințe, actele imobilului (carte funciară, contract de vânzare-cumpărare în formă preliminară), și documentația specifică solicitată de bancă.",
        },
      },
      {
        "@type": "Question",
        name: "Ce bănci participă în programul Noua Casă 2024?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Principalele bănci participante în programul Noua Casă includ: BCR, BRD, Raiffeisen Bank, ING, Banca Transilvania, OTP Bank, UniCredit Bank, CEC Bank și Alpha Bank. Fiecare bancă oferă propriile condiții de dobândă, comisioane și perioadă de grație. Este recomandat să compari ofertele mai multor bănci înainte de a alege.",
        },
      },
    ],
  };

  const conditions = [
    {
      label: "Vârstă maximă",
      value: "70 ani",
      note: "La finalizarea perioadei de credit.",
      icon: Calendar,
    },
    {
      label: "Avans minim",
      value: "5%",
      note: "Din prețul de achiziție; 0% pentru categorii preferențiale.",
      icon: PiggyBank,
    },
    {
      label: "Plafon finanțare",
      value: "~100.000 €",
      note: "Până la ~140.000 € pentru locuințe eficiente energetic.",
      icon: Home,
    },
    {
      label: "Perioadă credit",
      value: "Până la 30 ani",
      note: "Termen maxim de rambursare, cu perioadă de grație opțională.",
      icon: Scale,
    },
    {
      label: "Garanție stat",
      value: "50–80%",
      note: "Din valoarea creditului, în funcție de tipul locuinței.",
      icon: ShieldCheck,
    },
    {
      label: "Dobândă",
      value: "Preferențială",
      note: "Sub nivelul pieței, variabilă sau fixă, în funcție de bancă.",
      icon: TrendingDown,
    },
  ];

  const documents = [
    "Buletin / Carte de identitate valabilă",
    "Adeverință de venit de la angajator (ultimele 3–6 luni)",
    "Extras de cont bancar (ultimele 3–6 luni)",
    "Certificat de căsătorie / naștere (dacă este cazul)",
    "Declarație pe proprie răspundere privind deținerea de locuințe",
    "Carte funciară a imobilului (extras de informare)",
    "Contract preliminar de vânzare-cumpărare",
    "Evaluare tehnică a imobilului (realizată de evaluator bancar)",
    "Avizul Direcției de Sănătate Publică (doar pentru case)",
    "Documentație specifică băncii alese (formulare, împuterniciri)",
  ];

  const banks = [
    { name: "Banca Comercială Română (BCR)", note: "Rețea extinsă, condiții flexibile pentru tineri." },
    { name: "BRD – Groupe Société Générale", note: "Oferte competitive pentru clienții cu venituri stabile." },
    { name: "Raiffeisen Bank", note: "Dobândă fixă opțională pe primii 5 ani." },
    { name: "ING Bank", note: "Proces digital rapid, comisioane reduse." },
    { name: "Banca Transilvania", note: "Condiții avantajoase pentru clienții existenți." },
    { name: "OTP Bank", note: "Perioadă de grație de până la 12 luni." },
    { name: "UniCredit Bank", note: "Soluții integrate cu asigurări de viață." },
    { name: "CEC Bank", note: "Condiții preferențiale pentru angajații din sistemul public." },
  ];

  const comparison = [
    { aspect: "Avans minim", nouaCasa: "5% (0% pentru categorii preferențiale)", standard: "15–25%" },
    { aspect: "Dobândă anuală", nouaCasa: "IRCC + marjă redusă (~6–8%)", standard: "IRCC + marjă (~8–11%)" },
    { aspect: "Perioadă maximă", nouaCasa: "30 de ani", standard: "30 de ani" },
    { aspect: "Vârstă max. la final", nouaCasa: "70 de ani", standard: "65–70 de ani" },
    { aspect: "Garanție de stat", nouaCasa: "Da (50–80%)", standard: "Nu" },
    { aspect: "Asigurare de viață", nouaCasa: "Obligatorie (redusă)", standard: "Obligatorie" },
    { aspect: "Comision analiză dosar", nouaCasa: "Redus sau 0%", standard: "0,5–1%" },
    { aspect: "Destinație", nouaCasa: "Prima locuință doar", standard: "Oricare imobil" },
  ];

  return (
    <>
      <Helmet>
        <title>
          Ghid Noua Casă 2024 — condiții, acte și bănci participante | MVA Imobiliare
        </title>
        <meta
          name="description"
          content="Ghid complet al programului Noua Casă 2024: cine este eligibil, ce acte sunt necesare, care sunt băncile participante și cum obții un credit garantat de stat pentru prima locuință în București."
        />
        <meta
          name="keywords"
          content="noua casa, programul noua casa 2024, credit noua casa, conditii noua casa, banci participante noua casa, avans noua casa, acte necesare noua casa, prima casa 2024, credit prima locuinta, ipotecar noua casa"
        />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta
          property="og:title"
          content="Ghid Noua Casă 2024 — condiții, acte și bănci participante"
        />
        <meta
          property="og:description"
          content="Află totul despre programul Noua Casă 2024: eligibilitate, acte necesare, bănci participante și cum obții creditul pentru prima locuință."
        />
        <meta property="og:image" content="https://www.mvaimobiliare.ro/og-image.jpg" />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <BreadcrumbSchema
        items={[
          { name: "Acasă", url: "https://www.mvaimobiliare.ro/" },
          { name: "Ghiduri", url: "https://www.mvaimobiliare.ro/blog" },
          { name: "Ghid Noua Casă 2024", url: canonical },
        ]}
      />

      <Header />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/50 bg-stone">
          <div className="container mx-auto max-w-5xl px-4 py-16 md:py-24">
            <Badge className="mb-4" variant="secondary">
              <Home className="mr-1.5 h-3.5 w-3.5" /> Ghid financiar 2024
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              Programul Noua Casă 2024 — ghid complet pentru prima locuință
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
              Tot ce trebuie să știi despre creditul garantat de stat pentru achiziția primei locuințe:
              condiții de eligibilitate, acte necesare, bănci participante și diferențele față de un
              credit ipotecar standard. Consultanții MVA Imobiliare te ghidăm pas cu pas.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/proprietati">
                  Vezi apartamente disponibile <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/calculator-credit">
                  <PiggyBank className="mr-2 h-4 w-4" /> Calculează-ți creditul
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Quick stats */}
        <section className="container mx-auto max-w-5xl px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Avans minim", value: "5%" },
              { label: "Perioadă credit", value: "30 ani" },
              { label: "Plafon finanțare", value: "~100.000 €" },
              { label: "Garanție stat", value: "50–80%" },
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

        {/* What is Noua Casa */}
        <section className="container mx-auto max-w-5xl px-4 py-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Ce este programul Noua Casă
          </h2>
          <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
            <p>
              <strong>Noua Casă</strong> (fostul „Prima Casă") este un program guvernamental lansat
              de Guvernul României prin Ministerul Finanțelor și gestionat de Fondul Național de
              Garantare a Creditelor pentru IMM (FNGCIMM). Scopul programului este de a facilita
              accesul tinerilor și familiilor la o locuință proprie prin credite ipotecare cu
              garanție de stat.
            </p>
            <p>
              Prin acest program, statul român garantează o parte semnificativă din valoarea
              creditului — între 50% și 80%, în funcție de tipul locuinței și de categoria
              solicitantului. Această garanție reduce riscul pentru bănci, care la rândul lor oferă
              condiții mai avantajoase: avans redus, dobânzi mai mici și termene de rambursare
              extinse până la 30 de ani.
            </p>
            <p>
              Programul se adresează în primul rând <strong>persoanelor care nu dețin nicio locuință</strong>{" "}
              sau care dețin o locuință mai mică de 50 de metri pătrați și doresc să achiziționeze una
              nouă. Fiecare solicitant poate accesa programul o singură dată, iar imobilul achiziționat
              devine proprietate personală, nefiind supus regimului de închiriere socială.
            </p>
          </div>
        </section>

        {/* Conditions cards */}
        <section className="container mx-auto max-w-5xl px-4 py-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Condiții de eligibilitate
          </h2>
          <p className="mt-3 text-muted-foreground">
            Pentru a accesa programul Noua Casă, trebuie să îndeplinești cumulativ câteva condiții
            esențiale stabilite de FNGCIMM și de băncile participante.
          </p>
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {conditions.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label}>
                  <CardContent className="pt-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-semibold text-foreground">{item.label}</h3>
                    <p className="mt-1 text-sm font-medium text-primary">{item.value}</p>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {item.note}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              <strong>Notă importantă:</strong> Programul se adresează exclusiv persoanelor fizice.
              Nu pot accesa Noua Casă persoanele juridice, nici cele care dețin deja o locuință
              mai mare de 50 mp (exceptând situații speciale prevăzute de lege). Fiecare solicitant
              beneficiază de program o singură dată în viață.
            </p>
          </div>
        </section>

        {/* Documents */}
        <section className="container mx-auto max-w-5xl px-4 py-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Acte necesare pentru creditul Noua Casă
          </h2>
          <p className="mt-3 text-muted-foreground">
            Documentația necesară variază ușor de la o bancă la alta, dar lista de mai jos include
            actele solicitate în mod obișnuit de majoritatea băncilor participante.
          </p>
          <div className="mt-6 grid md:grid-cols-2 gap-3">
            {documents.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/20 p-3"
              >
                <FileCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm text-foreground">{doc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Banks */}
        <section className="container mx-auto max-w-5xl px-4 py-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Bănci participante în programul Noua Casă 2024
          </h2>
          <p className="mt-3 text-muted-foreground">
            Majoritatea băncilor importante din România participă în programul Noua Casă. Fiecare
            instituție oferă propriile condiții de dobândă, comisioane și perioadă de grație.
            Compară ofertele înainte de a lua o decizie.
          </p>
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            {banks.map((bank) => (
              <Card key={bank.name}>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground text-sm">{bank.name}</h3>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{bank.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Comparison table */}
        <section className="container mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Noua Casă vs. credit ipotecar standard
          </h2>
          <p className="mt-3 text-muted-foreground">
            Compară avantajele programului Noua Casă cu un credit ipotecar clasic pentru a înțelege
            de ce este preferat de majoritatea cumpărătorilor pentru prima locuință.
          </p>
          <div className="mt-6 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-foreground">Criteriu</th>
                  <th className="px-4 py-3 text-sm font-semibold text-foreground">Noua Casă</th>
                  <th className="px-4 py-3 text-sm font-semibold text-foreground">Credit standard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comparison.map((row) => (
                  <tr key={row.aspect}>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{row.aspect}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{row.nouaCasa}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{row.standard}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Step-by-step */}
        <section className="container mx-auto max-w-5xl px-4 py-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Pașii pentru obținerea creditului Noua Casă
          </h2>
          <div className="mt-6 space-y-8">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Verifică eligibilitatea</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Asigură-te că îndeplinești condițiile de bază: nu deții o locuință mai mare de 50 mp,
                  ai vârsta sub 70 de ani la finalizarea creditului și ai venituri stabile. Consultanții
                  MVA Imobiliare îți pot verifica rapid eligibilitatea.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Alege imobilul</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Caută apartamentul sau casa care se încadrează în plafonul programului și care
                  îndeplinește condițiile tehnice. Atât locuințele noi, cât și cele vechi sunt eligibile.
                  Imobilul trebuie să fie situat în România.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Compară ofertele bancare</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Solicită simulări de la minimum 3 bănci participante. Urmărește nu doar dobânda,
                  ci și comisioanele de administrare, costurile de asigurare și posibilele perioade
                  de grație. MVA Imobiliare colaborează cu multiple bănci și te poate orienta.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Depune documentația</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Pregătește dosarul cu toate actele necesare și depune-l la banca aleasă. Analiza
                  durează de regulă 5–10 zile lucrătoare. Banca va solicita și evaluarea imobilului
                  de către un evaluator autorizat.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                5
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Autentifică și finalizează</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  După aprobarea creditului, semnează contractul de credit și contractul de vânzare-cumpărare
                  la notar. Banca viră suma către vânzător, iar tu primești cheile locuinței. Asigură-te
                  că ai bugetat și costurile notariale și taxele ANCPI.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/50 bg-muted/30">
          <div className="container mx-auto max-w-5xl px-4 py-16 text-center">
            <Users className="mx-auto h-10 w-10 text-primary mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Vrei să aplici pentru Noua Casă?
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Consultanții MVA Imobiliare îți verifică gratuit eligibilitatea, îți recomandă băncile
              cu cele mai bune condiții și te însoțesc în tot procesul — de la alegerea apartamentului
              până la semnarea actelor la notar.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/contact">
                  <Phone className="mr-2 h-4 w-4" /> Programează o consultație
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/proprietati">
                  Vezi apartamente pentru Noua Casă <ArrowRight className="ml-2 h-4 w-4" />
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

export default GhidNouaCasa2024;
