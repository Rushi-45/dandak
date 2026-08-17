/**
 * Builds the planner's slim index from already-parsed dataset records. 
 *
 * Deliberately takes parsed JSON rather than reading disk, so the same mapping
 * serves the server (lib/data.ts) and the test runner without duplication,
 * and so this module stays free of node:fs and safe to reason about. 
 *
 * Summary and description are omitted on purpose: they dominate the existing
 * /spots client payload, and the planner never shows them. 
 */
import type { PlannerData, PlannerSpot, PlannerStay, PlannerHub, Precision, Confidence } from "./planner";

const WALK_IN = /trek|walk|steps|climb|descend|footpath|hike/i;

export interface RawSpotForPlanner {
  id: string;
  slug: string;
  district: "dang" | "narmada";
  name: { en: string };
  category: string;
  cluster: string | null;
  tags: string[];
  location: {
    coordinates: { lat: number; lng: number; precision: string };
    distances_km?: Record<string, number> | null;
  };
  access?: { last_mile?: string | null };
  visit: { duration_min: number; weekly_closure?: string | null };
  seasonality: {
    best_months: number[];
    avoid_months: number[];
    monsoon_dependent: boolean | null;
  };
  media?: { images?: unknown[] };
  nearby?: { id: string; distance_km: number }[];
  provenance: { confidence: Confidence };
}

export interface RawStayForPlanner {
  id: string;
  name: string;
  type: string;
  price_band: string;
  cluster: string | null;
  spot_id: string | null;
  coordinates: { lat: number; lng: number } | null;
  nearest_spots?: { id: string; distance_km: number }[];
  booking?: { url?: string | null; notes?: string | null };
  contact?: string | null;
}

export function toPlannerSpot(s: RawSpotForPlanner, hasPhoto: boolean): PlannerSpot {
  return {
    id: s.id,
    slug: s.slug,
    district: s.district,
    name: s.name.en,
    lat: s.location.coordinates.lat,
    lng: s.location.coordinates.lng,
    precision: (s.location.coordinates.precision as Precision) ?? "area",
    category: s.category,
    cluster: s.cluster ?? null,
    durationMin: s.visit.duration_min,
    weeklyClosure: s.visit.weekly_closure ?? null,
    bestMonths: s.seasonality.best_months ?? [],
    avoidMonths: s.seasonality.avoid_months ?? [],
    monsoonDependent: Boolean(s.seasonality.monsoon_dependent),
    confidence: s.provenance.confidence,
    hasPhoto,
    walkIn: WALK_IN.test(s.access?.last_mile ?? ""),
    tags: s.tags ?? [],
    nearby: (s.nearby ?? []).map((n) => ({ id: n.id, km: n.distance_km })),
    hubKm: s.location.distances_km ?? {},
  };
}

export function toPlannerStay(s: RawStayForPlanner): PlannerStay {
  return {
    id: s.id,
    name: s.name,
    type: s.type,
    priceBand: s.price_band,
    cluster: s.cluster ?? null,
    spotId: s.spot_id ?? null,
    nearestSpotIds: (s.nearest_spots ?? []).map((n) => n.id),
    lat: s.coordinates?.lat ?? null,
    lng: s.coordinates?.lng ?? null,
    bookingUrl: s.booking?.url ?? null,
    bookingNotes: s.booking?.notes ?? null,
    contact: s.contact ?? null,
  };
}

/** Hub display names: the registry only holds kebab keys and coordinates. */
export function hubLabel(key: string): string {
  const special: Record<string, string> = { "ekta-nagar": "Ekta Nagar (Kevadia)" };
  return special[key] ?? key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildPlannerIndex(
  rawSpots: RawSpotForPlanner[],
  rawStays: RawStayForPlanner[],
  registry: { hubs: Record<string, Record<string, [number, number]>> },
  hasPhoto: (id: string) => boolean
): PlannerData {
  const spots = rawSpots
    .filter((s) => s.location?.coordinates)
    .map((s) => toPlannerSpot(s, hasPhoto(s.id)));

  // hubs are declared per district and overlap (surat, vadodara…), dedupe by key
  const hubMap = new Map<string, PlannerHub>();
  for (const table of Object.values(registry.hubs ?? {})) {
    for (const [key, coords] of Object.entries(table)) {
      if (hubMap.has(key)) continue;
      hubMap.set(key, { key, name: hubLabel(key), lat: coords[0], lng: coords[1] });
    }
  }

  return {
    spots: spots.sort((a, b) => a.name.localeCompare(b.name)),
    hubs: [...hubMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
    stays: rawStays.map(toPlannerStay),
  };
}
