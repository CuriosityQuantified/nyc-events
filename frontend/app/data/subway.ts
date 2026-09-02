export type SubwayLine = {
  id: string;
  shortName: string;
  longName: string;
  color: string;
  textColor: string;
};

export type SubwayRouteData = {
  geometry: { type: string; coordinates: number[][][] };
  stopIds: string[];
};

export type SubwayStopData = {
  name: string;
  lat: number;
  lng: number;
};

export type SubwayTransitData = {
  source: {
    id: string;
    attribution: string;
    sourceUrl: string;
    lastUpdated: string;
  };
  routes: Record<string, SubwayRouteData>;
  stops: Record<string, SubwayStopData>;
};

export const SUBWAY_LINES: SubwayLine[] = [
  {
    id: "1",
    shortName: "1",
    longName: "Broadway–Seventh Avenue Local",
    color: "EE352E",
    textColor: "FFFFFF",
  },
  {
    id: "2",
    shortName: "2",
    longName: "Seventh Avenue Express",
    color: "EE352E",
    textColor: "FFFFFF",
  },
  {
    id: "3",
    shortName: "3",
    longName: "Seventh Avenue Express",
    color: "EE352E",
    textColor: "FFFFFF",
  },
  {
    id: "4",
    shortName: "4",
    longName: "Lexington Avenue Express",
    color: "00933C",
    textColor: "FFFFFF",
  },
  {
    id: "5",
    shortName: "5",
    longName: "Lexington Avenue Express",
    color: "00933C",
    textColor: "FFFFFF",
  },
  {
    id: "6",
    shortName: "6",
    longName: "Lexington Avenue Local",
    color: "00933C",
    textColor: "FFFFFF",
  },
  {
    id: "6X",
    shortName: "6X",
    longName: "Pelham Express",
    color: "00933C",
    textColor: "FFFFFF",
  },
  {
    id: "7",
    shortName: "7",
    longName: "Flushing Local",
    color: "B933AD",
    textColor: "FFFFFF",
  },
  {
    id: "7X",
    shortName: "7X",
    longName: "Flushing Express",
    color: "B933AD",
    textColor: "FFFFFF",
  },
  {
    id: "A",
    shortName: "A",
    longName: "Eighth Avenue Express",
    color: "0039A6",
    textColor: "FFFFFF",
  },
  {
    id: "B",
    shortName: "B",
    longName: "Sixth Avenue Express",
    color: "FF6319",
    textColor: "FFFFFF",
  },
  {
    id: "C",
    shortName: "C",
    longName: "Eighth Avenue Local",
    color: "0039A6",
    textColor: "FFFFFF",
  },
  {
    id: "D",
    shortName: "D",
    longName: "Sixth Avenue Express",
    color: "FF6319",
    textColor: "FFFFFF",
  },
  {
    id: "E",
    shortName: "E",
    longName: "Eighth Avenue Local",
    color: "0039A6",
    textColor: "FFFFFF",
  },
  {
    id: "F",
    shortName: "F",
    longName: "Sixth Avenue Local",
    color: "FF6319",
    textColor: "FFFFFF",
  },
  {
    id: "FX",
    shortName: "FX",
    longName: "Sixth Avenue Express",
    color: "FF6319",
    textColor: "FFFFFF",
  },
  {
    id: "G",
    shortName: "G",
    longName: "Brooklyn–Queens Crosstown",
    color: "6CBE45",
    textColor: "FFFFFF",
  },
  {
    id: "J",
    shortName: "J",
    longName: "Nassau Street Local",
    color: "996633",
    textColor: "FFFFFF",
  },
  {
    id: "L",
    shortName: "L",
    longName: "14th Street–Canarsie Local",
    color: "A7A9AC",
    textColor: "000000",
  },
  {
    id: "M",
    shortName: "M",
    longName: "Sixth Avenue Local",
    color: "FF6319",
    textColor: "FFFFFF",
  },
  {
    id: "N",
    shortName: "N",
    longName: "Broadway Express",
    color: "FCCC0A",
    textColor: "000000",
  },
  {
    id: "Q",
    shortName: "Q",
    longName: "Second Avenue / Broadway Express",
    color: "FCCC0A",
    textColor: "000000",
  },
  {
    id: "R",
    shortName: "R",
    longName: "Broadway Local",
    color: "FCCC0A",
    textColor: "000000",
  },
  {
    id: "W",
    shortName: "W",
    longName: "Broadway Local",
    color: "FCCC0A",
    textColor: "000000",
  },
  {
    id: "Z",
    shortName: "Z",
    longName: "Nassau Street Express",
    color: "996633",
    textColor: "FFFFFF",
  },
  {
    id: "FS",
    shortName: "S",
    longName: "Franklin Avenue Shuttle",
    color: "808183",
    textColor: "FFFFFF",
  },
  {
    id: "GS",
    shortName: "S",
    longName: "42nd Street Shuttle",
    color: "808183",
    textColor: "FFFFFF",
  },
  {
    id: "H",
    shortName: "S",
    longName: "Rockaway Park Shuttle",
    color: "808183",
    textColor: "FFFFFF",
  },
  {
    id: "SI",
    shortName: "SIR",
    longName: "Staten Island Railway",
    color: "0039A6",
    textColor: "FFFFFF",
  },
];

export function getSubwayLine(id: string): SubwayLine | undefined {
  return SUBWAY_LINES.find((line) => line.id === id);
}

let transitDataPromise: Promise<SubwayTransitData> | null = null;

export async function loadTransitData(): Promise<SubwayTransitData> {
  if (!transitDataPromise) {
    transitDataPromise = import("./mta-subway-data.json").then(
      (module) => module.default as SubwayTransitData,
    );
  }
  return transitDataPromise;
}
