# Dandak Dataset — Release Stats (v1.0.0, 2026-08-08)

## Corpus

| Metric | Value |
|---|---|
| Spot records | 64 (Dang 32 / Narmada 32) |
| Tier coverage | T1 22/22 · T2 27/27 · T3 15/15 |
| Verified (`last_verified` stamped) | 48/64 — T1 100%, T2 81% |
| Confidence mix | high 11 · medium 40 · low 13 |
| Companion records | 44 — 2 districts, 9 itineraries, 8 events, 15 stays, 10 foods |
| Machine schemas | 6 (spot, district, itinerary, event, stay, food) |
| Validation | 0 errors, 0 warnings (L1 schema · L2 referential · L3 lints) |
| GeoJSON exports | dang 32 · narmada 32 · all-spots 64 features |

## Open verification ledger (top paths)

| Count | Path |
|---|---|
| 60 | `location.coordinates` — awaiting a dedicated map pass |
| 27 | `visit.timings` |
| 24 | `location.distances_km` |
| 22 | `visit.fees` |
| 6 | `status` (verify-existence T3 spots) |

Regenerate anytime: `npm run stats` · `npm run export:geojson` · `npm run validate`
