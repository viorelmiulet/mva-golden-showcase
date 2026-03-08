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

const RenewResidence = () => {
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["renew-residence-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_offers")
        .select("*")
        .is("project_id", null)
        .eq("is_published", true)
        .or("location.ilike.%renew residence%,zone.ilike.%renew residence%,title.ilike.%renew residence%,location.ilike.%renew%,zone.ilike.%renew%")
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
      name: "Renew Residence, Militari, București",
    },
    url: "https://mvaimobiliare.ro/renew-residence",
  };

  return (
    <>
      <Helmet>
        <title>Apartamente de Vânzare Renew Residence – MVA Imobiliare</title>
        <meta
          name="description"
          content="Apartamente noi de vânzare în Renew Residence. Oferte actualizate, prețuri corecte, vizionare gratuită. MVA Imobiliare – specialiști în zona Militari."
        />
        <link rel="canonical" href="https://mvaimobiliare.ro/renew-residence" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
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
                  Zona Militari, București
                </Badge>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6">
                  <span className="text-foreground">Apartamente de Vânzare în </span>
                  <span className="text-gradient-gold">Renew Residence</span>
                </h1>

                <p className="text-base lg:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  MVA Imobiliare oferă apartamente de vânzare în Renew Residence — garsoniere, 2 și 3 camere. Vizionare gratuită, asistență completă până la notar.
                </p>
              </header>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <article className="prose prose-lg max-w-none space-y-10 mb-16">
                <section>
                  <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                    Despre <span className="text-gradient-gold">Renew Residence</span>
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Renew Residence este un ansamblu rezidențial modern situat în zona Militari, Chiajna, ce se remarcă prin arhitectura contemporană și calitatea finisajelor. Proiectul oferă apartamente bine compartimentate cu acces la facilități moderne și spații verzi generoase.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    Localizarea excelentă asigură acces rapid la bulevardul Iuliu Maniu, la transportul în comun și la toate serviciile din zonă — școli, grădinițe, centre comerciale și unități medicale.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                    Apartamente disponibile în <span className="text-gradient-gold">Renew Residence</span>
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    MVA Imobiliare oferă garsoniere, apartamente cu 2 camere și apartamente cu 3 camere în Renew Residence, în intervalul de prețuri 70.000–90.000€. Toate proprietățile sunt în blocuri noi cu finisaje de calitate, locuri de parcare și spații comune îngrijite.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                    De ce MVA Imobiliare pentru <span className="text-gradient-gold">Renew Residence</span>
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Suntem specializați în ansamblurile rezidențiale din zona Chiajna–Militari din 2016. Cunoaștem Renew Residence în detaliu și vă oferim acces la oferte exclusive, evaluare gratuită și asistență completă în procesul de cumpărare.
                  </p>
                </section>
              </article>
            </ScrollReveal>

            {/* Properties Section */}
            <ScrollReveal delay={0.2}>
              <section className="mb-16">
                <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8">
                  <span className="text-foreground">Proprietăți în </span>
                  <span className="text-gradient-gold">Renew Residence</span>
                </h2>

                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gold" />
                  </div>
                ) : properties.length === 0 ? (
                  <div className="text-center py-12 card-modern rounded-2xl p-8">
                    <p className="text-muted-foreground mb-4">
                      Momentan nu avem proprietăți listate în Renew Residence. Contactează-ne pentru oferte actualizate!
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
                              alt={`Apartament ${property.rooms || ""} camere Renew Residence${property.surface_min ? ` ${property.surface_min}mp` : ""}`}
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
                  <span className="text-gradient-gold">Renew Residence?</span>
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

export default RenewResidence;
