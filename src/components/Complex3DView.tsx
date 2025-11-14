import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, Box, Environment } from "@react-three/drei";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import * as THREE from "three";

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

interface Complex3DViewProps {
  properties: Apartment[];
  onApartmentClick?: (apartment: Apartment) => void;
  isAuthenticated?: boolean;
}

interface ApartmentBoxProps {
  apartment: Apartment;
  position: [number, number, number];
  onHover: (aptId: string | null) => void;
  onClick: (apt: Apartment) => void;
  isHovered: boolean;
}

const ApartmentBox = ({ apartment, position, onHover, onClick, isHovered }: ApartmentBoxProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#22c55e'; // green
      case 'reserved':
        return '#eab308'; // yellow
      case 'sold':
        return '#ef4444'; // red
      default:
        return '#9ca3af'; // gray
    }
  };

  const color = getStatusColor(apartment.availability_status);
  const aptNumber = apartment.title.match(/\d+/)?.[0] || '?';

  return (
    <group position={position}>
      <Box
        args={[0.8, 0.6, 0.8]}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(apartment.id);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(apartment);
        }}
        scale={isHovered ? 1.15 : 1}
      >
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={isHovered ? 0.4 : 0.2}
          metalness={0.3}
          roughness={0.5}
        />
      </Box>
      <Text
        position={[0, 0, 0.41]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {aptNumber}
      </Text>
    </group>
  );
};

const Building3D = ({ properties, onApartmentClick }: Omit<Complex3DViewProps, 'isAuthenticated'>) => {
  const [hoveredApt, setHoveredApt] = useState<string | null>(null);

  // Group properties by floor
  const groupedByFloor = useMemo(() => {
    return properties?.reduce((acc, prop) => {
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
  }, [properties]);

  const floorOrder = ['Etaj 5', 'Etaj 4', 'Etaj 3', 'Etaj 2', 'Etaj 1', 'Parter', 'Demisol'];
  const sortedFloors = Object.keys(groupedByFloor || {})
    .filter(floor => groupedByFloor[floor].length > 0)
    .sort((a, b) => floorOrder.indexOf(a) - floorOrder.indexOf(b));

  // Calculate positions for apartments
  const apartmentPositions = useMemo(() => {
    const positions: { apartment: Apartment; position: [number, number, number] }[] = [];
    let floorHeight = 0;

    sortedFloors.forEach((floor, floorIndex) => {
      const apartments = groupedByFloor[floor] || [];
      const aptsPerRow = Math.min(8, apartments.length);
      const rows = Math.ceil(apartments.length / aptsPerRow);
      
      apartments.forEach((apt, aptIndex) => {
        const row = Math.floor(aptIndex / aptsPerRow);
        const col = aptIndex % aptsPerRow;
        
        const x = (col - (aptsPerRow - 1) / 2) * 1;
        const y = floorHeight;
        const z = row * 1;
        
        positions.push({
          apartment: apt,
          position: [x, y, z]
        });
      });
      
      floorHeight += 1;
    });

    return positions;
  }, [sortedFloors, groupedByFloor]);

  return (
    <>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>

      {/* Apartments */}
      {apartmentPositions.map(({ apartment, position }) => (
        <ApartmentBox
          key={apartment.id}
          apartment={apartment}
          position={position}
          onHover={setHoveredApt}
          onClick={(apt) => onApartmentClick?.(apt)}
          isHovered={hoveredApt === apartment.id}
        />
      ))}

      {/* Floor labels */}
      {sortedFloors.map((floor, index) => (
        <Text
          key={floor}
          position={[-5, index, -1]}
          fontSize={0.3}
          color="#6b7280"
          anchorX="left"
          anchorY="middle"
        >
          {floor}
        </Text>
      ))}

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-10, 10, -5]} intensity={0.5} />
      
      {/* Environment */}
      <Environment preset="city" />
      
      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
};

export const Complex3DView = ({ properties, onApartmentClick, isAuthenticated }: Complex3DViewProps) => {
  const [selectedApt, setSelectedApt] = useState<Apartment | null>(null);

  const handleApartmentClick = (apt: Apartment) => {
    setSelectedApt(apt);
    if (onApartmentClick) {
      onApartmentClick(apt);
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

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Vizualizare 3D Complex</CardTitle>
            </div>
            <div className="flex gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>Disponibil</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-yellow-500" />
                <span>Rezervat</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span>Vândut</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[600px] rounded-lg overflow-hidden bg-gradient-to-b from-background to-muted/20 border">
            <Canvas
              camera={{ position: [8, 6, 8], fov: 50 }}
              shadows
              gl={{ antialias: true }}
            >
              <Building3D properties={properties} onApartmentClick={handleApartmentClick} />
            </Canvas>
          </div>
          <div className="mt-4 text-sm text-muted-foreground text-center">
            🖱️ Rotește: click stânga • Deplasează: click dreapta • Zoom: scroll
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
