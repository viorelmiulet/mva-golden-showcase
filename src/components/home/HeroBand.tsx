import { useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildTypeOptions, normalizeType } from "@/lib/propertyType";

export const HOME_ZONES = [
  "Militari",
  "Chiajna",
  "Sector 6",
  "Sector 5",
  "Sector 1",
  "Sector 2",
  "Sector 3",
  "Sector 4",
  "Ilfov",
];

const ROOMS = ["1", "2", "3", "4"];
const MAX_PRICES = [60000, 80000, 100000, 130000, 160000, 200000];

const selectClass =
  "h-11 w-full rounded-sm border border-stone bg-card px-3 text-small text-foreground focus-visible:outline-hidden";

const normalize = (s: string) =>
  s.toLowerCase().replace(/[ăâ]/g, "a").replace(/î/g, "i").replace(/[șş]/g, "s").replace(/[țţ]/g, "t");

const HeroBand = () => {
  const navigate = useNavigate();
  const [propertyType, setPropertyType] = useState("");
  const [zone, setZone] = useState("");
  const [rooms, setRooms] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const { data: activeCount } = useQuery({
    queryKey: ["home-active-offers-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("catalog_offers")
        .select("id", { count: "exact", head: true })
        .is("project_id", null)
        .neq("availability_status", "sold")
        .neq("is_published", false);
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  /** Types actually present in the live portfolio — never a hardcoded list. */
  const { data: typeOptions = [] } = useQuery({
    queryKey: ["home-property-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_offers")
        .select("property_type, rooms, title")
        .is("project_id", null)
        .neq("availability_status", "sold")
        .neq("is_published", false);
      if (error) throw error;
      return buildTypeOptions(data || []);
    },
    staleTime: 5 * 60 * 1000,
  });

  const isStudio = normalizeType(propertyType) === "garsoniera";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (propertyType) params.set("tip_proprietate", propertyType);
    if (zone) params.set("zona", zone);
    if (rooms && !isStudio) params.set("camere", rooms);
    if (priceMax) params.set("pret_max", priceMax);
    navigate(`/proprietati${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <section className="bg-background border-b border-stone">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="max-w-5xl py-10 md:py-12 md:max-h-[320px]">
          <p className="text-spec text-brass mb-3">
            {(activeCount ?? 0).toLocaleString("ro-RO")} PROPRIETĂȚI ACTIVE · ACTUALIZAT ZILNIC
          </p>

          <h1 className="text-display-xl text-foreground">Apartamente noi în București</h1>

          <p className="text-body text-muted-foreground mt-3 max-w-2xl">
            Ansambluri rezidențiale în toată Capitala, cu expertiză aprofundată în Militari și Chiajna.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:flex md:items-center"
            aria-label="Caută proprietăți"
          >
            {typeOptions.length > 0 && (
              <>
                <label className="sr-only" htmlFor="hero-type">Tip proprietate</label>
                <select
                  id="hero-type"
                  className={`${selectClass} md:w-52`}
                  value={propertyType}
                  onChange={(e) => {
                    setPropertyType(e.target.value);
                    if (normalize(e.target.value) === "garsoniera") setRooms("");
                  }}
                >
                  <option value="">Tip proprietate</option>
                  {typeOptions.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </>
            )}

            <label className="sr-only" htmlFor="hero-zone">Zonă</label>
            <select id="hero-zone" className={`${selectClass} md:w-48`} value={zone} onChange={(e) => setZone(e.target.value)}>
              <option value="">Zonă</option>
              {HOME_ZONES.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>

            {!isStudio && (
              <>
                <label className="sr-only" htmlFor="hero-rooms">Camere</label>
                <select id="hero-rooms" className={`${selectClass} md:w-40`} value={rooms} onChange={(e) => setRooms(e.target.value)}>
                  <option value="">Camere</option>
                  {ROOMS.map((r) => (
                    <option key={r} value={r}>{r === "4" ? "4+ camere" : `${r} ${r === "1" ? "cameră" : "camere"}`}</option>
                  ))}
                </select>
              </>
            )}

            <label className="sr-only" htmlFor="hero-price">Preț maxim</label>
            <select id="hero-price" className={`${selectClass} md:w-48`} value={priceMax} onChange={(e) => setPriceMax(e.target.value)}>
              <option value="">Preț maxim</option>
              {MAX_PRICES.map((p) => (
                <option key={p} value={String(p)}>{p.toLocaleString("ro-RO")} €</option>
              ))}
            </select>

            <button
              type="submit"
              className="h-11 rounded-sm bg-brass px-8 text-small font-semibold text-paper transition-colors hover:bg-brass-dark"
            >
              Caută
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};


export default HeroBand;
