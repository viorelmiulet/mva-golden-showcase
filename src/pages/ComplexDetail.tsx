import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  ArrowLeft,
  MapPin,
  Euro,
  Home,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const ComplexDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['public-project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('real_estate_projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['public-project-properties', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_offers')
        .select('*')
        .eq('project_id', id)
        .order('title');
      
      if (error) throw error;
      return data;
    }
  });

  if (projectLoading || propertiesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-4">
            <Building2 className="h-12 w-12 mx-auto animate-pulse text-primary" />
            <p className="text-muted-foreground">Se încarcă...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Proiectul nu a fost găsit</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Group properties by floor
  const groupedByFloor = properties?.reduce((acc, prop) => {
    const floor = prop.features?.find((f: string) => f.startsWith('Etaj:'))?.split(': ')[1] || 'Altele';
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(prop);
    return acc;
  }, {} as Record<string, typeof properties>);

  const floorOrder = ['P', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'Altele'];
  const sortedFloors = Object.keys(groupedByFloor || {}).sort((a, b) => {
    return floorOrder.indexOf(a) - floorOrder.indexOf(b);
  });

  return (
    <>
      <Helmet>
        <title>{project.name} - MVA Imobiliare</title>
        <meta name="description" content={project.description || `Descoperă apartamentele disponibile în ${project.name}`} />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-24">
          {/* Back Button */}
          <Link to="/complexe" className="inline-block mb-8">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Înapoi la complexe
            </Button>
          </Link>

          {/* Project Header */}
          <div className="mb-12 space-y-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  {project.name}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                  <span className="text-lg">{project.location}</span>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{properties?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Apartamente</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {properties?.filter(p => p.availability_status === 'available').length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Disponibile</div>
                </Card>
              </div>
            </div>

            {project.main_image && (
              <div className="rounded-lg overflow-hidden shadow-2xl">
                <img
                  src={project.main_image}
                  alt={project.name}
                  className="w-full h-[400px] object-cover"
                />
              </div>
            )}

            {project.description && (
              <p className="text-lg text-muted-foreground max-w-3xl">
                {project.description}
              </p>
            )}
          </div>

          {/* Apartments by Floor */}
          {sortedFloors.map((floor) => (
            <div key={floor} className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  {floor === 'P' ? 'PARTER' : floor === 'Altele' ? 'ALTELE' : floor}
                  <Badge variant="secondary" className="text-sm">
                    {groupedByFloor?.[floor]?.length} {groupedByFloor?.[floor]?.length === 1 ? 'apartament' : 'apartamente'}
                  </Badge>
                </h2>
                <div className="text-sm text-muted-foreground">
                  {floor === 'P' ? 'Parter: 1.612 EUR/mp' : `Etajul ${floor.replace('E', '')}: 1.612 EUR/mp`}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {groupedByFloor?.[floor]?.map((apt) => {
                  const isAvailable = apt.availability_status === 'available';
                  const aptNumber = apt.title.match(/\d+/)?.[0] || '';
                  const surface = apt.surface_min;
                  const priceCredit = apt.price_max;
                  const priceCash = apt.price_min;
                  const rooms = apt.rooms;
                  const tipApt = apt.features?.find((f: string) => f.startsWith('Tip:'))?.split(': ')[1] || '';

                  return (
                    <Card 
                      key={apt.id}
                      className={`relative overflow-hidden transition-all duration-300 ${
                        isAvailable 
                          ? 'hover:shadow-xl hover:border-primary/50 border-2' 
                          : 'opacity-60 border border-muted'
                      }`}
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* Header with apt number and status */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Home className="h-5 w-5 text-primary" />
                            <span className="text-xl font-bold">Ap. {aptNumber}</span>
                          </div>
                          <Badge 
                            variant={
                              isAvailable 
                                ? "default" 
                                : apt.availability_status === 'reserved' 
                                  ? "secondary" 
                                  : "destructive"
                            }
                            className={
                              isAvailable 
                                ? "bg-green-600" 
                                : apt.availability_status === 'reserved'
                                  ? "bg-orange-500 text-white"
                                  : "bg-red-600"
                            }
                          >
                            {isAvailable ? (
                              <><CheckCircle2 className="h-3 w-3 mr-1" /> Disponibil</>
                            ) : apt.availability_status === 'reserved' ? (
                              <><Clock className="h-3 w-3 mr-1" /> Rezervat</>
                            ) : (
                              <><XCircle className="h-3 w-3 mr-1" /> Vândut</>
                            )}
                          </Badge>
                        </div>

                        {/* Apartment Type */}
                        <div className="py-2 px-3 bg-primary/10 rounded-md text-center">
                          <span className="font-semibold text-sm">{tipApt}</span>
                        </div>

                        {/* Details */}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Suprafață:</span>
                            <span className="font-semibold">{surface} mp</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Camere:</span>
                            <span className="font-semibold">{rooms} {rooms === 1 ? 'cameră' : 'camere'}</span>
                          </div>
                        </div>

                        {/* Prices */}
                        <div className="space-y-2 pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Preț Cash:</span>
                            <div className="flex items-center gap-1 font-bold text-green-600">
                              <Euro className="h-3 w-3" />
                              {priceCash?.toLocaleString()}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Preț Credit:</span>
                            <div className="flex items-center gap-1 font-bold text-blue-600">
                              <Euro className="h-3 w-3" />
                              {priceCredit?.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        {isAvailable && (
                          <Button 
                            size="sm" 
                            className="w-full mt-2"
                            onClick={() => window.scrollTo({ top: document.getElementById('contact')?.offsetTop || 0, behavior: 'smooth' })}
                          >
                            Contactează-ne
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {properties?.length === 0 && (
            <div className="text-center py-16">
              <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nu există apartamente disponibile</h3>
              <p className="text-muted-foreground">Revino în curând pentru noi oferte!</p>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ComplexDetail;
