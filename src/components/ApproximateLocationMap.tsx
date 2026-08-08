import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApproximateLocationMapProps {
  latitude: number;
  longitude: number;
  locationLabel?: string;
  /** Approximation radius in meters (visual circle). Default 2000m. */
  radiusMeters?: number;
}

/**
 * Approximate location on an OpenStreetMap (Leaflet) map.
 * - OSM tiles set no cookies, so the map renders for everyone with no consent gate.
 * - Coordinates are rounded to ~3 decimals (~110m) and only a ~2km circle is
 *   drawn: no marker, no exact address.
 */
export const ApproximateLocationMap = ({
  latitude,
  longitude,
  locationLabel,
  radiusMeters = 2000,
}: ApproximateLocationMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  const lat = Math.round(latitude * 1000) / 1000;
  const lng = Math.round(longitude * 1000) / 1000;

  useEffect(() => {
    if (!containerRef.current || !latitude || !longitude) return;
    let cancelled = false;
    let map: any;

    // Leaflet touches window/document, so it is only imported in the browser.
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true,
      }).setView([lat, lng], 13);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const circle = L.circle([lat, lng], {
        radius: radiusMeters,
        color: "hsl(var(--primary))",
        weight: 2,
        opacity: 0.55,
        fillColor: "hsl(var(--primary))",
        fillOpacity: 0.18,
      }).addTo(map);

      map.fitBounds(circle.getBounds(), { padding: [16, 16] });
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 100);
    })();

    return () => {
      cancelled = true;
      if (map) map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, radiusMeters, latitude, longitude]);

  if (!latitude || !longitude) return null;

  return (
    <section aria-label="Locație aproximativă" className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-brass" />
          Locație aproximativă
        </h2>
        {locationLabel && (
          <span className="text-xs sm:text-sm text-muted-foreground">{locationLabel}</span>
        )}
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-[300px] sm:h-[400px] md:h-[460px] rounded-lg overflow-hidden border border-brass/20 bg-muted z-0"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] sm:text-xs text-muted-foreground max-w-xl">
          Din motive de confidențialitate, locația afișată este aproximativă (rază de ~
          {(radiusMeters / 1000).toLocaleString("ro-RO")} km). Adresa exactă se comunică la
          programarea vizionării.
        </p>
        <Button size="sm" variant="outline" asChild>
          <a
            href={`https://www.google.com/maps?q=${lat},${lng}&z=13`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Deschide în Google Maps
          </a>
        </Button>
      </div>
    </section>
  );
};

export default ApproximateLocationMap;
