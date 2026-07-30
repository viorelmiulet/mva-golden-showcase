import { useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

const HeroBand = () => {
  const navigate = useNavigate();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (zone) params.set("zone", zone);
    if (rooms) params.set("rooms", rooms);
    if (priceMax) params.set("priceMax", priceMax);
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
            <label className="sr-only" htmlFor="hero-zone">Zonă</label>
            <select id="hero-zone" className={`${selectClass} md:w-48`} value={zone} onChange={(e) => setZone(e.target.value)}>
              <option value="">Zonă</option>
              {HOME_ZONES.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>

            <label className="sr-only" htmlFor="hero-rooms">Camere</label>
            <select id="hero-rooms" className={`${selectClass} md:w-40`} value={rooms} onChange={(e) => setRooms(e.target.value)}>
              <option value="">Camere</option>
              {ROOMS.map((r) => (
                <option key={r} value={r}>{r === "4" ? "4+ camere" : `${r} ${r === "1" ? "cameră" : "camere"}`}</option>
              ))}
            </select>

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
