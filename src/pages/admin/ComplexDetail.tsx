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
  CheckCircle2
} from "lucide-react";
import RenewResidenceImporter from "@/components/RenewResidenceImporter";
import { toast } from "sonner";

const ComplexDetail = () => {
  const { id } = useParams<{ id: string }>();

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
      {sortedFloors.map((floor) => (
        <div key={floor}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              {floor === 'P' ? 'PARTER' : floor === 'Altele' ? 'ALTELE' : floor}
              <Badge variant="secondary" className="text-sm">
                {groupedByFloor?.[floor]?.length} {groupedByFloor?.[floor]?.length === 1 ? 'apartament' : 'apartamente'}
              </Badge>
            </h2>
            <div className="text-sm text-muted-foreground">
              Model: 1.612 EUR/mp
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {groupedByFloor?.[floor]?.map((apt) => {
              const isAvailable = apt.availability_status === 'available';
              const aptNumber = apt.title.match(/\d+/)?.[0] || '';
              const surface = apt.surface_min;
              const priceCredit = apt.price_max;
              const priceCash = apt.price_min;
              const rooms = apt.rooms;
              const tipApt = apt.features?.find((f: string) => f.startsWith('Tip:'))?.split(': ')[1] || '';

              return (
                <Card 
                  key={apt.id}
                  className={`relative overflow-hidden transition-all duration-300 border-2 ${
                    isAvailable 
                      ? 'border-green-500/50 hover:shadow-xl' 
                      : 'border-red-500/50 opacity-80'
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Header with apt number and actions */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Home className="h-5 w-5 text-primary" />
                        <span className="text-xl font-bold">Ap. {aptNumber}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => toggleAvailability(apt.id, apt.availability_status)}
                        >
                          {isAvailable ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <Badge 
                      variant={isAvailable ? "default" : "secondary"}
                      className={`w-full justify-center ${isAvailable ? "bg-green-600" : "bg-red-600"}`}
                    >
                      {isAvailable ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Disponibil</>
                      ) : (
                        <><XCircle className="h-3 w-3 mr-1" /> Vândut</>
                      )}
                    </Badge>

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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {properties?.length === 0 && (
        <div className="text-center py-16">
          <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nu există apartamente</h3>
          <p className="text-muted-foreground">Importă apartamente pentru a începe</p>
        </div>
      )}
    </div>
  );
};

export default ComplexDetail;
