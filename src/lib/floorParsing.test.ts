import { describe, it, expect } from "vitest";
import { parseTotalFloors, parseFloor } from "./floorParsing";

describe("parseTotalFloors", () => {
  it("returns null for null/undefined/empty", () => {
    expect(parseTotalFloors(null, undefined, "")).toBeNull();
  });

  it("returns null for 0 and '0'", () => {
    expect(parseTotalFloors(0)).toBeNull();
    expect(parseTotalFloors("0")).toBeNull();
  });

  it("returns null for non-numeric strings", () => {
    expect(parseTotalFloors("necunoscut")).toBeNull();
  });

  it("parses numeric strings and numbers", () => {
    expect(parseTotalFloors("5")).toBe(5);
    expect(parseTotalFloors(8)).toBe(8);
  });

  it("extracts first integer from noisy strings", () => {
    expect(parseTotalFloors("P+10E")).toBe(10);
    expect(parseTotalFloors("Regim 4 etaje")).toBe(4);
  });

  it("falls back across mixed candidates (nrnivele/nivele/regimsuprateran/total_floors)", () => {
    expect(parseTotalFloors(null, "0", "", "P+7")).toBe(7);
    expect(parseTotalFloors(undefined, undefined, 3, 9)).toBe(3);
    expect(parseTotalFloors("0", null, "", "necunoscut")).toBeNull();
  });
});

describe("parseFloor", () => {
  it("returns null for null/undefined/empty", () => {
    expect(parseFloor(null, undefined, "")).toBeNull();
  });

  it("returns 'Parter' for 0 and '0'", () => {
    expect(parseFloor(0)).toBe("Parter");
    expect(parseFloor("0")).toBe("Parter");
  });

  it("normalizes textual parter/demisol", () => {
    expect(parseFloor("parter")).toBe("Parter");
    expect(parseFloor("DEMISOL")).toBe("Demisol");
  });

  it("returns null for non-numeric, non-keyword strings", () => {
    expect(parseFloor("necunoscut")).toBeNull();
  });

  it("parses numeric and noisy strings", () => {
    expect(parseFloor("3")).toBe(3);
    expect(parseFloor("Etaj 5")).toBe(5);
  });

  it("falls back across mixed candidates", () => {
    expect(parseFloor(null, "", "etaj 2")).toBe(2);
    expect(parseFloor(undefined, "necunoscut", 4)).toBe(4);
  });
});
