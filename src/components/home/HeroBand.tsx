import { useState } from "react";
import { useNavigate, Link } from "@/lib/router-compat";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildTypeOptions, normalizeType } from "@/lib/propertyType";
import { useContactDialog } from "@/components/contact/ContactDialogProvider";
import heroImage from "@/assets/hero-mva.jpg";


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
const MAX_RENTS = [300, 400, 500, 700, 1000, 1500, 2000];

const selectClass =
  "h-11 w-full rounded-sm border border-stone bg-card px-3 text-small text-foreground focus-visible:outline-hidden";

const normalize = normalizeType;

const HeroBand = () => {
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState("");
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

  /** Show the transaction control only when both sale and rent listings are live. */
  const { data: showTransaction = false } = useQuery({
    queryKey: ["home-transaction-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_offers")
        .select("transaction_type")
        .is("project_id", null)
        .neq("availability_status", "sold")
        .neq("is_published", false);
      if (error) throw error;
      const set = new Set((data || []).map((r: any) => (r.transaction_type === "rent" ? "rent" : "sale")));
      return set.has("sale") && set.has("rent");
    },
    staleTime: 5 * 60 * 1000,
  });

  const isStudio = normalizeType(propertyType) === "garsoniera";
  const isRent = transaction === "inchiriere";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (transaction) params.set("tranzactie", transaction);
    if (propertyType) params.set("tip_proprietate", propertyType);
    if (zone) params.set("zona", zone);
    if (rooms && !isStudio) params.set("camere", rooms);
    if (priceMax) params.set("pret_max", priceMax);
    navigate(`/proprietati${params.toString() ? `?${params.toString()}` : ""}`);
  };


  return (
    <section className="relative isolate overflow-hidden bg-ink">
      <img
        src={heroImage}
        alt="Ansamblu rezidențial modern în București"
        width={1920}
        height={1088}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover opacity-45"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" aria-hidden="true" />

      <div className="relative container mx-auto px-4 lg:px-6">
        <div className="max-w-3xl py-16 md:py-24">
          <p className="text-spec text-brass mb-4">
            {(activeCount ?? 0).toLocaleString("ro-RO")} PROPRIETĂȚI ACTIVE · ACTUALIZAT ZILNIC
          </p>

          <h1 className="text-display-xl text-paper">
            Găsim împreună locuința potrivită în București
          </h1>

          <p className="text-body text-paper/75 mt-4 max-w-xl">
            Consultanță imobiliară completă pentru vânzare, cumpărare și închiriere — cu expertiză
            aprofundată în Militari, Chiajna și vestul Capitalei.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/proprietati"
              className="inline-flex h-12 items-center rounded-sm bg-brass px-7 text-small font-semibold uppercase tracking-wide text-ink transition-colors duration-200 hover:bg-brass-light"
            >
              Vezi proprietățile
            </Link>
            <button
              type="button"
              onClick={() => openContactForm({ title: "Spune-ne ce cauți" })}
              className="inline-flex h-12 items-center rounded-sm border border-paper/30 px-7 text-small font-semibold uppercase tracking-wide text-paper transition-colors duration-200 hover:border-brass hover:text-brass"
            >
              Contactează-ne
            </button>
          </div>
        </div>
      </div>

      {/* Search band */}
      <div className="relative border-t border-paper/10 bg-graphite/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 lg:px-6 py-5">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:flex md:items-center"
            aria-label="Caută proprietăți"
          >
            {showTransaction && (
              <>
                <label className="sr-only" htmlFor="hero-transaction">Tranzacție</label>
                <select
                  id="hero-transaction"
                  className={`${selectClass} md:w-44`}
                  value={transaction}
                  onChange={(e) => {
                    setTransaction(e.target.value);
                    setPriceMax("");
                  }}
                >
                  <option value="">Tranzacție</option>
                  <option value="vanzare">Vânzare</option>
                  <option value="inchiriere">Închiriere</option>
                </select>
              </>
            )}

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

            <label className="sr-only" htmlFor="hero-price">{isRent ? "Chirie maximă" : "Preț maxim"}</label>
            <select id="hero-price" className={`${selectClass} md:w-48`} value={priceMax} onChange={(e) => setPriceMax(e.target.value)}>
              <option value="">{isRent ? "Chirie maximă" : "Preț maxim"}</option>
              {(isRent ? MAX_RENTS : MAX_PRICES).map((p) => (
                <option key={p} value={String(p)}>{p.toLocaleString("ro-RO")} €{isRent ? "/lună" : ""}</option>
              ))}
            </select>

            <button
              type="submit"
              className="h-11 rounded-sm bg-brass px-8 text-small font-semibold uppercase tracking-wide text-ink transition-colors duration-200 hover:bg-brass-light"
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
