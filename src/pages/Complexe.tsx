import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Home, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

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
        
        <main className="container mx-auto px-4 py-24">
          {/* Hero Section */}
          <div className="text-center space-y-6 mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Complexe Rezidențiale
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explorează cele mai moderne ansambluri rezidențiale din București și împrejurimi
            </p>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects
              ?.slice()
              .sort((a, b) => a.name.localeCompare(b.name, 'ro', { numeric: true, sensitivity: 'base' }))
              .map((project) => (
              <Link 
                key={project.id} 
                to={`/complexe/${project.id}`}
                className="group"
              >
                <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50 h-full">
                  {/* Project Image */}
                  <div className="relative h-64 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
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
                    <div className="absolute bottom-4 left-4 right-4">
                      <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                        {project.name}
                      </h2>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-4">
                    {/* Location */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{project.location}</span>
                    </div>

                    {/* Description */}
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      {project.price_range && (
                        <div>
                          <p className="text-xs text-muted-foreground">Preț</p>
                          <p className="font-semibold">{project.price_range}</p>
                        </div>
                      )}
                      {project.surface_range && (
                        <div>
                          <p className="text-xs text-muted-foreground">Suprafață</p>
                          <p className="font-semibold">{project.surface_range}</p>
                        </div>
                      )}
                      {project.rooms_range && (
                        <div>
                          <p className="text-xs text-muted-foreground">Camere</p>
                          <p className="font-semibold">{project.rooms_range}</p>
                        </div>
                      )}
                      {project.completion_date && (
                        <div>
                          <p className="text-xs text-muted-foreground">Finalizare</p>
                          <p className="font-semibold">{project.completion_date}</p>
                        </div>
                      )}
                    </div>

                    {/* Call to Action */}
                    <div className="pt-4">
                      <div className="flex items-center justify-between text-primary group-hover:text-primary/80 transition-colors">
                        <span className="font-semibold">Vezi apartamente disponibile</span>
                        <Home className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
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
