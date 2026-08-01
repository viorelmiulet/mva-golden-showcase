import { Link } from "@/lib/router-compat";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Euro,
  Home,
  MapPin,
  CheckCircle2,
  Phone,
  ArrowRight,
  FileText,
  ShieldCheck,
  Bus,
  ShoppingBag,
  Wallet,
  Key,
} from "lucide-react";
import { CHIRII_MILITARI_FAQ } from "@/lib/chiriiMilitariFaq";

/**
 * SEO landing: chirii in Militari Residence.
 * Targets "chirie militari residence" (~1.000/mo, RO) and long-tail like
 * "apartamente de inchiriat militari residence", "garsoniera de inchiriat militari residence".
 */
const ChiriiMilitariResidence = () => {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Acasă", url: "https://www.mvaimobiliare.ro/" },
          { name: "Ghiduri", url: "https://www.mvaimobiliare.ro/blog" },
          {
            name: "Chirii Militari Residence",
            url: "https://www.mvaimobiliare.ro/chirii-militari-residence",
          },
        ]}
      />

      <Header />

      <main className="min-h-screen bg-background">
        {/* HERO */}
        <section className="relative bg-brass pt-32 pb-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <Badge variant="outline" className="mb-4">
              Ghid pentru chiriași · Militari Residence
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Chirii Militari Residence — prețuri, sfaturi pentru chiriași și
              facilități
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl">
              Cât costă o chirie în Militari Residence în 2026, ce include
              întreținerea, ce acte îți trebuie la semnarea contractului și la ce
              să fii atent înainte să te muți. Ghid scris de consultanții MVA
              Imobiliare, care intermediază închirieri în acest ansamblu.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/proprietati">
                  Vezi ofertele disponibile{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contact">
                  <Phone className="mr-2 h-4 w-4" /> Cere o recomandare
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
                { icon: Euro, label: "Garsonieră", value: "300–420 €/lună" },
                { icon: Home, label: "2 camere", value: "400–550 €/lună" },
                { icon: Wallet, label: "Întreținere iarna", value: "80–150 €" },
                { icon: MapPin, label: "Metrou Păcii", value: "5–10 min" },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="p-5 text-center">
                    <s.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-xl font-bold">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {s.label}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* PRICES */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold mb-4">
              Cât costă chiria în Militari Residence
            </h2>
            <p className="text-muted-foreground mb-8 max-w-3xl">
              Prețurile de mai jos reflectă apartamentele mobilate și utilate
              complet, cele mai frecvente în ansamblu. Apartamentele nemobilate
              se închiriază, în medie, cu 50–80 € mai puțin pe lună.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Garsonieră",
                  surface: "30–45 mp utili",
                  desc: "Open-space mobilat, baie cu fereastră, balcon. Cea mai căutată opțiune de studenți și tineri la primul job.",
                  price: "300 – 420 €/lună",
                },
                {
                  title: "Apartament 2 camere",
                  surface: "50–65 mp utili",
                  desc: "Living cu bucătărie deschisă sau separată și un dormitor. Potrivit pentru cupluri sau colegi de apartament.",
                  price: "400 – 550 €/lună",
                },
                {
                  title: "Apartament 3 camere",
                  surface: "70–90 mp utili",
                  desc: "Două dormitoare, living generos, adesea două băi și loc de parcare inclus. Preferat de familii cu copii.",
                  price: "550 – 750 €/lună",
                },
              ].map((l) => (
                <Card key={l.title}>
                  <CardContent className="p-6">
                    <Key className="h-7 w-7 text-primary mb-3" />
                    <h3 className="font-semibold text-lg mb-1">{l.title}</h3>
                    <div className="text-sm text-muted-foreground mb-3">
                      {l.surface}
                    </div>
                    <p className="text-sm mb-4">{l.desc}</p>
                    <div className="font-bold text-primary">{l.price}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-6">
              Estimări MVA Imobiliare pe baza închirierilor intermediate în
              ansamblu. Prețurile variază în funcție de etaj, bloc, an de
              construcție, dotări și perioada anului (cererea urcă în
              august–octombrie).
            </p>
          </div>
        </section>

        {/* COSTS */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold mb-4">
              Costuri lunare la care să te aștepți
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <Wallet className="h-7 w-7 text-primary mb-3" />
                  <h3 className="font-semibold text-lg mb-3">
                    Buget lunar tipic — 2 camere
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      • Chirie: <strong>450 €</strong>
                    </li>
                    <li>
                      • Întreținere (vara / iarna):{" "}
                      <strong>40 € / 120 €</strong>
                    </li>
                    <li>
                      • Curent electric: <strong>25–45 €</strong>
                    </li>
                    <li>
                      • Internet + TV: <strong>8–12 €</strong>
                    </li>
                    <li>
                      • Loc de parcare (opțional): <strong>25–40 €</strong>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <FileText className="h-7 w-7 text-primary mb-3" />
                  <h3 className="font-semibold text-lg mb-3">
                    Costuri la semnare
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      • Garanție: <strong>o chirie</strong> (uneori două)
                    </li>
                    <li>
                      • Prima lună de chirie: <strong>în avans</strong>
                    </li>
                    <li>
                      • Comision agenție: <strong>50–100% dintr-o chirie</strong>
                    </li>
                    <li>
                      • Înregistrare contract la ANAF:{" "}
                      <strong>gratuită, online</strong>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* TENANT ADVICE */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold mb-4">
              Sfaturi pentru chiriași înainte de semnare
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Cere ultima factură de întreținere — blocurile fără contorizare individuală pot avea costuri mult mai mari iarna.",
                "Verifică etajul și liftul: în blocurile înalte, etajele 3–7 sunt cele mai confortabile și cele mai căutate.",
                "Fă un proces-verbal de predare-primire cu fotografii pentru fiecare cameră și pentru indexul contoarelor.",
                "Confirmă că proprietarul este cel din extrasul de carte funciară și că apartamentul nu e grevat de litigii.",
                "Clarifică în contract cine plătește reparațiile: uzura normală revine proprietarului, defecțiunile din culpă — chiriașului.",
                "Cere înregistrarea contractului la ANAF — îți oferă un document opozabil și dovada domiciliului.",
                "Întreabă despre locul de parcare: nu toate apartamentele îl includ, iar parcarea la sol e limitată.",
                "Negociază: contractele pe 12 luni obțin frecvent 20–40 € reducere față de cele pe termen scurt.",
              ].map((tip) => (
                <div key={tip} className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FACILITIES */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold mb-4">
              Facilități pentru chiriași în Militari Residence
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Bus,
                  title: "Transport",
                  desc: "Metrou M3 Păcii și Preciziei la 5–10 minute, linii STB directe spre Politehnica, Crângași și Piața Unirii, acces rapid la A1 și centura Bucureștiului.",
                },
                {
                  icon: ShoppingBag,
                  title: "Cumpărături și servicii",
                  desc: "Supermarketuri în ansamblu, Militari Shopping și Plaza România la 10 minute, farmacii, clinici private, săli de fitness și cafenele la parterul blocurilor.",
                },
                {
                  icon: ShieldCheck,
                  title: "Familie și siguranță",
                  desc: "Grădinițe și after-school în ansamblu, școli publice în Roșu și Chiajna, locuri de joacă, spații verzi și pază/acces controlat în majoritatea blocurilor.",
                },
              ].map((f) => (
                <Card key={f.title}>
                  <CardContent className="p-6">
                    <f.icon className="h-7 w-7 text-primary mb-3" />
                    <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold mb-8">Întrebări frecvente</h2>
            <div className="space-y-6">
              {CHIRII_MILITARI_FAQ.map((f) => (
                <Card key={f.q}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">{f.q}</h3>
                    <p className="text-sm text-muted-foreground">{f.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* RELATED */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl font-bold mb-6">Citește și</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link to="/garsoniere-militari-residence" className="block">
                <Card className="h-full hover:border-primary transition-colors">
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-1">
                      Garsoniere Militari Residence
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Prețuri de achiziție și randament la închiriere.
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/facilitati-militari-residence" className="block">
                <Card className="h-full hover:border-primary transition-colors">
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-1">
                      Facilități Militari Residence
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Școli, magazine, transport — tot ce e în jurul ansamblului.
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/viata-in-militari-residence" className="block">
                <Card className="h-full hover:border-primary transition-colors">
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-1">
                      Viața în Militari Residence
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Cum e cu adevărat traiul de zi cu zi în ansamblu.
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
              Cauți o chirie în Militari Residence?
            </h2>
            <p className="mb-8 opacity-90">
              Îți trimitem ofertele potrivite bugetului tău, inclusiv apartamente
              care nu ajung pe portaluri, și te însoțim la vizionări.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/contact">
                  <Phone className="mr-2 h-4 w-4" /> Contactează-ne
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

export default ChiriiMilitariResidence;
