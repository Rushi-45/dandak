/** GPX builder tests. Run from web/:  node --test lib/gpx.test.ts */
import test from "node:test";
import assert from "node:assert/strict";

import { buildGpx, escapeXml } from "./gpx.ts";

test("all five XML metacharacters are escaped", () => {
  assert.equal(escapeXml(`Baaj & <View> "Point" 'north'`), "Baaj &amp; &lt;View&gt; &quot;Point&quot; &apos;north&apos;");
});

test("a two-day trip produces two tracks and globally numbered waypoints", () => {
  const gpx = buildGpx("Surat → Saputara", [
    {
      day: 1,
      points: [
        [21.17, 72.831],
        [20.776, 73.512],
      ],
      stops: [{ order: 1, name: "Kilad Nature Education Campsite", lat: 20.776, lng: 73.512 }],
    },
    {
      day: 2,
      points: [
        [20.776, 73.512],
        [20.7, 73.55],
        [20.575, 73.757],
      ],
      stops: [
        { order: 2, name: "Pandav Caves & Waterfall", lat: 20.7, lng: 73.55 },
        { order: 3, name: "Saputara Lake", lat: 20.575, lng: 73.757 },
      ],
    },
  ]);

  assert.equal((gpx.match(/<trk>/g) ?? []).length, 2);
  assert.equal((gpx.match(/<wpt /g) ?? []).length, 3);
  assert.equal((gpx.match(/<trkpt /g) ?? []).length, 5);
  assert.ok(gpx.includes("#2 Pandav Caves &amp; Waterfall"), "waypoint names keep their global number and escape the ampersand");
  assert.ok(!/<[^>]*&(?!amp;|lt;|gt;|quot;|apos;)/.test(gpx), "no raw ampersand may survive anywhere");
});

test("a day whose geometry has not arrived is skipped as a track but keeps its waypoints", () => {
  const gpx = buildGpx("test", [
    { day: 1, points: [], stops: [{ order: 1, name: "Lone Stop", lat: 20.7, lng: 73.5 }] },
  ]);
  assert.equal((gpx.match(/<trk>/g) ?? []).length, 0);
  assert.equal((gpx.match(/<wpt /g) ?? []).length, 1);
});
