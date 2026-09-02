import { describe, expect, it } from "vitest";
import { SUBWAY_LINES, getSubwayLine, loadTransitData } from "./subway";

describe("subway line definitions", () => {
  const EXPECTED_IDS = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "6X",
    "7",
    "7X",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "FX",
    "G",
    "J",
    "L",
    "M",
    "N",
    "Q",
    "R",
    "W",
    "Z",
    "FS",
    "GS",
    "H",
    "SI",
  ];

  it("contains all 29 expected line IDs", () => {
    const ids = SUBWAY_LINES.map((line) => line.id);
    expect(ids).toHaveLength(29);
    for (const id of EXPECTED_IDS) {
      expect(ids).toContain(id);
    }
  });

  it("uses correct colors for each line group", () => {
    const colorForId = (id: string) => getSubwayLine(id)?.color;
    // Red lines
    expect(colorForId("1")).toBe("EE352E");
    expect(colorForId("2")).toBe("EE352E");
    expect(colorForId("3")).toBe("EE352E");
    // Green lines
    expect(colorForId("4")).toBe("00933C");
    expect(colorForId("5")).toBe("00933C");
    expect(colorForId("6")).toBe("00933C");
    expect(colorForId("6X")).toBe("00933C");
    // Purple
    expect(colorForId("7")).toBe("B933AD");
    expect(colorForId("7X")).toBe("B933AD");
    // Blue
    expect(colorForId("A")).toBe("0039A6");
    expect(colorForId("C")).toBe("0039A6");
    expect(colorForId("E")).toBe("0039A6");
    // Orange
    expect(colorForId("B")).toBe("FF6319");
    expect(colorForId("D")).toBe("FF6319");
    expect(colorForId("F")).toBe("FF6319");
    expect(colorForId("FX")).toBe("FF6319");
    expect(colorForId("M")).toBe("FF6319");
    // Green (G)
    expect(colorForId("G")).toBe("6CBE45");
    // Brown
    expect(colorForId("J")).toBe("996633");
    expect(colorForId("Z")).toBe("996633");
    // Gray
    expect(colorForId("L")).toBe("A7A9AC");
    expect(colorForId("FS")).toBe("808183");
    expect(colorForId("GS")).toBe("808183");
    expect(colorForId("H")).toBe("808183");
    // Yellow
    expect(colorForId("N")).toBe("FCCC0A");
    expect(colorForId("Q")).toBe("FCCC0A");
    expect(colorForId("R")).toBe("FCCC0A");
    expect(colorForId("W")).toBe("FCCC0A");
    // Blue (SI)
    expect(colorForId("SI")).toBe("0039A6");
  });

  it("uses accessible text colors for yellow and light-gray lines", () => {
    for (const line of SUBWAY_LINES) {
      if (["N", "Q", "R", "W", "L"].includes(line.id)) {
        expect(line.textColor).toBe("000000");
      } else {
        expect(line.textColor).toBe("FFFFFF");
      }
    }
  });
});

describe("getSubwayLine", () => {
  it("returns the correct line for valid IDs", () => {
    const line = getSubwayLine("A");
    expect(line).toBeDefined();
    expect(line!.shortName).toBe("A");
    expect(line!.longName).toBe("Eighth Avenue Express");
  });

  it("returns undefined for invalid IDs", () => {
    expect(getSubwayLine("X")).toBeUndefined();
    expect(getSubwayLine("")).toBeUndefined();
    expect(getSubwayLine("99")).toBeUndefined();
  });
});

describe("loadTransitData", () => {
  it("returns data with routes and stops", async () => {
    const data = await loadTransitData();
    expect(data.routes).toBeDefined();
    expect(data.stops).toBeDefined();
    expect(Object.keys(data.routes).length).toBeGreaterThan(0);
    expect(Object.keys(data.stops).length).toBeGreaterThan(0);
    const route1 = data.routes["1"];
    expect(route1).toBeDefined();
    expect(route1.geometry.type).toBe("MultiLineString");
    expect(route1.stopIds.length).toBeGreaterThan(0);
  });

  it("contains geometry and every referenced stop for each supported line", async () => {
    const data = await loadTransitData();

    expect(Object.keys(data.routes).sort()).toEqual(
      SUBWAY_LINES.map((line) => line.id).sort(),
    );
    for (const line of SUBWAY_LINES) {
      const route = data.routes[line.id];
      expect(route.geometry.type, line.id).toBe("MultiLineString");
      expect(route.geometry.coordinates.length, line.id).toBeGreaterThan(0);
      expect(
        route.geometry.coordinates.every((branch) => branch.length >= 2),
        line.id,
      ).toBe(true);
      expect(route.stopIds.length, line.id).toBeGreaterThan(0);
      for (const stopId of route.stopIds) {
        const stop = data.stops[stopId];
        expect(stop, `${line.id}:${stopId}`).toBeDefined();
        expect(Number.isFinite(stop.lat), `${line.id}:${stopId}:lat`).toBe(
          true,
        );
        expect(Number.isFinite(stop.lng), `${line.id}:${stopId}:lng`).toBe(
          true,
        );
      }
    }
  });
});
