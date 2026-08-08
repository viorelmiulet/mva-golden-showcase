import { Link } from "@/lib/router-compat";
import OptimizedPropertyImage from "@/components/OptimizedPropertyImage";
import SpecRail from "@/components/SpecRail";
import { getPropertyUrl } from "@/lib/propertySlug";
import { hasVideo } from "@/lib/videoEmbed";
import { Play } from "lucide-react";

const isCoordinates = (str: string | null | undefined) =>
  !!str && (/^\d{2,}\.\d{3,}/.test(str.trim()) || /^-?\d+\.\d+,?\s*-?\d+\.\d+$/.test(str.trim()));

export const getCardZone = (p: any): string => {
  if (p.zone && !isCoordinates(p.zone)) return p.zone;
  if (p.location && !isCoordinates(p.location)) return p.location;
  if (p.city && !isCoordinates(p.city)) return p.city;
  if (p.project_name) return p.project_name;
  return "București";
};

export const formatCardPrice = (
  value: number | null | undefined,
  currency?: string | null,
  perMonth = false
) => {
  if (!value) return "Preț la cerere";
  const symbol = (currency || "EUR").toUpperCase() === "EUR" ? "€" : currency;
  return `${Number(value).toLocaleString("ro-RO")} ${symbol}${perMonth ? "/lună" : ""}`;
};

/** Rentals show a monthly price, so the card must say so. */
const isRental = (p: any) =>
  String(p?.transaction_type || "").toLowerCase() === "rent" ||
  (!p?.transaction_type && Number(p?.price_min) > 0 && Number(p?.price_min) < 3000);

/** Exactly one badge, or none. COMISION 0% wins over NOU. */
const getBadge = (p: any): "COMISION 0%" | "NOU" | null => {
  const zeroCommission =
    Number(p.commission_value) === 0 || String(p.commission_type || "").toLowerCase().includes("0");
  if (zeroCommission) return "COMISION 0%";
  const created = p.created_at ? new Date(p.created_at).getTime() : 0;
  if (created && Date.now() - created < 21 * 24 * 60 * 60 * 1000) return "NOU";
  return null;
};

const floorLabel = (p: any) => {
  if (p.floor_label) return String(p.floor_label);
  if (p.floor === 0) return "PARTER";
  if (typeof p.floor === "number") return `ET ${p.floor}`;
  return null;
};

/** Only surface the type when it isn't an apartment/garsonieră — those are implied by the room count. */
const typeLabel = (p: any) => {
  const raw = String(p.property_type || "").trim();
  if (!raw) return null;
  const norm = raw
    .toLowerCase()
    .replace(/[ăâ]/g, "a")
    .replace(/î/g, "i")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t");
  if (norm.includes("apartament") || norm.includes("garsoniera")) return null;
  return raw.toUpperCase();
};

interface PropertyCardProps {
  property: any;
  priority?: boolean;
  /** Override the destination URL (e.g. Immoflux route) */
  to?: string;
  /** Parent development, so the badge matches the detail page's video resolution. */
  development?: any;
}

const PropertyCard = ({ property: p, priority = false, to, development }: PropertyCardProps) => {
  const badge = getBadge(p);
  const video = hasVideo(p, development);
  return (
    <Link to={to || getPropertyUrl(p)} className="group block">
      <div className="relative overflow-hidden rounded-sm border border-stone">
        <OptimizedPropertyImage
          src={p.images?.[0]}
          alt={`${p.title || "Proprietate"} — ${getCardZone(p)}`}
          aspectRatio="4/3"
          className="w-full h-full object-cover"
          width={640}
          height={480}
          quality={75}
          priority={priority}
        />
        {/* Status badge and VIDEO share one row; on narrow cards VIDEO drops and the glyph stands in. */}
        {(badge || video) && (
          <div className="absolute top-2 left-2 right-2 flex items-center gap-1.5">
            {badge && (
              <span className="bg-pine text-paper text-spec px-2 py-1 rounded-sm">{badge}</span>
            )}
            {video && (
              <span
                className={`bg-brass text-ink text-spec px-2 py-1 rounded-sm ${badge ? "hidden sm:inline-block" : ""}`}
              >
                VIDEO
              </span>
            )}
          </div>
        )}
        {video && badge && (
          <span
            className="sm:hidden absolute bottom-2 right-2 flex items-center justify-center w-7 h-7 rounded-full bg-ink/70 text-paper"
            aria-label="Anunț cu videoclip"
          >
            <Play className="w-3.5 h-3.5" aria-hidden="true" fill="currentColor" />
          </span>
        )}
      </div>

      <p className="mt-3 font-sans font-semibold text-[1.375rem] leading-tight tabular text-foreground">
        {formatCardPrice(p.price_min, p.currency, isRental(p))}
      </p>
      <p className="text-small text-muted-foreground mt-1">{getCardZone(p)}</p>
      <SpecRail
        className="mt-2"
        items={[
          typeLabel(p),
          p.rooms ? `${p.rooms} CAM` : null,
          p.surface_min ? `${p.surface_min} MP` : null,
          floorLabel(p),
          p.year_built || null,
        ]}
      />
    </Link>
  );
};

/** Skeleton matching the real card dimensions exactly. */
export const PropertyCardSkeleton = () => (
  <div className="opacity-60">
    <div className="w-full aspect-[4/3] bg-stone rounded-sm border border-stone" />
    <div className="mt-3 h-[1.375rem] w-32 bg-stone rounded-sm" />
    <div className="mt-2 h-4 w-24 bg-stone rounded-sm" />
    <div className="mt-2 h-4 w-40 bg-stone rounded-sm" />
  </div>
);

export default PropertyCard;
