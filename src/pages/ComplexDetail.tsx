import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Play,
  Calendar,
  Loader2
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import OptimizedPropertyImage from "@/components/OptimizedPropertyImage";
import { Helmet } from "react-helmet-async";
import { ApartmentEditDialog } from "@/components/ApartmentEditDialog";
import { ScheduleViewingDialog } from "@/components/ScheduleViewingDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ZoomableFloorPlan } from "@/components/ZoomableFloorPlan";
import { ComplexDetailSkeleton } from "@/components/skeletons";
import { usePlausible } from "@/hooks/usePlausible";
import { getComplexUrl, isUUID } from "@/lib/complexSlug";
import NotFound from "@/pages/NotFound";
import ComplexFAQ, { generateComplexFAQSchema } from "@/components/ComplexFAQ";

const ComplexDetail = () => {
  const { trackComplex } = usePlausible();
  const { slug } = useParams<{ slug: string }>();
  const isLegacyUuid = slug ? isUUID(slug) : false;
  const [floorPlanOpen, setFloorPlanOpen] = useState(false);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<string | null>(null);
  const [editingApartment, setEditingApartment] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sortBy, setSortBy] = useState<string>("default");
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [filterRooms, setFilterRooms] = useState<string>("all");
  const [filterSurfaceMin, setFilterSurfaceMin] = useState<string>("");
  const [filterSurfaceMax, setFilterSurfaceMax] = useState<string>("");

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

  // Track complex view
  useEffect(() => {
    if (slug) {
      trackComplex('view', slug);
    }
  }, [slug, trackComplex]);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['public-project', slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from('real_estate_projects')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug && !isLegacyUuid,
  });

  const { data: properties, isLoading: propertiesLoading, refetch } = useQuery({
    queryKey: ['public-project-properties', project?.id],
    queryFn: async () => {
      if (!project?.id) return [];

      const { data, error } = await supabase
        .from('catalog_offers')
        .select('*')
        .eq('project_id', project.id)
        .order('title');
      
      if (error) throw error;
      console.log('[ComplexDetail] Fetched properties:', data?.length, 'with floor_plan:', data?.filter(p => p.floor_plan).length);
      return data;
    },
    enabled: !!project?.id,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  if (isLegacyUuid) {
    return <NotFound />;
  }

  if (projectLoading || propertiesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <ComplexDetailSkeleton />
        <Footer />
      </div>
    );
  }

  if (!project) {
    return <NotFound />;
  }

  // Helper function to extract apartment number numerically
  const getApartmentNumber = (title: string): number => {
    // Match "AP 21", "Apartament 21", "ap21", "- AP 48", etc.
    const match = title.match(/(?:AP|Apartament)\.?\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Extract building/staircase and floor from features
  const extractBuildingAndFloor = (features: string[] | null) => {
    let building = 'Altele';
    let floor = 'Altele';
    
    if (!features || features.length === 0) return { building, floor };
    
    // Check for "Scara X" or "Corpul X" in features
    const buildingFeature = features.find(f => f?.startsWith('Scara') || f?.startsWith('Corpul') || f?.startsWith('Bloc'));
    if (buildingFeature) {
      building = buildingFeature;
    }
    
    // Check for floor in features - prioritize "Etaj:" format for RENEW Residence
    for (const feature of features) {
      if (!feature) continue;
      
      if (feature.startsWith('Demisol')) {
        floor = 'Demisol';
        break;
      } else if (feature.startsWith('Parter')) {
        floor = 'Parter';
        break;
      } else if (feature.includes('Etaj:')) {
        // RENEW format: "Etaj: E2 Suprafață: ..." or "Etaj: P ..."
        const floorCode = feature.split('Etaj:')[1]?.trim().split(' ')[0];
        if (floorCode === 'P') {
          floor = 'Parter';
        } else if (floorCode?.startsWith('E')) {
          const floorNum = floorCode.substring(1);
          floor = `Etaj ${floorNum}`;
        }
        break;
      } else if (feature.startsWith('Etaj')) {
        // Standard format: "Etaj 2" or "Etaj2"
        const match = feature.match(/Etaj\s*(\d+)/);
        if (match) {
          floor = `Etaj ${match[1]}`;
        }
        break;
      }
    }
    
    return { building, floor };
  };

  // Check if this complex has multiple buildings (Scara/Corpul)
  const hasMultipleBuildings = properties?.some(p => 
    p.features?.some(f => f?.startsWith('Scara') || f?.startsWith('Corpul') || f?.startsWith('Bloc'))
  ) || false;

  // Get unique room counts for filter options
  const uniqueRooms = [...new Set(properties?.map(p => p.rooms).filter(r => r != null))].sort((a, b) => (a || 0) - (b || 0));

  // Filter properties based on selected filters
  const filteredProperties = properties?.filter(prop => {
    // Filter by rooms
    if (filterRooms !== "all" && prop.rooms !== parseInt(filterRooms)) {
      return false;
    }
    // Filter by surface min
    if (filterSurfaceMin && (prop.surface_min || 0) < parseInt(filterSurfaceMin)) {
      return false;
    }
    // Filter by surface max
    if (filterSurfaceMax && (prop.surface_min || 0) > parseInt(filterSurfaceMax)) {
      return false;
    }
    return true;
  }) || [];

  // Group filtered properties by building first, then by floor
  const groupedByBuildingAndFloor = filteredProperties.reduce((acc, prop) => {
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
  const buildingOrder = ['Bloc 1', 'Bloc 2', 'Bloc 3', 'Bloc 4', 'Bloc 5', 'Bloc 6', 'Bloc 7', 'Bloc 8', 'Bloc 9', 'Bloc 10', 'Corpul 1', 'Corpul 2', 'Corpul 3', 'Corpul 4', 'Scara 1', 'Scara 2', 'Scara 3', 'Scara 4', 'Altele'];
  
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
        <link rel="canonical" href={`https://mvaimobiliare.ro${getComplexUrl(project)}`} />
        
        {/* AI Crawler Optimization */}
        <meta name="summary" content={`Complex rezidențial ${project.name} în ${project.location}. ${properties?.length || 0} apartamente totale, ${properties?.filter(p => p.availability_status === 'available').length || 0} disponibile. Preț: ${project.price_range || 'la cerere'}. Suprafață: ${project.surface_range || 'variată'}. Camere: ${project.rooms_range || 'diverse opțiuni'}. ${project.completion_date ? `Finalizare: ${project.completion_date}` : ''}. Developer: ${project.developer || 'verificat'}. Contact: 0767941512.`} />
        <meta name="category" content="Real Estate Complex Detail" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://mvaimobiliare.ro${getComplexUrl(project)}`} />
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

        {/* FAQ Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(generateComplexFAQSchema({
            complexName: project.name,
            location: project.location,
            priceRange: project.price_range,
            surfaceRange: project.surface_range,
            roomsRange: project.rooms_range,
            totalApartments: properties?.length || 0,
            availableApartments: properties?.filter(p => p.availability_status === 'available').length || 0,
            developer: project.developer,
            completionDate: project.completion_date,
            amenities: project.amenities,
          }))}
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
                "item": `https://mvaimobiliare.ro${getComplexUrl(project)}`
              }
            ]
          })}
        </script>
      </Helmet>
      
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Background Decorations */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -left-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-40 -right-40 w-96 h-96 bg-gradient-to-br from-gold-400/15 to-gold-600/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
        </div>

        <Header />
        
        <main className="container mx-auto px-3 sm:px-4 py-16 sm:py-20 md:py-24 relative z-10">
          {/* Breadcrumbs */}
          <Breadcrumbs 
            items={[
              { label: 'Complexe', href: '/complexe' },
              { label: project.name }
            ]} 
          />

          {/* Back Button */}
          <Link to="/complexe" className="inline-block mb-4 sm:mb-6 md:mb-8">
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm h-8 sm:h-9 glass hover:bg-primary/10">
              <ArrowLeft className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Înapoi la complexe
            </Button>
          </Link>

          {/* Project Header */}
          <div className="mb-6 sm:mb-8 md:mb-12 space-y-4 sm:space-y-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 sm:gap-6">
              <div className="space-y-2 sm:space-y-4">
                <Badge className="glass px-4 py-1.5 text-sm font-medium border-primary/20 mb-2">
                  <Building2 className="h-4 w-4 mr-2" />
                  Complex Rezidențial Premium
                </Badge>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gradient-gold drop-shadow-lg">
                  {project.name}
                </h1>
                <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-primary" />
                  <span className="text-sm sm:text-base md:text-lg">{project.location}</span>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex gap-2 sm:gap-4">
                <Card className="stats-card p-2.5 sm:p-3 md:p-4 text-center flex-1 sm:flex-initial glow-gold">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-gradient-gold">{properties?.length || 0}</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Apartamente</div>
                </Card>
                <Card className="stats-card p-2.5 sm:p-3 md:p-4 text-center flex-1 sm:flex-initial border-green-500/30">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-500">
                    {properties?.filter(p => p.availability_status === 'available').length || 0}
                  </div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Disponibile</div>
                </Card>
              </div>
            </div>

            {project.main_image && (
              <div className="rounded-xl overflow-hidden shadow-2xl border-glow">
                <OptimizedPropertyImage
                  src={project.main_image}
                  alt={`${project.name} - complex rezidențial în ${project.location || 'București'} cu apartamente moderne, finisaje premium și facilități complete`}
                  title={`${project.name} - ${project.price_range || 'Complex rezidențial premium'}`}
                  containerClassName="w-full h-48 sm:h-64 md:h-80 lg:h-[400px]"
                  aspectRatio="auto"
                  priority
                  quality={85}
                />
              </div>
            )}

            {project.description && (
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl glass p-4 rounded-xl">
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

          {/* Filters and Sorting Controls */}
          <div className="mb-4 sm:mb-6 md:mb-8 card-modern p-3 sm:p-4 rounded-xl space-y-3 sm:space-y-4">
            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-primary" />
                <span className="text-xs sm:text-sm font-medium">Filtre:</span>
              </div>
              
              {/* Rooms Filter */}
              <Select value={filterRooms} onValueChange={(value) => {
                setFilterRooms(value);
                if (value !== "all" && project?.id) {
                  trackComplex('filter', project.id, project?.name);
                }
              }}>
                <SelectTrigger className="w-[130px] sm:w-[150px] h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Camere" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate camerele</SelectItem>
                  {uniqueRooms.map(room => (
                    <SelectItem key={room} value={String(room)}>
                      {room} {room === 1 ? 'cameră' : 'camere'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Surface Filter */}
              <div className="flex items-center gap-1 sm:gap-2">
                <input
                  type="number"
                  placeholder="Min mp"
                  value={filterSurfaceMin}
                  onChange={(e) => setFilterSurfaceMin(e.target.value)}
                  className="w-[70px] sm:w-[80px] h-8 sm:h-9 px-2 text-xs sm:text-sm border rounded-md bg-background"
                />
                <span className="text-muted-foreground text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max mp"
                  value={filterSurfaceMax}
                  onChange={(e) => setFilterSurfaceMax(e.target.value)}
                  className="w-[70px] sm:w-[80px] h-8 sm:h-9 px-2 text-xs sm:text-sm border rounded-md bg-background"
                />
              </div>

              {/* Clear Filters */}
              {(filterRooms !== "all" || filterSurfaceMin || filterSurfaceMax) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterRooms("all");
                    setFilterSurfaceMin("");
                    setFilterSurfaceMax("");
                  }}
                  className="h-8 sm:h-9 text-xs sm:text-sm text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3 mr-1" />
                  Resetează
                </Button>
              )}

              {/* Results count */}
              <Badge className="ml-auto text-xs glass border-primary/20">
                {filteredProperties.length} / {properties?.length || 0} apartamente
              </Badge>
            </div>

            {/* Sorting Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 pt-2 border-t border-primary/10">
              <div className="flex items-center gap-2 sm:gap-3">
                <ArrowUpDown className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
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
                    className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 flex-1 sm:flex-none justify-center ${
                      isSelected
                        ? 'glass bg-primary/20 border-2 border-primary text-primary glow-gold'
                        : 'glass-hover border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>{building.toUpperCase()}</span>
                    <Badge variant="secondary" className="text-xs">{totalInBuilding}</Badge>
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
                    <div className="flex items-center mb-3 sm:mb-4 md:mb-6 p-2.5 sm:p-3 md:p-4 glass rounded-xl border-l-4 border-primary/60">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2 sm:gap-3 flex-wrap">
                        <span className="text-gradient-gold">{floor.toUpperCase()}</span>
                        <Badge className="text-[10px] sm:text-xs md:text-sm glass border-primary/20">
                          {floorsInBuilding[floor]?.length} {floorsInBuilding[floor]?.length === 1 ? 'apartament' : 'apartamente'}
                        </Badge>
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                      {floorsInBuilding[floor]?.map((apt) => {
                        const isAvailable = apt.availability_status === 'available';
                        // Match "AP 21", "Apartament 21", "ap21", "- AP 48", etc.
                        const aptNumberMatch = apt.title.match(/(?:AP|Apartament)\.?\s*(\d+)/i);
                        const aptNumber = aptNumberMatch ? aptNumberMatch[1] : '';
                        const surface = apt.surface_min;
                        const priceCredit = apt.price_max;
                        const priceCash = apt.price_min;
                        const rooms = apt.rooms;
                        const tipApt = apt.rooms ? `${apt.rooms} ${apt.rooms === 1 ? 'cameră' : 'camere'}` : (apt.features?.find((f: string) => f?.startsWith('Tip:'))?.split(': ')[1] || '');

                        return (
                          <Card 
                            key={apt.id}
                            className={`relative overflow-hidden transition-all duration-300 ${
                              isAvailable 
                                ? 'card-modern hover:shadow-xl border-glow' 
                                : 'opacity-60 glass border border-muted'
                            }`}
                          >
                            <CardContent className="p-2.5 sm:p-3 md:p-4 pt-6 sm:pt-7 md:pt-8 space-y-2 sm:space-y-3">
                              {/* Header with apt number and status */}
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                                  <span className="text-sm sm:text-base md:text-xl font-bold text-gradient-gold">Ap. {aptNumber}</span>
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
                              <div className="py-1.5 sm:py-2 px-2 sm:px-3 glass rounded-lg text-center">
                                <span className="font-semibold text-[10px] sm:text-xs md:text-sm">{tipApt}</span>
                              </div>

                              {/* Details - Surface Breakdown */}
                              {(() => {
                                const surfaceDetails = (apt.contact_info as any)?.surface_details;
                                if (surfaceDetails && Array.isArray(surfaceDetails)) {
                                  return (
                                    <div className="space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs md:text-sm">
                                      {surfaceDetails.filter((d: any) => d.tip !== 'Total').map((detail: any, idx: number) => (
                                        <div key={idx} className="flex justify-between">
                                          <span className="text-muted-foreground">{detail.tip}:</span>
                                          <span className="font-semibold">{detail.suprafata_construita} mp</span>
                                        </div>
                                      ))}
                                      {surfaceDetails.filter((d: any) => d.tip === 'Total' && d.suprafata_utila).map((detail: any, idx: number) => (
                                        <div key={`util-${idx}`} className="flex justify-between pt-0.5 border-t border-primary/10 text-muted-foreground">
                                          <span>S. utilă:</span>
                                          <span className="font-semibold text-foreground">{detail.suprafata_utila} mp</span>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                }
                                return (
                                  <div className="space-y-1 sm:space-y-2 text-[10px] sm:text-xs md:text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Suprafață:</span>
                                      <span className="font-semibold">{surface} mp</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Camere:</span>
                                      <span className="font-semibold">{rooms} cam.</span>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Prices - Hidden for RENEW RESIDENCE, Eurocasa and Viscolului Residence */}
                              {project.name?.toUpperCase() !== "RENEW RESIDENCE" && !project.name?.toUpperCase().includes("EUROCASA") && !project.name?.toUpperCase().includes("VISCOLULUI") && (
                                <div className="space-y-1 sm:space-y-2 pt-1.5 sm:pt-2 border-t border-primary/10">
                                  <div className="flex items-center justify-between glass-hover p-1.5 rounded">
                                    <span className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">Cash:</span>
                                    <div className="flex items-center gap-0.5 font-bold text-green-500 text-[10px] sm:text-xs md:text-sm">
                                      <Euro className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                      {priceCash?.toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between glass-hover p-1.5 rounded">
                                    <span className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">Credit:</span>
                                    <div className="flex items-center gap-0.5 font-bold text-blue-500 text-[10px] sm:text-xs md:text-sm">
                                      <Euro className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                      {priceCredit?.toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Floor Plan Thumbnail - click to enlarge */}
                              <div className="mt-1.5 sm:mt-2">
                                {apt.floor_plan && isAvailable ? (
                                  <button
                                    type="button"
                                    className="w-full rounded-lg overflow-hidden border border-primary/20 hover:border-primary/50 transition-all hover:shadow-md cursor-zoom-in group"
                                    onClick={() => {
                                      setSelectedFloorPlan(apt.floor_plan || null);
                                      setFloorPlanOpen(true);
                                    }}
                                  >
                                    <div className="relative">
                                      <img
                                        src={apt.floor_plan}
                                        alt={`Schiță Ap. ${aptNumber}`}
                                        className="w-full h-20 sm:h-24 md:h-28 object-contain bg-white/90 dark:bg-white/10 p-1"
                                        loading="lazy"
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                        <span className="text-[8px] sm:text-[10px] text-white bg-black/60 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                          Click pentru mărire
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-[9px] sm:text-[10px] text-muted-foreground py-1 text-center bg-muted/30">
                                      Schiță apartament
                                    </div>
                                  </button>
                                ) : (
                                  <div className="text-center text-[9px] sm:text-[10px] md:text-sm text-muted-foreground py-1 sm:py-2">
                                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 mx-auto mb-0.5 opacity-50" />
                                    <span className="hidden sm:inline">Schiță nedisponibilă</span>
                                    <span className="sm:hidden">N/A</span>
                                  </div>
                                )}
                              </div>

                              {/* Schedule Viewing Button - rendered AFTER floor plan to avoid Dialog interference */}
                              {isAvailable && (
                                <div className="space-y-1.5 sm:space-y-2">
                                  <ScheduleViewingDialog
                                    propertyTitle={`${project.name} - Ap. ${aptNumber}`}
                                    propertyId={apt.id}
                                    propertyUrl={getComplexUrl(project)}
                                    trigger={
                                      <Button 
                                        size="sm" 
                                        variant="default"
                                        className="w-full h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs md:text-sm bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 glow-gold"
                                      >
                                        <Calendar className="mr-1 sm:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                                        Vizionare
                                      </Button>
                                    }
                                  />
                                </div>
                              )}

                              {/* Admin Edit Button */}
                              <div className="space-y-1.5 sm:space-y-2">
                                {isAuthenticated && (
                                  <Button 
                                    size="sm" 
                                    variant="secondary"
                                    className="w-full h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs md:text-sm glass-hover"
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
                <div className="text-center py-16 card-modern rounded-xl">
                  <Home className="h-16 w-16 mx-auto text-primary/40 mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-gradient-gold">Nu există apartamente disponibile</h3>
                  <p className="text-muted-foreground">Revino în curând pentru noi oferte!</p>
                </div>
              )}

          {/* FAQ Section */}
          <ComplexFAQ
            complexName={project.name}
            location={project.location}
            priceRange={project.price_range}
            surfaceRange={project.surface_range}
            roomsRange={project.rooms_range}
            totalApartments={properties?.length || 0}
            availableApartments={properties?.filter(p => p.availability_status === 'available').length || 0}
            developer={project.developer}
            completionDate={project.completion_date}
            amenities={project.amenities}
          />
        </main>
      </div>

      {/* Floor Plan Dialog */}
      <Dialog open={floorPlanOpen} onOpenChange={setFloorPlanOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] p-3 sm:p-6 glass">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-sm sm:text-base text-gradient-gold">
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
                className="w-full h-9 sm:h-10 text-xs sm:text-sm bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 glow-gold"
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
