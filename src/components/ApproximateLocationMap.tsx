import { MapPin } from "lucide-react";

interface ApproximateLocationMapProps {
  latitude: number;
  longitude: number;
  locationLabel?: string;
  /** Approximation radius in meters (visual circle). Default 500m. */
  radiusMeters?: number;
}

/**
 * Displays an approximate location on Google Maps via iframe embed.
 * - Coordinates are rounded to ~3 decimals (~110m precision) so the exact
 *   address is never exposed.
 * - A semi-transparent circle is overlaid to communicate the approximation.
 * - No marker is shown.
 */
export const ApproximateLocationMap = ({
  latitude,
  longitude,
  locationLabel,
  radiusMeters = 2000,
}: ApproximateLocationMapProps) => {
  if (!latitude || !longitude) return null;

  // Round to ~110m precision so we never leak the precise address
  const lat = Math.round(latitude * 1000) / 1000;
  const lng = Math.round(longitude * 1000) / 1000;

  // Bounding box for ~2km radius around the point (1° lat ≈ 111km)
  const latDelta = radiusMeters / 111000;
  const lngDelta = radiusMeters / (111000 * Math.cos((lat * Math.PI) / 180));
  const bbox = `${lng - lngDelta},${lat - latDelta},${lng + lngDelta},${lat + latDelta}`;

  // OpenStreetMap embed: full map, no marker, framed to the 2km bbox
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;

  return (
    <section aria-label="Locație aproximativă" className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
          Locație aproximativă
        </h2>
        {locationLabel && (
          <span className="text-xs sm:text-sm text-muted-foreground">
            {locationLabel}
          </span>
        )}
      </div>

      <div className="relative w-full h-[280px] sm:h-[360px] rounded-lg overflow-hidden border border-gold/20 bg-muted">
        <iframe
          title="Locație aproximativă proprietate"
          src={src}
          width="100%"
          height="100%"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          style={{ border: 0 }}
          allowFullScreen
        />
        {/* Approximation circle overlay (visual only, non-interactive) */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-full"
            style={{
              width: 180,
              height: 180,
              background: "hsl(var(--primary) / 0.18)",
              border: "2px solid hsl(var(--primary) / 0.55)",
              boxShadow: "0 0 0 9999px hsl(0 0% 0% / 0.0)",
            }}
            aria-hidden="true"
          />
        </div>
      </div>

      <p className="text-[11px] sm:text-xs text-muted-foreground">
        Din motive de confidențialitate, locația afișată este aproximativă (rază de ~{radiusMeters} m).
        Adresa exactă se comunică la programarea vizionării.
      </p>
    </section>
  );
};

export default ApproximateLocationMap;
