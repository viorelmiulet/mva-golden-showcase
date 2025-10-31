import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
  ImagePlus
} from "lucide-react";
import RenewResidenceImporter from "@/components/RenewResidenceImporter";
import ImageUploadDialog from "@/components/ImageUploadDialog";
import { toast } from "sonner";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ComplexDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [imageUploadOpen, setImageUploadOpen] = useState(false);
  const [uploadPropertyIds, setUploadPropertyIds] = useState<string[]>([]);
  const [commissions, setCommissions] = useState<Record<string, { type: 'cash' | 'credit' | null, amount: number }>>({});

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('real_estate_projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    }
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
    }
  });

  const toggleAvailability = async (propertyId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'available' ? 'sold' : 'available';
    
    const { error } = await supabase
      .from('catalog_offers')
      .update({ availability_status: newStatus })
      .eq('id', propertyId);

    if (error) {
      toast.error("Eroare la actualizarea statusului");
      return;
    }

    toast.success(`Apartament marcat ca ${newStatus === 'available' ? 'disponibil' : 'vândut'}`);
    refetch();
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

  const handleCommissionChange = (propertyId: string, type: 'cash' | 'credit' | null, priceCash: number, priceCredit: number) => {
    if (type === null) {
      const newCommissions = { ...commissions };
      delete newCommissions[propertyId];
      setCommissions(newCommissions);
    } else {
      const price = type === 'cash' ? priceCash : priceCredit;
      const amount = price * 0.02; // 2%
      setCommissions({
        ...commissions,
        [propertyId]: { type, amount }
      });
    }
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
  const total = properties?.length || 0;
  const soldPercentage = total > 0 ? Math.round((sold / total) * 100) : 0;

  // Group properties by floor
  const groupedByFloor = properties?.reduce((acc, prop) => {
    const floor = prop.features?.find((f: string) => f.startsWith('Etaj:'))?.split(': ')[1] || 'Altele';
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(prop);
    return acc;
  }, {} as Record<string, typeof properties>);

  const floorOrder = ['P', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'Altele'];
  const sortedFloors = Object.keys(groupedByFloor || {}).sort((a, b) => {
    return floorOrder.indexOf(a) - floorOrder.indexOf(b);
  });

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/complexe">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <MapPin className="h-4 w-4" />
            {project.location}
          </p>
        </div>
        <Link to="/admin/projects">
          <Button>
            <Building2 className="mr-2 h-4 w-4" />
            Editează Proiect
          </Button>
        </Link>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Proprietăți
            </CardTitle>
            <Home className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Disponibile
            </CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{available}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vândute
            </CardTitle>
            <XCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{sold}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Procent Vândut
            </CardTitle>
            <Layers className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{soldPercentage}%</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/50 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Comisioane
            </CardTitle>
            <Euro className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totalCommission.toLocaleString()} €</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Object.keys(commissions).length} {Object.keys(commissions).length === 1 ? 'proprietate selectată' : 'proprietăți selectate'}
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

      {/* Import Section - Show only for Renew Residence */}
      {project.name === "RENEW RESIDENCE" && (
        <RenewResidenceImporter />
      )}

      {/* Apartments by Floor */}
      {sortedFloors.map((floor) => {
        const floorProperties = groupedByFloor?.[floor] || [];
        const allFloorSelected = floorProperties.length > 0 && 
          floorProperties.every(p => selectedProperties.includes(p.id));
        
        return (
          <div key={floor}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={allFloorSelected}
                  onCheckedChange={(checked) => handleSelectAll(floorProperties, checked as boolean)}
                />
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  {floor === 'P' ? 'PARTER' : floor === 'Altele' ? 'ALTELE' : floor}
                  <Badge variant="secondary" className="text-sm">
                    {floorProperties.length} {floorProperties.length === 1 ? 'apartament' : 'apartamente'}
                  </Badge>
                </h2>
              </div>
              <div className="text-sm text-muted-foreground">
                Model: 1.612 EUR/mp
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {floorProperties.map((apt) => {
                const isAvailable = apt.availability_status === 'available';
                const aptNumber = apt.title.match(/\d+/)?.[0] || '';
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
                          : 'border-red-500/50 opacity-80'
                    }`}
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Checkbox and Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectProperty(apt.id, checked as boolean)}
                          />
                          <Home className="h-5 w-5 text-primary" />
                          <span className="text-xl font-bold">Ap. {aptNumber}</span>
                        </div>
                      </div>

                    {/* Status Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant={isAvailable ? "default" : "secondary"}
                          className={`w-full justify-between ${isAvailable ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                        >
                          <span className="flex items-center gap-2">
                            {isAvailable ? (
                              <><CheckCircle2 className="h-4 w-4" /> Disponibil</>
                            ) : (
                              <><XCircle className="h-4 w-4" /> Vândut</>
                            )}
                          </span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 bg-background border-2 z-50" align="center">
                        <DropdownMenuItem
                          onClick={() => toggleAvailability(apt.id, apt.availability_status)}
                          disabled={isAvailable}
                          className="cursor-pointer"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                          <span>Disponibil</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleAvailability(apt.id, apt.availability_status)}
                          disabled={!isAvailable}
                          className="cursor-pointer"
                        >
                          <XCircle className="mr-2 h-4 w-4 text-red-600" />
                          <span>Vândut</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Apartment Type */}
                    <div className="py-2 px-3 bg-primary/10 rounded-md text-center">
                      <span className="font-semibold text-sm">{tipApt}</span>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Suprafață:</span>
                        <span className="font-semibold">{surface} mp</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Camere:</span>
                        <span className="font-semibold">{rooms} {rooms === 1 ? 'cameră' : 'camere'}</span>
                      </div>
                    </div>

                    {/* Prices */}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Preț Cash:</span>
                        <div className="flex items-center gap-1 font-bold text-green-600">
                          <Euro className="h-3 w-3" />
                          {priceCash?.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Preț Credit:</span>
                        <div className="flex items-center gap-1 font-bold text-blue-600">
                          <Euro className="h-3 w-3" />
                          {priceCredit?.toLocaleString()}
                        </div>
                      </div>
                    </div>

                      {/* View Sketch and Add Image Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-primary/30 hover:bg-primary/10"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Vezi schița
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-primary/30 hover:bg-primary/10"
                          onClick={() => handleSingleImageUpload(apt.id)}
                        >
                          <ImagePlus className="h-4 w-4 mr-1" />
                          Imagine
                        </Button>
                      </div>

                      {/* Commission Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-between ${
                              commissions[apt.id] ? 'border-primary bg-primary/10' : ''
                            }`}
                            size="sm"
                          >
                            <span className="flex items-center gap-2">
                              <Euro className="h-4 w-4" />
                              {commissions[apt.id] 
                                ? `${commissions[apt.id].amount.toLocaleString()} € (${commissions[apt.id].type === 'cash' ? 'Cash' : 'Credit'})`
                                : 'Selectează Comision'
                              }
                            </span>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 bg-background border-2 z-50" align="center">
                          <DropdownMenuItem
                            onClick={() => handleCommissionChange(apt.id, 'cash', priceCash, priceCredit)}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col w-full">
                              <span className="font-semibold">2% din Cash</span>
                              <span className="text-sm text-green-600">
                                {(priceCash * 0.02).toLocaleString()} € (din {priceCash.toLocaleString()} €)
                              </span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCommissionChange(apt.id, 'credit', priceCash, priceCredit)}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col w-full">
                              <span className="font-semibold">2% din Credit</span>
                              <span className="text-sm text-blue-600">
                                {(priceCredit * 0.02).toLocaleString()} € (din {priceCredit.toLocaleString()} €)
                              </span>
                            </div>
                          </DropdownMenuItem>
                          {commissions[apt.id] && (
                            <DropdownMenuItem
                              onClick={() => handleCommissionChange(apt.id, null, priceCash, priceCredit)}
                              className="cursor-pointer text-red-600"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              <span>Șterge Comision</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Card className="shadow-2xl border-primary">
            <CardContent className="p-4 flex items-center gap-4">
              <span className="font-semibold">
                {selectedProperties.length} {selectedProperties.length === 1 ? 'proprietate selectată' : 'proprietăți selectate'}
              </span>
              <div className="flex gap-2">
                <Button onClick={handleBulkImageUpload} size="sm">
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Adaugă Imagini
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProperties([])}
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
    </div>
  );
};

export default ComplexDetail;
