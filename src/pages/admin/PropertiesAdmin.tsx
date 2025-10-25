import { useState } from "react";
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

const PropertiesAdmin = () => {
  const [propertyIds, setPropertyIds] = useState(Array(5).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState(Array(5).fill(false));
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    const validIds = propertyIds.filter((id) => id.trim() !== "");

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
      const promises = propertyIds.map((propertyId, index) => {
        if (propertyId.trim() !== "") {
          return scrapeProperty(propertyId, index);
        }
        return Promise.resolve();
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
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("catalog_offers")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all rows

      if (error) throw error;

      toast({
        title: "Succes!",
        description: "Toate proprietățile au fost șterse cu succes",
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
    <div className="space-y-8">
      {/* Scrape Properties Section */}
      <Card className="glass border-gold/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-gold" />
            Adaugă Proprietăți din ImmoFlux
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {propertyIds.map((id, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`ID Proprietate ${index + 1}`}
                  value={id}
                  onChange={(e) => updatePropertyId(index, e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={() => scrapeProperty(id, index)}
                  disabled={loadingStates[index] || !id.trim()}
                  size="sm"
                  variant="outline"
                  className="border-gold/30"
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
            className="w-full"
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
                Adaugă Toate Proprietățile
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Properties List */}
      <Card className="glass border-gold/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-gold" />
              Proprietăți ({properties?.length || 0})
            </div>
            {properties && properties.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/30 hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Șterge Toate
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmare ștergere masivă</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ești sigur că vrei să ștergi TOATE proprietățile ({properties?.length} proprietăți)?
                      <br />
                      <span className="font-semibold text-destructive">Această acțiune nu poate fi anulată!</span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Anulează</AlertDialogCancel>
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
        <CardContent>
          {propertiesLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold" />
              <p className="text-muted-foreground mt-2">Se încarcă proprietățile...</p>
            </div>
          ) : properties && properties.length > 0 ? (
            <div className="grid gap-4">
              {properties.map((property: any) => (
                <Card
                  key={property.id}
                  className="border-border/30 hover:border-gold/30 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {property.images?.[0] && (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-2 truncate">
                          {property.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary" className="bg-gold/10">
                            <MapPin className="w-3 h-3 mr-1" />
                            {property.location}
                          </Badge>
                          <Badge variant="secondary" className="bg-gold/10">
                            <Euro className="w-3 h-3 mr-1" />
                            €{property.price_min?.toLocaleString()}
                          </Badge>
                          <Badge variant="secondary" className="bg-gold/10">
                            <Ruler className="w-3 h-3 mr-1" />
                            {property.surface_min} mp
                          </Badge>
                          <Badge variant="secondary" className="bg-gold/10">
                            <Home className="w-3 h-3 mr-1" />
                            {property.rooms} cam
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 items-start">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(property)}
                          className="border-gold/30"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive/30 hover:bg-destructive/10"
                            >
                              {deletingId === property.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmare ștergere</AlertDialogTitle>
                              <AlertDialogDescription>
                                Ești sigur că vrei să ștergi această proprietate?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Anulează</AlertDialogCancel>
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
            <div className="text-center py-8">
              <Home className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nu există proprietăți</p>
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
  );
};

export default PropertiesAdmin;
