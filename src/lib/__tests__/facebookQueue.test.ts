import { describe, it, expect, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/lib/propertySlug", () => ({
  generatePropertySlug: () => "test-slug",
}));

import { buildFacebookMessage } from "../facebookQueue";

const baseOffer = {
  id: "abc-123",
  slug: "apartament-test",
};

describe("buildFacebookMessage", () => {
  it("nu conține null / undefined / NaN și nici linii goale cu emoji orfan", () => {
    const msg = buildFacebookMessage({ ...baseOffer, title: "Apartament 2 camere" });
    expect(msg).not.toMatch(/null/i);
    expect(msg).not.toMatch(/undefined/i);
    expect(msg).not.toMatch(/NaN/);
    // nicio linie care se termină cu ":" (label fără valoare) sau doar emoji + spațiu
    for (const line of msg.split("\n")) {
      expect(line.trim()).not.toMatch(/:\s*$/);
      expect(line.trim()).not.toMatch(/^[\p{Emoji}\s]+$/u);
    }
  });

  it("nu include niciodată linia de Disponibilitate", () => {
    const msg = buildFacebookMessage({
      ...baseOffer,
      title: "Test",
      // câmpuri care ar putea genera „Disponibilitate" într-o versiune anterioară
      ...({ availability: "Disponibil", status: "available" } as Record<string, unknown>),
    } as Parameters<typeof buildFacebookMessage>[0]);
    expect(msg).not.toMatch(/disponibilitate/i);
    expect(msg).not.toMatch(/disponibil/i);
  });

  it("omite zero, string gol, coduri CRM numerice brute și valori negative", () => {
    const msg = buildFacebookMessage({
      ...baseOffer,
      title: "Garsonieră",
      rooms: 0,
      bathrooms: 0,
      balconies: 0,
      surface_min: 0,
      total_floors: 0,
      year_built: 0,
      price_min: 0,
      compartment: "",
      comfort: "   ",
      build_materials: "9999", // cod CRM nemapat
      furnished: "8888", // cod CRM nemapat
      zone: null,
      city: undefined,
      location: "",
    });
    expect(msg).not.toMatch(/Camere:/);
    expect(msg).not.toMatch(/Băi:/);
    expect(msg).not.toMatch(/Balcoane:/);
    expect(msg).not.toMatch(/Suprafață/);
    expect(msg).not.toMatch(/Nr\. nivele/);
    expect(msg).not.toMatch(/An construcție/);
    expect(msg).not.toMatch(/EUR/);
    expect(msg).not.toMatch(/Compartimentare/);
    expect(msg).not.toMatch(/Confort/);
    expect(msg).not.toMatch(/Structură/);
    expect(msg).not.toMatch(/Mobilat/);
    expect(msg).not.toMatch(/Zonă/);
    expect(msg).not.toMatch(/Oraș/);
    expect(msg).not.toMatch(/Locație/);
    expect(msg).not.toMatch(/9999/);
    expect(msg).not.toMatch(/8888/);
  });

  it("mapează codurile CRM cunoscute pentru mobilat", () => {
    const msg = buildFacebookMessage({ ...baseOffer, title: "T", furnished: "30303" });
    expect(msg).toMatch(/🛋️ Mobilat: Mobilat/);
    const msg2 = buildFacebookMessage({ ...baseOffer, title: "T", furnished: "30301" });
    expect(msg2).toMatch(/🛋️ Mobilat: Nemobilat/);
  });

  it("formatează prețul cu separator românesc și include EUR", () => {
    const msg = buildFacebookMessage({ ...baseOffer, title: "T", price_min: 77000 });
    expect(msg).toMatch(/💶 77\.000 EUR/);
  });

  it("formatează etajul (Parter, cu total_floors)", () => {
    const parter = buildFacebookMessage({ ...baseOffer, title: "T", floor: 0, total_floors: 10 });
    expect(parter).toMatch(/🏢 Etaj: Parter \/ 10/);
    const et3 = buildFacebookMessage({ ...baseOffer, title: "T", floor: 3, total_floors: 8 });
    expect(et3).toMatch(/🏢 Etaj: 3 \/ 8/);
  });

  it("unește utilitățile și finisajele cu ' • '", () => {
    const msg = buildFacebookMessage({
      ...baseOffer,
      title: "T",
      has_gas: true,
      has_water: true,
      has_electricity: true,
      features: ["Termopan", "Ușă metalică"],
      amenities: ["Piscină"],
    });
    expect(msg).toMatch(/🔌 Utilități: Gaz • Apă • Curent/);
    expect(msg).toMatch(/🎨 Finisaje: Termopan • Ușă metalică • Piscină/);
  });

  it("mapează tipul tranzacției la Vânzare / Închiriere", () => {
    expect(buildFacebookMessage({ ...baseOffer, title: "T", transaction_type: "sale" }))
      .toMatch(/Tip tranzacție: Vânzare/);
    expect(buildFacebookMessage({ ...baseOffer, title: "T", transaction_type: "rent" }))
      .toMatch(/Tip tranzacție: Închiriere/);
  });

  it("include mereu linia de telefon și linia Detalii cu URL absolut", () => {
    const msg = buildFacebookMessage({ ...baseOffer, title: "T" });
    expect(msg).toMatch(/☎️ 0767\.941\.512/);
    expect(msg).toMatch(/🔗 Detalii: https:\/\/www\.mvaimobiliare\.ro\/proprietate\//);
  });

  it("fiecare linie non-goală începe cu un emoji", () => {
    const msg = buildFacebookMessage({
      ...baseOffer,
      title: "Apartament 3 camere lux",
      rooms: 3,
      bathrooms: 2,
      surface_min: 85,
      floor: 4,
      total_floors: 10,
      price_min: 129000,
      zone: "Militari",
      city: "București",
    });
    for (const line of msg.split("\n").filter((l) => l.trim())) {
      // prima „literă" trebuie să fie un caracter emoji, nu literă/cifră ASCII
      expect(line).not.toMatch(/^[A-Za-z0-9]/);
    }
  });
});
