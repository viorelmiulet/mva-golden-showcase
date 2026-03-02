import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowRight, Sparkles, Loader2, Phone } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OptimizedPropertyImage from "@/components/OptimizedPropertyImage";
import ScrollReveal from "@/components/ScrollReveal";

const EurocasaResidence = () => {
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["eurocasa-residence-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_offers")
        .select("*")
        .eq("is_published", true)
        .or("location.ilike.%eurocasa%,zone.ilike.%eurocasa%,title.ilike.%eurocasa%,project_name.ilike.%eurocasa%")
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
      name: "Eurocasa Residence, Chiajna, Ilfov",
    },
    url: "https://mvaimobiliare.ro/eurocasa-residence",
  };

  return (
    <>
      <Helmet>
        <title>Apartamente de Vânzare Eurocasa Residence – MVA Imobiliare</title>
        <meta
          name="description"
          content="Apartamente noi disponibile în Eurocasa Residence. MVA Imobiliare – agenție specializată în ansambluri rezidențiale zona Militari, Chiajna."
        />
        <link rel="canonical" href="https://mvaimobiliare.ro/eurocasa-residence" />
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
                  Chiajna, Ilfov
                </Badge>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6">
                  <span className="text-foreground">Apartamente de Vânzare în </span>
                  <span className="text-gradient-gold">Eurocasa Residence</span>
                </h1>

                <p className="text-base lg:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Apartamente noi cu finisaje de calitate în Eurocasa Residence. Vizionare gratuită prin MVA Imobiliare.
                </p>
              </header>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <article className="prose prose-lg max-w-none space-y-10 mb-16">
                <section>
                  <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                    Despre <span className="text-gradient-gold">Eurocasa Residence</span>
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Eurocasa Residence este un ansamblu rezidențial modern situat în Chiajna, județul Ilfov, în imediata apropiere a sectorului 6 din București. Proiectul a fost conceput pentru a oferi locuințe de calitate la prețuri accesibile, într-un cadru urbanistic bine organizat. Ansamblul cuprinde apartamente cu 1, 2 și 3 camere, fiecare unitate fiind proiectată cu atenție la detalii, spații generoase și compartimentare eficientă, ideale atât pentru familii, cât și pentru tineri la prima achiziție imobiliară.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                    Localizare și <span className="text-gradient-gold">Conectivitate</span>
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Eurocasa Residence se bucură de o poziție strategică, cu acces facil la bulevardul Iuliu Maniu și la principalele rute de transport din vestul Bucureștiului. Stațiile de autobuz și metrou sunt la distanță mică, permițând deplasarea rapidă către centrul capitalei. În zonă se regăsesc centre comerciale precum Militari Shopping Center, hipermarketuri Cora și Auchan, precum și grădinițe, școli și clinici medicale. Apropierea de centura Bucureștiului și de autostrada A1 reprezintă un avantaj suplimentar pentru cei care navighează frecvent în afara orașului.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                    Facilități și <span className="text-gradient-gold">Standarde de Construcție</span>
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Apartamentele din Eurocasa Residence sunt construite conform standardelor actuale de eficiență energetică, cu izolație termică și fonică de înaltă performanță. Rezidenții beneficiază de parcări dedicate, spații verzi amenajate și zone de recreere. Clădirile dispun de lift, interfonie video și sisteme moderne de securitate. Finisajele interioare includ tâmplărie cu geam termoizolant, gresie și faianță premium, instalații sanitare de calitate și pregătire pentru aer condiționat, oferind un nivel ridicat de confort imediat după mutare.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                    De ce să alegi <span className="text-gradient-gold">MVA Imobiliare</span>
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Cu sediul în Chiajna și experiență din 2016 pe piața imobiliară din zona Militari, MVA Imobiliare este partenerul ideal pentru achiziția unui apartament în Eurocasa Residence. Cunoaștem ansamblul în detaliu, de la planuri de compartimentare la istoricul tranzacțiilor din fiecare bloc. Oferim consultanță gratuită, vizionări personalizate și suport juridic complet pe tot parcursul procesului de cumpărare, de la identificarea apartamentului potrivit până la semnarea actelor la notar.
                  </p>
                </section>
              </article>
            </ScrollReveal>

            {/* Properties — prices hidden for Eurocasa */}
            <ScrollReveal delay={0.2}>
              <section className="mb-16">
                <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8">
                  <span className="text-foreground">Proprietăți în </span>
                  <span className="text-gradient-gold">Eurocasa Residence</span>
                </h2>

                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gold" />
                  </div>
                ) : properties.length === 0 ? (
                  <div className="text-center py-12 card-modern rounded-2xl p-8">
                    <p className="text-muted-foreground mb-4">
                      Momentan nu avem proprietăți listate în Eurocasa Residence. Contactează-ne pentru oferte actualizate!
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
                              alt={`Apartament ${property.rooms || ""} camere Eurocasa Residence${property.surface_min ? ` ${property.surface_min}mp` : ""}`}
                              className="group-hover:scale-110 transition-transform duration-700"
                              aspectRatio="video"
                              width={640}
                              height={360}
                              quality={75}
                            />
                          </div>
                          <CardContent className="p-4 space-y-3">
                            <h3 className="text-base font-bold leading-tight text-foreground group-hover:text-gold transition-colors line-clamp-2">
                              {property.title}
                            </h3>
                            <div className="flex items-center text-muted-foreground">
                              <MapPin className="w-3 h-3 mr-1 text-gold flex-shrink-0" />
                              <span className="text-xs line-clamp-1">{property.location}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-center">
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

            <ScrollReveal delay={0.3}>
              <div className="text-center card-modern border-glow rounded-2xl p-8 max-w-3xl mx-auto">
                <h2 className="text-xl lg:text-2xl font-bold mb-4">
                  <span className="text-foreground">Cauți un apartament în </span>
                  <span className="text-gradient-gold">Eurocasa Residence?</span>
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

export default EurocasaResidence;
