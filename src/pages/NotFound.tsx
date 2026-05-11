import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Home, Search, Building2, Phone, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

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
        <title>404 - Pagina nu a fost găsită | MVA Imobiliare</title>
        <meta
          name="description"
          content="Pagina căutată nu mai există. Explorează proprietățile MVA Imobiliare sau contactează un consultant."
        />
      </Helmet>
      <Header />

      <main className="relative flex-1 overflow-hidden">
        {/* Subtle brand backdrop */}
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
              <span className="block bg-gradient-to-b from-gold via-gold to-gold/40 bg-clip-text text-[7rem] text-transparent sm:text-[10rem]">
                404
              </span>
            </h1>

            <h2 className="mb-4 text-2xl font-bold text-foreground sm:text-3xl">
              Pagina nu a fost găsită
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-base text-muted-foreground sm:text-lg">
              Adresa accesată nu mai există, a fost mutată sau a expirat. Te
              putem ajuta să găsești ce cauți.
            </p>

            <div className="mb-14 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild variant="luxury" size="lg" className="min-w-[220px]">
                <Link to="/proprietati">
                  <Search className="mr-2 h-4 w-4" />
                  Vezi proprietăți disponibile
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-[180px]">
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Pagina principală
                </Link>
              </Button>
            </div>

            <button
              type="button"
              onClick={() => window.history.back()}
              className="mb-12 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gold"
            >
              <ArrowLeft className="h-4 w-4" />
              Înapoi la pagina anterioară
            </button>
          </div>

          <div className="mx-auto max-w-4xl">
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
                  className="group rounded-xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-lg hover:shadow-gold/5"
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
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
