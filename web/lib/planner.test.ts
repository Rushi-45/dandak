/**
 * Planner golden tests. Run from web/:  node --test lib/planner.test.ts
 *
 * Every case here encodes a real failure found by simulating the naive design
 * against the actual dataset, not hypothetical edge cases.
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
  closureWarnings,
  timeOfDayPass,
  resolveNode,
  suggestStays,
  USABLE_DAY_MIN,
  PACKED_DAY_MIN,
  PACKED_MAX_STOPS_PER_DAY,
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

test("Sardar Sarovar survives December: only its overflow is seasonal", () => {
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
  const options = suggestStays(soU, data.stays);
  assert.ok(options.length > 0, "expected stay suggestions near the Statue of Unity");
  assert.ok(
    options.some((o) => o.stay.type === "tent-city"),
    `expected a tent city among them, got: ${options.map((o) => o.stay.name).join(", ")}`
  );
});

test("a night offers a choice, not a single bed", () => {
  // the corpus now has a government campsite, a homestay and a hotel within
  // reach of the same evening: a plan that names one of them is hiding two
  const plan = planTrip(
    { from: "h:surat", to: "h:saputara", days: 3, month: 8, must: [] },
    data
  )!;
  const nights = plan.days.slice(0, -1);
  assert.ok(nights.length > 0, "a 3-day trip should have nights to sleep through");
  for (const d of nights) {
    assert.ok(d.stays.length > 0, `day ${d.day} ends with nowhere to sleep`);
    const ids = d.stays.map((s) => s.stay.id);
    assert.equal(new Set(ids).size, ids.length, `day ${d.day} repeats a bed`);
  }
  // and the last day sends you home rather than to a hotel
  assert.equal(plan.days[plan.days.length - 1].stays.length, 0);
});

// -------------------------------------------------------------- URL state

test("plan state round-trips through the URL", () => {
  const input = {
    from: "h:surat",
    to: "s:dang-saputara-lake",
    days: 2,
    month: 8,
    must: ["dang-gira-falls"],
    avoid: ["dang-girmal-falls"], // decodePlan always returns the field, so the round-trip must carry it
    pace: "packed" as const, // same reason; "easy" stays out of the URL, so exercise the one that rides it
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

// ------------------------------------------------------------- skip a stop

test("a skipped stop leaves the plan and frees its time for a replacement", () => {
  const base = planTrip({ from: "h:surat", to: "h:saputara", days: 2, month: 8, must: [] }, data)!;
  const baseIds = base.days.flatMap((d) => d.stops.map((s) => s.spot.id));
  const skipped = baseIds[0];

  const re = planTrip(
    { from: "h:surat", to: "h:saputara", days: 2, month: 8, must: [], avoid: [skipped] },
    data
  )!;
  const reIds = re.days.flatMap((d) => d.stops.map((s) => s.spot.id));

  assert.ok(!reIds.includes(skipped), "the skipped stop must not come back");
  // the freed time pulls in at least one place the base plan did not have
  assert.ok(reIds.some((id) => !baseIds.includes(id)), "a replacement should fill the gap");
});

test("a must-visit beats a skip, in the algorithm and in the URL", () => {
  const plan = planTrip(
    {
      from: "h:ahwa",
      to: "h:waghai",
      days: 1,
      month: 8,
      must: ["dang-gira-falls"],
      avoid: ["dang-gira-falls"],
    },
    data
  )!;
  assert.ok(plan.days.flatMap((d) => d.stops).some((s) => s.spot.id === "dang-gira-falls"));

  const { input } = decodePlan(
    "from=h:ahwa&to=h:waghai&days=1&month=8&must=dang-gira-falls&avoid=dang-gira-falls,dang-nowhere",
    data
  );
  assert.deepEqual(input!.must, ["dang-gira-falls"]);
  assert.deepEqual(input!.avoid, []); // the conflict and the unknown id both dropped
});

// ------------------------------------------------------- closure warnings

test("a Monday start flags the SoU cluster's closing day, other days stay quiet", () => {
  // jungle safari closes on Mondays in the dataset; force it onto day 1
  const plan = planTrip(
    {
      from: "h:ekta-nagar",
      to: "h:ekta-nagar",
      days: 2,
      month: 11,
      must: ["narmada-jungle-safari"],
    },
    data
  )!;
  assert.ok(
    plan.days[0].stops.some((s) => s.spot.id === "narmada-jungle-safari"),
    "precondition: the must-visit landed on day 1"
  );

  // find a Monday deterministically rather than trusting calendar arithmetic
  const monday = new Date(2026, 10, 1); // local, never a UTC-parsed string
  while (monday.getDay() !== 1) monday.setDate(monday.getDate() + 1);

  const onMonday = closureWarnings(plan.days, monday);
  assert.ok(
    onMonday.some((w) => w.day === 1 && w.spotNames.includes("Jungle Safari (Sardar Patel Zoological Park)")),
    "day 1 on a Monday must warn about the safari"
  );

  // start on Tuesday instead: day 1 is fine, and a warning may only appear if
  // some later day both lands on Monday and contains a mon-closing stop
  const tuesday = new Date(monday);
  tuesday.setDate(tuesday.getDate() + 1);
  const onTuesday = closureWarnings(plan.days, tuesday);
  assert.ok(!onTuesday.some((w) => w.day === 1), "day 1 on a Tuesday must not warn");
});

// ---------------------------------------------------- time-of-day ordering

test("the time-of-day pass moves an evening stop to the end of its day", () => {
  // hand-build a day that is deliberately wrong: sunset point FIRST
  const ids = ["dang-sunset-point", "dang-echo-point", "dang-table-point"];
  const nodes = ids.map((id) => resolveNode(`s:${id}`, data)!);
  const from = resolveNode("h:saputara", data)!;
  const wrongDay = {
    day: 1,
    stops: nodes.map((n, i) => ({
      spot: n.spot!,
      day: 1,
      order: i + 1,
      arriveAfterMin: 0,
      driveMinFromPrev: 0,
      driveKmFromPrev: 0,
      distanceSource: "estimated" as const,
      seasonTier: "ok" as const,
      seasonNote: null,
    })),
    startNode: from,
    endNode: nodes[2],
    driveKm: 0,
    driveMin: 0,
    visitMin: 0,
    transitLeg: null,
    stays: [],
  };
  const fixed = timeOfDayPass(
    { days: [wrongDay], dropped: [], curatedLegs: 0, estimatedLegs: 0 },
    from,
    from, // a loop: the final leg returns to base
    1,
    11,
    data.stays
  );
  const slugs = fixed.days[0].stops.map((s) => s.spot.slug);
  assert.equal(slugs[slugs.length - 1], "sunset-point", `evening stop must land last, got ${slugs.join(" > ")}`);
  assert.deepEqual(
    fixed.days[0].stops.map((s) => s.order),
    [1, 2, 3],
    "stop numbering is redone after the reorder"
  );
});

test("a December Saputara weekend ends day 1 at an evening spot and opens a day at dawn", () => {
  // pins live behaviour: the plan carries sunset-hinted and dawn-hinted stops,
  // and the pass must respect both without breaking the day budget
  const plan = planTrip({ from: "h:saputara", to: "h:saputara", days: 2, month: 12, must: [] }, data)!;
  const d1 = plan.days[0].stops;
  assert.ok(d1.length >= 2, "day 1 should have stops");
  const last = d1[d1.length - 1].spot;
  assert.ok(
    last.bestTime === "evening" || last.bestTime === "night",
    `day 1 should end on an evening stop, ends on ${last.slug} (${last.bestTime})`
  );
  const dawnDay = plan.days.find((d) => d.stops.some((s) => s.spot.bestTime === "early-morning"));
  assert.ok(dawnDay, "the plan should reach a dawn-hinted stop in December");
  assert.equal(
    dawnDay!.stops[0].spot.bestTime,
    "early-morning",
    "a day holding a dawn stop must open with it"
  );
  for (const d of plan.days) {
    assert.ok(d.visitMin + d.driveMin <= USABLE_DAY_MIN, `day ${d.day} broke the budget after reordering`);
  }
});

// ------------------------------------------------------------------- pace

test("packed pace covers at least as much and never breaks its own longer day", () => {
  for (const [from, to, days, month] of [
    ["h:surat", "h:saputara", 2, 8],
    ["h:ahwa", "h:ahwa", 1, 8],
    ["h:vadodara", "h:ekta-nagar", 2, 11],
  ] as [string, string, number, number][]) {
    const easy = planTrip({ from, to, days, month, must: [] }, data)!;
    const packed = planTrip({ from, to, days, month, must: [], pace: "packed" }, data)!;
    const count = (p: typeof easy) => p.days.reduce((n, d) => n + d.stops.length, 0);
    assert.ok(
      count(packed) >= count(easy),
      `${from}->${to} ${days}d: packed found ${count(packed)} vs easy ${count(easy)}`
    );
    for (const d of packed.days) {
      assert.ok(
        d.visitMin + d.driveMin <= PACKED_DAY_MIN,
        `packed day ${d.day} runs ${d.visitMin + d.driveMin} of ${PACKED_DAY_MIN} min`
      );
      assert.ok(d.stops.length <= PACKED_MAX_STOPS_PER_DAY, `packed day ${d.day} over the stop cap`);
    }
    // easy remains bound by the easy budget: the default did not quietly change
    for (const d of easy.days) {
      assert.ok(d.visitMin + d.driveMin <= USABLE_DAY_MIN, `easy day ${d.day} broke the easy budget`);
    }
  }
});
