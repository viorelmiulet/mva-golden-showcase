import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Home, CheckCircle, XCircle, TrendingUp, Plus, FileSpreadsheet, MapPin, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import ComplexExcelImporter from "@/components/ComplexExcelImporter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ProjectStats {
  id: string;
  name: string;
  location: string | null;
  main_image: string | null;
  total_properties: number;
  available: number;
  sold: number;
  soldPercentage: number;
}

const ComplexesOverview = () => {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch all projects with their statistics
  const { data: projectsStats, isLoading } = useQuery({
    queryKey: ['projects-stats'],
    queryFn: async () => {
      // Get all projects
      const { data: projects, error: projectsError } = await supabase
        .from('real_estate_projects')
        .select('*')
        .order('name');

      if (projectsError) throw projectsError;

      // Get all properties
      const { data: properties, error: propertiesError } = await supabase
        .from('catalog_offers')
        .select('project_id, availability_status, available_units');

      if (propertiesError) throw propertiesError;

      // Calculate stats for each project
      const stats: ProjectStats[] = projects.map(project => {
        const projectProperties = properties.filter(p => p.project_id === project.id);
        
        const available = projectProperties
          .filter(p => p.availability_status === 'available')
          .reduce((sum, p) => sum + (p.available_units || 1), 0);
        
        const sold = projectProperties
          .filter(p => p.availability_status === 'sold')
          .reduce((sum, p) => sum + (p.available_units || 1), 0);
        
        const total = available + sold;
        const soldPercentage = total > 0 ? Math.round((sold / total) * 100) : 0;

        return {
          id: project.id,
          name: project.name,
          location: project.location,
          main_image: project.main_image,
          total_properties: total,
          available,
          sold,
          soldPercentage
        };
      });

      // Sort ascending by name with Romanian locale and numeric handling
      stats.sort((a, b) => a.name.localeCompare(b.name, 'ro', { numeric: true, sensitivity: 'base' }));
      return stats;
    }
  });

  // Calculate totals
  const totals = projectsStats?.reduce(
    (acc, project) => ({
      complexes: acc.complexes + 1,
      properties: acc.properties + project.total_properties,
      available: acc.available + project.available,
      sold: acc.sold + project.sold
    }),
    { complexes: 0, properties: 0, available: 0, sold: 0 }
  ) || { complexes: 0, properties: 0, available: 0, sold: 0 };

  const handleDeleteClick = (projectId: string) => {
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      // First delete all properties associated with this project
      const { error: propertiesError } = await supabase
        .from('catalog_offers')
        .delete()
        .eq('project_id', projectToDelete);

      if (propertiesError) throw propertiesError;

      // Then delete the project
      const { error: projectError } = await supabase
        .from('real_estate_projects')
        .delete()
        .eq('id', projectToDelete);

      if (projectError) throw projectError;

      toast({
        title: "Succes!",
        description: "Ansamblul a fost șters cu succes"
      });

      queryClient.invalidateQueries({ queryKey: ['projects-stats'] });
      queryClient.invalidateQueries({ queryKey: ['real_estate_projects'] });
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu am putut șterge ansamblul",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Building2 className="h-12 w-12 mx-auto animate-pulse text-primary" />
          <p className="text-muted-foreground">Se încarcă ansamblurile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Selectează un complex
        </h1>
        <p className="text-muted-foreground text-lg">
          Gestionează proprietățile și vânzările din fiecare complex imobiliar
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Complexe
            </CardTitle>
            <Building2 className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totals.complexes}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 hover:border-blue-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Proprietăți
            </CardTitle>
            <Home className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{totals.properties}</div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 hover:border-green-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Disponibile
            </CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{totals.available}</div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 hover:border-red-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vândute
            </CardTitle>
            <XCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{totals.sold}</div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Complexe</h2>
            <p className="text-muted-foreground">{totals.complexes} complexe active</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setImportDialogOpen(true)} variant="outline">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Import Excel/PDF
            </Button>
            <Link to="/admin/complexe/add">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Adaugă Complex
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectsStats?.map(project => (
            <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
              {/* Project Image */}
              <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
                {project.main_image ? (
                  <img
                    src={project.main_image}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="h-16 w-16 text-primary/30" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="backdrop-blur-sm bg-background/80">
                    {project.total_properties} proprietăți
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6 space-y-4">
                {/* Project Name and Location */}
                <div>
                  <h3 className="text-xl font-bold">{project.name}</h3>
                  {project.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {project.location}
                    </p>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Vândute</span>
                    <span className="font-semibold">{project.soldPercentage}%</span>
                  </div>
                  <Progress value={project.soldPercentage} className="h-2" />
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Disponibile</p>
                    <p className="text-2xl font-bold text-green-600">{project.available}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Vândute</p>
                    <p className="text-2xl font-bold text-red-600">{project.sold}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link to={`/admin/complexe/${project.id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Editează
                    </Button>
                  </Link>
                  <Link to={`/admin/complexe/${project.id}`} className="flex-1">
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" size="sm">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Detalii
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteClick(project.id)}
                    className="border-destructive/30 hover:bg-destructive/10 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Complexe din Excel sau PDF</DialogTitle>
          </DialogHeader>
          <ComplexExcelImporter />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmare ștergere</AlertDialogTitle>
            <AlertDialogDescription>
              Sigur doriți să ștergeți acest ansamblu rezidențial? Toate proprietățile asociate vor fi de asemenea șterse. Această acțiune nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ComplexesOverview;