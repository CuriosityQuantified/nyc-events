import { getUpcomingDates } from "./dates";

export type Borough = "Manhattan" | "Brooklyn" | "Queens" | "Bronx" | "Staten Island";

export type Category =
  | "Fitness"
  | "Theater"
  | "Music"
  | "Nature"
  | "Sports"
  | "Art"
  | "Family";

export type CostType = "Free" | "Paid" | "RSVP";

export interface ParkEvent {
  id: string;
  title: string;
  location: string;
  borough: Borough;
  category: Category;
  date: string;        // ISO date string (YYYY-MM-DD)
  time: string;        // Display time, e.g. "10:00 AM"
  costType: CostType;
  costAmount?: number;  // Only for "Paid" type
  imageAlt: string;     // Alt text for placeholder image
}

const dates = getUpcomingDates(7);

export const mockEvents: ParkEvent[] = [
  {
    id: "evt-001",
    title: "Morning Yoga in Prospect Park",
    location: "Prospect Park Long Meadow",
    borough: "Brooklyn",
    category: "Fitness",
    date: dates[0],
    time: "7:30 AM",
    costType: "Free",
    imageAlt: "People doing yoga on a green meadow at sunrise",
  },
  {
    id: "evt-002",
    title: "Shakespeare in the Park",
    location: "Delacorte Theater, Central Park",
    borough: "Manhattan",
    category: "Theater",
    date: dates[1],
    time: "8:00 PM",
    costType: "RSVP",
    imageAlt: "Outdoor theater stage with audience seating",
  },
  {
    id: "evt-003",
    title: "Jazz Under the Stars",
    location: "Fort Greene Park",
    borough: "Brooklyn",
    category: "Music",
    date: dates[0],
    time: "7:00 PM",
    costType: "Paid",
    costAmount: 15,
    imageAlt: "Jazz musicians performing outdoors at dusk",
  },
  {
    id: "evt-004",
    title: "Bird Watching Walk",
    location: "Jamaica Bay Wildlife Refuge",
    borough: "Queens",
    category: "Nature",
    date: dates[2],
    time: "6:30 AM",
    costType: "Free",
    imageAlt: "Binoculars overlooking a wetland with birds",
  },
  {
    id: "evt-005",
    title: "Pickup Soccer Tournament",
    location: "Van Cortlandt Park",
    borough: "Bronx",
    category: "Sports",
    date: dates[3],
    time: "10:00 AM",
    costType: "Free",
    imageAlt: "Soccer players on a green field",
  },
  {
    id: "evt-006",
    title: "Outdoor Watercolor Workshop",
    location: "Snug Harbor Cultural Center",
    borough: "Staten Island",
    category: "Art",
    date: dates[1],
    time: "2:00 PM",
    costType: "Paid",
    costAmount: 15,
    imageAlt: "Artist painting with watercolors in a garden",
  },
  {
    id: "evt-007",
    title: "Family Nature Scavenger Hunt",
    location: "Pelham Bay Park",
    borough: "Bronx",
    category: "Family",
    date: dates[4],
    time: "11:00 AM",
    costType: "Free",
    imageAlt: "Children exploring a wooded trail with magnifying glasses",
  },
  {
    id: "evt-008",
    title: "Sunset Concert Series",
    location: "Astoria Park",
    borough: "Queens",
    category: "Music",
    date: dates[5],
    time: "6:30 PM",
    costType: "RSVP",
    imageAlt: "Concert stage with sunset over the East River",
  },
];
