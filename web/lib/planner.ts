/**
 * Trip planner: pure, dependency-free, runs in the browser. 
 *
 * No React, no node:fs, no network. Everything here is a pure function so it can
 * be unit-tested with `node --test` and imported by a client component. 
 *
 * The constants are regressed from the dataset itself (224 curated road-distance
 * pairs and the twelve hand-built itineraries), not guessed: see the comments
 * on each block. 
 */

// ---------------------------------------------------------------- types

export type Precision = "exact" | "approximate" | "area";
export type Confidence = "high" | "medium" | "low";
export type SeasonTier = "peak" | "ok" | "weak" | "closed";
export type DistanceSource = "curated-nearby" | "curated-hub" | "estimated";

export interface PlannerSpot {
  id: string;
  slug: string;
  district: "dang" | "narmada";
  name: string;
  lat: number;
  lng: number;
  precision: Precision;
  category: string;
  cluster: string | null;
  durationMin: number;
  bestMonths: number[];
  avoidMonths: number[];
  monsoonDependent: boolean;
  confidence: Confidence;
  hasPhoto: boolean;
  walkIn: boolean;
  tags: string[];
  nearby: { id: string; km: number }[];
  hubKm: Record<string, number>;
}

export interface PlannerHub {
  key: string;
  name: string;
  lat: number;
  lng: number;
}

export interface PlannerStay {
  id: string;
  name: string;
  type: string;
  priceBand: string;
  cluster: string | null;
  spotId: string | null;
  nearestSpotIds: string[];
  lat: number | null;
  lng: number | null;
  bookingUrl: string | null;
  /** the published tariff line, the single most useful thing when choosing a bed */
  bookingNotes: string | null;
  contact: string | null;
}

export interface PlannerData {
  spots: PlannerSpot[];
  hubs: PlannerHub[];
  stays: PlannerStay[];
}

/** A point on the route: either a hub town or one of our spots. */
export interface Node {
  key: string; // "h:saputara" | "s:dang-gira-falls"
  kind: "hub" | "spot";
  name: string;
  lat: number;
  lng: number;
  cluster: string | null;
  spot?: PlannerSpot;
}

export interface PlanInput {
  from: string; // node key
  to: string; // node key
  days: number; // 1..5
  month: number; // 1..12
  must: string[]; // spot ids
}

export interface PlannedStop {
  spot: PlannerSpot;
  day: number;
  order: number; // GLOBALLY sequential across days, matches all 12 curated itineraries
  arriveAfterMin: number;
  driveMinFromPrev: number;
  driveKmFromPrev: number;
  distanceSource: DistanceSource;
  seasonTier: SeasonTier;
  seasonNote: string | null;
}

export interface PlannedDay {
  day: number;
  stops: PlannedStop[];
  startNode: Node;
  endNode: Node;
  driveKm: number;
  driveMin: number;
  visitMin: number;
  transitLeg: { fromName: string; toName: string; km: number; min: number } | null;
  /** empty on the final day, you go home rather than sleep */
  stays: StayOption[];
}

export interface Excluded {
  id: string;
  name: string;
  reason: string;
}

export interface PlanResult {
  days: PlannedDay[];
  totalKm: number;
  totalDriveMin: number;
  totalVisitMin: number;
  excluded: Excluded[];
  excludedBySeason: number;
  warnings: string[];
  estimatedLegs: number; // how many legs fell back to computed distance
  curatedLegs: number;
  from: Node;
  to: Node;
  isLoop: boolean;
}

// ------------------------------------------------------------ constants

/**
 * Road factor by cluster, regressed from the 224 curated (road km, straight-line km)
 * pairs already in the dataset. The global median is 1.45; the interior and ghat
 * clusters run 1.62–1.85. A flat 1.35 sits at the 35th percentile and underestimates
 * every interior leg. 
 */
export const ROAD_FACTOR: Record<string, number> = {
  "sou-complex": 1.2,
  "ekta-nagar-area": 1.3,
  rajpipla: 1.35,
  waghai: 1.45,
  poicha: 1.55,
  "dang-interior": 1.65,
  "dediapada-belt": 1.7,
  saputara: 1.85,
};
export const ROAD_FACTOR_DEFAULT = 1.55;
export const ROAD_FACTOR_HIGHWAY = 1.25;

/** Hubs that sit on national highways, legs touching them move much faster. */
const HIGHWAY_HUBS = new Set([
  "surat",
  "vadodara",
  "bharuch",
  "ankleshwar",
  "ahmedabad",
  "mumbai",
  "nashik",
  "bilimora",
]);
const INTERIOR_CLUSTERS = new Set(["dang-interior", "dediapada-belt"]);
const GHAT_CLUSTERS = new Set(["saputara"]);

export const SPEED_KMH = { highway: 55, district: 38, interior: 25, ghat: 25 };
export const MONSOON_SPEED_MULT = 0.8;
export const MONSOON_HIGHWAY_MULT = 0.9; // highways suffer less than forest road
/** How much of a long leg is local road at each end, before the highway starts. */
export const LOCAL_END_KM = 12;

/**
 * Day budget anchored to the twelve hand-built itineraries: their visit-minutes per
 * day run 180–465 (mean 320) and no day exceeds 8 stops. 540 wall-clock minutes
 * (09:00–18:00) minus 75 for lunch, fuel and parking. 
 */
export const USABLE_DAY_MIN = 465;
export const STOP_OVERHEAD_MIN = 10;
export const LAST_MILE_WALK_MIN = 15;
export const MAX_STOPS_PER_DAY = 7;
export const CLUSTER_SOFT_CAP = 3;
export const CLUSTER_ANCHOR_CAP = 5; // when the day is based in that cluster
export const CATEGORY_SOFT_CAP = 3; // the actual fix for "twelve gardens"
/**
 * Fatigue: each place already taken from the same cluster (or category) makes the
 * next one *look* further away by this many 5 km buckets. Without it, a loop's
 * ranking is pure radius, which is pure cluster-ranking, and a Saputara day trip
 * returns five town gardens while Girmal and Gira never surface. 
 */
export const CLUSTER_FATIGUE_BUCKETS = 2; // ≈10 km of apparent detour per repeat
export const CATEGORY_FATIGUE_BUCKETS = 1; // ≈5 km
/**
 * In its season, a monsoon waterfall is worth driving for, that is the entire
 * reason people come to Dang in July. Without this, near-town gardens always
 * outrank Girmal and Gira and a monsoon plan contains no falls at all. 
 */
export const SEASON_PEAK_BUCKET_DISCOUNT = 3; // ≈15 km of forgiven detour
export const TRANSIT_LEG_MIN = 90; // a drive this long is called out, not hidden

/** 98 of 106 coordinates carry real positional uncertainty, budget for it. */
export const PRECISION_SLACK_KM: Record<Precision, number> = {
  exact: 0,
  approximate: 2,
  area: 4,
};
export const COARSE_COORD_SLACK_KM = 8;

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ------------------------------------------------------------- geometry

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Decimal places of a coordinate: two records sit on a ~11 km grid (1 dp). */
function decimals(n: number): number {
  const s = String(n);
  const i = s.indexOf(".");
  return i === -1 ? 0 : s.length - i - 1;
}

export function coordSlackKm(spot: Pick<PlannerSpot, "precision" | "lat" | "lng">): number {
  // the COARSEST axis sets the grid: 21.03, 73.4 is precise in latitude and
  // ~11 km wide in longitude, so it deserves the coarse slack
  const dp = Math.min(decimals(spot.lat), decimals(spot.lng));
  if (dp <= 1) return COARSE_COORD_SLACK_KM;
  return PRECISION_SLACK_KM[spot.precision] ?? 2;
}

/**
 * Where a point falls along the start→end corridor. 
 * `t` is deliberately unclamped so callers can see spots that sit past the end
 * (t > 1) or behind the start (t < 0). Degenerate (loop) input returns t = 0. 
 */
export function projectOntoCorridor(
  p: { lat: number; lng: number },
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): { t: number; offsetKm: number } {
  const kx = Math.cos((((start.lat + end.lat) / 2) * Math.PI) / 180);
  const ax = start.lng * kx;
  const ay = start.lat;
  const bx = end.lng * kx;
  const by = end.lat;
  const px = p.lng * kx;
  const py = p.lat;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-12) return { t: 0, offsetKm: haversineKm(p, start) };
  const t = ((px - ax) * dx + (py - ay) * dy) / len2;
  const projLat = ay + t * dy;
  const projLng = (ax + t * dx) / kx;
  return { t, offsetKm: haversineKm(p, { lat: projLat, lng: projLng }) };
}

// ----------------------------------------------------- distance cascade

export function roadFactorFor(a: Node, b: Node): number {
  const hubKey = (n: Node) => (n.kind === "hub" ? n.key.slice(2) : null);
  if (HIGHWAY_HUBS.has(hubKey(a) ?? "") || HIGHWAY_HUBS.has(hubKey(b) ?? "")) {
    return ROAD_FACTOR_HIGHWAY;
  }
  const fa = a.cluster ? ROAD_FACTOR[a.cluster] : undefined;
  const fb = b.cluster ? ROAD_FACTOR[b.cluster] : undefined;
  if (fa === undefined && fb === undefined) return ROAD_FACTOR_DEFAULT;
  return Math.max(fa ?? ROAD_FACTOR_DEFAULT, fb ?? ROAD_FACTOR_DEFAULT);
}

export function legSpeedKmh(a: Node, b: Node, month: number): number {
  const hubKey = (n: Node) => (n.kind === "hub" ? n.key.slice(2) : null);
  if (HIGHWAY_HUBS.has(hubKey(a) ?? "") || HIGHWAY_HUBS.has(hubKey(b) ?? "")) {
    return SPEED_KMH.highway;
  }
  const clusters = [a.cluster, b.cluster];
  const ghat = clusters.some((c) => c && GHAT_CLUSTERS.has(c));
  const interior = clusters.some((c) => c && INTERIOR_CLUSTERS.has(c));
  let speed = SPEED_KMH.district;
  if (ghat) speed = SPEED_KMH.ghat;
  else if (interior) speed = SPEED_KMH.interior;
  const monsoon = month >= 6 && month <= 9;
  if (monsoon && (ghat || interior)) speed *= MONSOON_SPEED_MULT;
  return speed;
}

/**
 * Leg distance, preferring the project's own curated road figures:
 *   1. `nearby[]`, 286 curated spot-to-spot edges
 *   2. `distances_km`, when one end IS that hub
 *   3. haversine × road factor, clamped to at least the straight line
 *      (three records currently claim road km *below* straight-line)
 */
export function legDistanceKm(a: Node, b: Node): { km: number; source: DistanceSource } {
  const straight = haversineKm(a, b);

  if (a.spot && b.spot) {
    const edge =
      a.spot.nearby.find((n) => n.id === b.spot!.id) ?? 
      b.spot.nearby.find((n) => n.id === a.spot!.id);
    if (edge) return { km: Math.max(edge.km, straight), source: "curated-nearby" };
  }
  const hubSpot = (h: Node, s: Node) => {
    if (h.kind !== "hub" || !s.spot) return null;
    const km = s.spot.hubKm[h.key.slice(2)];
    return typeof km === "number" ? km : null;
  };
  const viaHub = hubSpot(a, b) ?? hubSpot(b, a);
  if (viaHub !== null) return { km: Math.max(viaHub, straight), source: "curated-hub" };

  return { km: straight * roadFactorFor(a, b), source: "estimated" };
}

/**
 * A long leg is not slow all the way. Ekta Nagar to Saputara is 261 km of mostly
 * state highway with forest road at each end; charging the whole thing at the
 * interior speed priced it at 13 hours and produced a "day" of 900 minutes. 
 *
 * So: the first and last stretch run at the local speed the clusters imply, and
 * anything beyond that runs at highway speed. 
 */
export function driveMinutes(a: Node, b: Node, month: number): number {
  const { km } = legDistanceKm(a, b);
  const local = legSpeedKmh(a, b, month);
  if (local >= SPEED_KMH.highway) return Math.round((km / local) * 60);

  const localKm = Math.min(km, LOCAL_END_KM * 2);
  const highwayKm = Math.max(0, km - localKm);
  const monsoon = month >= 6 && month <= 9;
  const highway = SPEED_KMH.highway * (monsoon ? MONSOON_HIGHWAY_MULT : 1);
  return Math.round((localKm / local + highwayKm / highway) * 60);
}

/** Visit cost: the record's own duration, plus parking, plus any walk-in. */
export function stopCostMinutes(spot: PlannerSpot): number {
  return spot.durationMin + STOP_OVERHEAD_MIN + (spot.walkIn ? LAST_MILE_WALK_MIN : 0);
}

// --------------------------------------------------------------- season

/**
 * Four tiers, because hard-excluding everything outside `best_months` would drop
 * the Sardar Sarovar dam in December: it is open, ticketed and floodlit all year;
 * only the overflow is seasonal. Only genuinely-shut places are excluded. 
 */
export function seasonTier(spot: PlannerSpot, month: number): SeasonTier {
  const avoided = spot.avoidMonths.includes(month);
  const isBest = spot.bestMonths.length === 0 || spot.bestMonths.includes(month);
  if (avoided && !spot.monsoonDependent) return "closed";
  if (spot.monsoonDependent && !isBest) return "weak";
  if (avoided) return "weak";
  return isBest ? "peak" : "ok";
}

export function seasonNote(spot: PlannerSpot, month: number): string | null {
  const tier = seasonTier(spot, month);
  const m = MONTH_NAMES[month - 1];
  if (tier === "weak") {
    return spot.monsoonDependent
      ? `Likely dry in ${m}: this one runs with the monsoon`
      : `${m} is not its season`;
  }
  if (tier === "closed") return `Closed or not worth it in ${m}`;
  return null;
}

// -------------------------------------------------------------- ranking

const CONFIDENCE_SCORE: Record<Confidence, number> = { high: 3, medium: 2, low: 1 };

export function notabilityScore(spot: PlannerSpot, month: number): number {
  return (
    CONFIDENCE_SCORE[spot.confidence] +
    (spot.hasPhoto ? 1 : 0) +
    (seasonTier(spot, month) === "peak" ? 1 : 0)
  );
}

/**
 * Lexicographic rank. Offsets are bucketed to 5 km bands first because 73 of 106
 * records self-declare their coordinates unverified, ranking on raw metres would
 * reshuffle every plan whenever a coordinate is corrected. 
 */
export interface RankKey {
  offsetBucket: number;
  diversityPenalty: number;
  notability: number;
  duration: number;
  slug: string;
}

export function compareRankKey(a: RankKey, b: RankKey): number {
  return (
    a.offsetBucket - b.offsetBucket ||
    a.diversityPenalty - b.diversityPenalty ||
    b.notability - a.notability ||
    b.duration - a.duration ||
    a.slug.localeCompare(b.slug)
  );
}

// -------------------------------------------------------------- routing

function nodeOf(spot: PlannerSpot): Node {
  return {
    key: `s:${spot.id}`,
    kind: "spot",
    name: spot.name,
    lat: spot.lat,
    lng: spot.lng,
    cluster: spot.cluster,
    spot,
  };
}

export function hubNode(hub: PlannerHub): Node {
  return { key: `h:${hub.key}`, kind: "hub", name: hub.name, lat: hub.lat, lng: hub.lng, cluster: null };
}

export function resolveNode(key: string, data: PlannerData): Node | null {
  if (key.startsWith("h:")) {
    const hub = data.hubs.find((h) => h.key === key.slice(2));
    return hub ? hubNode(hub) : null;
  }
  if (key.startsWith("s:")) {
    const spot = data.spots.find((s) => s.id === key.slice(2));
    return spot ? nodeOf(spot) : null;
  }
  return null;
}

/** Total drive time for an ordered chain. */
function chainMinutes(nodes: Node[], month: number): number {
  let total = 0;
  for (let i = 1; i < nodes.length; i++) total += driveMinutes(nodes[i - 1], nodes[i], month);
  return total;
}

function chainKm(nodes: Node[]): number {
  let total = 0;
  for (let i = 1; i < nodes.length; i++) total += legDistanceKm(nodes[i - 1], nodes[i]).km;
  return total;
}

/** Exact optimal ordering of the interior nodes (Held–Karp). n ≤ 9 → sub-millisecond. */
export function solveExact(start: Node, interior: Node[], end: Node, month: number): Node[] {
  const n = interior.length;
  if (n <= 1) return interior;
  const size = 1 << n;

  /*
   * Every pair cost, once, up front.
   *
   * Held-Karp visits O(2^n * n^2) transitions and this used to call
   * driveMinutes at each one, recomputing the same haversine, road factor and
   * leg speed for the same pair of places thousands of times over. At n = 9
   * that is roughly 41,000 evaluations of trigonometry against 121 distinct
   * pairs. Profiling a four-day plan put 70% of planTrip's time in
   * haversineKm, roadFactorFor and legSpeedKmh, all of it reached from here.
   *
   * The matrix is (n+2)^2 and the solver below is then pure array lookups.
   * Both directions are computed rather than mirroring one triangle, because
   * legDistanceKm can answer from curated road figures that are not guaranteed
   * to be symmetric.
   */
  const nodes = [start, ...interior, end];
  const S = 0;
  const E = n + 1;
  const m: number[][] = Array.from({ length: n + 2 }, () => new Array(n + 2).fill(0));
  for (let i = 0; i < n + 2; i++) {
    for (let j = 0; j < n + 2; j++) {
      if (i !== j) m[i][j] = driveMinutes(nodes[i], nodes[j], month);
    }
  }

  const dp: number[][] = Array.from({ length: size }, () => new Array(n).fill(Infinity));
  const parent: number[][] = Array.from({ length: size }, () => new Array(n).fill(-1));
  for (let i = 0; i < n; i++) dp[1 << i][i] = m[S][i + 1];
  for (let mask = 1; mask < size; mask++) {
    for (let last = 0; last < n; last++) {
      if (!(mask & (1 << last)) || dp[mask][last] === Infinity) continue;
      const row = m[last + 1];
      for (let next = 0; next < n; next++) {
        if (mask & (1 << next)) continue;
        const nm = mask | (1 << next);
        const cand = dp[mask][last] + row[next + 1];
        if (cand < dp[nm][next]) {
          dp[nm][next] = cand;
          parent[nm][next] = last;
        }
      }
    }
  }
  const full = size - 1;
  let best = Infinity;
  let bestLast = 0;
  for (let last = 0; last < n; last++) {
    const total = dp[full][last] + m[last + 1][E];
    if (total < best) {
      best = total;
      bestLast = last;
    }
  }
  const order: number[] = [];
  let mask = full;
  let cur = bestLast;
  while (cur !== -1) {
    order.push(cur);
    const p = parent[mask][cur];
    mask ^= 1 << cur;
    cur = p;
  }
  order.reverse();
  return order.map((i) => interior[i]);
}

/** 2-opt polish for longer chains. Idempotent. */
export function twoOpt(start: Node, interior: Node[], end: Node, month: number): Node[] {
  let best = interior.slice();
  let improved = true;
  const total = (arr: Node[]) => chainMinutes([start, ...arr, end], month);
  let bestCost = total(best);
  while (improved) {
    improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const cand = best.slice();
        const seg = cand.slice(i, j + 1).reverse();
        cand.splice(i, seg.length, ...seg);
        const c = total(cand);
        if (c < bestCost - 0.5) {
          best = cand;
          bestCost = c;
          improved = true;
        }
      }
    }
  }
  return best;
}

export function orderRoute(start: Node, interior: Node[], end: Node, month: number): Node[] {
  if (interior.length <= 1) return interior;
  // corridor order first, monotone along the route, so the map never self-crosses
  const seeded = interior
    .map((n) => ({ n, t: projectOntoCorridor(n, start, end).t }))
    .sort((a, b) => a.t - b.t)
    .map((x) => x.n);
  return interior.length <= 9
    ? solveExact(start, seeded, end, month)
    : twoOpt(start, seeded, end, month);
}

/** Loop trips have no corridor, sweep around the base instead. */
export function orderRadial(base: Node, interior: Node[]): Node[] {
  return interior
    .map((n) => ({ n, a: Math.atan2(n.lat - base.lat, n.lng - base.lng) }))
    .sort((x, y) => x.a - y.a)
    .map((x) => x.n);
}

// ---------------------------------------------------------------- stays

export type StayMatch = "at-the-spot" | "nearest-spot" | "cluster" | "coords";

export interface StayOption {
  stay: PlannerStay;
  matchedOn: StayMatch;
  /** null for the handful of stays with no coordinates, e.g. the Tent Cities */
  km: number | null;
}

/**
 * Beds for the end of a day, best match first. 
 *
 * Returns several rather than one: a night is a choice, and the corpus now has
 * a government campsite, a homestay and a hotel within reach of the same
 * evening. Match quality leads, then distance, then id so the list is stable
 * across coordinate-fix commits. 
 */
export function suggestStays(
  dayEnd: Node,
  stays: PlannerStay[],
  limit = 3
): StayOption[] {
  const spotId = dayEnd.spot?.id ?? null;
  const RANK: Record<StayMatch, number> = {
    "at-the-spot": 0,
    "nearest-spot": 1,
    cluster: 2,
    coords: 3,
  };

  const found: (StayOption & { rank: number })[] = [];
  for (const stay of stays) {
    const km =
      stay.lat !== null && stay.lng !== null
        ? haversineKm(dayEnd, { lat: stay.lat, lng: stay.lng })
        : null;

    let matchedOn: StayMatch | null = null;
    if (spotId && stay.spotId === spotId) matchedOn = "at-the-spot";
    else if (spotId && stay.nearestSpotIds.includes(spotId)) matchedOn = "nearest-spot";
    else if (dayEnd.cluster && stay.cluster === dayEnd.cluster) matchedOn = "cluster";
    else if (km !== null && km <= 60) matchedOn = "coords";
    if (!matchedOn) continue;

    found.push({ stay, matchedOn, km, rank: RANK[matchedOn] });
  }

  // A null distance can only come from an explicit match, the coords branch
  // requires coordinates to fire at all, so it means "this record asserts it
  // serves the spot", not "unreachable". Sorting it last would bury the Tent
  // Cities, which have no coordinates and are the obvious bed at the Statue. 
  found.sort(
    (a, b) => a.rank - b.rank || (a.km ?? 0) - (b.km ?? 0) || a.stay.id.localeCompare(b.stay.id)
  );
  return found.slice(0, limit).map(({ stay, matchedOn, km }) => ({ stay, matchedOn, km }));
}

// ------------------------------------------------------------- URL state

export function encodePlan(input: PlanInput): string {
  const p = new URLSearchParams();
  p.set("from", input.from);
  p.set("to", input.to);
  p.set("days", String(input.days));
  p.set("month", String(input.month));
  if (input.must.length) p.set("must", input.must.join(","));
  return p.toString();
}

export function decodePlan(
  search: string,
  data: PlannerData
): { input: PlanInput | null; dropped: string[] } {
  const p = new URLSearchParams(search);
  const from = p.get("from");
  const to = p.get("to");
  if (!from || !to) return { input: null, dropped: [] };
  if (!resolveNode(from, data) || !resolveNode(to, data)) return { input: null, dropped: [] };

  const days = Math.min(5, Math.max(1, Number(p.get("days")) || 1));
  const rawMonth = Number(p.get("month"));
  const month = rawMonth >= 1 && rawMonth <= 12 ? rawMonth : 0;
  const wanted = (p.get("must") ?? "").split(",").filter(Boolean);
  const must = wanted.filter((id) => data.spots.some((s) => s.id === id));
  const dropped = wanted.filter((id) => !must.includes(id));
  return { input: { from, to, days, month, must: must.slice(0, 5) }, dropped };
}

// --------------------------------------------------------------- packing

export interface PackResult {
  days: PlannedDay[];
  dropped: string[];
  curatedLegs: number;
  estimatedLegs: number;
}

/**
 * Walk an ordered route and cut it into days. 
 *
 * Extracted so that selection can gate on the *actual* packing. Gating on a
 * pooled `days × USABLE_DAY_MIN` budget instead lets a stop pass selection and
 * then get dropped here, which is how a 2-day Surat trip ended up with two
 * stops and a warning about places that "fitted the route but not the clock",
 * while day one ran at two-thirds capacity. Time is not fungible across days. 
 */
export function packDays(
  from: Node,
  ordered: Node[],
  to: Node,
  days: number,
  month: number,
  stays: PlannerStay[],
  /** spot ids the traveller demanded, placed even when they wreck the day */
  mustIds: Set<string> = new Set()
): PackResult {
  const driveMonth = month || 1; // 0 means "month not chosen"; speeds still need one
  const plannedDays: PlannedDay[] = [];
  const dropped: string[] = [];
  let dayIndex = 1;
  let order = 0;
  let cursor: Node = from;
  let dayStops: PlannedStop[] = [];
  let dayVisit = 0;
  let dayDrive = 0;
  let dayKm = 0;
  let dayStart: Node = from;
  let transit: PlannedDay["transitLeg"] = null;
  let curatedLegs = 0;
  let estimatedLegs = 0;

  const closeDay = (endNode: Node) => {
    plannedDays.push({
      day: dayIndex,
      stops: dayStops,
      startNode: dayStart,
      endNode,
      driveKm: Math.round(dayKm),
      driveMin: dayDrive,
      visitMin: dayVisit,
      transitLeg: transit,
      stays: dayIndex < days ? suggestStays(endNode, stays) : [],
    });
    dayIndex++;
    dayStops = [];
    dayVisit = 0;
    dayDrive = 0;
    dayKm = 0;
    transit = null;
    dayStart = endNode;
  };

  for (const node of ordered) {
    const spot = node.spot!;
    const leg = legDistanceKm(cursor, node);
    const drive = driveMinutes(cursor, node, driveMonth);
    const cost = stopCostMinutes(spot);
    // Whichever day ends the trip still has to reach the finish; earlier days
    // just end where they end and you sleep there. Without reserving it, the
    // last day silently ran an hour over. Recomputed after a day closes, since
    // closing changes which day this is. 
    const isFinalStop = node === ordered[ordered.length - 1];
    const tailFor = (idx: number) =>
      idx === days || isFinalStop ? driveMinutes(node, to, driveMonth) : 0;
    const wouldBe = dayVisit + dayDrive + drive + cost + tailFor(dayIndex);

    const required = mustIds.has(spot.id);
    const dayFull = wouldBe > USABLE_DAY_MIN || dayStops.length >= MAX_STOPS_PER_DAY;
    if (dayStops.length && dayFull) {
      if (dayIndex < days) {
        closeDay(cursor);
      } else if (!required) {
        // last day is full: drop the tail rather than emit a 12-hour day
        dropped.push(spot.name);
        continue;
      }
    }
    // A day's first stop used to bypass the budget entirely, which is how a
    // 261 km transfer became a single-stop 15-hour day. If it does not fit an
    // empty day it does not fit any day. 
    if (!required && !dayStops.length && drive + cost + tailFor(dayIndex) > USABLE_DAY_MIN) {
      dropped.push(spot.name);
      continue;
    }

    if (leg.source === "estimated") estimatedLegs++;
    else curatedLegs++;
    if (drive >= TRANSIT_LEG_MIN) {
      transit = { fromName: cursor.name, toName: node.name, km: Math.round(leg.km), min: drive };
    }

    order++;
    dayStops.push({
      spot,
      day: dayIndex,
      order,
      arriveAfterMin: dayVisit + dayDrive + drive,
      driveMinFromPrev: drive,
      driveKmFromPrev: Math.round(leg.km),
      distanceSource: leg.source,
      seasonTier: month ? seasonTier(spot, month) : "ok",
      seasonNote: month ? seasonNote(spot, month) : null,
    });
    dayVisit += cost;
    dayDrive += drive;
    dayKm += leg.km;
    cursor = node;
  }

  const finalLeg = legDistanceKm(cursor, to);
  dayKm += finalLeg.km;
  dayDrive += driveMinutes(cursor, to, driveMonth);
  closeDay(to);

  return { days: plannedDays, dropped, curatedLegs, estimatedLegs };
}

// ------------------------------------------------------------- planning

function isSamePlace(a: Node, b: Node): boolean {
  return a.key === b.key || haversineKm(a, b) < 0.4;
}

export function mustVisitDetourKm(spot: PlannerSpot, start: Node, end: Node): number {
  const n = nodeOf(spot);
  return Math.max(
    0,
    legDistanceKm(start, n).km + legDistanceKm(n, end).km - legDistanceKm(start, end).km
  );
}

/** The whole planner. Deterministic: same input, same output. */
export function planTrip(input: PlanInput, data: PlannerData): PlanResult | null {
  const from = resolveNode(input.from, data);
  const to = resolveNode(input.to, data);
  if (!from || !to) return null;

  const month = input.month;
  const days = Math.min(5, Math.max(1, input.days));
  const isLoop = isSamePlace(from, to);
  const warnings: string[] = [];
  const excluded: Excluded[] = [];

  // endpoints and must-visits are never candidates
  const endpointIds = new Set(
    [from, to].filter((n) => n.spot).map((n) => n.spot!.id)
  );
  const mustSpots = input.must
    .map((id) => data.spots.find((s) => s.id === id))
    .filter((s): s is PlannerSpot => Boolean(s) && !endpointIds.has(s!.id));

  // must-visits that wreck the trip get called out, never silently accepted
  const corridorKm = legDistanceKm(from, to).km;
  for (const m of mustSpots) {
    const detour = mustVisitDetourKm(m, from, to);
    if (detour > Math.max(60, corridorKm * 0.6)) {
      warnings.push(
        `${m.name} adds roughly ${Math.round(detour)} km of driving to this route, consider another day or a different endpoint.`
      );
    }
    if (month && seasonTier(m, month) !== "peak" && seasonTier(m, month) !== "ok") {
      warnings.push(`${m.name}: ${seasonNote(m, month) ?? "out of season"}, kept because you asked for it.`);
    }
  }

  // 1. eligibility
  const mustIds = new Set(mustSpots.map((s) => s.id));
  let excludedBySeason = 0;
  const eligible = data.spots.filter((s) => {
    if (endpointIds.has(s.id) || mustIds.has(s.id)) return false;
    if (!month) return true;
    const tier = seasonTier(s, month);
    if (tier === "closed") {
      excludedBySeason++;
      excluded.push({ id: s.id, name: s.name, reason: seasonNote(s, month) ?? "out of season" });
      return false;
    }
    return true;
  });

  // 2. reach filter, corridor offset, or radius for loops
  const maxOffsetKm = isLoop
    ? days === 1
      ? 45
      : 70
    : Math.min(days === 1 ? 25 : 45, Math.max(days === 1 ? 10 : 15, corridorKm * (days === 1 ? 0.2 : 0.25)));

  const reachable = eligible
    .map((s) => {
      const n = nodeOf(s);
      if (isLoop) {
        const km = legDistanceKm(from, n).km;
        return { spot: s, node: n, t: 0, offsetKm: km };
      }
      const { t, offsetKm } = projectOntoCorridor(n, from, to);
      return { spot: s, node: n, t, offsetKm: Math.max(0, offsetKm - coordSlackKm(s)) };
    })
    .filter((c) => c.offsetKm <= maxOffsetKm && (isLoop || (c.t > -0.15 && c.t < 1.15)));

  // 3. selection, lexicographic rank, diversity-aware, accepted while time allows
  const clusterCount = new Map<string, number>();
  const categoryCount = new Map<string, number>();
  const clusterCap = (isLoop ? CLUSTER_ANCHOR_CAP : CLUSTER_SOFT_CAP) * days;
  const categoryCap = CATEGORY_SOFT_CAP * days;

  const seedNodes = mustSpots.map(nodeOf);
  const chosen: Node[] = [...seedNodes];
  const routeOf = (nodes: Node[]) =>
    isLoop ? orderRadial(from, nodes) : orderRoute(from, nodes, to, month || 1);
  /** Accept only what survives the real packer: see packDays. */
  const fits = (nodes: Node[]) =>
    packDays(from, routeOf(nodes), to, days, month, data.stays, mustIds).dropped.length === 0;

  /**
   * Greedy selection, re-ranked every round. Ranking has to be dynamic: fatigue
   * depends on what has already been picked, so a static sort cannot express it. 
   * n ≈ 100 and picks ≤ 35, so the O(n²) is irrelevant. 
   */
  const remaining = reachable.slice();
  while (chosen.length < MAX_STOPS_PER_DAY * days && remaining.length) {
    let bestIdx = -1;
    let bestKey: RankKey | null = null;

    for (let i = 0; i < remaining.length; i++) {
      const c = remaining[i];
      const cl = c.spot.cluster ?? "none";
      const cCount = clusterCount.get(cl) ?? 0;
      const catCount = categoryCount.get(c.spot.category) ?? 0;
      if (cCount >= clusterCap || catCount >= categoryCap) continue;

      const inSeasonDraw =
        month && c.spot.monsoonDependent && seasonTier(c.spot, month) === "peak"
          ? SEASON_PEAK_BUCKET_DISCOUNT
          : 0;

      const key: RankKey = {
        offsetBucket:
          Math.max(
            0,
            Math.floor(c.offsetKm / 5) - inSeasonDraw
          ) +
          cCount * CLUSTER_FATIGUE_BUCKETS +
          catCount * CATEGORY_FATIGUE_BUCKETS,
        diversityPenalty: cCount + catCount,
        notability: notabilityScore(c.spot, month || 1),
        duration: c.spot.durationMin,
        slug: c.spot.slug,
      };
      if (!bestKey || compareRankKey(key, bestKey) < 0) {
        bestKey = key;
        bestIdx = i;
      }
    }
    if (bestIdx === -1) break;

    const cand = remaining.splice(bestIdx, 1)[0];
    if (!fits([...chosen, cand.node])) continue; // budget only shrinks, skip for good
    chosen.push(cand.node);
    const cl = cand.spot.cluster ?? "none";
    clusterCount.set(cl, (clusterCount.get(cl) ?? 0) + 1);
    categoryCount.set(cand.spot.category, (categoryCount.get(cand.spot.category) ?? 0) + 1);
  }

  // 4. final ordering, 5. pack into days, the same packer the fit gate used
  const ordered = routeOf(chosen);
  const packed = packDays(from, ordered, to, days, month, data.stays, mustIds);
  const plannedDays = packed.days;
  const dropped = packed.dropped;

  if (!plannedDays.some((d) => d.stops.length)) {
    warnings.push(
      "Nothing fits between those two points in the time available, try more days, or endpoints further apart."
    );
  }
  if (dropped.length) {
    warnings.push(
      `${dropped.length} more place${dropped.length > 1 ? "s" : ""} would have fitted the route but not the clock. Add a day to reach ${dropped.slice(0, 2).join(" and ")}.`
    );
  }

  return {
    days: plannedDays,
    totalKm: Math.round(chainKm([from, ...ordered, to])),
    totalDriveMin: plannedDays.reduce((s, d) => s + d.driveMin, 0),
    totalVisitMin: plannedDays.reduce((s, d) => s + d.visitMin, 0),
    excluded,
    excludedBySeason,
    warnings,
    estimatedLegs: packed.estimatedLegs,
    curatedLegs: packed.curatedLegs,
    from,
    to,
    isLoop,
  };
}
