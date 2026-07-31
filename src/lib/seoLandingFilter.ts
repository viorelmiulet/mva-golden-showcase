import type { SeoLandingPreset } from "@/pages/SeoLanding";

const matchesAnyZone = (p: any, zones: string[]) => {
  const hay = `${p.title || ""} ${p.zone || ""} ${p.location || ""} ${p.city || ""} ${p.project_name || ""}`.toUpperCase();
  return zones.some((z) => hay.includes(z.toUpperCase()));
};

const detectIsHouse = (p: any) => {
  const t = `${p.title || ""} ${p.description || ""}`.toLowerCase();
  return /\bcas[aă]\b|\bvil[aă]\b/.test(t) && !/apartament/.test(t);
};

const detectIsLand = (p: any) => {
  const t = `${p.title || ""} ${p.description || ""}`.toLowerCase();
  return /\bteren\b|\bteren(uri)?\b/.test(t);
};

/** Shared between the client page and the SSR loader so JSON-LD matches the cards. */
export function filterForPreset(rows: any[], preset: SeoLandingPreset) {
  const f = preset.filter;
  return rows.filter((p: any) => {
    if (f.rooms !== undefined && p.rooms !== f.rooms) return false;
    if (f.minRooms !== undefined && (!p.rooms || p.rooms < f.minRooms)) return false;
    if (f.transactionType && p.transaction_type && p.transaction_type !== f.transactionType) return false;
    if (f.zone && !matchesAnyZone(p, [f.zone])) return false;
    if (f.zones && f.zones.length > 0 && !matchesAnyZone(p, f.zones)) return false;

    if (f.propertyType === "house" && !detectIsHouse(p)) return false;
    if (f.propertyType === "land" && !detectIsLand(p)) return false;
    if (f.propertyType === "garsoniera" && p.rooms && p.rooms > 1) return false;
    if (f.propertyType === "apartment") {
      if (detectIsHouse(p) || detectIsLand(p)) return false;
    }
    if (f.newBuild) {
      const currentYear = new Date().getFullYear();
      const yb = p.year_built || 0;
      const isNew =
        yb >= currentYear - 3 ||
        /bloc nou|apartamente noi|finisat la cheie|ansamblu nou/i.test(`${p.title || ""} ${p.description || ""}`);
      if (!isNew) return false;
    }
    return true;
  });
}
