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

  return (
    <>
      <Helmet>
        <title>Apartamente de Vânzare Militari Residence – MVA Imobiliare</title>
        <meta
          name="description"
          content="Apartamente noi de vânzare în Militari Residence, Chiajna. Garsoniere, 2 și 3 camere disponibile. Prețuri actualizate, vizionare gratuită. Contactează MVA Imobiliare."
        />
        <link rel="canonical" href="https://mvaimobiliare.ro/militari-residence" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <Header />

      <main className="min-h-screen">
        {/* Hero Section */}
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
                  Garsoniere, apartamente cu 2 și 3 camere disponibile. Prețuri actualizate, vizionare gratuită.
                </p>
              </header>
            </ScrollReveal>

            {/* Content Sections */}
            <ScrollReveal delay={0.1}>
              <article className="prose prose-lg max-w-none space-y-10 mb-16">
                <section>
                  <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                    Despre <span className="text-gradient-gold">Militari Residence</span>
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Militari Residence este unul dintre cele mai mari și cunoscute ansambluri rezidențiale din vestul Bucureștiului, situat în Chiajna, județul Ilfov, la granița cu Sectorul 6. Ansamblul oferă apartamente moderne cu 1, 2 și 3 camere, dotări complete și acces facil la toate facilitățile urbane. Cu mii de apartamente livrate și comunități în continuă dezvoltare, Militari Residence rămâne una dintre cele mai populare opțiuni pentru cumpărătorii de locuințe noi din zona de vest a capitalei.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                    Localizare și <span className="text-gradient-gold">Acces</span>
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Militari Residence beneficiază de acces direct la bulevardul Iuliu Maniu și la transportul în comun spre centrul Bucureștiului. Proximitatea față de mall-uri (Militari Shopping, Cora, Auchan) și școli face din această zonă una dintre cele mai căutate pentru familii. Infrastructura rutieră în continuă dezvoltare, împreună cu opțiunile de transport public, asigură o conectivitate excelentă cu restul orașului, inclusiv accesul rapid spre autostrada A1 și centura capitalei.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                    Tipuri de <span className="text-gradient-gold">Apartamente Disponibile</span>
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    MVA Imobiliare are în portofoliu constant apartamente disponibile în Militari Residence: garsoniere, apartamente cu 2 camere și apartamente cu 3 camere, în diverse etaje și orientări. Toate proprietățile sunt în ansambluri rezidențiale noi, cu finisaje moderne și spații comune îngrijite. Fiecare apartament este verificat personal de echipa noastră, astfel încât să oferim clienților informații complete și corecte despre suprafețe, compartimentare și starea actuală a locuinței.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                    De ce să alegi <span className="text-gradient-gold">MVA Imobiliare</span>
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Cu experiență din 2016 și sediul în Chiajna, suntem agenția imobiliară cea mai apropiată de Militari Residence. Cunoaștem fiecare bloc, fiecare scară și fiecare preț tranzacționat în zonă. Oferim evaluare gratuită, transparență totală și asistență completă până la semnarea actelor la notar. Echipa noastră de consultanți imobiliari este specializată în tranzacții în zona Militari și oferă suport complet pe tot parcursul procesului de achiziție.
                  </p>
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
                      <Link to={`/proprietati/${property.id}`} key={property.id}>
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
