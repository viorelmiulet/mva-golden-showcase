import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { adminApi } from "@/lib/adminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Home, CheckCircle, XCircle, TrendingUp, Plus, FileSpreadsheet, MapPin, Edit, Trash2, Share2, Loader2, Facebook, Instagram, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import ComplexExcelImporter from "@/components/ComplexExcelImporter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/admin/PullToRefreshIndicator";
import { triggerProjectSocialAutoPost } from "@/lib/socialAutoPost";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

interface CorpStats {
  name: string;
  total: number;
  available: number;
  sold: number;
  soldPercentage: number;
}

interface ProjectStats {
  id: string;
  name: string;
  location: string | null;
  main_image: string | null;
  total_properties: number;
  available: number;
  sold: number;
  soldPercentage: number;
  is_published: boolean;
  corpStats: CorpStats[];
}

const ComplexesOverview = () => {
  const isMobile = useIsMobile();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [postingToSocial, setPostingToSocial] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [projectToShare, setProjectToShare] = useState<{ id: string; name: string } | null>(null);
  const [togglingVisibility, setTogglingVisibility] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleVisibility = async (projectId: string, currentValue: boolean) => {
    setTogglingVisibility(projectId);
    try {
      const result = await adminApi.updateComplex(projectId, { is_published: !currentValue });

      if (!result.success) throw new Error(result.error);

      toast({
        title: "Succes!",
        description: !currentValue ? "Complexul este acum vizibil pe site" : "Complexul a fost ascuns de pe site",
      });

      queryClient.invalidateQueries({ queryKey: ["projects-stats"] });
      queryClient.invalidateQueries({ queryKey: ["real_estate_projects"] });
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu am putut actualiza vizibilitatea",
        variant: "destructive",
      });
    } finally {
      setTogglingVisibility(null);
    }
  };

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['projects-stats'] });
  }, [queryClient]);

  const { containerRef, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
    disabled: !isMobile,
  });
  
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
        .select('project_id, availability_status, available_units, features');

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

        // Calculate per-corp/scara stats
        const corpMap = new Map<string, { available: number; sold: number }>();
        projectProperties.forEach(p => {
          const corpFeature = (p.features as string[] | null)?.find(
            (f: string) => f.startsWith('Corpul ') || f.startsWith('Scara ')
          );
          if (corpFeature) {
            const entry = corpMap.get(corpFeature) || { available: 0, sold: 0 };
            const units = p.available_units || 1;
            if (p.availability_status === 'sold') {
              entry.sold += units;
            } else if (p.availability_status === 'available') {
              entry.available += units;
            }
            corpMap.set(corpFeature, entry);
          }
        });

        const corpStats: CorpStats[] = [];
        if (corpMap.size > 1) {
          // Sort corps naturally
          const sortedCorps = Array.from(corpMap.entries()).sort((a, b) =>
            a[0].localeCompare(b[0], 'ro', { numeric: true })
          );
          for (const [name, vals] of sortedCorps) {
            const corpTotal = vals.available + vals.sold;
            corpStats.push({
              name,
              total: corpTotal,
              available: vals.available,
              sold: vals.sold,
              soldPercentage: corpTotal > 0 ? Math.round((vals.sold / corpTotal) * 100) : 0,
            });
          }
        }

        return {
          id: project.id,
          name: project.name,
          location: project.location,
          main_image: project.main_image,
          total_properties: total,
          available,
          sold,
          soldPercentage,
          is_published: project.is_published !== false,
          corpStats,
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

  const openShareDialog = (projectId: string, projectName: string) => {
    setProjectToShare({ id: projectId, name: projectName });
    setShareDialogOpen(true);
  };

  const handleShareToSocial = async (platform: 'facebook' | 'instagram' | 'all') => {
    if (!projectToShare) return;
    
    setShareDialogOpen(false);
    setPostingToSocial(projectToShare.id);
    
    try {
      const success = await triggerProjectSocialAutoPost(projectToShare.id, platform);
      
      const platformName = platform === 'facebook' ? 'Facebook' : platform === 'instagram' ? 'Instagram' : 'toate platformele';
      
      if (success) {
        toast({
          title: "Succes!",
          description: `"${projectToShare.name}" a fost trimis către ${platformName}`
        });
      } else {
        toast({
          title: "Atenție",
          description: "Nu s-a putut trimite către Zapier. Verificați configurarea webhook-urilor.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu am putut trimite către social media",
        variant: "destructive"
      });
    } finally {
      setPostingToSocial(null);
      setProjectToShare(null);
    }
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      // First delete all properties associated with this project using admin API
      const propertiesResult = await adminApi.delete('catalog_offers', projectToDelete);
      // Note: This deletes by project_id match - we need a different approach
      // For now, use edge function for properties too
      const { error: propertiesError } = await supabase.functions.invoke('admin-offers', {
        body: { action: 'delete_by_project', projectId: projectToDelete }
      });

      // Then delete the project using admin API
      const result = await adminApi.deleteComplex(projectToDelete);

      if (!result.success) throw new Error(result.error);

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
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-blue-600/10 rounded-full blur-xl" />
            <div className="relative p-4 rounded-full bg-gradient-to-br from-primary/20 to-blue-600/5 border border-primary/20">
              <Building2 className="h-12 w-12 animate-pulse text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground">Se încarcă ansamblurile...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      {isMobile && (
        <PullToRefreshIndicator 
          pullDistance={pullDistance} 
          isRefreshing={isRefreshing} 
          progress={progress} 
        />
      )}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-8"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-blue-600/10 rounded-2xl blur-xl" />
            <div className="relative p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-600/5 border border-primary/20">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Complexe Rezidențiale</h1>
            <p className="text-muted-foreground text-sm">Gestionează proprietățile din fiecare complex</p>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                Complexe
              </CardTitle>
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-3xl font-bold">{totals.complexes}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-blue-500/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                Proprietăți
              </CardTitle>
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <Home className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-3xl font-bold text-blue-500">{totals.properties}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-green-500/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                Disponibile
              </CardTitle>
              <div className="p-1.5 rounded-lg bg-green-500/10">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-3xl font-bold text-green-500">{totals.available}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-red-500/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                Vândute
              </CardTitle>
              <div className="p-1.5 rounded-lg bg-red-500/10">
                <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-3xl font-bold text-red-500">{totals.sold}</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Projects Section */}
        <motion.div variants={itemVariants} className="space-y-3 md:space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
            <div>
              <h2 className="text-lg md:text-2xl font-bold">Toate Complexele</h2>
              <p className="text-muted-foreground text-sm">{totals.complexes} complexe active</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setImportDialogOpen(true)} variant="outline" size="sm" className="flex-1 md:flex-none">
                <FileSpreadsheet className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Import</span>
              </Button>
              <Link to="/admin/complexe/add" className="flex-1 md:flex-none">
                <Button size="sm" className="w-full">
                  <Plus className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">Adaugă</span> Complex
                </Button>
            </Link>
          </div>
        </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {projectsStats?.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:border-primary/30 transition-all group">
                  {/* Project Image */}
              <div className="relative h-32 md:h-48 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
                {project.main_image ? (
                  <img
                    src={project.main_image}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="h-10 w-10 md:h-16 md:w-16 text-primary/30" />
                  </div>
                )}
                <div className="absolute top-2 right-2 md:top-4 md:right-4">
                  <Badge variant="secondary" className="backdrop-blur-sm bg-background/80 text-[10px] md:text-xs">
                    {project.total_properties} prop.
                  </Badge>
                </div>
              </div>

              <CardContent className="p-3 md:p-6 space-y-3 md:space-y-4">
                {/* Project Name and Location */}
                <div>
                  <h3 className="text-base md:text-xl font-bold line-clamp-1">{project.name}</h3>
                  {project.location && (
                    <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1 mt-0.5 md:mt-1">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{project.location}</span>
                    </p>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 md:space-y-2">
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-muted-foreground">Vândute</span>
                    <span className="font-semibold">{project.soldPercentage}%</span>
                  </div>
                  <Progress value={project.soldPercentage} className="h-1.5 md:h-2" />
                </div>

                {/* Per-Corp Breakdown */}
                {project.corpStats.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {project.corpStats.map((corp) => (
                      <div key={corp.name} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[10px] md:text-xs">
                          <span className="text-muted-foreground">{corp.name}</span>
                          <span className="font-medium">
                            {corp.soldPercentage}%
                            <span className="text-muted-foreground ml-1">({corp.sold}/{corp.total})</span>
                          </span>
                        </div>
                        <Progress value={corp.soldPercentage} className="h-1" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-2 md:gap-4 pt-2 md:pt-4 border-t">
                  <div className="space-y-0.5 md:space-y-1">
                    <p className="text-xs md:text-sm text-muted-foreground">Disponibile</p>
                    <p className="text-lg md:text-2xl font-bold text-green-600">{project.available}</p>
                  </div>
                  <div className="space-y-0.5 md:space-y-1">
                    <p className="text-xs md:text-sm text-muted-foreground">Vândute</p>
                    <p className="text-lg md:text-2xl font-bold text-red-600">{project.sold}</p>
                  </div>
                </div>

                {/* Visibility Toggle */}
                <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-border/20">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={project.is_published}
                      onCheckedChange={() => toggleVisibility(project.id, project.is_published)}
                      disabled={togglingVisibility === project.id}
                    />
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {project.is_published ? (
                        <><Eye className="w-3.5 h-3.5 text-green-500" /> Vizibil pe site</>
                      ) : (
                        <><EyeOff className="w-3.5 h-3.5" /> Ascuns</>
                      )}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1.5 md:gap-2">
                  <Link to={`/admin/complexe/${project.id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full h-8 md:h-9 text-xs md:text-sm" size="sm">
                      <Edit className="mr-1 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                      Editează
                    </Button>
                  </Link>
                  <Link to={`/admin/complexe/${project.id}`} className="flex-1">
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors h-8 md:h-9 text-xs md:text-sm" size="sm">
                      <TrendingUp className="mr-1 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                      Detalii
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openShareDialog(project.id, project.name)}
                    disabled={postingToSocial === project.id}
                    className="border-blue-500/30 hover:bg-blue-500/10 text-blue-500 hover:text-blue-600 h-8 md:h-9 w-8 md:w-9 p-0"
                    title="Trimite către Zapier"
                  >
                    {postingToSocial === project.id ? (
                      <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
                    ) : (
                      <Share2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteClick(project.id)}
                    className="border-destructive/30 hover:bg-destructive/10 text-destructive hover:text-destructive h-8 md:h-9 w-8 md:w-9 p-0"
                  >
                    <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </Button>
                </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          </div>
        </motion.div>

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

        {/* Platform Selection Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Selectează platforma</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-4">
              <p className="text-sm text-muted-foreground">
                Trimite "{projectToShare?.name}" către:
              </p>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  className="justify-start gap-3 h-12"
                  onClick={() => handleShareToSocial('facebook')}
                >
                  <Facebook className="h-5 w-5 text-blue-600" />
                  <span>Facebook</span>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-3 h-12"
                  onClick={() => handleShareToSocial('instagram')}
                >
                  <Instagram className="h-5 w-5 text-pink-600" />
                  <span>Instagram</span>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-3 h-12"
                  onClick={() => handleShareToSocial('all')}
                >
                  <Share2 className="h-5 w-5 text-primary" />
                  <span>Toate platformele</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
};

export default ComplexesOverview;