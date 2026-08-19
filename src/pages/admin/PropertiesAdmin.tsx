import { invokeAdminFn } from "@/lib/adminInvoke";
import { useAllPropertyViews } from "@/hooks/usePropertyViews";
import { useState, useCallback, useMemo, useEffect } from "react";
import { toast as sonnerToast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import YouTubeVideoField, { videoColumnsFrom } from "@/components/admin/YouTubeVideoField";
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
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List as ListIcon,
  MoreVertical,
  Copy,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link } from "@/lib/router-compat";
import { useProperties, formatPrice, getTitle, getMainImage, getSurface, isPoleProperty, type ImmofluxProperty } from "@/hooks/useImmoflux";
import { getImmofluxPropertyUrl, generatePropertySlug } from "@/lib/propertySlug";
import { useImmofluxSlugMap, resolveImmofluxUrl } from "@/hooks/useImmofluxSlugMap";
import { Switch } from "@/components/ui/switch";
import { triggerSocialAutoPost } from "@/lib/socialAutoPost";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/admin/PullToRefreshIndicator";
import PropertyImageEditor from "@/components/admin/PropertyImageEditor";
import { Checkbox } from "@/components/ui/checkbox";
import { enqueueOfferToFacebook } from "@/lib/facebookQueue";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PAGE_SIZE = 24;

type PropStatus = "active" | "hidden" | "sold" | "rented";

const statusOf = (p: any): PropStatus => {
  if (p?.is_published === false) return "hidden";
  if (p?.availability_status === "sold" || p?.availability_status === "rezervat")
    return p?.transaction_type === "rent" ? "rented" : "sold";
  return "active";
};

const STATUS_META: Record<PropStatus, { label: string; className: string }> = {
  active: { label: "Activă", className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  hidden: { label: "Ascunsă", className: "bg-muted text-muted-foreground border-border" },
  sold: { label: "Vândută", className: "bg-rose-500/15 text-rose-700 border-rose-500/30" },
  rented: { label: "Închiriată", className: "bg-blue-500/15 text-blue-700 border-blue-500/30" },
};

const StatusPill = ({ status }: { status: PropStatus }) => (
  <Badge variant="outline" className={`text-[10px] font-medium px-2 py-0.5 ${STATUS_META[status].className}`}>
    {STATUS_META[status].label}
  </Badge>
);

const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-xl border border-border/60 bg-card/50 p-4">
    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
  </section>
);

const StatCard = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
  <div className="rounded-xl border border-border/60 bg-card px-3 py-2.5 sm:px-4 sm:py-3">
    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className={`mt-0.5 text-xl font-bold sm:text-2xl ${tone}`}>{value}</p>
  </div>
);

const PropertiesAdmin = () => {
  const { data: immofluxSlugMap } = useImmofluxSlugMap();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<
    "recent" | "oldest" | "price_asc" | "price_desc" | "surface_desc" | "views_total" | "views_7d"
  >("recent");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PropStatus>("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [txFilter, setTxFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [roomsFilter, setRoomsFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
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
    video_manual: "",
  });
  const [addImages, setAddImages] = useState<string[]>([]);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [sendingToSocial, setSendingToSocial] = useState<string | null>(null);
  const [sendingToGBP, setSendingToGBP] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [propertyToShare, setPropertyToShare] = useState<{ id: string; title: string } | null>(null);
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [isBulkQueuingFb, setIsBulkQueuingFb] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [togglingVisibility, setTogglingVisibility] = useState<string | null>(null);
  const [isBulkTogglingVisibility, setIsBulkTogglingVisibility] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleVisibility = async (propertyId: string, currentValue: boolean) => {
    setTogglingVisibility(propertyId);
    try {
      const { data, error } = await invokeAdminFn("admin-offers", {
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

  const { data: viewCounts } = useAllPropertyViews();

  const { data: rawProperties, isLoading: propertiesLoading } = useQuery({
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

  // Quick stats over the full (unfiltered) list.
  const stats = useMemo(() => {
    const base = { active: 0, hidden: 0, sold: 0, rented: 0 };
    (rawProperties ?? []).forEach((p: any) => { base[statusOf(p)] += 1; });
    return base;
  }, [rawProperties]);

  const typeOptions = useMemo(
    () => [...new Set((rawProperties ?? []).map((p: any) => p.property_type).filter(Boolean))].sort(),
    [rawProperties]
  );
  const zoneOptions = useMemo(
    () => [...new Set((rawProperties ?? []).map((p: any) => p.zone || p.city).filter(Boolean))].sort(),
    [rawProperties]
  );
  const roomOptions = useMemo(
    () => [...new Set((rawProperties ?? []).map((p: any) => p.rooms).filter(Boolean))].sort((a: any, b: any) => a - b),
    [rawProperties]
  );

  // Filtering + sorting, including by view counts from `property_views`.
  const properties = useMemo(() => {
    if (!rawProperties) return rawProperties;
    const q = search.trim().toLowerCase();
    let list = rawProperties.filter((p: any) => {
      if (statusFilter !== "all" && statusOf(p) !== statusFilter) return false;
      if (typeFilter !== "all" && p.property_type !== typeFilter) return false;
      if (txFilter !== "all" && (p.transaction_type || "sale") !== txFilter) return false;
      if (zoneFilter !== "all" && (p.zone || p.city) !== zoneFilter) return false;
      if (roomsFilter !== "all" && String(p.rooms) !== roomsFilter) return false;
      if (q) {
        const hay = [p.title, p.location, p.zone, p.city, p.project_name, p.external_id, p.id]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list = [...list];
    const v = (id: string) => viewCounts?.[id] ?? { total: 0, last7: 0 };
    if (sortBy === "views_total") list.sort((a, b) => v(b.id).total - v(a.id).total);
    else if (sortBy === "views_7d") list.sort((a, b) => v(b.id).last7 - v(a.id).last7);
    else if (sortBy === "price_asc") list.sort((a: any, b: any) => (a.price_min ?? 0) - (b.price_min ?? 0));
    else if (sortBy === "price_desc") list.sort((a: any, b: any) => (b.price_min ?? 0) - (a.price_min ?? 0));
    else if (sortBy === "surface_desc") list.sort((a: any, b: any) => (b.surface_min ?? 0) - (a.surface_min ?? 0));
    else if (sortBy === "oldest")
      list.sort((a: any, b: any) => Date.parse(a.created_at) - Date.parse(b.created_at));
    return list;
  }, [rawProperties, viewCounts, sortBy, search, statusFilter, typeFilter, txFilter, zoneFilter, roomsFilter]);

  const activeFilters =
    (statusFilter !== "all" ? 1 : 0) +
    (typeFilter !== "all" ? 1 : 0) +
    (txFilter !== "all" ? 1 : 0) +
    (zoneFilter !== "all" ? 1 : 0) +
    (roomsFilter !== "all" ? 1 : 0);

  const resetFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setTxFilter("all");
    setZoneFilter("all");
    setRoomsFilter("all");
    setSearch("");
  };

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter, txFilter, zoneFilter, roomsFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil((properties?.length ?? 0) / PAGE_SIZE));
  const pageItems = useMemo(
    () => (properties ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [properties, page]
  );

  const duplicateProperty = async (property: any) => {
    setDuplicatingId(property.id);
    try {
      const {
        id, created_at, updated_at, slug, legacy_slug, immoflux_slug, homedirect_id,
        homedirect_short_id, homedirect_status, homedirect_synced_at, external_id,
        date_added, ...rest
      } = property;
      const { data, error } = await invokeAdminFn("admin-offers", {
        body: {
          action: "insert_offer",
          offer: { ...rest, title: `${property.title} (copie)`, is_published: false },
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Insert failed");
      toast({ title: "Duplicat creat", description: "Copia a fost salvată ca ascunsă." });
      queryClient.invalidateQueries({ queryKey: ["catalog_offers"] });
    } catch (e: any) {
      toast({ title: "Eroare", description: e?.message || "Nu am putut duplica proprietatea", variant: "destructive" });
    } finally {
      setDuplicatingId(null);
    }
  };


  const deleteProperty = async (id: string) => {
    setDeletingId(id);
    try {
      const { data, error } = await invokeAdminFn("admin-offers", {
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
        invokeAdminFn("admin-offers", {
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
      video_manual: property.video_manual || property.video_id || "",
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

    const videoColumns = videoColumnsFrom(editForm.video_manual || "");
    if (!videoColumns) {
      toast({
        title: "Link video invalid",
        description: "Corectează câmpul „Video YouTube” înainte de a salva.",
        variant: "destructive",
      });
      return;
    }

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
        ...videoColumns,
        updated_at: new Date().toISOString(),
      };


      const { data, error } = await invokeAdminFn("admin-offers", {
        body: { action: "update_offer", id: editingProperty.id, data: updateData },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Update failed");
      if (
        data.data?.video_manual !== videoColumns.video_manual ||
        data.data?.video_id !== videoColumns.video_id
      ) {
        throw new Error("Serverul nu a confirmat salvarea linkului video");
      }

      setEditForm((current: any) => ({
        ...current,
        video_manual: (data.data?.video_manual as string | null) ?? "",
      }));

      toast({
        title: "Succes!",
        description: videoColumns.video_id
          ? "Proprietatea a fost actualizată. Videoclip salvat."
          : "Proprietatea a fost actualizată. Fără videoclip.",
      });

      queryClient.invalidateQueries({ queryKey: ["catalog_offers"] });
      closeEditModal();
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: `Salvarea a eșuat: ${error.message || "Nu am putut actualiza proprietatea"}`,
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
      video_manual: "",
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

  const sendSelectedToFacebookGroups = async () => {
    if (!properties || selectedProperties.size === 0) return;
    const targets = properties.filter((p) => selectedProperties.has(p.id));
    setIsBulkQueuingFb(true);
    setBulkProgress({ current: 0, total: targets.length });
    let queued = 0;
    let duplicates = 0;
    let errors = 0;
    let i = 0;
    for (const p of targets) {
      const res = await enqueueOfferToFacebook(p as any);
      if (res.status === "queued") queued++;
      else if (res.status === "duplicate") {
        duplicates++;
        sonnerToast(`«${res.offerTitle}» este deja în coadă`);
      } else {
        errors++;
        sonnerToast.error(`Eroare «${res.offerTitle}»`, { description: res.error });
      }
      i++;
      setBulkProgress({ current: i, total: targets.length });
    }
    setIsBulkQueuingFb(false);
    setBulkProgress({ current: 0, total: 0 });
    setSelectedProperties(new Set());
    if (queued > 0) {
      sonnerToast.success(`${queued} anunțuri adăugate în coada Facebook`);
    } else if (duplicates === targets.length) {
      sonnerToast("Toate anunțurile selectate erau deja în coadă");
    } else if (errors === targets.length) {
      sonnerToast.error("Nu s-a putut adăuga niciun anunț în coadă");
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
        const { data, error } = await invokeAdminFn("admin-offers", {
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

    const videoColumns = videoColumnsFrom(addForm.video_manual);
    if (!videoColumns) {
      toast({
        title: "Eroare",
        description: "Link YouTube invalid — corectează câmpul Video YouTube",
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
        ...videoColumns,
      };

      const { data, error } = await invokeAdminFn("admin-offers", {
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
      {/* Header */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-foreground sm:text-2xl">Proprietăți</h2>
          <p className="truncate text-xs text-muted-foreground sm:text-sm">
            {properties?.length ?? 0} din {rawProperties?.length ?? 0} proprietăți
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="h-11 shrink-0 bg-brass text-black hover:bg-brass/90"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">Adaugă proprietate</span>
          <span className="sm:hidden">Adaugă</span>
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <StatCard label="Active" value={stats.active} tone="text-emerald-600" />
        <StatCard label="Ascunse" value={stats.hidden} tone="text-muted-foreground" />
        <StatCard label="Vândute" value={stats.sold} tone="text-rose-600" />
        <StatCard label="Închiriate" value={stats.rented} tone="text-blue-600" />
      </div>

      {/* Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută după titlu, zonă, proiect sau ID..."
              className="h-11 pl-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Șterge căutarea"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="h-11 w-[170px]" aria-label="Sortare">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Cele mai recente</SelectItem>
              <SelectItem value="oldest">Cele mai vechi</SelectItem>
              <SelectItem value="price_asc">Preț crescător</SelectItem>
              <SelectItem value="price_desc">Preț descrescător</SelectItem>
              <SelectItem value="surface_desc">Suprafață mare</SelectItem>
              <SelectItem value="views_total">Vizualizări (total)</SelectItem>
              <SelectItem value="views_7d">Vizualizări (7 zile)</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile filters sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-11 lg:hidden">
                <SlidersHorizontal className="mr-1.5 h-4 w-4" />
                Filtre
                {activeFilters > 0 && (
                  <Badge className="ml-1.5 bg-brass px-1.5 text-[10px] text-black">{activeFilters}</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl">
              <SheetHeader className="text-left">
                <SheetTitle>Filtre</SheetTitle>
              </SheetHeader>
              <div className="mt-4 grid gap-3">
                <FilterSelects
                  statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                  typeFilter={typeFilter} setTypeFilter={setTypeFilter}
                  txFilter={txFilter} setTxFilter={setTxFilter}
                  zoneFilter={zoneFilter} setZoneFilter={setZoneFilter}
                  roomsFilter={roomsFilter} setRoomsFilter={setRoomsFilter}
                  typeOptions={typeOptions as string[]}
                  zoneOptions={zoneOptions as string[]}
                  roomOptions={roomOptions as number[]}
                  full
                />
                <Button variant="outline" className="h-11" onClick={resetFilters}>
                  Resetează filtrele
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <div className="ml-auto hidden items-center rounded-lg border border-border/60 p-0.5 sm:flex">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-9 px-2.5"
              onClick={() => setViewMode("list")}
              aria-label="Vizualizare listă"
            >
              <ListIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-9 px-2.5"
              onClick={() => setViewMode("grid")}
              aria-label="Vizualizare grilă"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Desktop filters */}
        <div className="hidden flex-wrap items-center gap-2 lg:flex">
          <FilterSelects
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            typeFilter={typeFilter} setTypeFilter={setTypeFilter}
            txFilter={txFilter} setTxFilter={setTxFilter}
            zoneFilter={zoneFilter} setZoneFilter={setZoneFilter}
            roomsFilter={roomsFilter} setRoomsFilter={setRoomsFilter}
            typeOptions={typeOptions as string[]}
            zoneOptions={zoneOptions as string[]}
            roomOptions={roomOptions as number[]}
          />
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-destructive">
              <X className="h-4 w-4" /> Resetează ({activeFilters})
            </Button>
          )}
        </div>
      </div>

      {/* Bulk actions */}
      {properties && properties.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
          <Checkbox
            id="select-all"
            checked={properties.length > 0 && selectedProperties.size === properties.length}
            onCheckedChange={toggleSelectAll}
          />
          <Label htmlFor="select-all" className="cursor-pointer text-sm">
            Selectează toate ({selectedProperties.size}/{properties.length})
          </Label>
          {selectedProperties.size > 0 && (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {(isBulkSending || isBulkTogglingVisibility) && bulkProgress.total > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {bulkProgress.current}/{bulkProgress.total}
                  </span>
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => bulkToggleVisibility(false)}
                disabled={isBulkTogglingVisibility || isBulkSending}
                className="h-10 text-xs"
              >
                {isBulkTogglingVisibility ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                )}
                Ascunde
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => bulkToggleVisibility(true)}
                disabled={isBulkTogglingVisibility || isBulkSending}
                className="h-10 border-green-500/30 text-xs text-green-600 hover:bg-green-500/10"
              >
                {isBulkTogglingVisibility ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                )}
                Afișează
              </Button>
              <Button
                size="sm"
                onClick={sendSelectedToZapier}
                disabled={isBulkSending || isBulkTogglingVisibility || isBulkQueuingFb}
                className="h-10 bg-primary text-xs text-primary-foreground hover:bg-primary/90"
              >
                {isBulkSending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                )}
                Zapier
              </Button>
              <Button
                size="sm"
                onClick={sendSelectedToFacebookGroups}
                disabled={isBulkQueuingFb || isBulkSending || isBulkTogglingVisibility}
                className="h-10 bg-blue-600 text-xs text-white hover:bg-blue-700"
              >
                {isBulkQueuingFb ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Facebook className="mr-1.5 h-3.5 w-3.5" />
                )}
                Grupuri FB
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Property list */}
      {propertiesLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brass" />
          <p className="mt-2 text-sm text-muted-foreground">Se încarcă...</p>
        </div>
      ) : pageItems.length > 0 ? (
        <>
          <div className={viewMode === "grid" ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3" : "grid gap-3"}>
            {pageItems.map((property: any) => {
              const status = statusOf(property);
              const slug = property.slug || generatePropertySlug(property);
              const selected = selectedProperties.has(property.id);
              const views = viewCounts?.[property.id];
              const actions = (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0" aria-label="Acțiuni">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem asChild>
                      <a href={`/proprietati/${slug}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" /> Vezi pe site
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditModal(property)}>
                      <Edit className="mr-2 h-4 w-4" /> Editează
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => duplicateProperty(property)}
                      disabled={duplicatingId === property.id}
                    >
                      <Copy className="mr-2 h-4 w-4" /> Duplică
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openShareDialog(property.id, property.title)}>
                      <Share2 className="mr-2 h-4 w-4" /> Publică pe social
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => toggleVisibility(property.id, property.is_published !== false)}
                    >
                      {property.is_published !== false ? (
                        <><EyeOff className="mr-2 h-4 w-4" /> Ascunde</>
                      ) : (
                        <><Eye className="mr-2 h-4 w-4" /> Afișează</>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setConfirmDelete(property)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Șterge
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );

              const meta = (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Home className="h-3.5 w-3.5" />{property.rooms} cam</span>
                  <span className="flex items-center gap-1"><Ruler className="h-3.5 w-3.5" />{property.surface_min ?? "—"} mp</span>
                  <span className="flex items-center gap-1" title="Vizualizări total / 7 zile">
                    <Eye className="h-3.5 w-3.5" />{views?.total ?? 0} · 7z: {views?.last7 ?? 0}
                  </span>
                </div>
              );

              if (viewMode === "grid") {
                return (
                  <Card
                    key={property.id}
                    className={`overflow-hidden border-border/60 transition-colors hover:border-brass/40 ${selected ? "border-brass/60 ring-1 ring-brass/30" : ""}`}
                  >
                    <div className="relative h-40">
                      {property.images?.[0] ? (
                        <img src={property.images[0]} alt={property.title} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted/40">
                          <Home className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute left-2 top-2 rounded-md bg-background/90 p-1.5 shadow-sm">
                        <Checkbox checked={selected} onCheckedChange={() => togglePropertySelection(property.id)} />
                      </div>
                      <div className="absolute right-2 top-2"><StatusPill status={status} /></div>
                      <Badge className="absolute bottom-2 right-2 bg-brass px-2.5 py-1 text-sm font-semibold text-black shadow-lg">
                        €{property.price_min?.toLocaleString()}
                      </Badge>
                    </div>
                    <CardContent className="space-y-2 p-3">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-tight">{property.title}</h3>
                      <p className="truncate text-xs text-muted-foreground">
                        <MapPin className="mr-1 inline h-3 w-3" />{property.location}
                      </p>
                      {meta}
                      <div className="flex items-center justify-between border-t border-border/40 pt-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={property.is_published !== false}
                            onCheckedChange={() => toggleVisibility(property.id, property.is_published !== false)}
                            disabled={togglingVisibility === property.id}
                          />
                          <span className="text-xs text-muted-foreground">
                            {property.is_published !== false ? "Vizibil" : "Ascuns"}
                          </span>
                        </div>
                        {actions}
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <Card
                  key={property.id}
                  className={`border-border/60 transition-colors hover:border-brass/40 ${selected ? "border-brass/60 ring-1 ring-brass/30" : ""}`}
                >
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <div className="flex items-start pt-1">
                        <Checkbox checked={selected} onCheckedChange={() => togglePropertySelection(property.id)} />
                      </div>
                      {property.images?.[0] ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          loading="lazy"
                          className="h-20 w-20 shrink-0 rounded-lg object-cover sm:h-24 sm:w-32"
                        />
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted/40 sm:h-24 sm:w-32">
                          <Home className="h-7 w-7 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-start gap-2">
                          <h3 className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-tight sm:text-base">
                            {property.title}
                          </h3>
                          <StatusPill status={status} />
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          <MapPin className="mr-1 inline h-3 w-3" />{property.location}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-sm font-bold text-brass">
                            <Euro className="mr-0.5 inline h-3.5 w-3.5" />
                            {property.price_min?.toLocaleString()}
                          </span>
                          {meta}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
                        {actions}
                        <div className="hidden items-center gap-2 sm:flex">
                          <Switch
                            checked={property.is_published !== false}
                            onCheckedChange={() => toggleVisibility(property.id, property.is_published !== false)}
                            disabled={togglingVisibility === property.id}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" className="h-10" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
              </Button>
              <span className="text-sm text-muted-foreground">Pagina {page} din {totalPages}</span>
              <Button variant="outline" size="sm" className="h-10" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Următor <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border/60 py-14 text-center">
          <Home className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
          {rawProperties && rawProperties.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">Nicio proprietate nu corespunde filtrelor.</p>
              <Button variant="outline" className="mt-4 h-11" onClick={resetFilters}>
                Resetează filtrele
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Nu ai încă nicio proprietate.</p>
              <Button className="mt-4 h-11 bg-brass text-black hover:bg-brass/90" onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Adaugă prima proprietate
              </Button>
            </>
          )}
        </div>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmare ștergere</AlertDialogTitle>
            <AlertDialogDescription>
              Ștergi definitiv „{confirmDelete?.title}”? Acțiunea nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="mt-0 h-11">Anulează</AlertDialogCancel>
            <AlertDialogAction
              className="h-11 bg-destructive hover:bg-destructive/90"
              onClick={() => {
                const target = confirmDelete;
                setConfirmDelete(null);
                if (target) deleteProperty(target.id);
              }}
            >
              {deletingId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {/* IMMOFLUX Properties Section */}
      <Card className="glass border-brass/20">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-base md:text-lg">
              <Building2 className="w-4 h-4 md:w-5 md:h-5 text-brass" />
              Proprietăți IMMOFLUX ({immofluxData?.total || 0})
            </div>
            <Badge variant="outline" className="border-brass/30 text-brass text-xs w-fit">
              Sincronizate din CRM
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          {immofluxLoading ? (
            <div className="text-center py-6 md:py-8">
              <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin mx-auto text-brass" />
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
                      className="border-border/30 hover:border-brass/30 transition-colors"
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
                              <Badge className="bg-brass text-white text-[10px]">IMMOFLUX</Badge>
                              <Badge className={isSale ? "bg-emerald-600 text-white text-[10px]" : "bg-blue-600 text-white text-[10px]"}>
                                {isSale ? "Vânzare" : "Închiriere"}
                              </Badge>
                              {property.top === 1 && (
                                <Badge className="bg-brass text-black font-bold text-[10px]">TOP</Badge>
                              )}
                              {isPoleProperty(property) && (
                                <Badge className="bg-brass text-white font-bold text-[10px]">POLE</Badge>
                              )}
                            </div>
                            <div className="absolute bottom-2 right-2">
                              <Badge className="bg-brass text-black font-semibold text-sm px-2.5 py-1 shadow-lg">
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
                            <Link to={resolveImmofluxUrl(property, immofluxSlugMap)} target="_blank">
                              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-brass">
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
                              <Badge className="bg-brass text-white text-[10px]">IMMOFLUX</Badge>
                              <Badge className={isSale ? "bg-emerald-600 text-white text-[10px]" : "bg-blue-600 text-white text-[10px]"}>
                                {isSale ? "Vânzare" : "Închiriere"}
                              </Badge>
                              {property.top === 1 && (
                                <Badge className="bg-brass text-black font-bold text-[10px]">TOP</Badge>
                              )}
                              {isPoleProperty(property) && (
                                <Badge className="bg-brass text-white font-bold text-[10px]">POLE</Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                              {getTitle(property)}
                            </h3>
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                              <Badge variant="secondary" className="bg-brass/10 text-xs px-1.5 py-0.5">
                                <Euro className="w-3 h-3 mr-0.5" />
                                {formatPrice(property)}
                              </Badge>
                              {surface > 0 && (
                                <Badge variant="secondary" className="bg-brass/10 text-xs px-1.5 py-0.5">
                                  <Ruler className="w-3 h-3 mr-0.5" />
                                  {surface}mp
                                </Badge>
                              )}
                              {property.nrcamere > 0 && (
                                <Badge variant="secondary" className="bg-brass/10 text-xs px-1.5 py-0.5">
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
                            <Link to={resolveImmofluxUrl(property, immofluxSlugMap)} target="_blank">
                              <Button variant="outline" size="sm" className="border-brass/30 hover:bg-brass/10 h-8 text-xs">
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
        <DialogContent className="max-w-3xl w-[100vw] h-[100dvh] max-h-[100dvh] rounded-none p-0 gap-0 sm:w-auto sm:h-auto sm:max-h-[92vh] sm:rounded-lg">
          <DialogHeader className="border-b border-border/60 px-4 py-3 sm:px-6">
            <DialogTitle className="text-base sm:text-lg">Editează proprietatea</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {editingProperty && (
            <div className="mb-4 flex items-center gap-4 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Eye className="w-4 h-4" /> Vizualizări
              </span>
              <span className="font-semibold">
                {viewCounts?.[editingProperty.id]?.total ?? 0} total
              </span>
              <span className="text-muted-foreground">
                {viewCounts?.[editingProperty.id]?.last7 ?? 0} în ultimele 7 zile
              </span>
            </div>
          )}
          <div className="space-y-6">
            <FormSection title="Informații generale">
              <div className="sm:col-span-2">
                <Label>Titlu</Label>
                <Input
                  value={editForm.title || ""}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
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
                <Label>Nume proiect</Label>
                <Input
                  value={editForm.project_name || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, project_name: e.target.value })
                  }
                />
              </div>
            </FormSection>

            <FormSection title="Detalii">
              <div>
                <Label>Camere</Label>
                <Input
                  type="number"
                  value={editForm.rooms || ""}
                  onChange={(e) => setEditForm({ ...editForm, rooms: e.target.value })}
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
            </FormSection>

            <FormSection title="Locație">
              <div className="sm:col-span-2">
                <Label>Locație</Label>
                <Input
                  value={editForm.location || ""}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                />
              </div>
            </FormSection>

            <FormSection title="Caracteristici">
              <div className="sm:col-span-2">
                <Label>Facilități (separate prin virgulă)</Label>
                <Input
                  value={editForm.features || ""}
                  onChange={(e) => setEditForm({ ...editForm, features: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Amenajări (separate prin virgulă)</Label>
                <Input
                  value={editForm.amenities || ""}
                  onChange={(e) => setEditForm({ ...editForm, amenities: e.target.value })}
                />
              </div>
            </FormSection>

            <FormSection title="Descriere">
              <div className="sm:col-span-2">
                <Textarea
                  value={editForm.description || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  rows={5}
                />
              </div>
            </FormSection>

            <FormSection title="Media">
              <div className="sm:col-span-2">
                <PropertyImageEditor
                  images={editImages}
                  onChange={setEditImages}
                  label="Fotografii"
                />
              </div>
              <div className="sm:col-span-2">
                <YouTubeVideoField
                  value={editForm.video_manual || ""}
                  onChange={(v) => setEditForm({ ...editForm, video_manual: v })}
                  onClear={() => setEditForm({ ...editForm, video_manual: "" })}
                />
              </div>
            </FormSection>

            <FormSection title="Publicare">
              <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
                <Switch
                  checked={editingProperty?.is_published !== false}
                  onCheckedChange={() =>
                    editingProperty &&
                    toggleVisibility(editingProperty.id, editingProperty.is_published !== false)
                  }
                  disabled={togglingVisibility === editingProperty?.id}
                />
                <span className="text-sm text-muted-foreground">
                  {editingProperty?.is_published !== false ? "Vizibilă pe site" : "Ascunsă de pe site"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
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
                          url: `https://www.mvaimobiliare.ro/proprietati/${slug}`,
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
                  className="ml-auto border-brass/40 text-brass hover:bg-brass/10"
                >
                  {sendingToGBP ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Google Business Profile
                </Button>
              </div>
            </FormSection>
          </div>
          </div>
          <div className="sticky bottom-0 flex gap-2 border-t border-border/60 bg-background px-4 py-3 sm:px-6">
            <Button variant="outline" onClick={closeEditModal} className="flex-1 sm:flex-none h-11">
              Anulează
            </Button>
            <Button
              onClick={updateProperty}
              disabled={isUpdating}
              className="flex-1 sm:flex-none sm:ml-auto h-11 bg-brass text-black hover:bg-brass/90"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Se salvează...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvează modificările
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Property Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl w-[100vw] h-[100dvh] max-h-[100dvh] rounded-none p-0 gap-0 sm:w-auto sm:h-auto sm:max-h-[92vh] sm:rounded-lg">
          <DialogHeader className="border-b border-border/60 px-4 py-3 sm:px-6">
            <DialogTitle className="text-base sm:text-lg">Adaugă proprietate</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="space-y-6">
              <FormSection title="Informații generale">
                <div className="sm:col-span-2">
                  <Label>Titlu *</Label>
                  <Input
                    value={addForm.title}
                    onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                    placeholder="Ex: Apartament 2 camere central"
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
                  <Label>Nume proiect</Label>
                  <Input
                    value={addForm.project_name}
                    onChange={(e) => setAddForm({ ...addForm, project_name: e.target.value })}
                    placeholder="Ex: Residence Park"
                  />
                </div>
              </FormSection>

              <FormSection title="Detalii">
                <div>
                  <Label>Camere *</Label>
                  <Input
                    type="number"
                    value={addForm.rooms}
                    onChange={(e) => setAddForm({ ...addForm, rooms: e.target.value })}
                    placeholder="2"
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
              </FormSection>

              <FormSection title="Locație">
                <div className="sm:col-span-2">
                  <Label>Locație *</Label>
                  <Input
                    value={addForm.location}
                    onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
                    placeholder="Ex: București, Sector 1"
                  />
                </div>
              </FormSection>

              <FormSection title="Caracteristici">
                <div className="sm:col-span-2">
                  <Label>Facilități (separate prin virgulă)</Label>
                  <Input
                    value={addForm.features}
                    onChange={(e) => setAddForm({ ...addForm, features: e.target.value })}
                    placeholder="Balcon, Parcare, Centrală proprie"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Amenajări (separate prin virgulă)</Label>
                  <Input
                    value={addForm.amenities}
                    onChange={(e) => setAddForm({ ...addForm, amenities: e.target.value })}
                    placeholder="Lift, Pază, Interfon"
                  />
                </div>
              </FormSection>

              <FormSection title="Descriere">
                <div className="sm:col-span-2">
                  <Textarea
                    value={addForm.description}
                    onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                    rows={5}
                    placeholder="Descriere detaliată a proprietății..."
                  />
                </div>
              </FormSection>

              <FormSection title="Media">
                <div className="sm:col-span-2">
                  <PropertyImageEditor
                    images={addImages}
                    onChange={setAddImages}
                    label="Fotografii"
                  />
                </div>
                <div className="sm:col-span-2">
                  <YouTubeVideoField
                    value={addForm.video_manual}
                    onChange={(v) => setAddForm({ ...addForm, video_manual: v })}
                    onClear={() => setAddForm({ ...addForm, video_manual: "" })}
                  />
                </div>
              </FormSection>
            </div>
          </div>
          <div className="sticky bottom-0 flex gap-2 border-t border-border/60 bg-background px-4 py-3 sm:px-6">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1 sm:flex-none h-11">
              Anulează
            </Button>
            <Button
              onClick={addProperty}
              disabled={isAdding}
              className="flex-1 sm:flex-none sm:ml-auto h-11 bg-brass text-black hover:bg-brass/90"
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Se adaugă...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Salvează proprietatea
                </>
              )}
            </Button>
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
                <Instagram className="h-5 w-5 text-brass" />
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
              <Button
                variant="outline"
                className="justify-start gap-3 h-12 border-brass/30"
                onClick={async () => {
                  if (!propertyToShare) return;
                  setShareDialogOpen(false);
                  setSendingToGBP(true);
                  try {
                    const { data: settingsData } = await supabase
                      .from('site_settings')
                      .select('value')
                      .eq('key', 'social_webhooks')
                      .single();
                    const webhookSettings = settingsData?.value ? JSON.parse(settingsData.value as string) : {};
                    const googleWebhookUrl = webhookSettings.google;
                    if (!googleWebhookUrl) {
                      toast({ title: "Eroare", description: "Configurează webhook-ul Google Business Profile din Marketing AI.", variant: "destructive" });
                      setSendingToGBP(false);
                      return;
                    }
                    const fullProperty = properties?.find(p => p.id === propertyToShare.id);
                    if (!fullProperty) throw new Error("Property not found");
                    const slug = generatePropertySlug(fullProperty);
                    const images = Array.isArray(fullProperty.images) ? fullProperty.images : [];
                    const res = await fetch(googleWebhookUrl, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: fullProperty.title,
                        price: fullProperty.price_min,
                        rooms: fullProperty.rooms,
                        surface: fullProperty.surface_min,
                        slug,
                        url: `https://www.mvaimobiliare.ro/proprietati/${slug}`,
                        image: images[0] || "",
                        description: fullProperty.description,
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
              >
                <MapPin className="h-5 w-5 text-amber-500" />
                <span>Google Business Profile</span>
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
