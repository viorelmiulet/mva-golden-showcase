import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Euro, ArrowRight, Sparkles, Loader2, Phone } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPropertyUrl } from "@/lib/propertySlug";
import OptimizedPropertyImage from "@/components/OptimizedPropertyImage";
import ScrollReveal from "@/components/ScrollReveal";

const MilitariResidence = () => {
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["militari-residence-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_offers")
        .select("*")
        .is("project_id", null)
        .eq("is_published", true)
        .or("location.ilike.%militari residence%,location.ilike.%chiajna%,zone.ilike.%militari residence%,zone.ilike.%chiajna%,title.ilike.%militari residence%")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    refetchOnWindowFocus: false,
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "MVA Imobiliare",
    areaServed: {
      "@type": "Place",
      name: "Militari Residence, Chiajna, Ilfov",
    },
    url: "https://mvaimobiliare.ro/militari-residence",
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Cât costă un apartament cu 2 camere în Militari Residence?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Prețurile variază între 70.000 și 85.000€ în funcție de etaj, orientare și finisaje. Contactați MVA Imobiliare pentru o evaluare gratuită.",
        },
      },
      {
        "@type": "Question",
        name: "Militari Residence este în București sau Ilfov?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Militari Residence este în comuna Chiajna, județul Ilfov, la granița cu Sectorul 6 București.",
        },
      },
      {
        "@type": "Question",
        name: "Se poate lua credit ipotecar pentru apartamentele din Militari Residence?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Da, toate apartamentele sunt eligibile pentru credit ipotecar. MVA Imobiliare colaborează cu consultanți financiari care oferă preaprobarea gratuit.",
        },
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>Apartamente de Vânzare Militari Residence – MVA Imobiliare</title>
        <meta
          name="description"
          content="Apartamente noi de vânzare în Militari Residence, Chiajna. Garsoniere, 2 și 3 camere disponibile. Prețuri actualizate, vizionare gratuită. Contactează MVA Imobiliare."
        />
        <link rel="canonical" href="https://mvaimobiliare.ro/militari-residence" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mvaimobiliare.ro/militari-residence" />
        <meta property="og:title" content="Apartamente Militari Residence – MVA Imobiliare" />
        <meta property="og:description" content="Apartamente noi de vânzare în Militari Residence, Chiajna. Vizionare gratuită cu MVA Imobiliare." />
        <meta property="og:image" content="https://mvaimobiliare.ro/og-default.jpg" />
        <meta property="og:image:width" content="1216" />
        <meta property="og:image:height" content="640" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Apartamente Militari Residence – MVA Imobiliare" />
        <meta name="twitter:description" content="Apartamente noi în Militari Residence, Chiajna." />
        <meta name="twitter:image" content="https://mvaimobiliare.ro/og-default.jpg" />

        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(faqStructuredData)}</script>
      </Helmet>

      <Header />

      <main className="min-h-screen">
        <section className="relative py-16 sm:py-20 lg:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-section">
            <div className="absolute top-20 left-10 w-72 h-72 bg-gold/5 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/3 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
          </div>

          <div className="container mx-auto px-4 lg:px-6 relative z-10 max-w-5xl">
            <ScrollReveal>
              <header className="text-center mb-12 lg:mb-16">
                <Badge variant="secondary" className="glass border-gold/30 text-gold px-4 py-1.5 text-sm font-semibold mb-6">
                  <MapPin className="w-4 h-4 mr-2" />
                  Chiajna, Ilfov
                </Badge>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6">
                  <span className="text-foreground">Apartamente de Vânzare în </span>
                  <span className="text-gradient-gold">Militari Residence</span>
                </h1>

                <p className="text-base lg:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  MVA Imobiliare oferă apartamente de vânzare în Militari Residence — garsoniere, 2 și 3 camere, în intervalul 70.000–90.000€. Evaluare gratuită, fără costuri ascunse.
                </p>
              </header>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <article className="prose prose-lg max-w-none space-y-10 mb-16">
                <section>
                  <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                    Despre <span className="text-gradient-gold">Militari Residence</span>
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Militari Residence este cel mai mare ansamblu rezidențial din vestul Bucureștiului, dezvoltat în Chiajna, județul Ilfov, la câteva minute de Sectorul 6. Cu peste 10.000 de apartamente livrate, ansamblul a devenit o comunitate urbană completă, cu școli, grădinițe, spații comerciale și zone verzi amenajate.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    Ansamblul se remarcă prin accesul excelent la infrastructura Bucureștiului: bulevardul Iuliu Maniu, linia de metrou M6 (în dezvoltare), autobuzele STB și proximitatea față de marile centre comerciale — Militari Shopping Center, Cora Lujerului și Auchan Militari.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                    Tipuri de <span className="text-gradient-gold">Apartamente Disponibile</span>
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    MVA Imobiliare are în portofoliu constant apartamente în Militari Residence în trei configurații:
                  </p>
                  <div className="mt-4 space-y-4">
                    <div className="card-modern rounded-xl p-4 border-gold/10">
                      <h3 className="text-lg font-semibold text-foreground mb-2">Garsoniere în Militari Residence</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Suprafețe între 28 și 38 mp, ideale pentru prima locuință sau investiție. Prețuri între 50.000 și 65.000€.
                      </p>
                    </div>
                    <div className="card-modern rounded-xl p-4 border-gold/10">
                      <h3 className="text-lg font-semibold text-foreground mb-2">Apartamente 2 camere în Militari Residence</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Cele mai căutate, suprafețe între 45 și 58 mp, prețuri între 70.000 și 85.000€. Potrivite pentru cupluri și familii tinere.
                      </p>
                    </div>
                    <div className="card-modern rounded-xl p-4 border-gold/10">
                      <h3 className="text-lg font-semibold text-foreground mb-2">Apartamente 3 camere în Militari Residence</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Suprafețe între 62 și 78 mp, prețuri între 82.000 și 95.000€. Ideal pentru familii cu copii care caută spațiu generos și confort.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                    De ce să alegi <span className="text-gradient-gold">MVA Imobiliare</span>
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Cu sediul în Chiajna din 2016, suntem agenția imobiliară cu cea mai mare experiență în tranzacțiile din Militari Residence. Cunoaștem fiecare bloc, fiecare dezvoltator și fiecare preț real tranzacționat în zonă — nu prețuri de listă, ci prețuri reale.
                  </p>
                  <div className="mt-4 space-y-2">
                    <p className="text-muted-foreground font-medium">Ce oferim:</p>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-gold mt-1">—</span>
                        Evaluare gratuită a oricărei proprietăți din Militari Residence
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gold mt-1">—</span>
                        Acces la oferte exclusive nepublicate online
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gold mt-1">—</span>
                        Asistență completă: de la prima vizionare până la semnarea actelor la notar
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gold mt-1">—</span>
                        Consultanță pentru finanțare și credit ipotecar
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gold mt-1">—</span>
                        Comision transparent, fără costuri ascunse
                      </li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-6">
                    Întrebări frecvente despre <span className="text-gradient-gold">Militari Residence</span>
                  </h2>
                  <div className="space-y-6">
                    <div className="card-modern rounded-xl p-5 border-gold/10">
                      <h3 className="text-base font-semibold text-foreground mb-2">
                        Cât costă un apartament cu 2 camere în Militari Residence în 2025?
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Prețurile pentru apartamentele cu 2 camere în Militari Residence variază între 70.000 și 85.000€ în funcție de etaj, orientare și starea finisajelor. Contactați-ne pentru o evaluare gratuită.
                      </p>
                    </div>
                    <div className="card-modern rounded-xl p-5 border-gold/10">
                      <h3 className="text-base font-semibold text-foreground mb-2">
                        Militari Residence este în București sau Ilfov?
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Militari Residence este situat administrativ în comuna Chiajna, județul Ilfov, la granița cu Sectorul 6 București. Adresa poștală este Chiajna, dar zona este practic continuarea cartierului Militari.
                      </p>
                    </div>
                    <div className="card-modern rounded-xl p-5 border-gold/10">
                      <h3 className="text-base font-semibold text-foreground mb-2">
                        Se poate lua credit ipotecar pentru apartamentele din Militari Residence?
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Da, toate apartamentele din Militari Residence sunt eligibile pentru credit ipotecar la băncile din România. MVA Imobiliare colaborează cu consultanți financiari care vă oferă preaprobarea gratuit.
                      </p>
                    </div>
                  </div>
                </section>
              </article>
            </ScrollReveal>

            {/* Properties Section */}
            <ScrollReveal delay={0.2}>
              <section className="mb-16">
                <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8">
                  <span className="text-foreground">Proprietăți în </span>
                  <span className="text-gradient-gold">Militari Residence</span>
                </h2>

                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gold" />
                  </div>
                ) : properties.length === 0 ? (
                  <div className="text-center py-12 card-modern rounded-2xl p-8">
                    <p className="text-muted-foreground mb-4">
                      Momentan nu avem proprietăți listate în Militari Residence. Contactează-ne pentru oferte actualizate!
                    </p>
                    <Link to="/contact">
                      <Button variant="luxury" size="lg" className="glow-gold">
                        <Phone className="w-4 h-4 mr-2" />
                        Contactează-ne
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                    {properties.map((property) => (
                      <Link to={getPropertyUrl(property)} key={property.id}>
                        <Card className="group relative overflow-hidden glass glass-hover touch-manipulation border-gold/20 h-full">
                          {property.is_featured && (
                            <div className="absolute top-3 left-3 z-10">
                              <Badge className="bg-gold text-primary-foreground shadow-lg text-xs">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Recomandat
                              </Badge>
                            </div>
                          )}
                          <div className="relative overflow-hidden">
                            <OptimizedPropertyImage
                              src={property.images?.[0]}
                              alt={`Apartament ${property.rooms || ""} camere Militari Residence${property.surface_min ? ` ${property.surface_min}mp` : ""}`}
                              className="group-hover:scale-110 transition-transform duration-700"
                              aspectRatio="video"
                              width={640}
                              height={360}
                              quality={75}
                            />
                            <div className="absolute bottom-3 right-3 glass rounded-xl px-3 py-2 border border-gold/30">
                              <div className="flex items-center text-gold font-bold">
                                <Euro className="w-3 h-3 mr-1" />
                                <span className="text-xs sm:text-sm">
                                  {property.price_min?.toLocaleString()} {property.currency || "EUR"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <CardContent className="p-4 space-y-3">
                            <h3 className="text-base font-bold leading-tight text-foreground group-hover:text-gold transition-colors line-clamp-2">
                              {property.title}
                            </h3>
                            <div className="flex items-center text-muted-foreground">
                              <MapPin className="w-3 h-3 mr-1 text-gold flex-shrink-0" />
                              <span className="text-xs line-clamp-1">{property.location}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="p-2 rounded-lg">
                                <div className="text-xs text-muted-foreground">Preț</div>
                                <div className="text-xs font-semibold text-foreground">{property.price_min?.toLocaleString()}</div>
                              </div>
                              <div className="p-2 rounded-lg">
                                <div className="text-xs text-muted-foreground">mp</div>
                                <div className="text-xs font-semibold text-foreground">{property.surface_min || property.surface_max || "-"}</div>
                              </div>
                              <div className="p-2 rounded-lg">
                                <div className="text-xs text-muted-foreground">Camere</div>
                                <div className="text-xs font-semibold text-foreground">{property.rooms}</div>
                              </div>
                            </div>
                            <Button variant="luxuryOutline" className="w-full h-9 text-sm group">
                              Vezi Detalii
                              <ArrowRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </ScrollReveal>

            {/* CTA */}
            <ScrollReveal delay={0.3}>
              <div className="text-center card-modern border-glow rounded-2xl p-8 max-w-3xl mx-auto">
                <h2 className="text-xl lg:text-2xl font-bold mb-4">
                  <span className="text-foreground">Cauți un apartament în </span>
                  <span className="text-gradient-gold">Militari Residence?</span>
                </h2>
                <p className="text-muted-foreground mb-6">
                  Contactează-ne pentru vizionare gratuită și consultanță personalizată.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/contact">
                    <Button variant="luxury" size="lg" className="glow-gold w-full sm:w-auto">
                      <Phone className="w-4 h-4 mr-2" />
                      Contactează-ne
                    </Button>
                  </Link>
                  <Link to="/proprietati">
                    <Button variant="luxuryOutline" size="lg" className="w-full sm:w-auto">
                      Toate proprietățile
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default MilitariResidence;
