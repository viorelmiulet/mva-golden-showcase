import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Loader2,
  Trash2,
  Home,
  MapPin,
  Euro,
  Ruler,
  Images,
  Edit,
  Save,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/admin/PullToRefreshIndicator";

const PropertiesAdmin = () => {
  const isMobile = useIsMobile();
  const [propertyIds, setPropertyIds] = useState(Array(5).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState(Array(5).fill(false));
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['all-properties'] });
  }, [queryClient]);

  const { containerRef, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
    disabled: !isMobile,
  });

  const scrapeProperty = async (propertyId: string, index: number) => {
    if (!propertyId.trim()) {
      toast({
        title: "Eroare",
        description: "Te rog să introduci un ID valid",
        variant: "destructive",
      });
      return;
    }

    const url = `https://web.immoflux.ro/publicproperty/p${propertyId.trim()}`;
    setLoadingStates((prev) => prev.map((state, i) => (i === index ? true : state)));

    try {
      const { data, error } = await supabase.functions.invoke("scrape-property", {
        body: { url },
      });

      if (error) throw error;

      if (data?.success) {
        const insertData = {
          title: data.property.title,
          description: data.property.description,
          location: data.property.location,
          images: data.property.images,
          price_min: data.property.price_min,
          price_max: data.property.price_max,
          currency: data.property.currency,
          surface_min: data.property.surface_min || 0,
          surface_max: data.property.surface_max || 0,
          rooms: data.property.rooms,
          features: data.property.features,
          availability_status: "available",
        };

        const { data: adminInsertData, error: adminInsertError } =
          await supabase.functions.invoke("admin-offers", {
            body: { action: "insert_offer", offer: insertData },
          });

        if (adminInsertError) throw adminInsertError;
        if (!adminInsertData?.success)
          throw new Error(adminInsertData?.error || "Insert failed");

        toast({
          title: "Succes!",
          description: `Proprietatea ${index + 1} (ID: ${propertyId}) a fost adăugată`,
        });

        setPropertyIds((prev) => prev.map((id, i) => (i === index ? "" : id)));
        queryClient.invalidateQueries({ queryKey: ["catalog_offers"] });
      } else {
        throw new Error(data?.error || "Eroare la preluarea datelor");
      }
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: `ID ${propertyId}: ${error.message || "Nu am putut prelua datele"}`,
        variant: "destructive",
      });
    } finally {
      setLoadingStates((prev) => prev.map((state, i) => (i === index ? false : state)));
    }
  };

  const scrapeAllProperties = async () => {
    const validIds = propertyIds.filter((id) => id && typeof id === 'string' && id.trim() !== "");

    if (validIds.length === 0) {
      toast({
        title: "Eroare",
        description: "Te rog să introduci cel puțin un ID valid",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const promises = validIds.map((propertyId, index) => {
        return scrapeProperty(propertyId, index);
      });

      await Promise.all(promises);

      toast({
        title: "Procesare completă!",
        description: `Am procesat ${validIds.length} proprietăți`,
      });
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: "Eroare la procesarea proprietăților",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePropertyId = (index: number, value: string) => {
    setPropertyIds((prev) => prev.map((id, i) => (i === index ? value : id)));
  };

  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ["catalog_offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_offers")
        .select("*")
        .is('project_id', null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteProperty = async (id: string) => {
    setDeletingId(id);
    try {
      const { data, error } = await supabase.functions.invoke("admin-offers", {
        body: { action: "delete_offer", id },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Delete failed");

      toast({
        title: "Succes!",
        description: "Proprietatea a fost ștearsă",
      });

      queryClient.invalidateQueries({ queryKey: ["catalog_offers"] });
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error?.message || "Nu am putut șterge proprietatea",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const deleteAllProperties = async () => {
    if (!properties || properties.length === 0) return;
    
    setIsLoading(true);
    try {
      // Delete all properties using admin-offers edge function
      const deletePromises = properties.map((property) =>
        supabase.functions.invoke("admin-offers", {
          body: { action: "delete_offer", id: property.id },
        })
      );

      const results = await Promise.all(deletePromises);

      // Check for errors
      const errors = results.filter((r) => r.error || !r.data?.success);
      if (errors.length > 0) {
        throw new Error(`Nu am putut șterge ${errors.length} proprietăți`);
      }

      toast({
        title: "Succes!",
        description: `Toate proprietățile (${properties.length}) au fost șterse cu succes`,
      });

      queryClient.invalidateQueries({ queryKey: ["catalog_offers"] });
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error?.message || "Nu am putut șterge proprietățile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (property: any) => {
    setEditingProperty(property);
    setEditForm({
      title: property.title || "",
      description: property.description || "",
      location: property.location || "",
      price_min: property.price_min || 0,
      price_max: property.price_max || 0,
      currency: property.currency || "EUR",
      surface_min: property.surface_min || 0,
      surface_max: property.surface_max || 0,
      rooms: property.rooms || 1,
      project_name: property.project_name || "",
      features: Array.isArray(property.features) ? property.features.join(", ") : "",
      amenities: Array.isArray(property.amenities) ? property.amenities.join(", ") : "",
    });
  };

  const closeEditModal = () => {
    setEditingProperty(null);
    setEditForm({});
  };

  const updateProperty = async () => {
    if (!editingProperty) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("catalog_offers")
        .update({
          title: editForm.title,
          description: editForm.description,
          location: editForm.location,
          price_min: parseInt(editForm.price_min) || 0,
          price_max: parseInt(editForm.price_max) || 0,
          surface_min: parseInt(editForm.surface_min) || 0,
          surface_max: parseInt(editForm.surface_max) || 0,
          rooms: parseInt(editForm.rooms) || 1,
          project_name: editForm.project_name,
          features: editForm.features
            ? editForm.features
                .split(",")
                .map((f: string) => f.trim())
                .filter(Boolean)
            : [],
          amenities: editForm.amenities
            ? editForm.amenities
                .split(",")
                .map((a: string) => a.trim())
                .filter(Boolean)
            : [],
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingProperty.id);

      if (error) throw error;

      toast({
        title: "Succes!",
        description: "Proprietatea a fost actualizată",
      });

      queryClient.invalidateQueries({ queryKey: ["catalog_offers"] });
      closeEditModal();
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu am putut actualiza proprietatea",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div ref={containerRef}>
      {isMobile && (
        <PullToRefreshIndicator 
          pullDistance={pullDistance} 
          isRefreshing={isRefreshing} 
          progress={progress} 
        />
      )}
      <div className="space-y-4 md:space-y-8">
      {/* Scrape Properties Section */}
      <Card className="glass border-gold/20">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Plus className="w-4 h-4 md:w-5 md:h-5 text-gold" />
            Adaugă Proprietăți
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4 p-4 pt-0 md:p-6 md:pt-0">
          <div className="grid gap-2 md:gap-3">
            {propertyIds.slice(0, 3).map((id, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`ID ${index + 1}`}
                  value={id}
                  onChange={(e) => updatePropertyId(index, e.target.value)}
                  className="flex-1 h-9 md:h-10 text-sm"
                />
                <Button
                  onClick={() => scrapeProperty(id, index)}
                  disabled={loadingStates[index] || !id.trim()}
                  size="sm"
                  variant="outline"
                  className="border-gold/30 h-9 md:h-10 w-9 md:w-10 p-0"
                >
                  {loadingStates[index] ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>

          <Button
            onClick={scrapeAllProperties}
            disabled={isLoading}
            className="w-full h-9 md:h-10 text-sm"
            variant="luxury"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Se procesează...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Adaugă Toate
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Properties List */}
      <Card className="glass border-gold/20">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-base md:text-lg">
              <Home className="w-4 h-4 md:w-5 md:h-5 text-gold" />
              Proprietăți ({properties?.length || 0})
            </div>
            {properties && properties.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/30 hover:bg-destructive/10 text-destructive h-8 text-xs md:text-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5" />
                    Șterge Toate
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-base md:text-lg">Confirmare ștergere</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm">
                      Ești sigur că vrei să ștergi toate {properties?.length} proprietățile?
                      <br />
                      <span className="font-semibold text-destructive">Acțiunea nu poate fi anulată!</span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel className="mt-0">Anulează</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteAllProperties}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Șterge Toate
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          {propertiesLoading ? (
            <div className="text-center py-6 md:py-8">
              <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin mx-auto text-gold" />
              <p className="text-muted-foreground mt-2 text-sm">Se încarcă...</p>
            </div>
          ) : properties && properties.length > 0 ? (
            <div className="grid gap-3 md:gap-4">
              {properties.map((property: any) => (
                <Card
                  key={property.id}
                  className="border-border/30 hover:border-gold/30 transition-colors"
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex gap-3 md:gap-4">
                      {property.images?.[0] && (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-16 h-16 md:w-24 md:h-24 object-cover rounded-lg shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm md:text-lg mb-1.5 md:mb-2 line-clamp-2">
                          {property.title}
                        </h3>
                        <div className="flex flex-wrap gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground">
                          <Badge variant="secondary" className="bg-gold/10 text-[10px] md:text-xs px-1.5 py-0.5">
                            <Euro className="w-2.5 h-2.5 md:w-3 md:h-3 mr-0.5" />
                            €{property.price_min?.toLocaleString()}
                          </Badge>
                          <Badge variant="secondary" className="bg-gold/10 text-[10px] md:text-xs px-1.5 py-0.5">
                            <Ruler className="w-2.5 h-2.5 md:w-3 md:h-3 mr-0.5" />
                            {property.surface_min}mp
                          </Badge>
                          <Badge variant="secondary" className="bg-gold/10 text-[10px] md:text-xs px-1.5 py-0.5">
                            <Home className="w-2.5 h-2.5 md:w-3 md:h-3 mr-0.5" />
                            {property.rooms}cam
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row gap-1.5 md:gap-2 items-end md:items-start shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(property)}
                          className="border-gold/30 h-7 w-7 md:h-8 md:w-8 p-0"
                        >
                          <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive/30 hover:bg-destructive/10 h-7 w-7 md:h-8 md:w-8 p-0"
                            >
                              {deletingId === property.id ? (
                                <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmare ștergere</AlertDialogTitle>
                              <AlertDialogDescription>
                                Ștergi această proprietate?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                              <AlertDialogCancel className="mt-0">Anulează</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteProperty(property.id)}
                              >
                                Șterge
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 md:py-8">
              <Home className="w-10 h-10 md:w-12 md:h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">Nu există proprietăți</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingProperty} onOpenChange={closeEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editează Proprietatea</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Titlu</Label>
                <Input
                  value={editForm.title || ""}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label>Descriere</Label>
                <Textarea
                  value={editForm.description || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label>Locație</Label>
                <Input
                  value={editForm.location || ""}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                />
              </div>
              <div>
                <Label>Nume Proiect</Label>
                <Input
                  value={editForm.project_name || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, project_name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Preț Min (€)</Label>
                <Input
                  type="number"
                  value={editForm.price_min || ""}
                  onChange={(e) => setEditForm({ ...editForm, price_min: e.target.value })}
                />
              </div>
              <div>
                <Label>Preț Max (€)</Label>
                <Input
                  type="number"
                  value={editForm.price_max || ""}
                  onChange={(e) => setEditForm({ ...editForm, price_max: e.target.value })}
                />
              </div>
              <div>
                <Label>Suprafață Min (mp)</Label>
                <Input
                  type="number"
                  value={editForm.surface_min || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, surface_min: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Suprafață Max (mp)</Label>
                <Input
                  type="number"
                  value={editForm.surface_max || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, surface_max: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Camere</Label>
                <Input
                  type="number"
                  value={editForm.rooms || ""}
                  onChange={(e) => setEditForm({ ...editForm, rooms: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label>Facilități (separate prin virgulă)</Label>
                <Input
                  value={editForm.features || ""}
                  onChange={(e) => setEditForm({ ...editForm, features: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label>Amenajări (separate prin virgulă)</Label>
                <Input
                  value={editForm.amenities || ""}
                  onChange={(e) => setEditForm({ ...editForm, amenities: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={closeEditModal}>
                Anulează
              </Button>
              <Button onClick={updateProperty} disabled={isUpdating} variant="luxury">
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Se salvează...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvează
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default PropertiesAdmin;
