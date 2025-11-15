import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Euro, Home, MapPin, CheckCircle2, XCircle, Clock, FileText, X } from "lucide-react";
import { useState } from "react";

interface Apartment {
  id: string;
  title: string;
  price_min?: number;
  price_max?: number;
  surface_min?: number;
  surface_max?: number;
  rooms?: number;
  availability_status?: string;
  features?: string[];
  amenities?: string[];
  description?: string;
  floor_plan?: string;
  images?: string[];
  location?: string;
}

interface ApartmentComparisonProps {
  apartments: Apartment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoveApartment: (id: string) => void;
}

const getStatusInfo = (status?: string) => {
  switch (status) {
    case 'available':
      return { icon: CheckCircle2, label: 'Disponibil', variant: 'default' as const, color: 'text-green-500' };
    case 'reserved':
      return { icon: Clock, label: 'Rezervat', variant: 'secondary' as const, color: 'text-yellow-500' };
    case 'sold':
      return { icon: XCircle, label: 'Vândut', variant: 'destructive' as const, color: 'text-red-500' };
    default:
      return { icon: Home, label: 'Necunoscut', variant: 'outline' as const, color: 'text-muted-foreground' };
  }
};

export const ApartmentComparison = ({ 
  apartments, 
  open, 
  onOpenChange,
  onRemoveApartment 
}: ApartmentComparisonProps) => {
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<string | null>(null);

  const formatPrice = (min?: number, max?: number) => {
    if (!min && !max) return 'La cerere';
    if (min === max || !max) return `${min?.toLocaleString('ro-RO')} €`;
    return `${min?.toLocaleString('ro-RO')} - ${max?.toLocaleString('ro-RO')} €`;
  };

  const formatSurface = (min?: number, max?: number) => {
    if (!min && !max) return 'N/A';
    if (min === max || !max) return `${min} mp`;
    return `${min} - ${max} mp`;
  };

  const getFloorFromFeatures = (features?: string[]) => {
    const featureStr = features?.[0] || '';
    if (featureStr.includes('Etaj:')) {
      const floorCode = featureStr.split('Etaj:')[1]?.trim().split(' ')[0];
      if (floorCode === 'P') return 'Parter';
      if (floorCode?.startsWith('E')) return `Etajul ${floorCode.substring(1)}`;
      return floorCode;
    }
    return 'N/A';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Comparare Apartamente ({apartments.length})</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-full pr-4">
            <div className="grid grid-cols-1 gap-6">
              {/* Header Row */}
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${apartments.length}, minmax(300px, 1fr))` }}>
                {apartments.map((apt) => (
                  <Card key={apt.id} className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => onRemoveApartment(apt.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <CardHeader>
                      <CardTitle className="text-lg">{apt.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {apt.images?.[0] && (
                        <img
                          src={apt.images[0]}
                          alt={apt.title}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Price Row */}
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${apartments.length}, minmax(300px, 1fr))` }}>
                {apartments.map((apt) => (
                  <Card key={apt.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                        <Euro className="h-4 w-4" />
                        Preț
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl font-bold text-primary">
                        {formatPrice(apt.price_min, apt.price_max)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Surface Row */}
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${apartments.length}, minmax(300px, 1fr))` }}>
                {apartments.map((apt) => (
                  <Card key={apt.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Suprafață
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold">
                        {formatSurface(apt.surface_min, apt.surface_max)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Rooms Row */}
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${apartments.length}, minmax(300px, 1fr))` }}>
                {apartments.map((apt) => (
                  <Card key={apt.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground">Camere</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold">{apt.rooms || 'N/A'}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Floor Row */}
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${apartments.length}, minmax(300px, 1fr))` }}>
                {apartments.map((apt) => (
                  <Card key={apt.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground">Etaj</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold">{getFloorFromFeatures(apt.features)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Status Row */}
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${apartments.length}, minmax(300px, 1fr))` }}>
                {apartments.map((apt) => {
                  const status = getStatusInfo(apt.availability_status);
                  const StatusIcon = status.icon;
                  return (
                    <Card key={apt.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant={status.variant} className="gap-2">
                          <StatusIcon className={`h-4 w-4 ${status.color}`} />
                          {status.label}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Features Row */}
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${apartments.length}, minmax(300px, 1fr))` }}>
                {apartments.map((apt) => (
                  <Card key={apt.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground">Caracteristici</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        {apt.features && apt.features.length > 0 ? (
                          apt.features.map((feature, idx) => (
                            <p key={idx} className="text-sm">{feature}</p>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Fără caracteristici</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Amenities Row */}
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${apartments.length}, minmax(300px, 1fr))` }}>
                {apartments.map((apt) => (
                  <Card key={apt.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground">Facilități</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        {apt.amenities && apt.amenities.length > 0 ? (
                          apt.amenities.map((amenity, idx) => (
                            <p key={idx} className="text-sm">{amenity}</p>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Fără facilități</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Floor Plan Row */}
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${apartments.length}, minmax(300px, 1fr))` }}>
                {apartments.map((apt) => (
                  <Card key={apt.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Plan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {apt.floor_plan ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedFloorPlan(apt.floor_plan!)}
                        >
                          Vezi planul
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground">Fără plan</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Description Row */}
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${apartments.length}, minmax(300px, 1fr))` }}>
                {apartments.map((apt) => (
                  <Card key={apt.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground">Descriere</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {apt.description || 'Fără descriere disponibilă'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Floor Plan Dialog */}
      <Dialog open={!!selectedFloorPlan} onOpenChange={() => setSelectedFloorPlan(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Plan Apartament</DialogTitle>
          </DialogHeader>
          {selectedFloorPlan && (
            <div className="relative w-full">
              <img
                src={selectedFloorPlan}
                alt="Plan apartament"
                className="w-full h-auto"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
