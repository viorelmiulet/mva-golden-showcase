import PropertyCard from "@/components/PropertyCard";

interface Props {
  properties: any[];
  complexName: string;
}

/**
 * Crawlable list of the development's units: real <a href="/proprietati/{slug}">
 * cards rendered server-side.
 */
const ComplexPropertyLinks = ({ properties, complexName }: Props) => {
  if (!properties.length) return null;
  return (
    <section className="mt-8 sm:mt-10" aria-label={`Apartamente disponibile în ${complexName}`}>
      <h2 className="text-xl sm:text-2xl font-bold mb-4">
        Apartamente disponibile în {complexName}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {properties.map((p, i) => (
          <PropertyCard key={p.id} property={p} priority={i < 2} />
        ))}
      </div>
    </section>
  );
};

export default ComplexPropertyLinks;
