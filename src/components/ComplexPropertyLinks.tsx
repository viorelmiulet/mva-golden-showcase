import { Link } from "@/lib/router-compat";
import { getPropertyUrl } from "@/lib/propertySlug";

interface Props {
  properties: any[];
  complexName: string;
  /** Kept for API compatibility with previous card-based rendering. */
  development?: any;
}

/**
 * Crawlable list of the development's units.
 * Rendered as compact text links (no image cards) because complex units have
 * no photos of their own — placeholder cards looked broken.
 */
const ComplexPropertyLinks = ({ properties, complexName }: Props) => {
  if (!properties.length) return null;
  return (
    <section className="mt-8 sm:mt-10" aria-label={`Apartamente disponibile în ${complexName}`}>
      <h2 className="text-xl sm:text-2xl font-bold mb-4">
        Apartamente disponibile în {complexName}
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
        {properties.map((p) => (
          <li key={p.id}>
            <Link
              to={getPropertyUrl(p)}
              className="text-sm text-muted-foreground hover:text-brass transition-colors underline-offset-4 hover:underline"
            >
              {p.rooms ? `${p.rooms} camere` : "Unitate"}
              {p.surface_min ? ` · ${p.surface_min} mp` : ""}
              {p.price_min ? ` · ${Number(p.price_min).toLocaleString("ro-RO")} €` : ""}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ComplexPropertyLinks;
