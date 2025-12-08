import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Building2, 
  ArrowLeft,
  MapPin,
  Euro,
  Home,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  X,
  Edit,
  ArrowUpDown,
  Download,
  Video,
  Play
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { ApartmentEditDialog } from "@/components/ApartmentEditDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ZoomableFloorPlan } from "@/components/ZoomableFloorPlan";

const ComplexDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [floorPlanOpen, setFloorPlanOpen] = useState(false);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<string | null>(null);
  const [editingApartment, setEditingApartment] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sortBy, setSortBy] = useState<string>("default");
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['public-project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('real_estate_projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: properties, isLoading: propertiesLoading, refetch } = useQuery({
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

  // Helper function to extract apartment number numerically
  const getApartmentNumber = (title: string): number => {
    const match = title.match(/AP\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Extract building/staircase and floor from features
  const extractBuildingAndFloor = (features: string[] | null) => {
    let building = 'Altele';
    let floor = 'Altele';
    
    if (!features || features.length === 0) return { building, floor };
    
    // Check for "Scara X" or "Corpul X" in features
    const buildingFeature = features.find(f => f?.startsWith('Scara') || f?.startsWith('Corpul'));
    if (buildingFeature) {
      building = buildingFeature;
    }
    
    // Check for floor in features
    const floorFeature = features.find(f => 
      f?.startsWith('Parter') || 
      f?.startsWith('Etaj') || 
      f?.startsWith('Demisol')
    );
    
    if (floorFeature) {
      if (floorFeature.startsWith('Parter')) {
        floor = 'Parter';
      } else if (floorFeature.startsWith('Demisol')) {
        floor = 'Demisol';
      } else if (floorFeature.startsWith('Etaj')) {
        // Extract "Etaj X" format
        const match = floorFeature.match(/Etaj\s*(\d+)/);
        if (match) {
          floor = `Etaj ${match[1]}`;
        }
      }
    } else {
      // Fallback: check the first feature for old format
      const featureStr = features[0] || '';
      if (featureStr.includes('Etaj:')) {
        const floorCode = featureStr.split('Etaj:')[1]?.trim().split(' ')[0];
        if (floorCode === 'P') {
          floor = 'Parter';
        } else if (floorCode?.startsWith('E')) {
          const floorNum = floorCode.substring(1);
          floor = `Etaj ${floorNum}`;
        }
      } else if (featureStr.startsWith('Demisol')) {
        floor = 'Demisol';
      } else if (featureStr.startsWith('Parter')) {
        floor = 'Parter';
      } else if (featureStr.startsWith('Etaj')) {
        const match = featureStr.match(/Etaj\s+(\d+)/);
        if (match) floor = `Etaj ${match[1]}`;
      }
    }
    
    return { building, floor };
  };

  // Check if this complex has multiple buildings (Scara/Corpul)
  const hasMultipleBuildings = properties?.some(p => 
    p.features?.some(f => f?.startsWith('Scara') || f?.startsWith('Corpul'))
  ) || false;

  // Group properties by building first, then by floor
  const groupedByBuildingAndFloor = properties?.reduce((acc, prop) => {
    const { building, floor } = extractBuildingAndFloor(prop.features);
    
    if (!acc[building]) acc[building] = {};
    if (!acc[building][floor]) acc[building][floor] = [];
    acc[building][floor].push(prop);
    
    return acc;
  }, {} as Record<string, Record<string, typeof properties>>) || {};

  // Sort properties within each group based on selected criteria
  Object.keys(groupedByBuildingAndFloor).forEach(building => {
    Object.keys(groupedByBuildingAndFloor[building]).forEach(floor => {
      groupedByBuildingAndFloor[building][floor].sort((a, b) => {
        switch (sortBy) {
          case "price-asc":
            return (a.price_min || 0) - (b.price_min || 0);
          case "price-desc":
            return (b.price_min || 0) - (a.price_min || 0);
          case "surface-asc":
            return (a.surface_min || 0) - (b.surface_min || 0);
          case "surface-desc":
            return (b.surface_min || 0) - (a.surface_min || 0);
          case "status-available":
            if (a.availability_status === 'available' && b.availability_status !== 'available') return -1;
            if (a.availability_status !== 'available' && b.availability_status === 'available') return 1;
            return getApartmentNumber(a.title) - getApartmentNumber(b.title);
          case "status-reserved":
            if (a.availability_status === 'reserved' && b.availability_status !== 'reserved') return -1;
            if (a.availability_status !== 'reserved' && b.availability_status === 'reserved') return 1;
            return getApartmentNumber(a.title) - getApartmentNumber(b.title);
          default:
            // Default: sort by apartment number numerically
            return getApartmentNumber(a.title) - getApartmentNumber(b.title);
        }
      });
    });
  });

  const floorOrder = ['Demisol', 'Parter', 'Etaj 1', 'Etaj 2', 'Etaj 3', 'Etaj 4', 'Etaj 5', 'Etaj 6', 'Etaj 7', 'Etaj 8', 'Altele'];
  const buildingOrder = ['Corpul 1', 'Corpul 2', 'Corpul 3', 'Corpul 4', 'Scara 1', 'Scara 2', 'Scara 3', 'Scara 4', 'Altele'];
  
  const sortedBuildings = Object.keys(groupedByBuildingAndFloor || {}).sort((a, b) => {
    const aIndex = buildingOrder.indexOf(a);
    const bIndex = buildingOrder.indexOf(b);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  // Get the first building to display by default
  const defaultBuilding = sortedBuildings[0] || null;
  const activeBuilding = selectedBuilding || defaultBuilding;

  return (
    <>
      <Helmet>
        <title>{project.name} - Apartamente Disponibile | MVA Imobiliare</title>
        <meta name="description" content={project.description || `Explorează toate apartamentele disponibile în ${project.name}. Prețuri, planuri, detalii complete și fotografii pentru fiecare unitate.`} />
        <meta name="keywords" content={`${project.name}, apartamente ${project.location}, ${project.rooms_range || 'apartamente'}, ${project.price_range || 'preț competitiv'}, complex rezidențial București`} />
        <link rel="canonical" href={`https://mvaimobiliare.ro/complexe/${project.id}`} />
        
        {/* AI Crawler Optimization */}
        <meta name="summary" content={`Complex rezidențial ${project.name} în ${project.location}. ${properties?.length || 0} apartamente totale, ${properties?.filter(p => p.availability_status === 'available').length || 0} disponibile. Preț: ${project.price_range || 'la cerere'}. Suprafață: ${project.surface_range || 'variată'}. Camere: ${project.rooms_range || 'diverse opțiuni'}. ${project.completion_date ? `Finalizare: ${project.completion_date}` : ''}. Developer: ${project.developer || 'verificat'}. Contact: 0767941512.`} />
        <meta name="category" content="Real Estate Complex Detail" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://mvaimobiliare.ro/complexe/${project.id}`} />
        <meta property="og:title" content={`${project.name} - Apartamente Disponibile`} />
        <meta property="og:description" content={`${properties?.length || 0} apartamente în ${project.location}. ${properties?.filter(p => p.availability_status === 'available').length || 0} disponibile acum!`} />
        <meta property="og:image" content={project.main_image || "https://mvaimobiliare.ro/mva-logo-luxury-horizontal.svg"} />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content={project.name} />
        <meta property="twitter:description" content={project.description} />
        {project.main_image && (
          <meta property="twitter:image" content={project.main_image} />
        )}
        
        {/* Structured Data - Residence */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Residence",
            "name": project.name,
            "description": project.description,
            "image": project.main_image,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": project.location,
              "addressRegion": "București",
              "addressCountry": "RO"
            },
            "numberOfRooms": project.rooms_range,
            "floorSize": project.surface_range,
            "amenityFeature": project.amenities?.map(amenity => ({
              "@type": "LocationFeatureSpecification",
              "name": amenity
            })),
            "offers": {
              "@type": "AggregateOffer",
              "availability": "https://schema.org/InStock",
              "priceCurrency": "EUR",
              "offerCount": properties?.filter(p => p.availability_status === 'available').length || 0,
              "seller": {
                "@type": "RealEstateAgent",
                "name": "MVA Imobiliare",
                "telephone": "+40767941512"
              }
            }
          })}
        </script>
        
        {/* Breadcrumb Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Acasă",
                "item": "https://mvaimobiliare.ro/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Complexe Rezidențiale",
                "item": "https://mvaimobiliare.ro/complexe"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": project.name,
                "item": `https://mvaimobiliare.ro/complexe/${project.id}`
              }
            ]
          })}
        </script>
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-3 sm:px-4 py-16 sm:py-20 md:py-24">
          {/* Back Button */}
          <Link to="/complexe" className="inline-block mb-4 sm:mb-6 md:mb-8">
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm h-8 sm:h-9">
              <ArrowLeft className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Înapoi la complexe
            </Button>
          </Link>

          {/* Project Header */}
          <div className="mb-6 sm:mb-8 md:mb-12 space-y-4 sm:space-y-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 sm:gap-6">
              <div className="space-y-2 sm:space-y-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  {project.name}
                </h1>
                <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base md:text-lg">{project.location}</span>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex gap-2 sm:gap-4">
                <Card className="p-2.5 sm:p-3 md:p-4 text-center flex-1 sm:flex-initial">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">{properties?.length || 0}</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Apartamente</div>
                </Card>
                <Card className="p-2.5 sm:p-3 md:p-4 text-center flex-1 sm:flex-initial">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-500">
                    {properties?.filter(p => p.availability_status === 'available').length || 0}
                  </div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Disponibile</div>
                </Card>
              </div>
            </div>

            {project.main_image && (
              <div className="rounded-lg overflow-hidden shadow-2xl">
                <img
                  src={project.main_image}
                  alt={project.name}
                  className="w-full h-48 sm:h-64 md:h-80 lg:h-[400px] object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {project.description && (
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl">
                {project.description}
              </p>
            )}

            {/* Stadiu Lucrare - Videos Section (Only for RENEW RESIDENCE) */}
            {project.name?.toUpperCase() === "RENEW RESIDENCE" && (() => {
              const projectVideos = (project as any).videos;
              const videos = projectVideos && Array.isArray(projectVideos) ? projectVideos : [];
              
              if (videos.length === 0) return null;

              const extractYouTubeId = (url: string): string | null => {
                // Support for regular YouTube videos and YouTube Shorts
                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
                const match = url.match(regExp);
                return match && match[2].length === 11 ? match[2] : null;
              };

              return (
                <div className="mt-8 sm:mt-10 md:mt-12">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Video className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Stadiu Lucrare</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {videos.map((video: { url: string; title: string }, index: number) => {
                      const videoId = extractYouTubeId(video.url);
                      if (!videoId) return null;
                      
                      return (
                        <Card key={index} className="overflow-hidden">
                          <div className="relative aspect-video">
                            <iframe
                              src={`https://www.youtube.com/embed/${videoId}`}
                              title={video.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full"
                            />
                          </div>
                          {video.title && (
                            <CardContent className="p-3 sm:p-4">
                              <p className="font-medium text-sm sm:text-base flex items-center gap-2">
                                <Play className="h-4 w-4 text-primary" />
                                {video.title}
                              </p>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Sorting Controls */}
          <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 bg-card p-3 sm:p-4 rounded-lg border">
            <div className="flex items-center gap-2 sm:gap-3">
              <ArrowUpDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium">Sortare:</span>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[250px] h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="Selectează sortare" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Implicit (după titlu)</SelectItem>
                <SelectItem value="price-asc">Preț: Crescător</SelectItem>
                <SelectItem value="price-desc">Preț: Descrescător</SelectItem>
                <SelectItem value="surface-asc">Suprafață: Crescător</SelectItem>
                <SelectItem value="surface-desc">Suprafață: Descrescător</SelectItem>
                <SelectItem value="status-available">Disponibile Întâi</SelectItem>
                <SelectItem value="status-reserved">Rezervate Întâi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Building Tabs - only show if multiple buildings */}
          {hasMultipleBuildings && (
            <div className="mb-6 sm:mb-8 flex flex-wrap gap-2">
              {sortedBuildings.map((building) => {
                const floorsInBuilding = groupedByBuildingAndFloor[building] || {};
                const totalInBuilding = Object.values(floorsInBuilding).reduce((sum, apts) => sum + (apts?.length || 0), 0);
                const isSelected = activeBuilding === building;
                
                return (
                  <button
                    key={building}
                    onClick={() => setSelectedBuilding(building)}
                    className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 flex-1 sm:flex-none justify-center ${
                      isSelected
                        ? 'bg-primary/20 border-2 border-primary text-primary'
                        : 'bg-card border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>{building.toUpperCase()}</span>
                    <span className="text-xs sm:text-sm opacity-70">({totalInBuilding})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Apartments by Building and Floor */}
          {sortedBuildings.filter(b => !hasMultipleBuildings || b === activeBuilding).map((building) => {
            const floorsInBuilding = groupedByBuildingAndFloor[building] || {};
            const sortedFloorsInBuilding = Object.keys(floorsInBuilding).sort((a, b) => {
              const aIndex = floorOrder.indexOf(a);
              const bIndex = floorOrder.indexOf(b);
              return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
            });
            
            return (
              <div key={building} className="mb-8 sm:mb-10 md:mb-14">
                
                {/* Floors within this building */}
                {sortedFloorsInBuilding.map((floor) => (
                  <div key={`${building}-${floor}`} className="mb-6 sm:mb-8 md:mb-10">
                    <div className="flex items-center mb-3 sm:mb-4 md:mb-6 p-2.5 sm:p-3 md:p-4 bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary/60 rounded-lg">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2 sm:gap-3 flex-wrap">
                        {floor.toUpperCase()}
                        <Badge variant="secondary" className="text-[10px] sm:text-xs md:text-sm">
                          {floorsInBuilding[floor]?.length} {floorsInBuilding[floor]?.length === 1 ? 'apartament' : 'apartamente'}
                        </Badge>
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                      {floorsInBuilding[floor]?.map((apt) => {
                        const isAvailable = apt.availability_status === 'available';
                        const aptNumberMatch = apt.title.match(/AP\s*(\d+)/i);
                        const aptNumber = aptNumberMatch ? aptNumberMatch[1] : '';
                        const surface = apt.surface_min;
                        const priceCredit = apt.price_max;
                        const priceCash = apt.price_min;
                        const rooms = apt.rooms;
                        // Extract apartment type from features (look for type like GARSONIERA, STUDIO, AP 2 CAMERE)
                        const typeFeature = apt.features?.find(f => 
                          f?.includes('GARSONIERA') || 
                          f?.includes('STUDIO') || 
                          f?.includes('CAMERE') ||
                          f?.includes('Garsoniera') ||
                          f?.includes('Studio')
                        );
                        const tipApt = typeFeature || apt.features?.[2] || '';

                        return (
                          <Card 
                            key={apt.id}
                            className={`relative overflow-hidden transition-all duration-300 ${
                              isAvailable 
                                ? 'hover:shadow-xl hover:border-primary/50 border-2' 
                                : 'opacity-60 border border-muted'
                            }`}
                          >
                            <CardContent className="p-2.5 sm:p-3 md:p-4 pt-6 sm:pt-7 md:pt-8 space-y-2 sm:space-y-3">
                              {/* Header with apt number and status */}
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                                  <span className="text-sm sm:text-base md:text-xl font-bold">Ap. {aptNumber}</span>
                                </div>
                                <Badge 
                                  variant={
                                    isAvailable 
                                      ? "default" 
                                      : apt.availability_status === 'reserved' 
                                        ? "secondary" 
                                        : "destructive"
                                  }
                                  className={`text-[8px] sm:text-[10px] md:text-xs px-1 sm:px-1.5 md:px-2 py-0.5 ${
                                    isAvailable 
                                      ? "bg-green-600" 
                                      : apt.availability_status === 'reserved'
                                        ? "bg-yellow-500 text-black hover:bg-yellow-600"
                                        : "bg-red-600"
                                  }`}
                                >
                                  {isAvailable ? (
                                    <><CheckCircle2 className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 mr-0.5" /> <span className="hidden sm:inline">Disponibil</span><span className="sm:hidden">Disp.</span></>
                                  ) : apt.availability_status === 'reserved' ? (
                                    <><Clock className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 mr-0.5" /> <span className="hidden sm:inline">Rezervat</span><span className="sm:hidden">Rez.</span></>
                                  ) : (
                                    <><XCircle className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 mr-0.5" /> <span className="hidden sm:inline">Vândut</span><span className="sm:hidden">Vând.</span></>
                                  )}
                                </Badge>
                              </div>

                              {/* Apartment Type */}
                              <div className="py-1.5 sm:py-2 px-2 sm:px-3 bg-primary/10 rounded-md text-center">
                                <span className="font-semibold text-[10px] sm:text-xs md:text-sm">{tipApt}</span>
                              </div>

                              {/* Details */}
                              <div className="space-y-1 sm:space-y-2 text-[10px] sm:text-xs md:text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Suprafață:</span>
                                  <span className="font-semibold">{surface} mp</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Camere:</span>
                                  <span className="font-semibold">{rooms} {rooms === 1 ? 'cam.' : 'cam.'}</span>
                                </div>
                              </div>

                              {/* Prices - Hidden for RENEW RESIDENCE and Eurocasa Residence */}
                              {project.name?.toUpperCase() !== "RENEW RESIDENCE" && !project.name?.toUpperCase().includes("EUROCASA") && (
                                <div className="space-y-1 sm:space-y-2 pt-1.5 sm:pt-2 border-t">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">Cash:</span>
                                    <div className="flex items-center gap-0.5 font-bold text-green-600 text-[10px] sm:text-xs md:text-sm">
                                      <Euro className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                      {priceCash?.toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">Credit:</span>
                                    <div className="flex items-center gap-0.5 font-bold text-blue-600 text-[10px] sm:text-xs md:text-sm">
                                      <Euro className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                      {priceCredit?.toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="space-y-1.5 sm:space-y-2 mt-1.5 sm:mt-2">
                                {apt.floor_plan ? (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="w-full h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs md:text-sm"
                                    onClick={() => {
                                      setSelectedFloorPlan(apt.floor_plan);
                                      setFloorPlanOpen(true);
                                    }}
                                  >
                                    <FileText className="mr-1 sm:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                                    Schiță
                                  </Button>
                                ) : (
                                  <div className="text-center text-[9px] sm:text-[10px] md:text-sm text-muted-foreground py-1 sm:py-2">
                                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 mx-auto mb-0.5 opacity-50" />
                                    <span className="hidden sm:inline">Schiță nedisponibilă</span>
                                    <span className="sm:hidden">N/A</span>
                                  </div>
                                )}
                                
                                {isAuthenticated && (
                                  <Button 
                                    size="sm" 
                                    variant="secondary"
                                    className="w-full h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs md:text-sm"
                                    onClick={() => setEditingApartment(apt)}
                                  >
                                    <Edit className="mr-1 sm:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                                    Editează
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

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

      {/* Floor Plan Dialog */}
      <Dialog open={floorPlanOpen} onOpenChange={setFloorPlanOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-sm sm:text-base">
              Schiță Apartament
            </DialogTitle>
          </DialogHeader>
          {selectedFloorPlan && (
            <div className="w-full space-y-3 sm:space-y-4 overflow-hidden">
              <ZoomableFloorPlan 
                src={selectedFloorPlan} 
                alt="Schiță apartament" 
              />
              <Button 
                className="w-full h-9 sm:h-10 text-xs sm:text-sm"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = selectedFloorPlan;
                  link.download = `schita-apartament.${selectedFloorPlan.split('.').pop()?.split('?')[0] || 'png'}`;
                  link.target = '_blank';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <Download className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Descarcă Schița
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Apartment Edit Dialog */}
      {editingApartment && (
        <ApartmentEditDialog
          apartment={editingApartment}
          open={!!editingApartment}
          onOpenChange={(open) => !open && setEditingApartment(null)}
          onSuccess={() => refetch()}
        />
      )}
    </>
  );
};

export default ComplexDetail;
