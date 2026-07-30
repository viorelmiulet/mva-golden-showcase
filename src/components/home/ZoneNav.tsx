import { Link } from "@/lib/router-compat";
import { HOME_ZONES } from "@/components/home/HeroBand";

const ZoneNav = () => (
  <section className="bg-secondary border-y border-stone">
    <div className="container mx-auto px-4 lg:px-6 py-6">
      <nav aria-label="Zone acoperite" className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {HOME_ZONES.map((zone) => (
          <Link
            key={zone}
            to={`/proprietati?zone=${encodeURIComponent(zone)}`}
            className="text-small text-muted-foreground hover:text-brass transition-colors"
          >
            {zone}
          </Link>
        ))}
      </nav>
    </div>
  </section>
);

export default ZoneNav;
