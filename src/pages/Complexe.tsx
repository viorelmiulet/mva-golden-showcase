import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Home, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Progress } from "@/components/ui/progress";

const Complexe = () => {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['public-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('real_estate_projects')
        .select('*')
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
        .select('id, project_id, availability_status')
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-4">
            <Building2 className="h-12 w-12 mx-auto animate-pulse text-primary" />
            <p className="text-muted-foreground">Se încarcă complexele...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Complexe Rezidențiale - MVA Imobiliare</title>
        <meta name="description" content="Descoperă complexele rezidențiale moderne disponibile prin MVA Imobiliare" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-16 md:py-24">
          {/* Hero Section */}
          <div className="text-center space-y-4 md:space-y-6 mb-12 md:mb-16">
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent px-2">
              Complexe Rezidențiale
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Explorează cele mai moderne ansambluri rezidențiale din București și împrejurimi
            </p>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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
                  >
                    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50 h-full">
                      {/* Project Image */}
                      <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
                        {project.main_image ? (
                          <img
                            src={project.main_image}
                            alt={project.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="h-24 w-24 text-primary/20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                        
                        {/* Project Name Overlay */}
                        <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 right-3 md:right-4">
                          <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow-lg">
                            {project.name}
                          </h2>
                        </div>
                      </div>

                      <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
                        {/* Location */}
                        <div className="flex items-center gap-2 text-muted-foreground text-sm md:text-base">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{project.location}</span>
                        </div>

                        {/* Description */}
                        {project.description && (
                          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                            {project.description}
                          </p>
                        )}

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-3 md:gap-4 pt-3 md:pt-4 border-t">
                          {project.price_range && (
                            <div>
                              <p className="text-xs text-muted-foreground">Preț</p>
                              <p className="font-semibold text-sm md:text-base truncate">{project.price_range}</p>
                            </div>
                          )}
                          {project.surface_range && (
                            <div>
                              <p className="text-xs text-muted-foreground">Suprafață</p>
                              <p className="font-semibold text-sm md:text-base truncate">{project.surface_range}</p>
                            </div>
                          )}
                          {project.rooms_range && (
                            <div>
                              <p className="text-xs text-muted-foreground">Camere</p>
                              <p className="font-semibold text-sm md:text-base truncate">{project.rooms_range}</p>
                            </div>
                          )}
                          {project.completion_date && (
                            <div>
                              <p className="text-xs text-muted-foreground">Finalizare</p>
                              <p className="font-semibold text-sm md:text-base truncate">{project.completion_date}</p>
                            </div>
                          )}
                        </div>

                        {/* Statistics Section */}
                        {stats.total > 0 && (
                          <div className="pt-3 md:pt-4 border-t space-y-2 md:space-y-3">
                            <div className="flex items-center justify-between text-xs md:text-sm">
                              <span className="font-semibold">Disponibilitate</span>
                              <span className="text-muted-foreground">{stats.available} din {stats.total}</span>
                            </div>
                            {/* Dual bar chart */}
                            <div className="flex gap-1 h-3 md:h-4 rounded-full overflow-hidden bg-muted/20">
                              <div 
                                className="bg-green-500 transition-all duration-300" 
                                style={{ width: `${stats.percentage}%` }}
                              />
                              <div 
                                className="bg-red-500 transition-all duration-300" 
                                style={{ width: `${100 - stats.percentage}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-center gap-4 md:gap-6 text-[10px] md:text-xs">
                              <div className="flex items-center gap-1.5 md:gap-2">
                                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                                <span>{stats.available} disponibile</span>
                              </div>
                              <div className="flex items-center gap-1.5 md:gap-2">
                                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500 flex-shrink-0"></div>
                                <span>{stats.sold} vândute</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Call to Action */}
                        <div className="pt-3 md:pt-4">
                          <div className="flex items-center justify-between text-primary group-hover:text-primary/80 transition-colors">
                            <span className="font-semibold text-sm md:text-base">Vezi apartamente disponibile</span>
                            <Home className="h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-2 transition-transform flex-shrink-0" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
          </div>

          {projects?.length === 0 && (
            <div className="text-center py-16">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nu există complexe disponibile</h3>
              <p className="text-muted-foreground">Revino în curând pentru noi proiecte!</p>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Complexe;
