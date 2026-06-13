import { useState, useCallback } from "react";
import { toast as sonnerToast } from "sonner";
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
  RefreshCw,
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

