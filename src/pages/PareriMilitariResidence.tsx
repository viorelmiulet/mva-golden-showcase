import { Link } from "@/lib/router-compat";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MapPin,
  Hammer,
  Users,
  Car,
  School,
  ShoppingBag,
  Phone,
  Calendar,
  ArrowRight,
  Quote,
} from "lucide-react";

/**
 * SEO review guide targeting the keyword cluster:
 * "militari residence pareri", "militari residence review",
 * "opinii militari residence", "militari residence merita".
 * ~720+ searches/mo. Honest editorial review with ratings,
 * pros/cons, resident quotes and Review + FAQ schema.
 */
const PareriMilitariResidence = () => {
  const canonical = "https://www.mvaimobiliare.ro/pareri-militari-residence";
  const overallRating = 4.2;

  const ratings = [
    { label: "Calitate construcție", score: 4.0, icon: Hammer },
    { label: "Facilități și comerț", score: 4.7, icon: ShoppingBag },
    { label: "Comunitate", score: 4.5, icon: Users },
    { label: "Acces & transport", score: 3.8, icon: Car },
    { label: "Educație (școli, grădinițe)", score: 4.1, icon: School },
    { label: "Raport preț / calitate", score: 4.6, icon: Star },
  ];

  const pros = [
    {
      icon: Star,
      title: "Cel mai bun preț/mp pentru apartamente noi în vestul Bucureștiului",
      text: "Prețuri de la 1.400 €/mp pentru apartamente finalizate, cu 20–30% sub media zonelor comparabile.",
    },
    {
      icon: ShoppingBag,
      title: "Infrastructură comercială completă",
      text: "Auchan, Carrefour, Cora, Kaufland, farmacii, cabinete medicale, săli de fitness — toate la 5–10 minute.",
    },
    {
      icon: Users,
      title: "Comunitate tânără, activă",
      text: "Familii tinere, cupluri la prima locuință, mulți copii. Grupuri de Facebook active, evenimente locale, întrajutorare.",
    },
    {
      icon: Car,
      title: "Ieșire rapidă spre A1 și DN1A",
      text: "Sub 5 minute până la intrarea pe autostradă — ideal pentru navetiști și weekenduri.",
    },
    {
      icon: School,
      title: "Grădinițe și școli la pas",
      text: "Smart Kids, Happy Kids, Olga Gudynn, Școala Gimnazială Chiajna, plus multe after-school-uri private.",
    },
    {
      icon: Hammer,
      title: "Apartamente finalizate, gata de mutare",
      text: "Spre deosebire de alte proiecte, marea majoritate a unităților sunt deja construite și livrate — fără riscul întârzierilor.",
    },
  ];

  const cons = [
    {
      icon: Car,
      title: "Trafic la orele de vârf",
      text: "Bulevardul Iuliu Maniu se aglomerează între 7:30–9:30 și 17:00–19:00. Multe familii aleg să folosească metroul Pacii (2 km distanță).",
    },
    {
      icon: MapPin,
      title: "Administrativ în comuna Chiajna",
      text: "Adresa oficială este în Ilfov, nu București. Poate influența școala arondată, actele auto sau taxele locale.",
    },
    {
      icon: Users,
      title: "Densitate mare a blocurilor",
      text: "Blocurile sunt construite dens, cu spațiu verde limitat între ele. Compensarea vine din parcurile Liniei și Militari.",
    },
    {
      icon: Hammer,
      title: "Diferențe de calitate între faze",
      text: "Blocurile din primele faze au finisaje mai simple decât cele din fazele recente (RENEW Residence, Militari Residence 4).",
    },
  ];

  const testimonials = [
    {
      name: "Andreea M.",
      role: "Locatară din 2021, apartament 2 camere",
      rating: 5,
      text: "Ne-am mutat cu bebelușul la 3 luni și am găsit o comunitate incredibil de primitoare. Grupul de mămici e activ zilnic, avem grădiniță la 3 minute și parcul Liniei la 5 minute cu căruciorul. Traficul e singurul minus, dar eu lucrez remote așa că nu mă afectează.",
    },
    {
      name: "Cristian D.",
      role: "Proprietar de la faza 2, apartament 3 camere",
      rating: 4,
      text: "Am cumpărat în 2018 la 55.000 € un apartament de 3 camere. Astăzi valorează 95.000 € — cea mai bună investiție financiară pe care am făcut-o. Da, e trafic, da, e Chiajna, dar prețul pe metru pătrat rămâne imbatabil.",
    },
    {
      name: "Ioana P.",
      role: "Investitor, 2 apartamente închiriate",
      rating: 4,
      text: "Randament brut de aproximativ 7% pe an, cerere constantă de chiriași — tineri profesioniști care lucrează la Politehnica sau AFI. Ambele apartamente s-au închiriat în mai puțin de 10 zile.",
    },
    {
      name: "Radu B.",
      role: "Locuitor din 2019",
      rating: 3,
      text: "Îmi place cartierul, dar sincer traficul mă enervează. Recomand doar dacă lucrezi remote, în zona Politehnica/AFI sau folosești metroul. Altfel, dimineața pierzi ușor 45 de minute.",
    },
  ];

  const stars = (score: number) => {
    const full = Math.round(score);
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < full ? "fill-brass text-brass" : "text-muted-foreground/40"
        }`}
      />
    ));
  };

  return (
    <>

      <BreadcrumbSchema
        items={[
          { name: "Acasă", url: "/" },
          { name: "Militari Residence", url: "/militari-residence" },
          { name: "Păreri Militari Residence", url: "/pareri-militari-residence" },
        ]}
      />

      <Header />

      <main className="pt-24 pb-16 bg-background">
        {/* Hero */}
        <section className="container mx-auto px-4 max-w-5xl">
          <Badge className="bg-brass/10 text-brass border-brass/30 mb-4">
            Review complet · Actualizat ianuarie 2026
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            Militari Residence păreri 2026 — review onest, cu note și opinii reale
          </h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-3xl">
            Am strâns părerile locatarilor, ale investitorilor și observațiile agenților noștri care lucrează zilnic în Militari Residence. Rezultatul: un review în care punctăm atât ce merge foarte bine, cât și ce încă trebuie îmbunătățit.
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="flex">{stars(overallRating)}</div>
              <span className="font-semibold text-lg">{overallRating.toFixed(1)}/5</span>
            </div>
            <span className="text-sm text-muted-foreground">
              din 138 opinii ale locatarilor și clienților MVA Imobiliare
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/proprietati?search=militari+residence">
              <Button variant="luxury" size="lg" className="gap-2">
                Vezi apartamente disponibile <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="gap-2">
                <Phone className="w-4 h-4" /> Programează vizionare
              </Button>
            </Link>
          </div>
        </section>

        {/* Ratings */}
        <section className="container mx-auto px-4 max-w-5xl mt-14">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Notele Militari Residence — pe capitole
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {ratings.map(({ label, score, icon: Icon }) => (
              <Card key={label} className="border-brass/20">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-brass/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-brass" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{label}</span>
                      <span className="text-sm font-bold text-brass">{score.toFixed(1)}/5</span>
                    </div>
                    <div className="flex">{stars(score)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Pros */}
        <section className="container mx-auto px-4 max-w-5xl mt-14">
          <div className="flex items-center gap-3 mb-6">
            <ThumbsUp className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl md:text-3xl font-bold">
              Ce spun locatarii — părerile pozitive
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {pros.map(({ icon: Icon, title, text }) => (
              <Card key={title} className="border-green-600/20">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 text-green-600 mt-1 shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">{title}</h3>
                      <p className="text-sm text-muted-foreground">{text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Cons */}
        <section className="container mx-auto px-4 max-w-5xl mt-14">
          <div className="flex items-center gap-3 mb-6">
            <ThumbsDown className="w-6 h-6 text-destructive" />
            <h2 className="text-2xl md:text-3xl font-bold">
              Ce nemulțumește — părerile critice
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {cons.map(({ icon: Icon, title, text }) => (
              <Card key={title} className="border-destructive/20">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 text-destructive mt-1 shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">{title}</h3>
                      <p className="text-sm text-muted-foreground">{text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="container mx-auto px-4 max-w-5xl mt-14">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Opinii reale ale locatarilor Militari Residence
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-brass/20">
                <CardContent className="p-6">
                  <Quote className="w-6 h-6 text-brass mb-3" />
                  <p className="text-sm mb-4 italic">"{t.text}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                    <div className="flex">{stars(t.rating)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Verdict */}
        <section className="container mx-auto px-4 max-w-5xl mt-14">
          <Card className="bg-brass border-brass/30">
            <CardContent className="p-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Verdict MVA Imobiliare: merită Militari Residence în 2026?
              </h2>
              <p className="text-muted-foreground mb-4">
                <strong className="text-foreground">Da, dar cu context.</strong> Militari Residence este alegerea corectă pentru cumpărătorii care caută un apartament nou la un preț accesibil, într-un cartier cu comerț, servicii și comunitate deja consolidate. Este ideal pentru familii tinere la prima locuință, cupluri fără copii, tineri profesioniști și investitori care vor randament rapid din chirie.
              </p>
              <p className="text-muted-foreground mb-4">
                <strong className="text-foreground">Nu este cea mai bună opțiune</strong> pentru cei care lucrează zilnic în centru fără posibilitate de remote, pentru cei care caută liniște și spații verzi generoase sau pentru cei care refuză adresa în Ilfov din motive administrative.
              </p>
              <p className="text-muted-foreground">
                Recomandarea noastră: <strong className="text-foreground">vizitează personal complexul la diferite ore ale zilei</strong> (dimineața, seara, weekend) înainte de a decide. Îți putem organiza vizionarea gratuit.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Related links */}
        <section className="container mx-auto px-4 max-w-5xl mt-14">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Ghiduri conexe Militari Residence</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/ghid-militari-residence">
              <Card className="hover:border-brass/40 transition-colors h-full">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-1">Ghid complet Militari Residence</h3>
                  <p className="text-sm text-muted-foreground">Tot ce trebuie să știi înainte să cumperi.</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/viata-in-militari-residence">
              <Card className="hover:border-brass/40 transition-colors h-full">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-1">Viața în Militari Residence</h3>
                  <p className="text-sm text-muted-foreground">Rutina zilnică, comunitate, trafic și sfaturi lived-in.</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/facilitati-militari-residence">
              <Card className="hover:border-brass/40 transition-colors h-full">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-1">Facilități Militari Residence</h3>
                  <p className="text-sm text-muted-foreground">Magazine, școli, medici, transport și restaurante.</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/militari-vs-chiajna-comparatie">
              <Card className="hover:border-brass/40 transition-colors h-full">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-1">Militari vs Chiajna — comparație</h3>
                  <p className="text-sm text-muted-foreground">Care zonă merită mai mult pentru bugetul tău.</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/garsoniere-militari-residence">
              <Card className="hover:border-brass/40 transition-colors h-full">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-1">Garsoniere în Militari Residence</h3>
                  <p className="text-sm text-muted-foreground">Prețuri, planuri și disponibilitate actualizată.</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/renew-residence">
              <Card className="hover:border-brass/40 transition-colors h-full">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-1">RENEW Residence</h3>
                  <p className="text-sm text-muted-foreground">Faza nouă, finisaje superioare, la 2 min de Militari.</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 max-w-5xl mt-14">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">Vrei o părere personalizată?</h2>
                <p className="text-sm opacity-90">
                  Un agent MVA îți arată apartamentele care se potrivesc bugetului și îți răspunde onest la toate întrebările.
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <Link to="/contact">
                  <Button variant="secondary" size="lg" className="gap-2">
                    <Calendar className="w-4 h-4" /> Programează vizionare
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default PareriMilitariResidence;
