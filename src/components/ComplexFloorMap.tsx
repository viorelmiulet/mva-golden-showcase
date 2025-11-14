import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Home, Euro, Layers } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Apartment {
  id: string;
  title: string;
  availability_status: string;
  price_min?: number;
  surface_min?: number;
  rooms?: number;
  features?: string[];
  floor_plan?: string;
}

interface ComplexFloorMapProps {
  properties: Apartment[];
  onApartmentClick?: (apartment: Apartment) => void;
  isAuthenticated?: boolean;
}

export const ComplexFloorMap = ({ 
  properties, 
  onApartmentClick,
  isAuthenticated = false 
}: ComplexFloorMapProps) => {
  const [hoveredApt, setHoveredApt] = useState<string | null>(null);
  const [selectedApt, setSelectedApt] = useState<Apartment | null>(null);

  // Group properties by floor
  const groupedByFloor = properties?.reduce((acc, prop) => {
    const featureStr = prop.features?.[0] || '';
    let floor = 'Altele';
    
    if (featureStr.includes('Etaj:')) {
      const floorCode = featureStr.split('Etaj:')[1]?.trim().split(' ')[0];
      if (floorCode === 'P') {
        floor = 'Parter';
      } else if (floorCode?.startsWith('E')) {
        const floorNum = floorCode.substring(1);
        floor = `Etaj ${floorNum}`;
      }
    } else if (featureStr.startsWith('Demisol')) {
      floor = 'Demisol';
    } else if (featureStr.startsWith('Parter')) {
      floor = 'Parter';
    }
    
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(prop);
    return acc;
  }, {} as Record<string, Apartment[]>);

  const floorOrder = ['Etaj 5', 'Etaj 4', 'Etaj 3', 'Etaj 2', 'Etaj 1', 'Parter', 'Demisol', 'Altele'];
  const sortedFloors = Object.keys(groupedByFloor || {})
    .filter(floor => groupedByFloor[floor].length > 0)
    .sort((a, b) => floorOrder.indexOf(a) - floorOrder.indexOf(b));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500/80 hover:bg-green-600/90 border-green-600';
      case 'reserved':
        return 'bg-yellow-500/80 hover:bg-yellow-600/90 border-yellow-600';
      case 'sold':
        return 'bg-red-500/80 hover:bg-red-600/90 border-red-600';
      default:
        return 'bg-muted hover:bg-muted/80 border-border';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponibil';
      case 'reserved':
        return 'Rezervat';
      case 'sold':
        return 'Vândut';
      default:
        return 'Necunoscut';
    }
  };

  const handleApartmentClick = (apt: Apartment) => {
    setSelectedApt(apt);
    if (onApartmentClick) {
      onApartmentClick(apt);
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Vizualizare Complex</CardTitle>
            </div>
            <div className="flex gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-green-500/80 border border-green-600" />
                <span>Disponibil</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-yellow-500/80 border border-yellow-600" />
                <span>Rezervat</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-red-500/80 border border-red-600" />
                <span>Vândut</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedFloors.map((floor) => {
              const apartments = groupedByFloor[floor] || [];
              const maxApts = Math.max(...Object.values(groupedByFloor).map(a => a.length));
              
              return (
                <div key={floor} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Layers className="h-4 w-4" />
                    {floor}
                    <span className="text-xs font-normal">({apartments.length} apartamente)</span>
                  </div>
                  
                  <div 
                    className="grid gap-2"
                    style={{ 
                      gridTemplateColumns: `repeat(${Math.min(apartments.length, 8)}, minmax(0, 1fr))` 
                    }}
                  >
                    {apartments.map((apt) => {
                      const isHovered = hoveredApt === apt.id;
                      const aptNumber = apt.title.match(/\d+/)?.[0] || '?';
                      
                      return (
                        <div
                          key={apt.id}
                          className={cn(
                            "relative aspect-square rounded-lg border-2 transition-all cursor-pointer",
                            "flex items-center justify-center text-white font-bold",
                            getStatusColor(apt.availability_status),
                            isHovered && "scale-110 shadow-xl z-10"
                          )}
                          onMouseEnter={() => setHoveredApt(apt.id)}
                          onMouseLeave={() => setHoveredApt(null)}
                          onClick={() => handleApartmentClick(apt)}
                        >
                          <span className="text-lg drop-shadow-lg">
                            {aptNumber}
                          </span>
                          
                          {isHovered && (
                            <div className="absolute -top-24 left-1/2 -translate-x-1/2 bg-popover border rounded-lg shadow-xl p-3 min-w-48 z-20 pointer-events-none">
                              <div className="space-y-1.5 text-xs text-foreground font-normal">
                                <div className="font-semibold text-sm">{apt.title}</div>
                                <div className="flex items-center gap-1">
                                  <Home className="h-3 w-3" />
                                  {apt.surface_min} mp, {apt.rooms} camere
                                </div>
                                <div className="flex items-center gap-1">
                                  <Euro className="h-3 w-3" />
                                  {apt.price_min?.toLocaleString()} EUR
                                </div>
                                <Badge 
                                  variant={
                                    apt.availability_status === 'available' 
                                      ? 'default' 
                                      : apt.availability_status === 'reserved'
                                      ? 'secondary'
                                      : 'destructive'
                                  }
                                  className="text-xs"
                                >
                                  {getStatusLabel(apt.availability_status)}
                                </Badge>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Apartment Details Dialog */}
      <Dialog open={!!selectedApt} onOpenChange={() => setSelectedApt(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedApt?.title}</DialogTitle>
          </DialogHeader>
          
          {selectedApt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge 
                    variant={
                      selectedApt.availability_status === 'available' 
                        ? 'default' 
                        : selectedApt.availability_status === 'reserved'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {getStatusLabel(selectedApt.availability_status)}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Preț</p>
                  <p className="font-semibold text-lg">
                    {selectedApt.price_min?.toLocaleString()} EUR
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Suprafață</p>
                  <p className="font-semibold">{selectedApt.surface_min} mp</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Camere</p>
                  <p className="font-semibold">{selectedApt.rooms}</p>
                </div>
              </div>

              {selectedApt.features && selectedApt.features.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Caracteristici</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedApt.features.map((feature, idx) => (
                      <Badge key={idx} variant="outline">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedApt.floor_plan && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <img 
                    src={selectedApt.floor_plan} 
                    alt="Plan apartament"
                    className="w-full rounded-lg border"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={() => setSelectedApt(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Închide
                </Button>
                {isAuthenticated && onApartmentClick && (
                  <Button 
                    onClick={() => {
                      onApartmentClick(selectedApt);
                      setSelectedApt(null);
                    }}
                    className="flex-1"
                  >
                    Editează
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
