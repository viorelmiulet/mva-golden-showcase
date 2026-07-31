import { createFileRoute } from "@tanstack/react-router";
import Properties, { fetchCatalogOffers } from "@/pages/Properties";
import { staticHead } from "@/lib/routeMeta";

/** Server-side validation of the filter query string — keeps filtered views crawlable. */
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? String(Math.floor(n)) : undefined;
};

const SORTS = ["recente", "pret_asc", "pret_desc", "suprafata"];

export interface PropertiesSearch {
  zona?: string;
  camere?: string;
  pret_max?: string;
  tip?: string;
  supr_min?: string;
  etaj?: string;
  compartimentare?: string;
  an?: string;
  ansamblu?: string;
  sort?: string;
  p?: number;
}

export const Route = createFileRoute("/proprietati/")({
  validateSearch: (search: Record<string, unknown>): PropertiesSearch => {
    const tip = str(search.tip);
    const sort = str(search.sort);
    const page = Number(search.p);
    return {
      zona: str(search.zona),
      camere: num(search.camere),
      pret_max: num(search.pret_max),
      tip: tip === "sale" || tip === "rent" ? tip : undefined,
      supr_min: num(search.supr_min),
      etaj: str(search.etaj),
      compartimentare: str(search.compartimentare),
      an: str(search.an),
      ansamblu: str(search.ansamblu),
      sort: sort && SORTS.includes(sort) ? sort : undefined,
      p: Number.isFinite(page) && page > 1 ? Math.floor(page) : undefined,
    };
  },

  // SSR: the first HTML already contains real <a href> property cards.
  loader: async () => {
    try {
      return { rows: await fetchCatalogOffers() };
    } catch {
      return { rows: [] as any[] };
    }
  },

  head: ({ match }) => {
    const s = (match.search || {}) as PropertiesSearch;
    const parts: string[] = [];
    if (s.zona) parts.push(`în ${s.zona}`);
    if (s.camere) parts.push(`${s.camere} camere`);
    if (s.tip) parts.push(s.tip === "rent" ? "de închiriat" : "de vânzare");
    const suffix = parts.length ? ` ${parts.join(", ")}` : " de vânzare și închiriere în București";
    const pageSuffix = s.p && s.p > 1 ? ` — pagina ${s.p}` : "";

    const qs = new URLSearchParams();
    for (const key of ["zona", "camere", "pret_max", "tip", "supr_min", "etaj", "compartimentare", "an", "ansamblu", "sort"] as const) {
      const v = s[key];
      if (v) qs.set(key, String(v));
    }
    if (s.p && s.p > 1) qs.set("p", String(s.p));
    const path = qs.toString() ? `/proprietati?${qs.toString()}` : "/proprietati";

    return staticHead({
      title: `Proprietăți${suffix}${pageSuffix} | MVA Imobiliare`,
      description:
        "Caută apartamente, garsoniere și case în București: filtre după zonă, preț, camere și suprafață. Ofertele MVA Imobiliare, actualizate zilnic.",
      path,
      image: "https://www.mvaimobiliare.ro/og-image.jpg?v=20260719c",
    });
  },

  component: PropertiesRoute,
});

function PropertiesRoute() {
  const { rows } = Route.useLoaderData();
  return <Properties initialRows={rows} />;
}
