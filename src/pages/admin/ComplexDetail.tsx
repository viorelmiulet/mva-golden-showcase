import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, 
  Home, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  MapPin,
  Euro,
  Layers,
  Edit,
  CheckCircle2,
  ChevronDown,
  FileText,
  ImagePlus,
  Clock,
  Trash2,
  Calculator,
  ArrowUpDown
} from "lucide-react";

import ImageUploadDialog from "@/components/ImageUploadDialog";
import FloorPlanUploadDialog from "@/components/FloorPlanUploadDialog";
import BulkFloorPlanUploadDialog from "@/components/BulkFloorPlanUploadDialog";
import { ApartmentEditDialog } from "@/components/ApartmentEditDialog";
import { BulkApartmentEditDialog } from "@/components/BulkApartmentEditDialog";
import { toast } from "sonner";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileFilterSort, type FilterOption, type SortOption } from "@/components/admin/MobileFilterSort";

const ComplexDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [imageUploadOpen, setImageUploadOpen] = useState(false);
  const [uploadPropertyIds, setUploadPropertyIds] = useState<string[]>([]);
  const [floorPlanDialogOpen, setFloorPlanDialogOpen] = useState(false);
  const [bulkFloorPlanDialogOpen, setBulkFloorPlanDialogOpen] = useState(false);
  const [selectedPropertyForFloorPlan, setSelectedPropertyForFloorPlan] = useState<{id: string, title: string, floorPlan?: string} | null>(null);
  const [commissions, setCommissions] = useState<Record<string, { type: 'cash' | 'credit' | 'manual', amount: number }>>({});
  const [duplicates, setDuplicates] = useState<string[]>([]);
  const [manualCommissionOpen, setManualCommissionOpen] = useState(false);
  const [selectedPropertyForCommission, setSelectedPropertyForCommission] = useState<string | null>(null);
  const [manualCommissionAmount, setManualCommissionAmount] = useState<string>('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPropertyForEdit, setSelectedPropertyForEdit] = useState<any>(null);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [filterRooms, setFilterRooms] = useState<string>("all");
  const [filterSurfaceMin, setFilterSurfaceMin] = useState<string>("");
  const [filterSurfaceMax, setFilterSurfaceMax] = useState<string>("");
  const [sortBy, setSortBy] = useState<{ key: string; direction: "asc" | "desc" } | undefined>();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('real_estate_projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Fetch properties for this project
  const { data: properties, isLoading: propertiesLoading, refetch } = useQuery({
    queryKey: ['project-properties', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_offers')
        .select('*')
        .eq('project_id', id)
        .order('title');
      
      if (error) throw error;
      return data;
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const setAvailability = async (propertyId: string, newStatus: 'available' | 'sold' | 'reserved') => {
    const queryKey = ['project-properties', id];
    const prev = queryClient.getQueryData<any[]>(queryKey);

    // Optimistic update for instant UI feedback
    queryClient.setQueryData<any[]>(queryKey, (old) =>
      (old || []).map((p) => (p.id === propertyId ? { ...p, availability_status: newStatus } : p))
    );

    const { data, error } = await supabase.functions.invoke('admin-offers', {
      body: {
        action: 'update_status',
        id: propertyId,
        availability_status: newStatus,
      },
    });

    if (error || (data && data.success === false)) {
      // Rollback on error
      queryClient.setQueryData(queryKey, prev);
      toast.error("Eroare la actualizarea statusului");
      return;
    }

    const statusLabels = {
      available: 'disponibil',
      reserved: 'rezervat',
      sold: 'vândut'
    };
    toast.success(`Apartament marcat ca ${statusLabels[newStatus]}`);
    // Ensure fresh data
    queryClient.invalidateQueries({ queryKey });
  };

  const handleSelectProperty = (propertyId: string, checked: boolean) => {
    if (checked) {
      setSelectedProperties([...selectedProperties, propertyId]);
    } else {
      setSelectedProperties(selectedProperties.filter(id => id !== propertyId));
    }
  };

  const handleSelectAll = (floorProperties: typeof properties, checked: boolean) => {
    const floorPropertyIds = floorProperties?.map(p => p.id) || [];
    if (checked) {
      setSelectedProperties([...new Set([...selectedProperties, ...floorPropertyIds])]);
    } else {
      setSelectedProperties(selectedProperties.filter(id => !floorPropertyIds.includes(id)));
    }
  };

  const handleBulkImageUpload = () => {
    if (selectedProperties.length === 0) {
      toast.error("Selectează cel puțin o proprietate");
      return;
    }
    setUploadPropertyIds(selectedProperties);
    setImageUploadOpen(true);
  };

  const handleSingleImageUpload = (propertyId: string) => {
    setUploadPropertyIds([propertyId]);
    setImageUploadOpen(true);
  };

  const handleUploadSuccess = () => {
    setSelectedProperties([]);
    refetch();
  };

  const handleBulkStatusUpdate = async (newStatus: 'available' | 'sold' | 'reserved') => {
    if (selectedProperties.length === 0) {
      toast.error("Selectează cel puțin o proprietate");
      return;
    }

    const statusLabels = {
      available: 'disponibile',
      reserved: 'rezervate',
      sold: 'vândute'
    };

    try {
      // Optimistic update
      const queryKey = ['project-properties', id];
      const prev = queryClient.getQueryData<any[]>(queryKey);
      
      queryClient.setQueryData<any[]>(queryKey, (old) =>
        (old || []).map((p) => 
          selectedProperties.includes(p.id) 
            ? { ...p, availability_status: newStatus } 
            : p
        )
      );

      // Update each property
      const updatePromises = selectedProperties.map(propertyId =>
        supabase.functions.invoke('admin-offers', {
          body: {
            action: 'update_status',
            id: propertyId,
            availability_status: newStatus,
          },
        })
      );

      const results = await Promise.all(updatePromises);
      const hasError = results.some(r => r.error || (r.data && r.data.success === false));

      if (hasError) {
        // Rollback on error
        queryClient.setQueryData(queryKey, prev);
        toast.error("Eroare la actualizarea statusului");
        return;
      }

      toast.success(`${selectedProperties.length} ${selectedProperties.length === 1 ? 'apartament marcat' : 'apartamente marcate'} ca ${statusLabels[newStatus]}`);
      setSelectedProperties([]);
      queryClient.invalidateQueries({ queryKey });
    } catch (error) {
      console.error('Error updating bulk status:', error);
      toast.error("Eroare la actualizarea statusului");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProperties.length === 0) {
      toast.error("Selectează cel puțin o proprietate");
      return;
    }

    if (!confirm(`Sigur vrei să ștergi ${selectedProperties.length} ${selectedProperties.length === 1 ? 'proprietate' : 'proprietăți'}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('catalog_offers')
        .delete()
        .in('id', selectedProperties);

      if (error) throw error;

      toast.success(`${selectedProperties.length} ${selectedProperties.length === 1 ? 'proprietate ștearsă' : 'proprietăți șterse'} cu succes`);
      setSelectedProperties([]);
      refetch();
    } catch (error) {
      console.error('Error deleting properties:', error);
      toast.error("Eroare la ștergerea proprietăților");
    }
  };

  const findDuplicates = () => {
    if (!properties) return;

    const seen = new Map<string, string[]>();
    
    properties.forEach(prop => {
      const key = prop.title;
      if (!seen.has(key)) {
        seen.set(key, []);
      }
      seen.get(key)?.push(prop.id);
    });

    const duplicateIds: string[] = [];
    seen.forEach((ids) => {
      if (ids.length > 1) {
        // Keep the first one, mark the rest as duplicates
        duplicateIds.push(...ids.slice(1));
      }
    });

    setDuplicates(duplicateIds);
    
    if (duplicateIds.length > 0) {
      toast.info(`Am găsit ${duplicateIds.length} ${duplicateIds.length === 1 ? 'dublură' : 'dubluri'}`);
    } else {
      toast.success("Nu există dubluri în acest complex");
    }
  };

  const deleteDuplicates = async () => {
    if (duplicates.length === 0) {
      toast.error("Nu există dubluri de șters");
      return;
    }

    if (!confirm(`Sigur vrei să ștergi ${duplicates.length} ${duplicates.length === 1 ? 'dublură' : 'dubluri'}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('catalog_offers')
        .delete()
        .in('id', duplicates);

      if (error) throw error;

      toast.success(`${duplicates.length} ${duplicates.length === 1 ? 'dublură ștearsă' : 'dubluri șterse'} cu succes`);
      setDuplicates([]);
      refetch();
    } catch (error) {
      console.error('Error deleting duplicates:', error);
      toast.error("Eroare la ștergerea dublurilor");
    }
  };

  const handleCommissionChange = (propertyId: string, type: 'cash' | 'credit' | 'manual' | null, priceCash: number, priceCredit: number, manualAmount?: number) => {
    if (type === null) {
      const newCommissions = { ...commissions };
      delete newCommissions[propertyId];
      setCommissions(newCommissions);
    } else if (type === 'manual' && manualAmount !== undefined) {
      setCommissions({
        ...commissions,
        [propertyId]: { type, amount: manualAmount }
      });
    } else {
      const price = type === 'cash' ? priceCash : priceCredit;
      const amount = price * 0.02; // 2%
      setCommissions({
        ...commissions,
        [propertyId]: { type, amount }
      });
    }
  };

  const handleManualCommissionSubmit = (propertyId: string, priceCash: number, priceCredit: number) => {
    const amount = parseFloat(manualCommissionAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Introduceți o sumă validă");
      return;
    }
    handleCommissionChange(propertyId, 'manual', priceCash, priceCredit, amount);
    setManualCommissionOpen(false);
    setManualCommissionAmount('');
    setSelectedPropertyForCommission(null);
    toast.success(`Comision manual de ${amount.toLocaleString()} € setat`);
  };

  const totalCommission = Object.values(commissions).reduce((sum, comm) => sum + comm.amount, 0);

  if (projectLoading || propertiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Building2 className="h-12 w-12 mx-auto animate-pulse text-primary" />
          <p className="text-muted-foreground">Se încarcă...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Proiectul nu a fost găsit</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate statistics
  const available = properties?.filter(p => p.availability_status === 'available').length || 0;
  const sold = properties?.filter(p => p.availability_status === 'sold').length || 0;
  const reserved = properties?.filter(p => p.availability_status === 'reserved').length || 0;
  const total = properties?.length || 0;
  const soldPercentage = total > 0 ? Math.round((sold / total) * 100) : 0;

  // Helper function to extract apartment number numerically
  const getApartmentNumber = (title: string): number => {
    // Match "AP 21", "Apartament 21", "ap21", etc.
    const match = title.match(/(?:AP|Apartament)\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Extract building/staircase and floor from features
  const extractBuildingAndFloor = (features: string[] | null) => {
    let building = 'Principal';
    let floor = 'Altele';
    
    if (!features || features.length === 0) return { building, floor };
    
    // Check for "Scara X" or "Corpul X" in features
    const buildingFeature = features.find(f => f?.startsWith('Scara') || f?.startsWith('Corpul') || f?.startsWith('Bloc'));
    if (buildingFeature) {
      building = buildingFeature;
    }
    
    // Check for floor in features - can be standalone or at the start of a combined string
    for (const feature of features) {
      if (!feature) continue;
      
      if (feature.startsWith('Demisol')) {
        floor = 'Demisol';
        break;
      } else if (feature.startsWith('Parter')) {
        floor = 'Parter';
        break;
      } else if (feature.includes('Etaj:')) {
        // RENEW format: "Etaj: E2 Suprafață: ..." or "Etaj: P ..."
        const floorCode = feature.split('Etaj:')[1]?.trim().split(' ')[0];
        if (floorCode === 'P') {
          floor = 'Parter';
        } else if (floorCode?.startsWith('E')) {
          const floorNum = floorCode.substring(1);
          floor = `Etaj ${floorNum}`;
        }
        break;
      } else if (feature.startsWith('Etaj')) {
        // Standard format: "Etaj 2" or "Etaj2"
        const match = feature.match(/Etaj\s*(\d+)/);
        if (match) {
          floor = `Etaj ${match[1]}`;
        }
        break;
      }
    }
    
    return { building, floor };
  };

  // Check if this complex has multiple buildings (Scara/Corpul)
  const hasMultipleBuildings = properties?.some(p => 
    p.features?.some(f => f?.startsWith('Scara') || f?.startsWith('Corpul') || f?.startsWith('Bloc'))
  ) || false;

  // Get unique room counts for filter options
  const uniqueRooms = [...new Set(properties?.map(p => p.rooms).filter(r => r != null))].sort((a, b) => (a || 0) - (b || 0));

  // Filter properties based on selected filters
  const filteredProperties = properties?.filter(prop => {
    // Filter by rooms
    if (filterRooms !== "all" && prop.rooms !== parseInt(filterRooms)) {
      return false;
    }
    // Filter by surface min
    if (filterSurfaceMin && (prop.surface_min || 0) < parseInt(filterSurfaceMin)) {
      return false;
    }
    // Filter by surface max
    if (filterSurfaceMax && (prop.surface_min || 0) > parseInt(filterSurfaceMax)) {
      return false;
    }
    return true;
  }) || [];

  // Group filtered properties by building first, then by floor
  const groupedByBuildingAndFloor = filteredProperties.reduce((acc, prop) => {
    const { building, floor } = extractBuildingAndFloor(prop.features);
    
    if (!acc[building]) acc[building] = {};
    if (!acc[building][floor]) acc[building][floor] = [];
    acc[building][floor].push(prop);
    
    return acc;
  }, {} as Record<string, Record<string, typeof properties>>) || {};

  // Sort properties within each group
  Object.keys(groupedByBuildingAndFloor).forEach(building => {
    Object.keys(groupedByBuildingAndFloor[building]).forEach(floor => {
      groupedByBuildingAndFloor[building][floor].sort((a, b) => {
        // Apply custom sort if selected
        if (sortBy) {
          let aVal: number, bVal: number;
          switch (sortBy.key) {
            case "price":
              aVal = a.price_min || 0;
              bVal = b.price_min || 0;
              break;
            case "surface":
              aVal = a.surface_min || 0;
              bVal = b.surface_min || 0;
              break;
            case "rooms":
              aVal = a.rooms || 0;
              bVal = b.rooms || 0;
              break;
            default:
              aVal = getApartmentNumber(a.title);
              bVal = getApartmentNumber(b.title);
          }
          return sortBy.direction === "asc" ? aVal - bVal : bVal - aVal;
        }
        // Default sort by apartment number
        return getApartmentNumber(a.title) - getApartmentNumber(b.title);
      });
    });
  });

  const floorOrder = ['Demisol', 'Parter', 'Etaj 1', 'Etaj 2', 'Etaj 3', 'Etaj 4', 'Etaj 5', 'Etaj 6', 'Etaj 7', 'Etaj 8', 'Altele'];
  const buildingOrder = ['Bloc 1', 'Bloc 2', 'Bloc 3', 'Bloc 4', 'Bloc 5', 'Bloc 6', 'Bloc 7', 'Bloc 8', 'Bloc 9', 'Bloc 10', 'Corpul 1', 'Corpul 2', 'Corpul 3', 'Corpul 4', 'Scara 1', 'Scara 2', 'Scara 3', 'Scara 4', 'Altele'];
  
  const sortedBuildings = Object.keys(groupedByBuildingAndFloor || {}).sort((a, b) => {
    const aIndex = buildingOrder.indexOf(a);
    const bIndex = buildingOrder.indexOf(b);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  // Get the first building to display by default
  const defaultBuilding = sortedBuildings[0] || null;
  const activeBuilding = selectedBuilding || defaultBuilding;

  return (
    <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4 flex-1">
          <Link to="/admin/complexe">
            <Button variant="ghost" size="icon" aria-label="Înapoi la complexe">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl font-bold truncate">{project.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1 text-sm md:text-base">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{project.location}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/admin/complexe/${id}/edit`} className="flex-1 md:flex-none">
            <Button variant="outline" size="sm" className="w-full">
              <Edit className="mr-1 md:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Editează Complex</span>
              <span className="sm:hidden">Editează</span>
            </Button>
          </Link>
          <Button onClick={findDuplicates} variant="outline" size="sm" className="flex-1 md:flex-none">
            <FileText className="mr-1 md:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Găsește Dubluri</span>
            <span className="sm:hidden">Dubluri</span>
          </Button>
          {duplicates.length > 0 && (
            <Button onClick={deleteDuplicates} variant="destructive" size="sm" className="flex-1 md:flex-none">
              <Trash2 className="mr-1 md:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Șterge {duplicates.length}</span>
              <span className="sm:hidden">{duplicates.length}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Project Image */}
      {project.main_image && (
        <Card className="overflow-hidden">
          <img
            src={project.main_image}
            alt={project.name}
            className="w-full h-64 object-cover"
          />
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
            <Home className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-blue-500">{total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Disponibile
            </CardTitle>
            <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-green-500">{available}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Rezervate
            </CardTitle>
            <Clock className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-orange-500">{reserved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Vândute
            </CardTitle>
            <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-red-500">{sold}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Vândut %
            </CardTitle>
            <Layers className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-primary">{soldPercentage}%</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/50 bg-primary/5 col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Total Comisioane
            </CardTitle>
            <Euro className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-primary">{totalCommission.toLocaleString()} €</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Object.keys(commissions).length} {Object.keys(commissions).length === 1 ? 'proprietate' : 'proprietăți'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progres Vânzări</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={soldPercentage} className="h-4" />
            <p className="text-sm text-muted-foreground text-center">
              {sold} din {total} proprietăți vândute ({soldPercentage}%)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedProperties.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm md:text-base">{selectedProperties.length} {selectedProperties.length === 1 ? 'selectată' : 'selectate'}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground hidden md:block">Acțiuni disponibile</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => handleBulkStatusUpdate('available')} 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 md:flex-none border-green-500 text-green-600 hover:bg-green-50"
                >
                  <CheckCircle className="mr-1 md:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Marchează Disponibil</span>
                  <span className="sm:hidden">Disponibil</span>
                </Button>
                <Button 
                  onClick={() => handleBulkStatusUpdate('reserved')} 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 md:flex-none border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  <Clock className="mr-1 md:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Marchează Rezervat</span>
                  <span className="sm:hidden">Rezervat</span>
                </Button>
                <Button 
                  onClick={() => handleBulkStatusUpdate('sold')} 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 md:flex-none border-red-500 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="mr-1 md:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Marchează Vândut</span>
                  <span className="sm:hidden">Vândut</span>
                </Button>
                <Button 
                  onClick={() => setBulkEditDialogOpen(true)} 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 md:flex-none border-primary text-primary hover:bg-primary/10"
                >
                  <Edit className="mr-1 md:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Editează Detalii</span>
                  <span className="sm:hidden">Editează</span>
                </Button>
                <Button onClick={handleBulkImageUpload} variant="outline" size="sm" className="flex-1 md:flex-none">
                  <ImagePlus className="mr-1 md:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Încarcă Imagini</span>
                  <span className="sm:hidden">Imagini</span>
                </Button>
                <Button onClick={handleBulkDelete} variant="destructive" size="sm" className="flex-1 md:flex-none">
                  <Trash2 className="mr-1 md:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Șterge</span>
                  <span className="sm:hidden">Șterge</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Mobile Filter Button */}
            {isMobile ? (
              <>
                <MobileFilterSort
                  filters={[
                    {
                      key: "rooms",
                      label: "Camere",
                      type: "select",
                      options: [
                        { value: "all", label: "Toate camerele" },
                        ...uniqueRooms.map(room => ({
                          value: String(room),
                          label: `${room} ${room === 1 ? 'cameră' : 'camere'}`
                        }))
                      ]
                    },
                    {
                      key: "surfaceMin",
                      label: "Suprafață minimă (mp)",
                      type: "number",
                      placeholder: "ex: 40"
                    },
                    {
                      key: "surfaceMax",
                      label: "Suprafață maximă (mp)",
                      type: "number",
                      placeholder: "ex: 100"
                    }
                  ]}
                  filterValues={{
                    rooms: filterRooms,
                    surfaceMin: filterSurfaceMin,
                    surfaceMax: filterSurfaceMax
                  }}
                  onFilterChange={(key, value) => {
                    if (key === "rooms") setFilterRooms(value);
                    if (key === "surfaceMin") setFilterSurfaceMin(value);
                    if (key === "surfaceMax") setFilterSurfaceMax(value);
                  }}
                  sortOptions={[
                    { key: "price", label: "Preț" },
                    { key: "surface", label: "Suprafață" },
                    { key: "rooms", label: "Camere" }
                  ]}
                  currentSort={sortBy}
                  onSortChange={(key, direction) => setSortBy({ key, direction })}
                  onReset={() => {
                    setFilterRooms("all");
                    setFilterSurfaceMin("");
                    setFilterSurfaceMax("");
                    setSortBy(undefined);
                  }}
                  activeFiltersCount={
                    (filterRooms !== "all" ? 1 : 0) +
                    (filterSurfaceMin ? 1 : 0) +
                    (filterSurfaceMax ? 1 : 0) +
                    (sortBy ? 1 : 0)
                  }
                />
                <Badge variant="secondary" className="ml-auto">
                  {filteredProperties.length} / {properties?.length || 0}
                </Badge>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filtre:</span>
                </div>
                
                {/* Rooms Filter */}
                <select
                  value={filterRooms}
                  onChange={(e) => setFilterRooms(e.target.value)}
                  className="h-9 px-3 text-sm border rounded-md bg-background"
                >
                  <option value="all">Toate camerele</option>
                  {uniqueRooms.map(room => (
                    <option key={room} value={String(room)}>
                      {room} {room === 1 ? 'cameră' : 'camere'}
                    </option>
                  ))}
                </select>

                {/* Surface Filter */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min mp"
                    value={filterSurfaceMin}
                    onChange={(e) => setFilterSurfaceMin(e.target.value)}
                    className="w-[80px] h-9 px-2 text-sm border rounded-md bg-background"
                  />
                  <span className="text-muted-foreground">-</span>
                  <input
                    type="number"
                    placeholder="Max mp"
                    value={filterSurfaceMax}
                    onChange={(e) => setFilterSurfaceMax(e.target.value)}
                    className="w-[80px] h-9 px-2 text-sm border rounded-md bg-background"
                  />
                </div>

                {/* Sort Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      Sortare
                      {sortBy && (
                        <Badge variant="secondary" className="ml-1">
                          {sortBy.direction === "asc" ? "↑" : "↓"}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortBy({ key: "price", direction: "asc" })}>
                      Preț ↑
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy({ key: "price", direction: "desc" })}>
                      Preț ↓
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy({ key: "surface", direction: "asc" })}>
                      Suprafață ↑
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy({ key: "surface", direction: "desc" })}>
                      Suprafață ↓
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy({ key: "rooms", direction: "asc" })}>
                      Camere ↑
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy({ key: "rooms", direction: "desc" })}>
                      Camere ↓
                    </DropdownMenuItem>
                    {sortBy && (
                      <DropdownMenuItem onClick={() => setSortBy(undefined)} className="text-destructive">
                        Resetează sortare
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Clear Filters */}
                {(filterRooms !== "all" || filterSurfaceMin || filterSurfaceMax || sortBy) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterRooms("all");
                      setFilterSurfaceMin("");
                      setFilterSurfaceMax("");
                      setSortBy(undefined);
                    }}
                    className="h-9 text-sm text-muted-foreground hover:text-foreground"
                  >
                    Resetează
                  </Button>
                )}

                {/* Results count */}
                <Badge variant="secondary" className="ml-auto">
                  {filteredProperties.length} / {properties?.length || 0} apartamente
                </Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Building Tabs - only show if multiple buildings */}
      {hasMultipleBuildings && (
        <div className="flex flex-wrap gap-2">
          {sortedBuildings.map((building) => {
            const floorsInBuilding = groupedByBuildingAndFloor[building] || {};
            const totalInBuilding = Object.values(floorsInBuilding).reduce((sum, apts) => sum + (apts?.length || 0), 0);
            const isSelected = activeBuilding === building;
            
            return (
              <button
                key={building}
                onClick={() => setSelectedBuilding(building)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 flex-1 sm:flex-none justify-center ${
                  isSelected
                    ? 'bg-primary/20 border-2 border-primary text-primary'
                    : 'bg-card border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>{building.toUpperCase()}</span>
                <span className="text-xs sm:text-sm opacity-70">({totalInBuilding})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Apartments by Building and Floor */}
      {sortedBuildings.filter(b => !hasMultipleBuildings || b === activeBuilding).map((building) => {
        const floorsInBuilding = groupedByBuildingAndFloor[building] || {};
        const sortedFloorsInBuilding = Object.keys(floorsInBuilding).sort((a, b) => {
          const aIndex = floorOrder.indexOf(a);
          const bIndex = floorOrder.indexOf(b);
          return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
        });
        
        return (
          <div key={building} className="space-y-6">

            {/* Floors within building */}
            {sortedFloorsInBuilding.map((floor, floorIndex) => {
              const floorProperties = floorsInBuilding[floor] || [];
              const allFloorSelected = floorProperties.length > 0 && 
                floorProperties.every(p => selectedProperties.includes(p.id));
              
              return (
                <div key={`${building}-${floor}`}>
                  {/* Separator between floors */}
                  {floorIndex > 0 && (
                    <div className="my-6 border-t border-border" />
                  )}
                  
                  <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 p-3 md:p-4 bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary rounded-lg">
                    <Checkbox
                      checked={allFloorSelected}
                      onCheckedChange={(checked) => handleSelectAll(floorProperties, checked as boolean)}
                    />
                    <h3 className="text-lg md:text-xl font-bold flex flex-wrap items-center gap-2 md:gap-3">
                      {floor.toUpperCase()}
                      <Badge variant="secondary" className="text-xs md:text-sm">
                        {floorProperties.length} apt
                      </Badge>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                    {floorProperties.map((apt) => {
                      const isAvailable = apt.availability_status === 'available';
                      // Match "AP 21", "Apartament 21", "ap21", etc.
                      const aptNumberMatch = apt.title.match(/(?:AP|Apartament)\s*(\d+)/i);
                      const aptNumber = aptNumberMatch ? aptNumberMatch[1] : '';
                      const surface = apt.surface_min;
                      const priceCredit = apt.price_max;
                      const priceCash = apt.price_min;
                      const rooms = apt.rooms;
                      const tipApt = apt.features?.find((f: string) => f.startsWith('Tip:'))?.split(': ')[1] || '';
                      const isSelected = selectedProperties.includes(apt.id);

                      return (
                        <Card 
                          key={apt.id}
                          className={`relative overflow-hidden transition-all duration-300 border-2 ${
                            isSelected 
                              ? 'border-primary shadow-lg' 
                              : isAvailable 
                                ? 'border-green-500/50 hover:shadow-xl' 
                                : 'border-red-500/50'
                          }`}
                        >
                          {/* Dark overlay for sold/reserved */}
                          {!isAvailable && (
                            <div className="absolute inset-0 bg-black/50 z-10 pointer-events-none" />
                          )}
                          
                          <CardContent className="p-3 md:p-4 space-y-2 md:space-y-3 relative">
                            {/* Badge - outside the overlay */}
                            <div className="absolute top-1 right-1 md:top-2 md:right-2 z-20">
                              <Badge 
                                variant={
                                  isAvailable 
                                    ? "default" 
                                    : apt.availability_status === 'reserved' 
                                      ? "secondary" 
                                      : "destructive"
                                }
                                className={`text-xs md:text-sm ${
                                  isAvailable 
                                    ? "bg-green-600 text-white" 
                                    : apt.availability_status === 'reserved'
                                      ? "bg-yellow-500 text-black hover:bg-yellow-600"
                                      : "bg-red-600 text-white"
                                }`}
                              >
                                {isAvailable ? (
                                  <><CheckCircle2 className="h-3 w-3 mr-1" /><span className="hidden md:inline">Disponibil</span><span className="md:hidden">Disp</span></>
                                ) : apt.availability_status === 'reserved' ? (
                                  <><Clock className="h-3 w-3 mr-1" /><span className="hidden md:inline">Rezervat</span><span className="md:hidden">Rez</span></>
                                ) : (
                                  <><XCircle className="h-3 w-3 mr-1" /><span className="hidden md:inline">Vândut</span><span className="md:hidden">Vând</span></>
                                )}
                              </Badge>
                            </div>

                            {/* Checkbox and Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handleSelectProperty(apt.id, checked as boolean)}
                                  className="touch-target"
                                />
                                <Home className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                                <span className="text-lg md:text-xl font-bold">Ap. {aptNumber}</span>
                              </div>
                            </div>

                            {/* Status Dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-between text-sm md:text-base h-9 md:h-10"
                                >
                                  <span className="flex items-center gap-1 md:gap-2">
                                    {isAvailable ? (
                                      <><CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-600" /> Disponibil</>
                                    ) : apt.availability_status === 'reserved' ? (
                                      <><Clock className="h-3 w-3 md:h-4 md:w-4 text-yellow-600" /> Rezervat</>
                                    ) : (
                                      <><XCircle className="h-3 w-3 md:h-4 md:w-4 text-red-600" /> Vândut</>
                                    )}
                                  </span>
                                  <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-56 z-[1000] bg-popover border shadow-lg" align="center" sideOffset={6}>
                                <DropdownMenuItem
                                  onClick={() => setAvailability(apt.id, 'available')}
                                  disabled={isAvailable}
                                  className="cursor-pointer"
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                  <span>Disponibil</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setAvailability(apt.id, 'reserved')}
                                  disabled={apt.availability_status === 'reserved'}
                                  className="cursor-pointer"
                                >
                                  <Clock className="mr-2 h-4 w-4 text-yellow-600" />
                                  <span>Rezervat</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setAvailability(apt.id, 'sold')}
                                  disabled={apt.availability_status === 'sold'}
                                  className="cursor-pointer"
                                >
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  <span>Vândut</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Apartment Type */}
                            <div className="py-1.5 md:py-2 px-2 md:px-3 bg-primary/10 rounded-md text-center">
                              <span className="font-semibold text-xs md:text-sm">{tipApt}</span>
                            </div>

                            {/* Details */}
                            <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Suprafață:</span>
                                <span className="font-semibold">{surface} mp</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Camere:</span>
                                <span className="font-semibold">{rooms} cam</span>
                              </div>
                            </div>

                            {/* Prices - Hidden for EUROCASA RESIDENCE */}
                            {project.name?.toUpperCase() !== "EUROCASA RESIDENCE" && (
                              <div className="space-y-1.5 md:space-y-2 pt-2 border-t">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] md:text-xs text-muted-foreground">Cash:</span>
                                  <div className="flex items-center gap-0.5 md:gap-1 font-bold text-green-600 text-xs md:text-sm">
                                    <Euro className="h-3 w-3" />
                                    {priceCash?.toLocaleString()}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] md:text-xs text-muted-foreground">Credit:</span>
                                  <div className="flex items-center gap-0.5 md:gap-1 font-bold text-blue-600 text-xs md:text-sm">
                                    <Euro className="h-3 w-3" />
                                    {priceCredit?.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* View Sketch Button */}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full border-primary/30 hover:bg-primary/10 h-8 md:h-9 text-xs md:text-sm"
                              onClick={() => {
                                setSelectedPropertyForFloorPlan({
                                  id: apt.id,
                                  title: apt.title,
                                  floorPlan: apt.floor_plan || undefined
                                });
                                setFloorPlanDialogOpen(true);
                              }}
                            >
                              <FileText className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                              {apt.floor_plan ? 'Vezi/Schimbă Schiță' : '+ Schiță Etaj'}
                            </Button>

                            {/* Commission Selection */}
                            <div className="pt-2 border-t space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                                  <Calculator className="h-3 w-3" />
                                  Comision (2%):
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <Button
                                  variant={commissions[apt.id]?.type === 'cash' ? 'default' : 'outline'}
                                  size="sm"
                                  className="h-7 text-[10px] md:text-xs px-1"
                                  onClick={() => {
                                    if (commissions[apt.id]?.type === 'cash') {
                                      handleCommissionChange(apt.id, null, priceCash, priceCredit);
                                    } else {
                                      handleCommissionChange(apt.id, 'cash', priceCash, priceCredit);
                                    }
                                  }}
                                >
                                  Cash
                                </Button>
                                <Button
                                  variant={commissions[apt.id]?.type === 'credit' ? 'default' : 'outline'}
                                  size="sm"
                                  className="h-7 text-[10px] md:text-xs px-1"
                                  onClick={() => {
                                    if (commissions[apt.id]?.type === 'credit') {
                                      handleCommissionChange(apt.id, null, priceCash, priceCredit);
                                    } else {
                                      handleCommissionChange(apt.id, 'credit', priceCash, priceCredit);
                                    }
                                  }}
                                >
                                  Credit
                                </Button>
                                <Button
                                  variant={commissions[apt.id]?.type === 'manual' ? 'default' : 'outline'}
                                  size="sm"
                                  className="h-7 text-[10px] md:text-xs px-1"
                                  onClick={() => {
                                    setSelectedPropertyForCommission(apt.id);
                                    setManualCommissionOpen(true);
                                  }}
                                >
                                  Manual
                                </Button>
                              </div>
                              {commissions[apt.id] && (
                                <div className="text-center text-xs font-semibold text-primary">
                                  {commissions[apt.id].amount.toLocaleString()} €
                                </div>
                              )}
                            </div>

                            {/* Edit Button */}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full border-primary/30 hover:bg-primary/10 h-8 md:h-9 text-xs md:text-sm"
                              onClick={() => {
                                setSelectedPropertyForEdit(apt);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                              Editează Detalii
                            </Button>

                            {/* Add Image Button */}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full border-blue-500/30 hover:bg-blue-500/10 h-8 md:h-9 text-xs md:text-sm"
                              onClick={() => handleSingleImageUpload(apt.id)}
                            >
                              <ImagePlus className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                              {apt.images && apt.images.length > 0 ? `Imagini (${apt.images.length})` : '+ Imagini'}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {properties?.length === 0 && (
        <div className="text-center py-16">
          <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nu există apartamente</h3>
          <p className="text-muted-foreground">Importă apartamente pentru a începe</p>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedProperties.length > 0 && (
        <div className="fixed bottom-3 md:bottom-6 left-3 right-3 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50 max-w-2xl">
          <Card className="shadow-2xl border-primary">
            <CardContent className="p-3 md:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
              <span className="font-semibold text-sm md:text-base text-center sm:text-left">
                {selectedProperties.length} {selectedProperties.length === 1 ? 'selectată' : 'selectate'}
              </span>
              <div className="flex gap-2 flex-1">
                <Button
                  onClick={() => {
                    if (selectedProperties.length === 0) {
                      toast.error('Selectează cel puțin o proprietate');
                    } else {
                      setBulkFloorPlanDialogOpen(true);
                    }
                  }} 
                  size="sm"
                  variant="secondary"
                  className="flex-1 sm:flex-none h-9 md:h-10"
                >
                  <FileText className="mr-1 md:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Adaugă Schiță</span>
                  <span className="sm:hidden">Schiță</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProperties([])}
                  className="flex-1 sm:flex-none h-9 md:h-10"
                >
                  Anulează
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <ImageUploadDialog
        open={imageUploadOpen}
        onOpenChange={setImageUploadOpen}
        propertyIds={uploadPropertyIds}
        onSuccess={handleUploadSuccess}
      />

      {selectedPropertyForFloorPlan && (
        <FloorPlanUploadDialog
          open={floorPlanDialogOpen}
          onOpenChange={setFloorPlanDialogOpen}
          propertyId={selectedPropertyForFloorPlan.id}
          propertyTitle={selectedPropertyForFloorPlan.title}
          currentFloorPlan={selectedPropertyForFloorPlan.floorPlan}
          onSuccess={refetch}
        />
      )}

      <BulkFloorPlanUploadDialog
        open={bulkFloorPlanDialogOpen}
        onOpenChange={setBulkFloorPlanDialogOpen}
        propertyIds={selectedProperties}
        onSuccess={() => {
          refetch();
          setSelectedProperties([]);
        }}
      />

      {/* Manual Commission Dialog */}
      <Dialog open={manualCommissionOpen} onOpenChange={setManualCommissionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Setează Comision Manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="commission-amount">Suma comisionului (EUR)</Label>
              <Input
                id="commission-amount"
                type="number"
                placeholder="Ex: 1500"
                value={manualCommissionAmount}
                onChange={(e) => setManualCommissionAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setManualCommissionOpen(false);
                setManualCommissionAmount('');
                setSelectedPropertyForCommission(null);
              }}
            >
              Anulează
            </Button>
            <Button 
              onClick={() => {
                if (selectedPropertyForCommission) {
                  const property = properties?.find(p => p.id === selectedPropertyForCommission);
                  if (property) {
                    handleManualCommissionSubmit(
                      selectedPropertyForCommission,
                      property.price_min,
                      property.price_max
                    );
                  }
                }
              }}
            >
              <Calculator className="mr-2 h-4 w-4" />
              Setează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Apartment Dialog */}
      {selectedPropertyForEdit && (
        <ApartmentEditDialog
          apartment={selectedPropertyForEdit}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={() => {
            refetch();
            setSelectedPropertyForEdit(null);
          }}
        />
      )}

      {/* Bulk Edit Dialog */}
      <BulkApartmentEditDialog
        apartmentIds={selectedProperties}
        open={bulkEditDialogOpen}
        onOpenChange={setBulkEditDialogOpen}
        onSuccess={() => {
          refetch();
          setSelectedProperties([]);
        }}
      />
    </div>
  );
};

export default ComplexDetail;
