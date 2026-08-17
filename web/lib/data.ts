import fs from "node:fs";
import path from "node:path";
import {
  buildPlannerIndex,
  type RawSpotForPlanner,
  type RawStayForPlanner,
} from "./planner-index";
import type { PlannerData } from "./planner";

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
  media: {
    images: { url: string; license: string; caption?: string | null; credit?: string | null; source_url?: string | null }[];
    videos: { url: string; title?: string | null; source?: string | null }[];
  };
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

export interface EventRec {
  id: string;
  slug: string;
  name: LangText;
  type: "festival" | "fair" | "show" | "season-window";
  district: "dang" | "narmada";
  spot_id: string | null;
  place: string | null;
  timing: { recurrence: string; typical_months: number[]; duration_days: number | null };
  description: string;
  scale: "local" | "regional" | "national";
  crowd_impact: string | null;
  tips: string[];
}

export interface Food {
  id: string;
  slug: string;
  name: LangText;
  type: string;
  veg: boolean;
  districts: string[];
  description: string;
  where_to_try: { name: string; place: string }[];
  season: string | null;
  cultural_note: string | null;
  media?: {
    images: { url: string; license: string; caption?: string; credit?: string; source_url?: string }[];
  } | null;
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
let plannerCache: PlannerData | null = null;

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
  return readDir<Itinerary>("itineraries").sort((a, b) => a.duration_days - b.duration_days || a.title.localeCompare(b.title));
}

export function getItinerary(slug: string): Itinerary | undefined {
  return getItineraries().find((i) => i.slug === slug);
}

export function getEvents(): EventRec[] {
  return readDir<EventRec>("events").sort(
    (a, b) => (a.timing.typical_months[0] ?? 13) - (b.timing.typical_months[0] ?? 13)
  );
}

export function getFoods(): Food[] {
  return readDir<Food>("food").sort((a, b) => a.name.en.localeCompare(b.name.en));
}

export { MONTHS, formatMonths, categoryLabel } from "./format";

/** Local card/hero image for a spot, if one has been staged under public/images/spots. */
export function getSpotImagePath(spotId: string): string | null {
  const p = path.join(process.cwd(), "public", "images", "spots", `${spotId}.jpg`);
  return fs.existsSync(p) ? `/images/spots/${spotId}.jpg` : null;
}

export interface GalleryItem {
  type: "image" | "video";
  src: string;
  poster?: string;
  caption?: string | null;
  credit?: string | null;
  license?: string | null;
  sourceUrl?: string | null;
}

/**
 * Everything visual we hold for a spot, in display order: the staged hero,
 * then any numbered extras that exist on disk (id-2.jpg, id-3.jpg …), then the
 * clips. Captions and credits come from the record's media.images by index,
 * the staging convention keeps the two aligned.
 */
export function getSpotGallery(spot: Spot): GalleryItem[] {
  const items: GalleryItem[] = [];
  const dir = path.join(process.cwd(), "public", "images", "spots");
  const meta = (i: number) => spot.media.images[i];

  if (fs.existsSync(path.join(dir, `${spot.id}.jpg`))) {
    const m = meta(0);
    items.push({
      type: "image",
      src: `/images/spots/${spot.id}.jpg`,
      caption: m?.caption,
      credit: m?.credit,
      license: m?.license,
      sourceUrl: m?.source_url,
    });
  }
  for (let i = 2; i <= 8; i++) {
    const file = `${spot.id}-${i}.jpg`;
    if (!fs.existsSync(path.join(dir, file))) continue;
    const m = meta(i - 1);
    items.push({
      type: "image",
      src: `/images/spots/${file}`,
      caption: m?.caption,
      credit: m?.credit,
      license: m?.license,
      sourceUrl: m?.source_url,
    });
  }
  for (const v of spot.media.videos ?? []) {
    items.push({
      type: "video",
      src: v.url,
      poster: v.url.replace(/\.mp4$/, ".jpg"),
      caption: v.title,
      credit: v.source,
      license: "own",
    });
  }
  return items;
}

/** Local image for a food record, if one has been staged under public/images/food. */
export function getFoodImagePath(foodId: string): string | null {
  const p = path.join(process.cwd(), "public", "images", "food", `${foodId}.jpg`);
  return fs.existsSync(p) ? `/images/food/${foodId}.jpg` : null;
}

export interface Stay {
  id: string;
  slug: string;
  name: string;
  type: string;
  district: "dang" | "narmada";
  cluster: string | null;
  spot_id: string | null;
  coordinates: { lat: number; lng: number; precision: string } | null;
  price_band: string;
  booking: { mode: string; url: string | null; notes: string | null };
  contact: string | null;
  amenities: string[];
  nearest_spots: { id: string; distance_km: number }[];
  notes: string | null;
  provenance: {
    created: string;
    last_verified: string | null;
    confidence: "high" | "medium" | "low";
    sources: { title: string; url: string; publisher: string; accessed: string }[];
    needs_verification: string[];
  };
}

let staysCache: Stay[] | null = null;

export function getStays(): Stay[] {
  if (!staysCache) {
    staysCache = readDir<Stay>("stays").sort((a, b) => a.name.localeCompare(b.name));
  }
  return staysCache;
}

/**
 * Beds near a spot, nearest first.
 *
 * Every spot record carries `access.stay_nearby`, but it is empty on all 106 of
 * them, so this reads the relationship from the other end, where the data
 * actually lives: each stay lists its own `nearest_spots`. Falls back to sharing
 * a cluster, which is how a Saputara spot finds the Saputara hotel belt.
 */
export function getStaysNearSpot(spot: Spot, limit = 4): { stay: Stay; km: number | null }[] {
  const direct: { stay: Stay; km: number | null }[] = [];
  const sameCluster: { stay: Stay; km: number | null }[] = [];

  for (const stay of getStays()) {
    const edge = stay.nearest_spots?.find((n) => n.id === spot.id);
    if (edge || stay.spot_id === spot.id) {
      direct.push({ stay, km: edge ? edge.distance_km : 0 });
    } else if (stay.cluster && stay.cluster === spot.cluster) {
      sameCluster.push({ stay, km: null });
    }
  }
  direct.sort((a, b) => (a.km ?? 0) - (b.km ?? 0));
  return [...direct, ...sameCluster].slice(0, limit);
}

/**
 * The planner's payload: every spot, hub and stay, slimmed to what the algorithm
 * actually reads. `summary` and `description` are omitted deliberately: they are
 * most of the weight of the /spots payload and the planner never renders them.
 *
 * The mapping itself lives in ./planner-index (no node:fs), so the browser, the
 * server and `node --test` all share one implementation.
 */
export function getPlannerIndex(): PlannerData {
  if (!plannerCache) {
    const registry = readJson<{ hubs: Record<string, Record<string, [number, number]>> }>(
      path.join(process.cwd(), "..", "scripts", "registry.json")
    );
    plannerCache = buildPlannerIndex(
      getAllSpots() as unknown as RawSpotForPlanner[],
      readDir<RawStayForPlanner>("stays"),
      registry,
      (id) => getSpotImagePath(id) !== null
    );
  }
  return plannerCache;
}

/** Slim a full Spot down to the card contract (adds the local image path). */
export function toCardData(s: Spot) {
  return {
    slug: s.slug,
    district: s.district,
    name: { en: s.name.en },
    category: s.category,
    cluster: s.cluster,
    tags: s.tags,
    summary: s.summary,
    seasonality: { monsoon_dependent: s.seasonality.monsoon_dependent },
    provenance: { confidence: s.provenance.confidence },
    image: getSpotImagePath(s.id),
    /**
     * Free to enter. Derived, not tagged: the `free-entry` tag exists in the
     * registry vocabulary but is applied to zero of the 106 records, so the
     * explorer's "Free entry" chip silently emptied the grid, while 72 spots
     * are in fact free (66 with an empty fee list, 6 with all-zero fees).
     */
    free: s.visit.fees !== null && !s.visit.fees.some((f) => f.amount_inr > 0),
  };
}
