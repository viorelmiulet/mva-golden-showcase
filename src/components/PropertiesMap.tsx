import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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

const PropertiesMap: React.FC<PropertiesMapProps> = ({ properties }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initMap = async () => {
      if (!mapContainer.current) return;

      try {
        console.log('Initializing map...');
        
        // Get Mapbox token from edge function
        const { data, error } = await supabase.functions.invoke('mapbox-token');
        
        console.log('Mapbox token response:', { data, error });
        
        if (error) {
          console.error('Error fetching token:', error);
          throw error;
        }
        if (!data?.token) {
          console.error('No token in response');
          throw new Error('No token received');
        }

        mapboxgl.accessToken = data.token;

        // Initialize map centered on Bucharest
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [26.1025, 44.4268], // Bucharest coordinates
          zoom: 11,
        });

        // Add navigation controls
        map.current.addControl(
          new mapboxgl.NavigationControl(),
          'top-right'
        );

        // Add markers for properties with approximate coordinates
        // In a real app, you'd geocode the addresses or store coordinates
        const bucharest = { lng: 26.1025, lat: 44.4268 };
        
        properties.forEach((property, index) => {
          // Spread markers around Bucharest (approximate locations)
          const randomOffset = () => (Math.random() - 0.5) * 0.1;
          const coordinates: [number, number] = [
            bucharest.lng + randomOffset(),
            bucharest.lat + randomOffset()
          ];

          // Create popup with property info
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <h3 class="font-semibold text-sm mb-1">${property.title}</h3>
              <p class="text-xs text-gray-600 mb-1">${property.location}</p>
              <p class="text-xs font-semibold">${property.price_min.toLocaleString()} €</p>
              <p class="text-xs text-gray-500">${property.rooms} camere</p>
            </div>
          `);

          // Create custom marker
          const el = document.createElement('div');
          el.className = 'custom-marker';
          el.style.width = '30px';
          el.style.height = '30px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = '#D4AF37';
          el.style.border = '3px solid white';
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
          el.style.cursor = 'pointer';

          // Add marker to map
          new mapboxgl.Marker(el)
            .setLngLat(coordinates)
            .setPopup(popup)
            .addTo(map.current!);
        });

        setIsLoading(false);
        console.log('Map initialized successfully');
      } catch (error) {
        console.error('Error initializing map:', error);
        const errorMessage = error instanceof Error ? error.message : 'Eroare la încărcarea hărții';
        setError(errorMessage);
        setIsLoading(false);
        
        toast({
          title: "Eroare hartă",
          description: errorMessage,
          variant: "destructive",
        });
      }
    };

    initMap();

    return () => {
      map.current?.remove();
    };
  }, [properties]);

  if (isLoading) {
    return (
      <div className="w-full h-[500px] rounded-lg bg-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden shadow-lg">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default PropertiesMap;
