import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Helmet } from "react-helmet-async";
import {
  MapPin,
  Home,
  Ruler,
  Euro,
  ArrowLeft,
  Phone,
  MessageCircle,
  Building2,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";

const ProjectDetail = () => {
  const { id } = useParams();
  const { trackContact } = useGoogleAnalytics();

  // Fetch project details
  const { data: project, isLoading: projectLoading, error: projectError } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("real_estate_projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching project:", error);
        throw error;
      }
      return data;
    },
    enabled: !!id,
    retry: false, // Don't retry on storage quota errors
  });

  // Fetch apartments from this project
  const { data: apartments, isLoading: apartmentsLoading } = useQuery({
    queryKey: ["project-apartments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_offers")
        .select("*")
        .eq("project_id", id)
        .order("price_min", { ascending: true });

      if (error) {
        console.error("Error fetching apartments:", error);
        // Return empty array instead of throwing to allow page to render
        return [];
      }
      return data || [];
    },
    enabled: !!id && !!project,
    retry: false, // Don't retry on storage quota errors
  });

  const isLoading = projectLoading || apartmentsLoading;

  if (isLoading) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
          <Header />
          <main className="pt-24 pb-16">
            <div className="container mx-auto px-4">
              <div className="text-center py-12">
                <p className="text-muted-foreground">Se încarcă...</p>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
          <Header />
          <main className="pt-24 pb-16">
            <div className="container mx-auto px-4">
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">
                  {projectError ? "Eroare la încărcarea proiectului" : "Proiect negăsit"}
                </h1>
                {projectError && (
                  <p className="text-muted-foreground mb-6">
                    Ne cerem scuze pentru inconvenient. Vă rugăm să reveniți mai târziu.
                  </p>
                )}
                <Link to="/proiecte">
                  <Button variant="luxury">
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Înapoi la proiecte
                  </Button>
                </Link>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  const handleWhatsAppClick = () => {
    trackContact("whatsapp", "project_detail");
    window.open(
      `https://wa.me/40767941512?text=Bună! Sunt interesat de ${project.name}`,
      "_blank"
    );
  };

  const handlePhoneClick = () => {
    trackContact("phone", "project_detail");
  };

  return (
    <>
      <Helmet>
        <title>{project.name} - MVA Imobiliare</title>
        <meta name="description" content={project.description} />
        <link rel="canonical" href={`https://mvaimobiliare.ro/proiecte/${id}`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <Header />

        <main className="pt-20 sm:pt-24 pb-12 sm:pb-16">
          {/* Back Button */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <Link to="/proiecte">
              <Button variant="ghost" size="sm" className="group">
                <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Înapoi la proiecte
              </Button>
            </Link>
          </div>

          {/* Project Hero */}
          <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-8 items-start">
                {/* Project Image */}
                <div className="relative aspect-video lg:aspect-square rounded-2xl overflow-hidden">
                  <img
                    src={
                      project.main_image ||
                      "/lovable-uploads/7e4ce4f4-4a39-4844-be2f-f0cbfeedb2dd.png"
                    }
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                  {project.is_recommended && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-gold text-primary-foreground shadow-lg">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Recomandat
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Project Info */}
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                      <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                        {project.name}
                      </span>
                    </h1>
                    <div className="flex items-center text-muted-foreground mb-4">
                      <MapPin className="w-5 h-5 mr-2 text-gold" />
                      <span className="text-lg">{project.location}</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="glass border-gold/20">
                      <CardContent className="p-4 text-center">
                        <Euro className="w-6 h-6 text-gold mx-auto mb-2" />
                        <div className="text-xs text-muted-foreground mb-1">
                          Preț
                        </div>
                        <div className="text-sm font-semibold">
                          {project.price_range}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="glass border-gold/20">
                      <CardContent className="p-4 text-center">
                        <Ruler className="w-6 h-6 text-gold mx-auto mb-2" />
                        <div className="text-xs text-muted-foreground mb-1">
                          Suprafață
                        </div>
                        <div className="text-sm font-semibold">
                          {project.surface_range}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="glass border-gold/20">
                      <CardContent className="p-4 text-center">
                        <Home className="w-6 h-6 text-gold mx-auto mb-2" />
                        <div className="text-xs text-muted-foreground mb-1">
                          Camere
                        </div>
                        <div className="text-sm font-semibold">
                          {project.rooms_range}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Contact Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="luxury"
                      className="flex-1"
                      onClick={handleWhatsAppClick}
                    >
                      <MessageCircle className="mr-2 w-4 h-4" />
                      WhatsApp
                    </Button>
                    <a
                      href="tel:0767941512"
                      className="flex-1"
                      onClick={handlePhoneClick}
                    >
                      <Button variant="luxuryOutline" className="w-full">
                        <Phone className="mr-2 w-4 h-4" />
                        Sună acum
                      </Button>
                    </a>
                  </div>
                </div>
              </div>

              {/* Features & Amenities */}
              {(project.features?.length > 0 || project.amenities?.length > 0) && (
                <div className="mt-12 grid md:grid-cols-2 gap-6">
                  {project.features?.length > 0 && (
                    <Card className="glass border-gold/20">
                      <CardContent className="p-6">
                        <h2 className="text-xl font-bold mb-4 text-gold">
                          Facilități
                        </h2>
                        <div className="space-y-3">
                          {project.features.map((feature: string, index: number) => (
                            <div key={index} className="flex items-start">
                              <CheckCircle className="w-5 h-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                              <span className="text-foreground">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {project.amenities?.length > 0 && (
                    <Card className="glass border-gold/20">
                      <CardContent className="p-6">
                        <h2 className="text-xl font-bold mb-4 text-gold">
                          Amenajări
                        </h2>
                        <div className="space-y-3">
                          {project.amenities.map((amenity: string, index: number) => (
                            <div key={index} className="flex items-start">
                              <CheckCircle className="w-5 h-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                              <span className="text-foreground">{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Apartments by Floor */}
          <section className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                      Apartamente Disponibile
                    </h2>
                    <p className="text-muted-foreground">
                      {apartments?.length || 0}{" "}
                      {apartments?.length === 1
                        ? "apartament disponibil"
                        : "apartamente disponibile"}
                    </p>
                  </div>
                  <Building2 className="w-8 h-8 text-gold" />
                </div>
              </div>

              {apartments && apartments.length > 0 ? (
                <div className="space-y-8">
                  {["Parter", "Etaj 1", "Etaj 2", "Etaj 3", "Etaj 4", "Etaj 5"].map((floor) => {
                    const floorApartments = apartments.filter((apt: any) => 
                      apt.features?.some((f: string) => f.toLowerCase() === floor.toLowerCase())
                    );
                    
                    if (floorApartments.length === 0) return null;
                    
                    return (
                      <div key={floor}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-gradient-to-r from-gold/20 to-transparent h-px flex-1" />
                          <h3 className="text-xl font-bold uppercase tracking-wider text-gold">
                            {floor}
                          </h3>
                          <div className="bg-gradient-to-l from-gold/20 to-transparent h-px flex-1" />
                        </div>
                        
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                          {floorApartments.map((apartment: any) => (
                            <Card
                              key={apartment.id}
                              className="relative overflow-hidden border-2 border-gold/30 bg-gradient-to-br from-background via-background to-gold/5"
                            >
                              <CardContent className="p-4 space-y-3">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2">
                                    <Home className="w-5 h-5 text-gold" />
                                    <span className="font-bold text-lg">
                                      {apartment.title.split(' - ')[0]}
                                    </span>
                                  </div>
                                  <Badge 
                                    variant={apartment.availability_status === 'available' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {apartment.availability_status === 'available' ? 'Disponibil' : 'Vândut'}
                                  </Badge>
                                </div>

                                {/* Type */}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <div className="w-2 h-2 rounded-full bg-gold" />
                                  {apartment.rooms === 1 ? 'Garsonieră' : `${apartment.rooms} camere`}
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-gold/20" />

                                {/* Details */}
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Suprafață:</span>
                                    <span className="font-semibold">{apartment.surface_min}.00 m²</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Credit:</span>
                                    <span className="font-bold text-gold">
                                      {apartment.price_max?.toLocaleString()} EUR
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Cash:</span>
                                    <span className="font-bold text-blue-400">
                                      {apartment.price_min?.toLocaleString()} EUR
                                    </span>
                                  </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-gold/20" />

                                {/* Actions */}
                                <div className="grid grid-cols-2 gap-2">
                                  <a 
                                    href={`tel:0767941512`}
                                    onClick={handlePhoneClick}
                                  >
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full text-xs h-8 border-gold/30"
                                    >
                                      Contact
                                    </Button>
                                  </a>
                                  <Link to={`/proprietati/${apartment.id}`}>
                                    <Button 
                                      variant="default" 
                                      size="sm" 
                                      className="w-full text-xs h-8 bg-gold hover:bg-gold/90"
                                    >
                                      Detalii
                                    </Button>
                                  </Link>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Card className="glass border-gold/20">
                  <CardContent className="p-12 text-center">
                    <Building2 className="w-16 h-16 text-gold mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold mb-2">
                      Momentan nu sunt apartamente adăugate
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Contactează-ne pentru informații despre apartamente
                      disponibile în acest proiect.
                    </p>
                    <Button variant="luxury" onClick={handleWhatsAppClick}>
                      <MessageCircle className="mr-2 w-4 h-4" />
                      Contactează-ne
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ProjectDetail;
