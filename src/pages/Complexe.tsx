import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Home, MapPin, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { ComplexGridSkeleton } from "@/components/skeletons";
import { usePlausible } from "@/hooks/usePlausible";
import { useLanguage } from "@/contexts/LanguageContext";

const Complexe = () => {
  const { trackComplex } = usePlausible();
  const { isFavorite, toggleFavorite, isAuthenticated } = useFavorites();
  const { t, language } = useLanguage();
  
  
  const { data: projects, isLoading } = useQuery({
    queryKey: ['public-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('real_estate_projects')
        .select('*')
        .neq('is_published', false)
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  // Fetch apartments for all projects
  const { data: allApartments } = useQuery({
    queryKey: ['all-project-apartments'],
    enabled: !!projects && projects.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_offers')
        .select('id, project_id, availability_status, features')
        .not('project_id', 'is', null);

      if (error) throw error;
      return data || [];
    }
  });

  const getProjectStats = (projectId: string) => {
    if (!allApartments) return { total: 0, available: 0, sold: 0, percentage: 0 };
    
    const projectApartments = allApartments.filter(apt => apt.project_id === projectId);
    const total = projectApartments.length;
    const available = projectApartments.filter(apt => apt.availability_status === 'available').length;
    const sold = total - available;
    const percentage = total > 0 ? Math.round((available / total) * 100) : 0;
    
    return { total, available, sold, percentage };
  };

  return (
    <>
      <Helmet>
        <title>Ansambluri Rezidențiale Premium București | MVA Imobiliare</title>
        <meta name="description" content="Explorează cele mai moderne ansambluri rezidențiale din București și împrejurimi. Apartamente noi cu finisaje premium în complexe rezidențiale de top cu toate facilitățile." />
        <meta name="keywords" content="complexe rezidențiale București, ansambluri rezidențiale noi, apartamente noi complexe, locuințe moderne București, Renew Residence, Eurocasa Residence" />
        <link rel="canonical" href="https://mvaimobiliare.ro/complexe" />
        
        {/* AI Crawler Optimization */}
        <meta name="summary" content="Catalog complet de complexe rezidențiale premium din București și împrejurimi. Fiecare complex include informații detaliate: locație, preț, suprafață, număr camere, dată finalizare, developer, facilități, disponibilitate apartamente. Peste {projects?.length || 0} complexe verificate." />
        <meta name="category" content="Real Estate Residential Complexes" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mvaimobiliare.ro/complexe" />
        <meta property="og:title" content="Complexe Rezidențiale Premium - MVA Imobiliare" />
        <meta property="og:description" content={`${projects?.length || 0} complexe rezidențiale moderne în București cu apartamente disponibile`} />
        <meta property="og:image" content={projects?.[0]?.main_image || "https://mvaimobiliare.ro/mva-logo-luxury-horizontal.svg"} />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Complexe Rezidențiale București" />
        <meta property="twitter:description" content="Ansambluri rezidențiale moderne cu toate facilitățile" />
        
        {/* Structured Data - ItemList */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Complexe Rezidențiale București",
            "description": "Lista completă de ansambluri rezidențiale moderne disponibile",
            "numberOfItems": projects?.length || 0,
            "itemListElement": projects?.slice(0, 10).map((project, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "Residence",
                "@id": `https://mvaimobiliare.ro/complexe/${project.id}`,
                "name": project.name,
                "description": project.description,
                "image": project.main_image,
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": project.location,
                  "addressRegion": "București",
                  "addressCountry": "RO"
                }
              }
            }))
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
          <Breadcrumbs items={[{ label: t.complexes?.title || 'Complexe Rezidențiale' }]} />

          {/* Hero Section */}
          <div className="text-center space-y-3 sm:space-y-4 md:space-y-6 mb-8 sm:mb-12 md:mb-16">
            <Badge className="glass px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium border-primary/20 mb-2 sm:mb-4">
              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              {projects?.length || 0} {language === 'ro' ? 'Ansambluri Disponibile' : 'Available Complexes'}
            </Badge>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gradient-gold drop-shadow-lg px-2">
              {t.complexes?.title || 'Complexe Rezidențiale'}
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4 sm:px-2">
              {t.complexes?.subtitle || 'Explorează cele mai moderne ansambluri rezidențiale din București și împrejurimi'}
            </p>
          </div>

          {/* Projects Grid */}
          {isLoading ? (
            <ComplexGridSkeleton count={6} />
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {projects
              ?.slice()
              .sort((a, b) => a.name.localeCompare(b.name, 'ro', { numeric: true, sensitivity: 'base' }))
              .map((project) => {
                const stats = getProjectStats(project.id);

                return (
                  <Link 
                    key={project.id} 
                    to={`/complexe/${project.id}`}
                    className="group"
                    onClick={() => trackComplex('click_details', project.id, project.name)}
                  >
                    <Card className="card-modern overflow-hidden h-full border-glow">
                      {/* Project Image */}
                      <div className="relative h-40 sm:h-48 md:h-64 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
                        {project.main_image ? (
                          <img
                            src={project.main_image}
                            alt={`${project.name} - complex rezidențial în ${project.location || 'București'} cu apartamente moderne, finisaje premium și facilități complete`}
                            title={`${project.name} - ${project.price_range || 'Preț la cerere'}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                            itemProp="image"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="h-24 w-24 text-primary/20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                        
                        {/* Favorite Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 sm:top-3 sm:right-3 glass hover:bg-background/90 backdrop-blur-sm z-10 glow-gold h-8 w-8 sm:h-10 sm:w-10"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(project.id, 'complex');
                            trackComplex('favorite', project.id, project.name);
                          }}
                        >
                          <Heart 
                            className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${
                              isFavorite(project.id, 'complex') 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-muted-foreground'
                            }`} 
                          />
                        </Button>

                        {/* Recommended Badge */}
                        {project.is_recommended && (
                          <Badge className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-gradient-to-r from-gold-400 to-gold-600 text-black font-semibold border-0 glow-gold text-[10px] sm:text-xs">
                            ⭐ Recomandat
                          </Badge>
                        )}
                        
                        {/* Project Name Overlay */}
                        <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-2 sm:left-3 md:left-4 right-2 sm:right-3 md:right-4">
                          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white drop-shadow-lg line-clamp-1">
                            {project.name}
                          </h2>
                        </div>
                      </div>

                      <CardContent className="p-3 sm:p-4 md:p-6 space-y-2.5 sm:space-y-3 md:space-y-4">
                        {/* Location */}
                        <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground text-xs sm:text-sm md:text-base">
                          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 text-primary" />
                          <span className="truncate">{project.location}</span>
                        </div>

                        {/* Description */}
                        {project.description && (
                          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                            {project.description}
                          </p>
                        )}

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 pt-2.5 sm:pt-3 md:pt-4 border-t border-primary/10">
                          {project.price_range && (
                            <div className="glass-hover p-1.5 sm:p-2 rounded-lg">
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{t.properties?.price || 'Preț'}</p>
                              <p className="font-semibold text-xs sm:text-sm md:text-base truncate text-gradient-gold">{project.price_range}</p>
                            </div>
                          )}
                          {project.surface_range && (
                            <div className="glass-hover p-1.5 sm:p-2 rounded-lg">
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{language === 'ro' ? 'Suprafață' : 'Surface'}</p>
                              <p className="font-semibold text-xs sm:text-sm md:text-base truncate">{project.surface_range}</p>
                            </div>
                          )}
                          {project.rooms_range && (
                            <div className="glass-hover p-1.5 sm:p-2 rounded-lg">
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{t.properties?.rooms || 'Camere'}</p>
                              <p className="font-semibold text-xs sm:text-sm md:text-base truncate">{project.rooms_range}</p>
                            </div>
                          )}
                          {project.completion_date && (
                            <div className="glass-hover p-1.5 sm:p-2 rounded-lg">
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{t.complexes?.completionDate || 'Finalizare'}</p>
                              <p className="font-semibold text-xs sm:text-sm md:text-base truncate">{project.completion_date}</p>
                            </div>
                          )}
                        </div>

                        {/* Statistics Section */}
                        {stats.total > 0 && (
                          <div className="pt-2.5 sm:pt-3 md:pt-4 border-t border-primary/10 space-y-1.5 sm:space-y-2 md:space-y-3">
                            <div className="flex items-center justify-between text-[10px] sm:text-xs md:text-sm">
                              <span className="font-semibold">{language === 'ro' ? 'Disponibilitate' : 'Availability'}</span>
                              <span className="text-muted-foreground">{stats.available} {language === 'ro' ? 'din' : 'of'} {stats.total}</span>
                            </div>
                            {/* Dual bar chart */}
                            <div className="flex gap-0.5 sm:gap-1 h-2.5 sm:h-3 md:h-4 rounded-full overflow-hidden glass">
                              <div 
                                className="bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300" 
                                style={{ width: `${stats.percentage}%` }}
                              />
                              <div 
                                className="bg-gradient-to-r from-red-400 to-red-600 transition-all duration-300" 
                                style={{ width: `${100 - stats.percentage}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6 text-[9px] sm:text-[10px] md:text-xs">
                              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
                                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex-shrink-0"></div>
                                <span>{stats.available} {t.properties?.available || 'disponibile'}</span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
                                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full bg-gradient-to-r from-red-400 to-red-600 flex-shrink-0"></div>
                                <span>{stats.sold} {t.properties?.sold || 'vândute'}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Call to Action */}
                        <div className="pt-2.5 sm:pt-3 md:pt-4">
                          <div className="flex items-center justify-between text-primary group-hover:text-gold-500 transition-colors">
                            <span className="font-semibold text-xs sm:text-sm md:text-base">
                              {language === 'ro' ? 'Vezi apartamente disponibile' : 'View available apartments'}
                            </span>
                            <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 group-hover:translate-x-2 transition-transform flex-shrink-0" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
          </div>
          )}

          {projects?.length === 0 && (
            <div className="text-center py-16">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {language === 'ro' ? 'Nu există complexe disponibile' : 'No complexes available'}
              </h3>
              <p className="text-muted-foreground">
                {language === 'ro' ? 'Revino în curând pentru noi proiecte!' : 'Come back soon for new projects!'}
              </p>
            </div>
          )}

          {/* Featured Residential Complexes - SEO Content */}
          <section className="mt-12 sm:mt-16 md:mt-20 max-w-4xl mx-auto" aria-label="Ansambluri rezidențiale recomandate">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 text-foreground text-center">
              Ansambluri Rezidențiale Recomandate în zona Militari–Chiajna
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-8 text-center max-w-3xl mx-auto">
              MVA Imobiliare colaborează cu cei mai importanți dezvoltatori imobiliari din zona de vest a Bucureștiului. 
              Fiecare ansamblu rezidențial din portofoliul nostru a fost verificat și evaluat de echipa noastră de specialiști, 
              astfel încât să vă putem oferi informații complete și actualizate despre disponibilitate, prețuri și facilități.
            </p>
            
            <div className="grid gap-6 sm:gap-8">
              {/* Militari Residence */}
              <Link to="/militari-residence" className="group">
                <Card className="card-modern p-4 sm:p-6 border-glow hover:border-gold/40 transition-all">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 group-hover:text-gold transition-colors">
                    Militari Residence
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    Cel mai mare ansamblu rezidențial din vestul Bucureștiului, situat în Chiajna, Ilfov. 
                    Oferă apartamente cu 1, 2 și 3 camere cu finisaje moderne, acces rapid la metrou Păcii și Preciziei, 
                    și facilități complete: locuri de joacă, parcări, spații comerciale. Prețuri accesibile și posibilitate de finanțare prin credit ipotecar.
                  </p>
                  <span className="text-sm font-semibold text-gold group-hover:underline">
                    Vezi apartamente disponibile →
                  </span>
                </Card>
              </Link>

              {/* Renew Residence */}
              <Link to="/renew-residence" className="group">
                <Card className="card-modern p-4 sm:p-6 border-glow hover:border-gold/40 transition-all">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 group-hover:text-gold transition-colors">
                    Renew Residence
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    Ansamblu rezidențial modern în Chiajna, cu arhitectură contemporană și apartamente luminoase. 
                    Garsoniere și apartamente cu 2 camere, finisate la cheie, cu materiale premium. 
                    Amplasare strategică cu acces facil la șoseaua de centură și transportul în comun. Ideal pentru tineri profesioniști și familii.
                  </p>
                  <span className="text-sm font-semibold text-gold group-hover:underline">
                    Descoperă Renew Residence →
                  </span>
                </Card>
              </Link>

              {/* Eurocasa Residence */}
              <Link to="/eurocasa-residence" className="group">
                <Card className="card-modern p-4 sm:p-6 border-glow hover:border-gold/40 transition-all">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 group-hover:text-gold transition-colors">
                    Eurocasa Residence
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    Complex rezidențial de calitate superioară în zona Militari–Chiajna. Apartamente spațioase cu 
                    compartimentări eficiente, balcoane generoase și finisaje de înaltă calitate. Beneficiază de zone verzi amenajate, 
                    securitate 24/7 și proximitate față de școli, grădinițe și centre comerciale.
                  </p>
                  <span className="text-sm font-semibold text-gold group-hover:underline">
                    Explorează Eurocasa Residence →
                  </span>
                </Card>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground mt-8 text-center">
              Toate proprietățile din aceste ansambluri sunt verificate și actualizate zilnic de echipa MVA Imobiliare. 
              Oferim vizionări gratuite, asistență la obținerea creditului ipotecar și suport complet până la semnarea actelor la notar. 
              Contactați-ne la <a href="tel:+40767941512" className="text-gold font-semibold hover:underline">0767 941 512</a> pentru 
              programarea unei vizionări sau pentru informații suplimentare despre apartamentele disponibile.
            </p>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Complexe;
