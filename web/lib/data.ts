import fs from "node:fs";
import path from "node:path";

// The dataset lives at the repo root; the app reads it at build time.
const DATA_DIR = path.resolve(process.cwd(), "..", "data");

export interface LangText {
  en: string;
  gu?: string;
  hi?: string;
}

export interface TimingWindow {
  days: string | string[];
  open: string;
  close: string;
  note?: string | null;
}

export interface FeeLine {
  type: string;
  amount_inr: number;
  note?: string | null;
}

export interface Spot {
  schema_version: number;
  id: string;
  slug: string;
  name: LangText;
  aliases: string[];
  category: string;
  subcategories: string[];
  tags: string[];
  cluster: string | null;
  status: string;
  district: "dang" | "narmada";
  summary: string;
  description: string | null;
  highlights: string[] | null;
  history_legend: string | null;
  attributes: Record<string, unknown>;
  location: {
    taluka: string | null;
    admin_district: string | null;
    outside_district: boolean;
    nearest_town: { name: string; distance_km: number } | null;
    coordinates: { lat: number; lng: number; precision: string };
    altitude_m: number | null;
    distances_km: Record<string, number>;
  };
  access: {
    modes: { road: string | null; rail: string | null; air: string | null };
    last_mile: string | null;
    road_condition: string | null;
    parking: { available: boolean | null; fee: number | null; notes: string | null };
  };
  visit: {
    timings: TimingWindow[] | null;
    fees: FeeLine[] | null;
    booking: { required: boolean | null; url: string | null; notes: string | null };
    duration_min: number | null;
    best_time_of_day: string | null;
    weekly_closure: string | null;
    notes: string | null;
  };
  seasonality: {
    best_months: number[];
    avoid_months: number[];
    monsoon_dependent: boolean | null;
    notes: string | null;
  };
  experience: {
    activities: string[];
    difficulty: string | null;
    suitable_for: { kids: boolean | null; elderly: boolean | null; wheelchair: boolean | null };
    photography_notes: string | null;
  };
  amenities: {
    food: string | null;
    toilets: string | null;
    drinking_water: boolean | null;
    mobile_network: Record<string, string | null>;
    guides: string | null;
    ev_charging: boolean | null;
    stay_nearby: string[];
  };
  safety: {
    warnings: string[];
    emergency: { nearest_hospital: string | null; police: string | null; notes: string | null };
  };
  tips: string[];
  faqs: { q: string; a: string }[];
  nearby: { id: string; distance_km: number; note?: string | null }[];
  itineraries: string[];
  media: { images: unknown[]; videos: unknown[] };
  seo: { meta_title: string | null; meta_description: string | null };
  provenance: {
    created: string;
    last_verified: string | null;
    confidence: "high" | "medium" | "low";
    sources: { title: string; url?: string | null; publisher?: string | null; accessed?: string | null }[];
    needs_verification: string[];
  };
}

export interface District {
  id: "dang" | "narmada";
  name: LangText;
  headline: string;
  overview: string;
  hero_spots: string[];
  hubs: { name: string; type: string; coordinates?: { lat: number; lng: number }; notes?: string }[];
  getting_there: { road: string; rail: string; air: string };
  local_transport: string;
  weather_by_month: { month: number; temp_min_c: number; temp_max_c: number; rain: string; notes?: string }[];
  best_season: string;
  emergency: { police: string; ambulance: string; hospitals: string[]; forest_dept: string | null };
  festivals: string[];
  foods: string[];
  tips: string[];
}

export interface ItineraryStop {
  day: number;
  order: number;
  spot_id: string;
  duration_min: number;
  note?: string;
}

export interface Itinerary {
  id: string;
  slug: string;
  title: string;
  duration_days: number;
  districts: string[];
  themes: string[];
  best_months: number[];
  base_hub: string;
  party: string;
  stops: ItineraryStop[];
  day_notes: { day: number; note: string }[];
  total_drive_km: number | null;
  notes: string | null;
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function readDir<T>(dir: string): T[] {
  const full = path.join(DATA_DIR, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson<T>(path.join(full, f)));
}

let spotsCache: Spot[] | null = null;

export function getAllSpots(): Spot[] {
  if (!spotsCache) {
    spotsCache = [...readDir<Spot>("spots/dang"), ...readDir<Spot>("spots/narmada")].sort((a, b) =>
      a.name.en.localeCompare(b.name.en)
    );
  }
  return spotsCache;
}

export function getSpot(district: string, slug: string): Spot | undefined {
  return getAllSpots().find((s) => s.district === district && s.slug === slug);
}

export function getSpotById(id: string): Spot | undefined {
  return getAllSpots().find((s) => s.id === id);
}

export function getDistrict(id: "dang" | "narmada"): District {
  return readJson<District>(path.join(DATA_DIR, "districts", `${id}.json`));
}

export function getItineraries(): Itinerary[] {
  return readDir<Itinerary>("itineraries");
}

export { MONTHS, formatMonths, categoryLabel } from "./format";
