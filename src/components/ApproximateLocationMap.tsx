import { useEffect, useRef, useState } from "react";
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
 * Displays an approximate location on Google Maps via iframe embed.
 * - Coordinates are rounded to ~3 decimals (~110m precision) so the exact
 *   address is never exposed.
 * - A semi-transparent circle (~radiusMeters) is overlaid to communicate
 *   the approximation. The map zoom is picked so the circle always
 *   covers ~55% of the smaller container side, on every breakpoint.
 * - No marker is shown.
 */
export const ApproximateLocationMap = ({
  latitude,
  longitude,
  locationLabel,
  radiusMeters = 2000,
}: ApproximateLocationMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [mapConsent, setMapConsent] = useState(false);

  useEffect(() => {
    // Initial read of consent state set by CookieConsent (Marketing category)
    const consent = (window as unknown as { __mvaConsent?: { marketing?: boolean } }).__mvaConsent;
    if (consent?.marketing) setMapConsent(true);
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<{ marketing?: boolean }>).detail;
      setMapConsent(Boolean(detail?.marketing));
    };
    window.addEventListener("mva-consent-change", onChange as EventListener);
    return () => window.removeEventListener("mva-consent-change", onChange as EventListener);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!latitude || !longitude) return null;

  // Round to ~110m precision so we never leak the precise address
  const lat = Math.round(latitude * 1000) / 1000;
  const lng = Math.round(longitude * 1000) / 1000;

  // Pick a zoom so the 2*radius diameter fits ~55% of the smaller side.
  // metersPerPixel(zoom) = 156543.03392 * cos(lat) / 2^zoom
  // We want: diameter / mpp ≈ 0.55 * minSide  →  mpp ≈ (2*radius) / (0.55*minSide)
  const minSide = Math.min(size.w || 320, size.h || 320);
  const targetMpp = (2 * radiusMeters) / (0.55 * minSide);
  const cosLat = Math.cos((lat * Math.PI) / 180);
  let zoom = Math.log2((156543.03392 * cosLat) / targetMpp);
  zoom = Math.max(11, Math.min(15, Math.round(zoom)));

  const metersPerPixel = (156543.03392 * cosLat) / Math.pow(2, zoom);
  const circleDiameterPx = Math.round((2 * radiusMeters) / metersPerPixel);

  // Google Maps embed (no API key, no marker). Use q= to guarantee centering on the coords.
  const src = `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&hl=ro&t=m&output=embed`;

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

      <div
        ref={containerRef}
        className="relative w-full h-[300px] sm:h-[400px] md:h-[460px] rounded-lg overflow-hidden border border-gold/20 bg-muted"
      >
        <iframe
          title="Locație aproximativă proprietate"
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          style={{ border: 0, display: "block", width: "100%", height: "100%" }}
          allowFullScreen
        />
        {/* Approximation circle overlay — centered, sized to ~2km, never overflowing */}
        {size.w > 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className="rounded-full"
              style={{
                width: circleDiameterPx,
                height: circleDiameterPx,
                maxWidth: "85%",
                maxHeight: "85%",
                background: "hsl(var(--primary) / 0.18)",
                border: "2px solid hsl(var(--primary) / 0.55)",
              }}
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      <p className="text-[11px] sm:text-xs text-muted-foreground">
        Din motive de confidențialitate, locația afișată este aproximativă (rază de ~{(radiusMeters / 1000).toLocaleString('ro-RO')} km).
        Adresa exactă se comunică la programarea vizionării.
      </p>
    </section>
  );
};

export default ApproximateLocationMap;
