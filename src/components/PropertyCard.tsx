import { Link } from "@/lib/router-compat";
import OptimizedPropertyImage from "@/components/OptimizedPropertyImage";
import SpecRail from "@/components/SpecRail";
import { getPropertyUrl } from "@/lib/propertySlug";

const isCoordinates = (str: string | null | undefined) =>
  !!str && (/^\d{2,}\.\d{3,}/.test(str.trim()) || /^-?\d+\.\d+,?\s*-?\d+\.\d+$/.test(str.trim()));

export const getCardZone = (p: any): string => {
  if (p.zone && !isCoordinates(p.zone)) return p.zone;
  if (p.location && !isCoordinates(p.location)) return p.location;
  if (p.city && !isCoordinates(p.city)) return p.city;
  if (p.project_name) return p.project_name;
  return "București";
};

export const formatCardPrice = (value: number | null | undefined, currency?: string | null) => {
  if (!value) return "Preț la cerere";
  const symbol = (currency || "EUR").toUpperCase() === "EUR" ? "€" : currency;
  return `${Number(value).toLocaleString("ro-RO")} ${symbol}`;
};

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

interface PropertyCardProps {
  property: any;
  priority?: boolean;
  /** Override the destination URL (e.g. Immoflux route) */
  to?: string;
}

const PropertyCard = ({ property: p, priority = false, to }: PropertyCardProps) => {
  const badge = getBadge(p);
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
        {badge && (
          <span className="absolute top-2 left-2 bg-pine text-paper text-spec px-2 py-1 rounded-sm">
            {badge}
          </span>
        )}
      </div>

      <p className="mt-3 font-sans font-semibold text-[1.375rem] leading-tight tabular text-foreground">
        {formatCardPrice(p.price_min, p.currency)}
      </p>
      <p className="text-small text-muted-foreground mt-1">{getCardZone(p)}</p>
      <SpecRail
        className="mt-2"
        items={[
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
