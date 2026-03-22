import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-12 sm:pt-28 sm:pb-16">
        <div className="w-full max-w-2xl text-center">
          <p className="mb-4 text-7xl font-bold tracking-[0.2em] text-gold sm:text-8xl">404</p>
          <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            Pagina nu a fost găsită
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-base text-muted-foreground sm:text-lg">
            Ne pare rău, pagina pe care o cauți nu există sau a fost mutată.
          </p>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild variant="luxury" size="lg">
              <Link to="/proprietati">Vezi proprietăți disponibile</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/">Acasă</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
