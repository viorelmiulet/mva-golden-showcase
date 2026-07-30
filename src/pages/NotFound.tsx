import { useLocation, Link, useNavigate } from "@/lib/router-compat";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Home, Search, Building2, Phone, ArrowLeft, AlertTriangle, Send, Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const WHATSAPP_NUMBER = "40767941512";
const REPORT_EMAIL = "contact@mvaimobiliare.ro";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [reported, setReported] = useState(false);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const brokenUrl = typeof window !== "undefined"
    ? window.location.href
    : `https://mvaimobiliare.ro${location.pathname}`;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (q) {
      navigate(`/proprietati?search=${encodeURIComponent(q)}`);
    } else {
      navigate("/proprietati");
    }
  };

  const reportMessage = `Bună! Am dat peste un link care nu mai funcționează pe site-ul MVA Imobiliare:\n\n${brokenUrl}\n\nAm ajuns aici din: ${document.referrer || "(direct)"}`;
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(reportMessage)}`;
  const mailtoUrl = `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent("Link stricat pe mvaimobiliare.ro")}&body=${encodeURIComponent(reportMessage)}`;

  const markReported = () => {
    setReported(true);
    setTimeout(() => setReported(false), 4000);
  };

  const quickLinks = [
    {
      to: "/proprietati",
      icon: Building2,
      title: "Proprietăți",
      description: "Vezi toate ofertele disponibile",
    },
    {
      to: "/complexuri-rezidentiale",
      icon: Search,
      title: "Complexuri rezidențiale",
      description: "Descoperă ansamblurile noastre",
    },
    {
      to: "/contact",
      icon: Phone,
      title: "Contact",
      description: "Vorbește cu un consultant MVA",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <meta name="robots" content="noindex, follow" />
        <meta name="googlebot" content="noindex, follow" />
        <title>Pagina nu a fost găsită – MVA Imobiliare</title>
        <meta
          name="description"
          content="Pagina căutată nu mai există. Caută proprietăți MVA Imobiliare, contactează un consultant sau raportează linkul stricat."
        />
      </Helmet>
      <Header />

      <main className="relative flex-1 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, hsl(var(--gold) / 0.6), transparent 45%), radial-gradient(circle at 80% 70%, hsl(var(--gold) / 0.4), transparent 50%)",
          }}
        />

        <section className="container mx-auto px-4 pt-28 pb-16 sm:pt-32 sm:pb-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Eroare 404
            </div>

            <h1 className="relative mb-4 font-bold leading-none tracking-tight text-foreground">
              <span className="block bg-brass bg-clip-text text-[7rem] text-transparent sm:text-[10rem]">
                404
              </span>
            </h1>

            <h2 className="mb-4 text-2xl font-bold text-foreground sm:text-3xl">
              Pagina nu a fost găsită
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-base text-muted-foreground sm:text-lg">
              Adresa accesată nu mai există, a fost mutată sau proprietatea a fost vândută. Te ajutăm să găsești rapid ce cauți.
            </p>

            {/* Search bar */}
            <form
              onSubmit={handleSearch}
              className="mx-auto mb-6 flex w-full max-w-xl flex-col gap-2 sm:flex-row"
              role="search"
              aria-label="Caută proprietăți"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Caută după zonă, camere, complex..."
                  className="h-12 pl-9"
                  aria-label="Termen de căutare"
                />
              </div>
              <Button type="submit" variant="luxury" size="lg" className="h-12">
                Caută proprietăți
              </Button>
            </form>

            <div className="mb-14 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild variant="outline" size="lg" className="min-w-[180px]">
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Pagina principală
                </Link>
              </Button>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gold"
              >
                <ArrowLeft className="h-4 w-4" />
                Înapoi la pagina anterioară
              </button>
            </div>
          </div>

          {/* Quick links */}
          <div className="mx-auto mb-12 max-w-4xl">
            <div className="mb-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Navigare rapidă
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {quickLinks.map(({ to, icon: Icon, title, description }) => (
                <Link
                  key={to}
                  to={to}
                  className="group rounded-xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-gold/50  /5"
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold transition-colors group-hover:bg-gold group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1 font-semibold text-foreground group-hover:text-gold">
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Report broken link */}
          <div className="mx-auto max-w-2xl">
            <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="mb-1 font-semibold text-foreground">
                    Raportează linkul stricat
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Ne ajuți să reparăm site-ul dacă ne trimiți pagina pe care ai încercat să o accesezi.
                  </p>
                  <div className="mb-4 overflow-hidden rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    <span className="block truncate font-mono" title={brokenUrl}>
                      {brokenUrl}
                    </span>
                  </div>
                  {reported ? (
                    <div className="inline-flex items-center gap-2 rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
                      <Check className="h-4 w-4" />
                      Mulțumim! Vom verifica linkul cât mai curând.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        asChild
                        variant="luxury"
                        size="sm"
                        onClick={markReported}
                      >
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Trimite pe WhatsApp
                        </a>
                      </Button>
                      <Button asChild variant="outline" size="sm" onClick={markReported}>
                        <a href={mailtoUrl}>
                          <Send className="mr-2 h-4 w-4" />
                          Trimite pe email
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
