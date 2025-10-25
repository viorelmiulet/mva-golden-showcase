import React, { useEffect, useState } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: string;
  title: string;
  location: string;
  price_min: number;
  rooms: number;
  images: any;
}

interface PropertiesMapProps {
  properties: Property[];
}

interface PropertyMarker extends Property {
  position: { lat: number; lng: number };
  index: number;
}

const PropertiesMap: React.FC<PropertiesMapProps> = ({ properties }) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyMarker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
  });

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('google-maps-token');
        
        if (error) throw error;
        if (!data?.token) throw new Error('No Google Maps API key received');

        setApiKey(data.token);
      } catch (error) {
        console.error('Error fetching Google Maps token:', error);
        const errorMessage = error instanceof Error ? error.message : 'Eroare la încărcarea hărții';
        setError(errorMessage);
        toast({
          title: "Eroare hartă",
          description: errorMessage,
          variant: "destructive",
        });
      }
    };

    fetchApiKey();
  }, [toast]);

  const mapCenter = { lat: 44.4268, lng: 26.1025 }; // Bucharest coordinates

  const getPropertyMarkers = () => {
    return properties.map((property, index) => {
      const randomOffset = () => (Math.random() - 0.5) * 0.1;
      const position = {
        lat: mapCenter.lat + randomOffset(),
        lng: mapCenter.lng + randomOffset(),
      };

      return { ...property, position, index };
    });
  };

  const propertyMarkers = getPropertyMarkers();

  if (error) {
    return (
      <div className="w-full h-[500px] rounded-lg bg-muted flex flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <p className="font-semibold text-lg mb-2">Eroare la încărcarea hărții</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded || !apiKey) {
    return (
      <div className="w-full h-[500px] rounded-lg bg-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-[500px] rounded-lg bg-muted flex flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <p className="font-semibold text-lg mb-2">Eroare la încărcarea hărții</p>
          <p className="text-sm text-muted-foreground">Google Maps nu a putut fi încărcat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden shadow-lg">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={mapCenter}
        zoom={11}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {propertyMarkers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            onClick={() => setSelectedProperty(marker)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#D4AF37',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            }}
          />
        ))}

        {selectedProperty && (
          <InfoWindow
            position={selectedProperty.position}
            onCloseClick={() => setSelectedProperty(null)}
          >
            <div className="p-2">
              <h3 className="font-semibold text-sm mb-1">{selectedProperty.title}</h3>
              <p className="text-xs text-gray-600 mb-1">{selectedProperty.location}</p>
              <p className="text-xs font-semibold">{selectedProperty.price_min.toLocaleString()} €</p>
              <p className="text-xs text-gray-500">{selectedProperty.rooms} camere</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default PropertiesMap;
