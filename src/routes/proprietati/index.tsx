import { createFileRoute } from "@tanstack/react-router";
import Properties, { fetchCatalogOffers } from "@/pages/Properties";
import { staticHead } from "@/lib/routeMeta";
import { buildItemListJsonLd } from "@/lib/listingJsonLd";

/** Keep in sync with PER_PAGE in src/pages/Properties.tsx. */
const PER_PAGE = 24;

/** Server-side validation of the filter query string — keeps filtered views crawlable. */
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
};
/** Keeps a value as-is (string or number) so the URL round-trips without a redirect. */
const loose = (v: unknown): string | number | undefined => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
};

const SORTS = ["recente", "pret_asc", "pret_desc", "suprafata"];

export interface PropertiesSearch {
  zona?: string;
  camere?: number;
  pret_max?: number;
  tip?: string;
  tip_proprietate?: string;
  supr_min?: number;
  etaj?: string | number;
  compartimentare?: string;
  an?: string | number;
  ansamblu?: string;
  sort?: string;
  p?: number;
}

/** Slug-ifies a zone label so "Drumul Taberei" matches "drumul-taberei". */
const zoneSlug = (v?: string) =>
  v
    ? v
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    : "";

/**
 * Filtered views that duplicate an existing static landing page must point their
 * canonical at that page. Key format: `zona|camere|tip` (empty segment = not set).
 */
const STATIC_EQUIVALENTS: Record<string, string> = {
  "militari|2||": "/apartamente-2-camere-militari",
  "militari|3||": "/apartamente-3-camere-militari",
  "militari||rent|": "/apartamente-de-inchiriat-militari",
  "|2||": "/apartamente-2-camere",
  "|3||": "/apartamente-3-camere",
  "|4||": "/apartamente-4-camere",
  "drumul-taberei|||": "/apartamente-drumul-taberei",
  "crangasi|||": "/apartamente-crangasi-giulesti",
  "giulesti|||": "/apartamente-crangasi-giulesti",
  "titan|||": "/apartamente-titan-pantelimon",
  "pantelimon|||": "/apartamente-titan-pantelimon",
  "berceni|||": "/apartamente-berceni-giurgiului",
  "giurgiului|||": "/apartamente-berceni-giurgiului",
  "tineretului|||": "/apartamente-tineretului-vacaresti",
  "vacaresti|||": "/apartamente-tineretului-vacaresti",
  "sector-6|||": "/apartamente-sector-6",
};

/** Filters other than zona/camere/tip/tip_proprietate make the view a non-canonical permutation. */
const EXTRA_FILTER_KEYS = ["pret_max", "supr_min", "etaj", "compartimentare", "an", "ansamblu", "sort"] as const;

const typeSlug = (v?: string) => zoneSlug(v);

function resolveIndexing(s: PropertiesSearch): { canonicalPath?: string; noindex: boolean } {
  const hasExtra = EXTRA_FILTER_KEYS.some((k) => s[k]);
  const hasCore = Boolean(s.zona || s.camere || s.tip || s.tip_proprietate);
  if (!hasExtra && !hasCore) return { noindex: false }; // unfiltered (incl. ?p=N)
  if (!hasExtra) {
    const tp = typeSlug(s.tip_proprietate);
    const base = `${zoneSlug(s.zona)}|${s.camere ?? ""}|${s.tip ?? ""}`;
    // The static landings are apartment pages, so an "apartament" type filter
    // resolves to the same canonical target.
    const target =
      STATIC_EQUIVALENTS[`${base}|${tp}`] ??
      (tp === "apartament" ? STATIC_EQUIVALENTS[`${base}|`] : undefined);
    if (target) return { canonicalPath: target, noindex: false };
  }
  return { noindex: true };
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
      etaj: loose(search.etaj),
      compartimentare: str(search.compartimentare),
      an: loose(search.an),
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

  head: ({ match, loaderData }) => {
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

    const { canonicalPath, noindex } = resolveIndexing(s);
    const title = `Proprietăți${suffix}${pageSuffix} | MVA Imobiliare`;

    const base = staticHead({
      title,
      description:
        "Caută apartamente, garsoniere și case în București: filtre după zonă, preț, camere și suprafață. Ofertele MVA Imobiliare, actualizate zilnic.",
      path: canonicalPath ?? path,
      noindex,
      image: "https://www.mvaimobiliare.ro/og-image.jpg?v=20260719c",
    });

    // Only indexable views describe their cards; filter permutations are noindex.
    const rows = (loaderData?.rows ?? []) as any[];
    if (noindex || rows.length === 0) return base;

    const page = s.p && s.p > 1 ? s.p : 1;
    const pageRows = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return {
      ...base,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            buildItemListJsonLd(pageRows, {
              name: title,
              url: `https://www.mvaimobiliare.ro${canonicalPath ?? path}`,
              limit: PER_PAGE,
            })
          ),
        },
      ],
    };
  },

  component: PropertiesRoute,
});

function PropertiesRoute() {
  const { rows } = Route.useLoaderData();
  return <Properties initialRows={rows} />;
}
