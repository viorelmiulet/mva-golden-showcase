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
  Loader2,
  Trash2,
  Home,
  Euro,
  Ruler,
  Edit,
  Save,
  Plus,
  Send,
  Instagram,
  Facebook,
  Share2,
  Eye,
  EyeOff,
  ExternalLink,
  Building2,
  BedDouble,
  Maximize,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useProperties, formatPrice, getTitle, getMainImage, getSurface, isPoleProperty, type ImmofluxProperty } from "@/hooks/useImmoflux";
import { getImmofluxPropertyUrl, generatePropertySlug } from "@/lib/propertySlug";
import { Switch } from "@/components/ui/switch";
import { triggerSocialAutoPost } from "@/lib/socialAutoPost";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/admin/PullToRefreshIndicator";
import PropertyImageEditor from "@/components/admin/PropertyImageEditor";
import { Checkbox } from "@/components/ui/checkbox";

const PropertiesAdmin = () => {
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // IMMOFLUX properties
  const [immofluxPage, setImmofluxPage] = useState(1);
  const { data: immofluxData, isLoading: immofluxLoading } = useProperties(immofluxPage);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    title: "",
    description: "",
    location: "",
    price_min: "",
    price_max: "",
    surface_min: "",
    surface_max: "",
    rooms: "1",
    project_name: "",
    features: "",
    amenities: "",
  });
  const [addImages, setAddImages] = useState<string[]>([]);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [sendingToSocial, setSendingToSocial] = useState<string | null>(null);
  const [sendingToGBP, setSendingToGBP] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [propertyToShare, setPropertyToShare] = useState<{ id: string; title: string } | null>(null);
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [togglingVisibility, setTogglingVisibility] = useState<string | null>(null);
  const [isBulkTogglingVisibility, setIsBulkTogglingVisibility] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleVisibility = async (propertyId: string, currentValue: boolean) => {
    setTogglingVisibility(propertyId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-offers", {
        body: { 
          action: "update_offer", 
          id: propertyId, 
          data: { is_published: !currentValue } 
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Update failed");

      toast({
        title: "Succes!",
        description: !currentValue ? "Anunțul este acum vizibil pe site" : "Anunțul a fost ascuns de pe site",
      });

      queryClient.invalidateQueries({ queryKey: ["catalog_offers"] });
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
    await queryClient.invalidateQueries({ queryKey: ['catalog_offers'] });
  }, [queryClient]);

  const { containerRef, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
    disabled: !isMobile,
  });

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
    setEditImages(Array.isArray(property.images) ? property.images : []);
  };

  const closeEditModal = () => {
    setEditingProperty(null);
    setEditForm({});
    setEditImages([]);
  };

  const updateProperty = async () => {
    if (!editingProperty) return;

    setIsUpdating(true);
    try {
      const updateData = {
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
        images: editImages,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.functions.invoke("admin-offers", {
        body: { action: "update_offer", id: editingProperty.id, data: updateData },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Update failed");

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

  const resetAddForm = () => {
    setAddForm({
      title: "",
      description: "",
      location: "",
      price_min: "",
      price_max: "",
      surface_min: "",
      surface_max: "",
      rooms: "1",
      project_name: "",
      features: "",
      amenities: "",
    });
    setAddImages([]);
  };

  const openShareDialog = (propertyId: string, propertyTitle: string) => {
    setPropertyToShare({ id: propertyId, title: propertyTitle });
    setShareDialogOpen(true);
  };

  const handleShareToSocial = async (platform: 'facebook' | 'instagram' | 'all') => {
    if (!propertyToShare) return;
    
    setShareDialogOpen(false);
    setSendingToSocial(propertyToShare.id);
    
    try {
      const success = await triggerSocialAutoPost(propertyToShare.id, platform);
      
      const platformName = platform === 'facebook' ? 'Facebook' : platform === 'instagram' ? 'Instagram' : 'toate platformele';
      
      if (success) {
        toast({
          title: "Succes!",
          description: `Proprietatea a fost trimisă către ${platformName}`
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
      setSendingToSocial(null);
      setPropertyToShare(null);
    }
  };

  const togglePropertySelection = (propertyId: string) => {
    setSelectedProperties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (!properties) return;
    if (selectedProperties.size === properties.length) {
      setSelectedProperties(new Set());
    } else {
      setSelectedProperties(new Set(properties.map(p => p.id)));
    }
  };

  const sendSelectedToZapier = async () => {
    if (selectedProperties.size === 0) {
      toast({
        title: "Atenție",
        description: "Selectează cel puțin o proprietate",
        variant: "destructive",
      });
      return;
    }

    const total = selectedProperties.size;
    setIsBulkSending(true);
    setBulkProgress({ current: 0, total });
    let successCount = 0;
    let failCount = 0;
    let current = 0;

    for (const propertyId of selectedProperties) {
      try {
        const success = await triggerSocialAutoPost(propertyId);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
      current++;
      setBulkProgress({ current, total });
    }

    setIsBulkSending(false);
    setBulkProgress({ current: 0, total: 0 });
    setSelectedProperties(new Set());

    if (successCount > 0) {
      toast({
        title: "Succes!",
        description: `${successCount} proprietăți trimise către Zapier${failCount > 0 ? `, ${failCount} au eșuat` : ''}`,
      });
    } else {
      toast({
        title: "Eroare",
        description: "Nu s-au putut trimite proprietățile către Zapier",
        variant: "destructive",
      });
    }
  };

  const bulkToggleVisibility = async (visible: boolean) => {
    if (selectedProperties.size === 0) {
      toast({
        title: "Atenție",
        description: "Selectează cel puțin o proprietate",
        variant: "destructive",
      });
      return;
    }

    setIsBulkTogglingVisibility(true);
    const total = selectedProperties.size;
    let successCount = 0;
    let failCount = 0;

    for (const propertyId of selectedProperties) {
      try {
        const { data, error } = await supabase.functions.invoke("admin-offers", {
          body: { 
            action: "update_offer", 
            id: propertyId, 
            data: { is_published: visible } 
          },
        });

        if (error || !data?.success) {
          failCount++;
        } else {
          successCount++;
        }
      } catch {
        failCount++;
      }
    }

    setIsBulkTogglingVisibility(false);
    setSelectedProperties(new Set());

    const actionText = visible ? "afișate" : "ascunse";
    
    if (successCount > 0) {
      toast({
        title: "Succes!",
        description: `${successCount} proprietăți ${actionText}${failCount > 0 ? `, ${failCount} au eșuat` : ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ["catalog_offers"] });
    } else {
      toast({
        title: "Eroare",
        description: `Nu s-au putut actualiza proprietățile`,
        variant: "destructive",
      });
    }
  };

  const addProperty = async () => {
    if (!addForm.title || !addForm.location || !addForm.price_min || !addForm.rooms) {
      toast({
        title: "Eroare",
        description: "Completează câmpurile obligatorii: Titlu, Locație, Preț, Camere",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      const offer = {
        title: addForm.title,
        description: addForm.description || null,
        location: addForm.location,
        price_min: parseInt(addForm.price_min) || 0,
        price_max: parseInt(addForm.price_max) || parseInt(addForm.price_min) || 0,
        surface_min: parseInt(addForm.surface_min) || null,
        surface_max: parseInt(addForm.surface_max) || parseInt(addForm.surface_min) || null,
        rooms: parseInt(addForm.rooms) || 1,
        project_name: addForm.project_name || null,
        features: addForm.features
          ? addForm.features.split(",").map((f: string) => f.trim()).filter(Boolean)
          : [],
        amenities: addForm.amenities
          ? addForm.amenities.split(",").map((a: string) => a.trim()).filter(Boolean)
          : [],
        images: addImages,
        currency: "EUR",
        availability_status: "available",
        source: "manual",
      };

      const { data, error } = await supabase.functions.invoke("admin-offers", {
        body: { action: "insert_offer", offer },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Insert failed");

      toast({
        title: "Succes!",
        description: "Proprietatea a fost adăugată",
      });

      queryClient.invalidateQueries({ queryKey: ["catalog_offers"] });
      setShowAddDialog(false);
      resetAddForm();
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu am putut adăuga proprietatea",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
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
      {/* Properties List */}
      <Card className="glass border-gold/20">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-base md:text-lg">
              <Home className="w-4 h-4 md:w-5 md:h-5 text-gold" />
              Proprietăți ({properties?.length || 0})
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setShowAddDialog(true)}
                className="bg-gold hover:bg-gold/90 text-black h-8 text-xs md:text-sm"
              >
                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5" />
                Adaugă Manual
              </Button>
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
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          {/* Bulk Actions Bar */}
          {properties && properties.length > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-muted/30 border border-border/30">
              <Checkbox
                id="select-all"
                checked={properties.length > 0 && selectedProperties.size === properties.length}
                onCheckedChange={toggleSelectAll}
              />
              <Label htmlFor="select-all" className="text-sm cursor-pointer">
                Selectează toate ({selectedProperties.size}/{properties.length})
              </Label>
              {selectedProperties.size > 0 && (
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  {(isBulkSending || isBulkTogglingVisibility) && bulkProgress.total > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {bulkProgress.current}/{bulkProgress.total}
                      </span>
                    </div>
                  )}
                  {/* Visibility bulk actions */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkToggleVisibility(false)}
                    disabled={isBulkTogglingVisibility || isBulkSending}
                    className="border-muted-foreground/30 hover:bg-muted h-8 text-xs"
                  >
                    {isBulkTogglingVisibility ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    <span className="hidden sm:inline">Ascunde {selectedProperties.size}</span>
                    <span className="sm:hidden">Ascunde</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkToggleVisibility(true)}
                    disabled={isBulkTogglingVisibility || isBulkSending}
                    className="border-green-500/30 hover:bg-green-500/10 text-green-600 h-8 text-xs"
                  >
                    {isBulkTogglingVisibility ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    <span className="hidden sm:inline">Afișează {selectedProperties.size}</span>
                    <span className="sm:hidden">Afișează</span>
                  </Button>
                  {/* Zapier bulk action */}
                  <Button
                    size="sm"
                    onClick={sendSelectedToZapier}
                    disabled={isBulkSending || isBulkTogglingVisibility}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs"
                  >
                    {isBulkSending ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    <span className="hidden sm:inline">{isBulkSending ? `Trimit...` : `Trimite ${selectedProperties.size} către Zapier`}</span>
                    <span className="sm:hidden">Zapier</span>
                  </Button>
                </div>
              )}
            </div>
          )}
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
                  className={`border-border/30 hover:border-gold/30 transition-colors ${selectedProperties.has(property.id) ? 'border-blue-500/50 bg-blue-500/5' : ''}`}
                >
                  <CardContent className="p-3 md:p-4">
                    {/* Mobile Layout - Card Style */}
                    <div className="md:hidden">
                      {/* Full-width image with checkbox overlay */}
                      <div className="relative -mx-3 -mt-3 mb-3">
                        {property.images?.[0] ? (
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-full h-40 object-cover rounded-t-lg"
                          />
                        ) : (
                          <div className="w-full h-40 bg-muted/30 rounded-t-lg flex items-center justify-center">
                            <Home className="w-12 h-12 text-muted-foreground/30" />
                          </div>
                        )}
                        {/* Checkbox overlay */}
                        <div className="absolute top-2 left-2">
                          <div className="bg-background/90 backdrop-blur-sm rounded-md p-1.5 shadow-sm">
                            <Checkbox
                              checked={selectedProperties.has(property.id)}
                              onCheckedChange={() => togglePropertySelection(property.id)}
                            />
                          </div>
                        </div>
                        {/* Price badge overlay */}
                        <div className="absolute bottom-2 right-2">
                          <Badge className="bg-gold text-black font-semibold text-sm px-2.5 py-1 shadow-lg">
                            €{property.price_min?.toLocaleString()}
                          </Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-2.5">
                        <h3 className="font-semibold text-base leading-tight line-clamp-2">
                          {property.title}
                        </h3>
                        
                        {/* Property details */}
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Ruler className="w-3.5 h-3.5" />
                            {property.surface_min} mp
                          </span>
                          <span className="flex items-center gap-1">
                            <Home className="w-3.5 h-3.5" />
                            {property.rooms} camere
                          </span>
                        </div>
                        
                        {property.location && (
                          <p className="text-xs text-muted-foreground truncate">
                            📍 {property.location}
                          </p>
                        )}
                      </div>

                      {/* Visibility Toggle and Actions */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/20">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={property.is_published !== false}
                            onCheckedChange={() => toggleVisibility(property.id, property.is_published !== false)}
                            disabled={togglingVisibility === property.id}
                          />
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            {property.is_published !== false ? (
                              <><Eye className="w-3.5 h-3.5 text-green-500" /> Vizibil</>
                            ) : (
                              <><EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> Ascuns</>
                            )}
                          </span>
                        </div>
                        {/* Action buttons */}
                        <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openShareDialog(property.id, property.title)}
                          disabled={sendingToSocial === property.id}
                          className="border-blue-500/30 hover:bg-blue-500/10 h-10 w-full"
                          title="Publică pe social media"
                        >
                          {sendingToSocial === property.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          ) : (
                            <Share2 className="w-4 h-4 text-blue-500" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(property)}
                          className="border-gold/30 hover:bg-gold/10 h-10 w-full"
                        >
                          <Edit className="w-4 h-4 text-gold" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive/30 hover:bg-destructive/10 h-10 w-full"
                            >
                              {deletingId === property.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-destructive" />
                              ) : (
                                <Trash2 className="w-4 h-4 text-destructive" />
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
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:flex gap-4">
                      <div className="flex items-center shrink-0">
                        <Checkbox
                          checked={selectedProperties.has(property.id)}
                          onCheckedChange={() => togglePropertySelection(property.id)}
                        />
                      </div>
                      {property.images?.[0] && (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-24 h-24 object-cover rounded-lg shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                          {property.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary" className="bg-gold/10 text-xs px-1.5 py-0.5">
                            <Euro className="w-3 h-3 mr-0.5" />
                            €{property.price_min?.toLocaleString()}
                          </Badge>
                          <Badge variant="secondary" className="bg-gold/10 text-xs px-1.5 py-0.5">
                            <Ruler className="w-3 h-3 mr-0.5" />
                            {property.surface_min}mp
                          </Badge>
                          <Badge variant="secondary" className="bg-gold/10 text-xs px-1.5 py-0.5">
                            <Home className="w-3 h-3 mr-0.5" />
                            {property.rooms}cam
                          </Badge>
                        </div>
                      </div>
                      {/* Visibility Toggle */}
                      <div className="flex items-center gap-2 mr-4 shrink-0">
                        <Switch
                          checked={property.is_published !== false}
                          onCheckedChange={() => toggleVisibility(property.id, property.is_published !== false)}
                          disabled={togglingVisibility === property.id}
                        />
                        <span className="text-xs text-muted-foreground flex items-center gap-1 min-w-[70px]">
                          {property.is_published !== false ? (
                            <><Eye className="w-3.5 h-3.5 text-green-500" /> Vizibil</>
                          ) : (
                            <><EyeOff className="w-3.5 h-3.5" /> Ascuns</>
                          )}
                        </span>
                      </div>
                      <div className="flex flex-row gap-2 items-start shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openShareDialog(property.id, property.title)}
                          disabled={sendingToSocial === property.id}
                          className="border-blue-500/30 hover:bg-blue-500/10 h-8 w-8 p-0"
                          title="Publică pe social media"
                        >
                          {sendingToSocial === property.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          ) : (
                            <Share2 className="w-4 h-4 text-blue-500" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(property)}
                          className="border-gold/30 h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive/30 hover:bg-destructive/10 h-8 w-8 p-0"
                            >
                              {deletingId === property.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
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

      {/* IMMOFLUX Properties Section */}
      <Card className="glass border-purple-500/20">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-base md:text-lg">
              <Building2 className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
              Proprietăți IMMOFLUX ({immofluxData?.total || 0})
            </div>
            <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs w-fit">
              Sincronizate din CRM
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          {immofluxLoading ? (
            <div className="text-center py-6 md:py-8">
              <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin mx-auto text-purple-400" />
              <p className="text-muted-foreground mt-2 text-sm">Se încarcă proprietățile IMMOFLUX...</p>
            </div>
          ) : immofluxData && immofluxData.data.length > 0 ? (
            <>
              <div className="grid gap-3 md:gap-4">
                {immofluxData.data.map((property: ImmofluxProperty) => {
                  const isSale = property.devanzare === 1;
                  const surface = getSurface(property);
                  return (
                    <Card
                      key={`immoflux-${property.idnum}`}
                      className="border-border/30 hover:border-purple-500/30 transition-colors"
                    >
                      <CardContent className="p-3 md:p-4">
                        {/* Mobile Layout */}
                        <div className="md:hidden">
                          <div className="relative -mx-3 -mt-3 mb-3">
                            <img
                              src={getMainImage(property)}
                              alt={getTitle(property)}
                              className="w-full h-40 object-cover rounded-t-lg"
                              loading="lazy"
                            />
                            <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
                              <Badge className="bg-purple-600 text-white text-[10px]">IMMOFLUX</Badge>
                              <Badge className={isSale ? "bg-emerald-600 text-white text-[10px]" : "bg-blue-600 text-white text-[10px]"}>
                                {isSale ? "Vânzare" : "Închiriere"}
                              </Badge>
                              {property.top === 1 && (
                                <Badge className="bg-gold text-black font-bold text-[10px]">TOP</Badge>
                              )}
                              {isPoleProperty(property) && (
                                <Badge className="bg-purple-700 text-white font-bold text-[10px]">POLE</Badge>
                              )}
                            </div>
                            <div className="absolute bottom-2 right-2">
                              <Badge className="bg-gold text-black font-semibold text-sm px-2.5 py-1 shadow-lg">
                                {formatPrice(property)}
                              </Badge>
                            </div>
                          </div>
                          <div className="space-y-2.5">
                            <h3 className="font-semibold text-base leading-tight line-clamp-2">
                              {getTitle(property)}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              {property.nrcamere > 0 && (
                                <span className="flex items-center gap-1">
                                  <BedDouble className="w-3.5 h-3.5" />
                                  {property.nrcamere} cam.
                                </span>
                              )}
                              {surface > 0 && (
                                <span className="flex items-center gap-1">
                                  <Maximize className="w-3.5 h-3.5" />
                                  {surface} mp
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3 shrink-0" />
                              {[property.zona, property.localitate].filter(Boolean).join(', ')}
                            </p>
                          </div>
                          <div className="flex items-center justify-end mt-4 pt-3 border-t border-border/20">
                            <Link to={getImmofluxPropertyUrl(property)} target="_blank">
                              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-gold">
                                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                Vezi pe site
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden md:flex gap-4">
                          <img
                            src={getMainImage(property)}
                            alt={getTitle(property)}
                            className="w-24 h-24 object-cover rounded-lg shrink-0"
                            loading="lazy"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-purple-600 text-white text-[10px]">IMMOFLUX</Badge>
                              <Badge className={isSale ? "bg-emerald-600 text-white text-[10px]" : "bg-blue-600 text-white text-[10px]"}>
                                {isSale ? "Vânzare" : "Închiriere"}
                              </Badge>
                              {property.top === 1 && (
                                <Badge className="bg-gold text-black font-bold text-[10px]">TOP</Badge>
                              )}
                              {isPoleProperty(property) && (
                                <Badge className="bg-purple-700 text-white font-bold text-[10px]">POLE</Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                              {getTitle(property)}
                            </h3>
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                              <Badge variant="secondary" className="bg-purple-500/10 text-xs px-1.5 py-0.5">
                                <Euro className="w-3 h-3 mr-0.5" />
                                {formatPrice(property)}
                              </Badge>
                              {surface > 0 && (
                                <Badge variant="secondary" className="bg-purple-500/10 text-xs px-1.5 py-0.5">
                                  <Ruler className="w-3 h-3 mr-0.5" />
                                  {surface}mp
                                </Badge>
                              )}
                              {property.nrcamere > 0 && (
                                <Badge variant="secondary" className="bg-purple-500/10 text-xs px-1.5 py-0.5">
                                  <Home className="w-3 h-3 mr-0.5" />
                                  {property.nrcamere}cam
                                </Badge>
                              )}
                              <span className="flex items-center gap-1 text-xs">
                                <MapPin className="w-3 h-3" />
                                {[property.zona, property.localitate].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center shrink-0">
                            <Link to={getImmofluxPropertyUrl(property)} target="_blank">
                              <Button variant="outline" size="sm" className="border-purple-500/30 hover:bg-purple-500/10 h-8 text-xs">
                                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                                Vezi
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              {immofluxData.last_page > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={immofluxPage <= 1}
                    onClick={() => setImmofluxPage((p) => p - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Pagina {immofluxData.current_page} din {immofluxData.last_page}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={immofluxPage >= immofluxData.last_page}
                    onClick={() => setImmofluxPage((p) => p + 1)}
                  >
                    Următor
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 md:py-8">
              <Building2 className="w-10 h-10 md:w-12 md:h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">Nu sunt proprietăți IMMOFLUX disponibile</p>
            </div>
          )}
        </CardContent>
      </Card>

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
                <Label>Preț (€)</Label>
                <Input
                  type="number"
                  value={editForm.price_min || ""}
                  onChange={(e) => setEditForm({ ...editForm, price_min: e.target.value })}
                />
              </div>
              <div>
                <Label>Suprafață (mp)</Label>
                <Input
                  type="number"
                  value={editForm.surface_min || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, surface_min: e.target.value })
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
                <PropertyImageEditor
                  images={editImages}
                  onChange={setEditImages}
                  label="Imagini Proprietate"
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
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="outline"
                disabled={sendingToGBP}
                onClick={async () => {
                  if (!editingProperty) return;
                  setSendingToGBP(true);
                  try {
                    // Read Google webhook URL from settings
                    const { data: settingsData } = await supabase
                      .from('site_settings')
                      .select('value')
                      .eq('key', 'social_webhooks')
                      .single();
                    const webhookSettings = settingsData?.value ? JSON.parse(settingsData.value) : {};
                    const googleWebhookUrl = webhookSettings.google;
                    if (!googleWebhookUrl) {
                      toast({ title: "Eroare", description: "Configurează webhook-ul Google Business Profile din Marketing AI.", variant: "destructive" });
                      setSendingToGBP(false);
                      return;
                    }
                    const slug = generatePropertySlug({
                      id: editingProperty.id,
                      rooms: editingProperty.rooms,
                      project_name: editingProperty.project_name,
                      zone: editingProperty.zone,
                      location: editingProperty.location,
                    });
                    const images = Array.isArray(editingProperty.images) ? editingProperty.images : [];
                    const res = await fetch(googleWebhookUrl, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: editingProperty.title || "",
                        price: editingProperty.price_min || 0,
                        rooms: editingProperty.rooms || 0,
                        surface: editingProperty.surface_min || 0,
                        slug,
                        url: `https://mvaimobiliare.ro/proprietati/${slug}`,
                        image: images[0] || "",
                        description: editingProperty.description || "",
                      }),
                    });
                    if (!res.ok) throw new Error("Request failed");
                    toast({ title: "Succes!", description: "Proprietatea a fost trimisă pe Google Business Profile!" });
                  } catch {
                    toast({ title: "Eroare", description: "Eroare la trimitere. Încearcă din nou.", variant: "destructive" });
                  } finally {
                    setSendingToGBP(false);
                  }
                }}
                className="border-gold text-gold hover:bg-gold hover:text-black transition-all"
              >
                {sendingToGBP ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Postează pe Google Business Profile
              </Button>
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

      {/* Add Property Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adaugă Proprietate Manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Titlu *</Label>
                <Input
                  value={addForm.title}
                  onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                  placeholder="Ex: Apartament 2 camere central"
                />
              </div>
              <div className="col-span-2">
                <Label>Descriere</Label>
                <Textarea
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  rows={3}
                  placeholder="Descriere detaliată a proprietății..."
                />
              </div>
              <div>
                <Label>Locație *</Label>
                <Input
                  value={addForm.location}
                  onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
                  placeholder="Ex: București, Sector 1"
                />
              </div>
              <div>
                <Label>Nume Proiect</Label>
                <Input
                  value={addForm.project_name}
                  onChange={(e) => setAddForm({ ...addForm, project_name: e.target.value })}
                  placeholder="Ex: Residence Park"
                />
              </div>
              <div>
                <Label>Preț (€) *</Label>
                <Input
                  type="number"
                  value={addForm.price_min}
                  onChange={(e) => setAddForm({ ...addForm, price_min: e.target.value })}
                  placeholder="85000"
                />
              </div>
              <div>
                <Label>Suprafață (mp)</Label>
                <Input
                  type="number"
                  value={addForm.surface_min}
                  onChange={(e) => setAddForm({ ...addForm, surface_min: e.target.value })}
                  placeholder="55"
                />
              </div>
              <div>
                <Label>Camere *</Label>
                <Input
                  type="number"
                  value={addForm.rooms}
                  onChange={(e) => setAddForm({ ...addForm, rooms: e.target.value })}
                  placeholder="2"
                />
              </div>
              <div className="col-span-2">
                <PropertyImageEditor
                  images={addImages}
                  onChange={setAddImages}
                  label="Imagini Proprietate"
                />
              </div>
              <div className="col-span-2">
                <Label>Facilități (separate prin virgulă)</Label>
                <Input
                  value={addForm.features}
                  onChange={(e) => setAddForm({ ...addForm, features: e.target.value })}
                  placeholder="Balcon, Parcare, Centrală proprie"
                />
              </div>
              <div className="col-span-2">
                <Label>Amenajări (separate prin virgulă)</Label>
                <Input
                  value={addForm.amenities}
                  onChange={(e) => setAddForm({ ...addForm, amenities: e.target.value })}
                  placeholder="Lift, Pază, Interfon"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Anulează
              </Button>
              <Button
                onClick={addProperty}
                disabled={isAdding}
                className="bg-gold hover:bg-gold/90 text-black"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Se adaugă...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Adaugă Proprietate
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Platform Selection Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Selectează platforma</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <p className="text-sm text-muted-foreground line-clamp-2">
              Trimite "{propertyToShare?.title}" către:
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
      </div>
    </div>
  );
};

export default PropertiesAdmin;
