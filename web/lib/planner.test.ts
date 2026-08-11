/**
 * Planner golden tests. Run from web/:  node --test lib/planner.test.ts
 *
 * Every case here encodes a real failure found by simulating the naive design
 * against the actual dataset — not hypothetical edge cases.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

import { buildPlannerIndex } from "./planner-index.ts";
import {
  planTrip,
  seasonTier,
  projectOntoCorridor,
  haversineKm,
  coordSlackKm,
  legDistanceKm,
  driveMinutes,
  encodePlan,
  decodePlan,
  resolveNode,
  suggestStay,
  USABLE_DAY_MIN,
  MAX_STOPS_PER_DAY,
  type PlannerData,
} from "./planner.ts";

// ---------------------------------------------------------------- fixtures

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const readJson = (p: string) => JSON.parse(readFileSync(p, "utf8"));

function loadData(): PlannerData {
  const spots: unknown[] = [];
  for (const district of ["dang", "narmada"]) {
    const dir = path.join(ROOT, "data", "spots", district);
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      spots.push(readJson(path.join(dir, f)));
    }
  }
  const stayDir = path.join(ROOT, "data", "stays");
  const stays = readdirSync(stayDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson(path.join(stayDir, f)));
  const registry = readJson(path.join(ROOT, "scripts", "registry.json"));
  const imgDir = path.join(ROOT, "web", "public", "images", "spots");
  const hasPhoto = (id: string) => existsSync(path.join(imgDir, `${id}.jpg`));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return buildPlannerIndex(spots as any, stays as any, registry, hasPhoto);
}

const data = loadData();
const spot = (id: string) => {
  const s = data.spots.find((x) => x.id === id);
  assert.ok(s, `fixture missing spot ${id}`);
  return s!;
};

// ------------------------------------------------------------- data sanity

test("index loads the whole corpus", () => {
  assert.equal(data.spots.length, 106);
  assert.ok(data.hubs.length >= 15, `expected the hub table, got ${data.hubs.length}`);
  assert.equal(data.stays.length, 20);
});

// ---------------------------------------------------------------- geometry

test("haversine matches a known separation", () => {
  const km = haversineKm({ lat: 20.575, lng: 73.757 }, { lat: 21.838, lng: 73.719 });
  assert.ok(km > 135 && km < 145, `Saputara→Ekta Nagar should be ~140 km, got ${km.toFixed(1)}`);
});

test("corridor projection is degenerate-safe for loops", () => {
  const p = { lat: 20.7, lng: 73.7 };
  const s = { lat: 20.575, lng: 73.757 };
  const r = projectOntoCorridor(p, s, s);
  assert.equal(r.t, 0);
  assert.ok(r.offsetKm > 0, "a loop must still report a radius");
});

test("coarse coordinates get more slack than exact ones", () => {
  // dang-padam-dungari sits on a 1-decimal grid (~11 km)
  assert.equal(coordSlackKm(spot("dang-padam-dungari")), 8);
  assert.equal(coordSlackKm({ precision: "exact", lat: 20.7378, lng: 73.4916 }), 0);
});

// ------------------------------------------------------- distance cascade

test("curated nearby distances beat computed ones, and never go below straight line", () => {
  const a = resolveNode("s:dang-girmal-falls", data)!;
  const b = resolveNode("s:dang-mahal-eco-campsite", data)!;
  const leg = legDistanceKm(a, b);
  assert.equal(leg.source, "curated-nearby");
  assert.ok(leg.km >= haversineKm(a, b) - 1e-9, "road distance cannot be shorter than the straight line");
});

test("hub legs use the record's own road distance", () => {
  const hub = resolveNode("h:ahwa", data)!;
  const s = resolveNode("s:dang-girmal-falls", data)!;
  assert.equal(legDistanceKm(hub, s).source, "curated-hub");
});

// ---------------------------------------------------------------- seasons

test("monsoon waterfalls are demoted in March, not deleted", () => {
  const gira = spot("dang-gira-falls");
  assert.equal(seasonTier(gira, 8), "peak");
  assert.equal(seasonTier(gira, 3), "weak");
});

test("Sardar Sarovar survives December — only its overflow is seasonal", () => {
  // the naive rule excluded this high-confidence, year-round, ticketed site
  const dam = spot("narmada-sardar-sarovar-dam");
  assert.notEqual(seasonTier(dam, 12), "closed");

  const plan = planTrip(
    { from: "h:ekta-nagar", to: "h:rajpipla", days: 1, month: 12, must: [] },
    data
  )!;
  assert.ok(plan, "December plan should exist");
  assert.ok(
    !plan.excluded.some((e) => e.id === "narmada-sardar-sarovar-dam"),
    "the dam must not be excluded in December"
  );
});

test("year-round spots (empty best_months) are never season-excluded", () => {
  const mall = spot("narmada-ekta-mall");
  assert.deepEqual(mall.bestMonths, []);
  for (let m = 1; m <= 12; m++) assert.notEqual(seasonTier(mall, m), "closed");
});

// ------------------------------------------------------ the cluster flood

test("a Saputara day trip in July is not twelve gardens", () => {
  // the naive design returned 12/12 saputara-cluster gardens and zero waterfalls
  const plan = planTrip(
    { from: "h:saputara", to: "h:saputara", days: 1, month: 7, must: [] },
    data
  )!;
  const stops = plan.days.flatMap((d) => d.stops);
  assert.ok(stops.length >= 2, `loop produced ${stops.length} stops`);

  const clusters = new Set(stops.map((s) => s.spot.cluster));
  assert.ok(clusters.size >= 2, `expected variety, got only ${[...clusters]}`);

  const categories = new Map<string, number>();
  for (const s of stops) categories.set(s.spot.category, (categories.get(s.spot.category) ?? 0) + 1);
  for (const [cat, n] of categories) {
    assert.ok(n <= 4, `${n} × ${cat} in one day is a category flood`);
  }

  // Peak monsoon in Dang without a single falling-water stop is a broken product.
  // Test the draw, not the taxonomy: "Pandav Caves & Waterfall" is categorised
  // religious-site but is exactly the trip a July visitor came for.
  assert.ok(
    stops.some((s) => s.spot.category === "waterfall" || s.spot.monsoonDependent),
    `a July plan should reach falling water, got: ${stops.map((s) => s.spot.name).join(", ")}`
  );
});

// ------------------------------------------------------------ must-visits

test("an absurd must-visit warns instead of silently producing a 16-hour drive", () => {
  // Ekta Nagar → Rajpipla is 23 km; Saputara Lake adds ~263 km
  const plan = planTrip(
    {
      from: "h:ekta-nagar",
      to: "h:rajpipla",
      days: 1,
      month: 11,
      must: ["dang-saputara-lake"],
    },
    data
  )!;
  assert.ok(
    plan.warnings.some((w) => /adds roughly \d+ km/.test(w)),
    `expected a detour warning, got: ${JSON.stringify(plan.warnings)}`
  );
  assert.ok(
    plan.days.flatMap((d) => d.stops).some((s) => s.spot.id === "dang-saputara-lake"),
    "a must-visit must still appear in the plan"
  );
});

test("must-visits are never dropped by the season filter", () => {
  const plan = planTrip(
    { from: "h:ahwa", to: "h:waghai", days: 1, month: 4, must: ["dang-gira-falls"] },
    data
  )!;
  assert.ok(plan.days.flatMap((d) => d.stops).some((s) => s.spot.id === "dang-gira-falls"));
});

// -------------------------------------------------------------- budgeting

test("no day exceeds the budget or the stop cap", () => {
  for (const month of [3, 8]) {
    for (const days of [1, 2, 3]) {
      const plan = planTrip(
        { from: "h:surat", to: "h:saputara", days, month, must: [] },
        data
      )!;
      assert.ok(plan.days.length <= days, `got ${plan.days.length} days for a ${days}-day trip`);
      for (const d of plan.days) {
        assert.ok(
          d.stops.length <= MAX_STOPS_PER_DAY,
          `day ${d.day} has ${d.stops.length} stops`
        );
        // hard, not approximate: the packer reserves the drive to the finish
        assert.ok(
          d.visitMin + d.driveMin <= USABLE_DAY_MIN,
          `day ${d.day} runs ${d.visitMin + d.driveMin} min of a ${USABLE_DAY_MIN} min day`
        );
      }
    }
  }
});

test("a long transfer is priced as highway, not as forest road", () => {
  // charging all 261 km at the interior speed produced a 13-hour drive and a
  // single-stop 900-minute "day"
  const soU = resolveNode("s:narmada-statue-of-unity", data)!;
  const lake = resolveNode("s:dang-saputara-lake", data)!;
  const min = driveMinutes(soU, lake, 8);
  assert.ok(min > 240 && min < 420, `expected roughly 5-6 hours, got ${Math.round(min / 60)} h`);
});

test("selection never promises stops the packer cannot place", () => {
  // the fit gate used a pooled days x 465 budget while packing is per-day and
  // sequential, so stops passed selection and were then dropped
  for (const input of [
    { from: "h:surat", to: "h:saputara", days: 2, month: 3, must: [] },
    { from: "h:vadodara", to: "h:saputara", days: 3, month: 7, must: [] },
    { from: "h:ekta-nagar", to: "h:ekta-nagar", days: 5, month: 9, must: [] },
  ]) {
    const plan = planTrip(input, data)!;
    assert.ok(
      !plan.warnings.some((w) => /not the clock/.test(w)),
      `${input.from}→${input.to}: ${plan.warnings.find((w) => /not the clock/.test(w))}`
    );
  }
});

test("no spot is ever visited twice, and orders are globally sequential", () => {
  const plan = planTrip(
    { from: "h:ekta-nagar", to: "h:ekta-nagar", days: 5, month: 9, must: [] },
    data
  )!;
  const stops = plan.days.flatMap((d) => d.stops);
  const ids = stops.map((s) => s.spot.id);
  assert.equal(new Set(ids).size, ids.length, "a spot appears twice");
  // matches the convention in all 12 curated itineraries: order does not restart per day
  assert.deepEqual(
    stops.map((s) => s.order),
    stops.map((_, i) => i + 1)
  );
});

// ------------------------------------------------------------------ stays

test("Tent City is reachable even though it has no coordinates", () => {
  const soU = resolveNode("s:narmada-statue-of-unity", data)!;
  const s = suggestStay(soU, data.stays);
  assert.ok(s, "expected a stay suggestion near the Statue of Unity");
});

// -------------------------------------------------------------- URL state

test("plan state round-trips through the URL", () => {
  const input = {
    from: "h:surat",
    to: "s:dang-saputara-lake",
    days: 2,
    month: 8,
    must: ["dang-gira-falls"],
  };
  const { input: back, dropped } = decodePlan(encodePlan(input), data);
  assert.deepEqual(back, input);
  assert.equal(dropped.length, 0);
});

test("a retired must-visit id is reported, not silently swallowed", () => {
  const { input, dropped } = decodePlan(
    "from=h:surat&to=h:ahwa&days=1&month=8&must=dang-gira-falls,dang-this-was-deleted",
    data
  );
  assert.deepEqual(dropped, ["dang-this-was-deleted"]);
  assert.deepEqual(input!.must, ["dang-gira-falls"]);
});

test("hostile URL input is clamped", () => {
  const { input } = decodePlan("from=h:surat&to=h:ahwa&days=99&month=77", data);
  assert.equal(input!.days, 5); // trip-map only defines 5 day colours
  assert.equal(input!.month, 0); // 0 = unset, not a bogus month
});

test("unknown endpoints yield no plan rather than a crash", () => {
  assert.equal(decodePlan("from=h:atlantis&to=h:ahwa", data).input, null);
  assert.equal(planTrip({ from: "h:atlantis", to: "h:ahwa", days: 1, month: 8, must: [] }, data), null);
});

// -------------------------------------------------------------- stability

test("planning is deterministic", () => {
  const input = { from: "h:surat", to: "h:saputara", days: 2, month: 8, must: [] };
  const a = planTrip(input, data)!;
  const b = planTrip(input, data)!;
  assert.deepEqual(
    a.days.flatMap((d) => d.stops.map((s) => s.spot.id)),
    b.days.flatMap((d) => d.stops.map((s) => s.spot.id))
  );
});
