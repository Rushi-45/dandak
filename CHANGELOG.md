# Changelog

Dataset versioning per [spec 06](specs/06-pipeline-and-workflow.md#versioning--releases).

## [Unreleased]

### Added
- Seven "pinch-in" Tier-3 spots (2026-08-09), web-grounded where possible and flagged for ground-truthing: Pandav Caves & Waterfall (Javatla), Chimer/Chichkund Falls (claimed ~100 m, unofficial), Don Waterfall, Birsa Waterfall, Koshmal Falls (Bhigu Dhodh), Juna Ghanta Waterfall, Mandan Lake View. "Milan waterfall" was searched but has no findable footprint and awaits a local pin. Corpus: 64 → 71 spots.
- Media entries for 14 spot records: CC-licensed photography (Wikimedia Commons) with credits, licenses and source links — Statue of Unity, Saputara Lake, Gira Falls, Sardar Sarovar Dam, Zarwani, Hatgadh, Kabirvad, Purna, Mahal, Sunset Point, Shoolpaneshwar WLS, Nilkanthdham Poicha, Shabari Dham, Devmogra.

## [1.0.0] — 2026-08-08

First release. All spec-00 success criteria met: 64 schema-valid spot records (100% of Tier-1 verified within 90 days), full companion sets, zero validation errors.

### Added
- Phase 0 — specification suite v0.1: specs 00–09, spot schema v1 (`schema/spot.schema.json`).
- Phase 1 — scaffold: `seed/spots-master.csv` (64 spots: 32 Dang, 32 Narmada), validator (`scripts/validate.mjs`, levels L1–L3 + seed checks), stats dashboard (`scripts/stats.mjs`), vocabulary registry (`scripts/registry.json`, mirrors spec 04), example fixture (`schema/examples/spot.example.json`).
- Phase 3 — full corpus drafted: all 64 spot records (T1 22, T2 27, T3 15), knowledge-drafted per spec 05 with `needs_verification` ledgers populated; validator clean (0 errors / 0 warnings).
- Phase 4 — verification: 48/64 records web-verified and stamped `last_verified` (T1 22/22 = 100%; T2 22/27 = 81%). Official sources recorded where they exist (Gujarat Tourism, district NIC sites, PIB, SSNNL, Utsav portal, forest-department portal). Confidence mix 11 high / 40 medium / 13 low. Remaining 16 records stay flagged via `needs_verification`; coordinates remain the standing ledger item (60 records) pending a dedicated map pass.
- Phase 5 — companions: 5 machine schemas (district, itinerary, event, stay, food); 2 district files (overview, hubs, 12-month weather, emergency); 9 itineraries; 8 events (Dang Darbar, Devmogra fair, Shabridham Mela, monsoon festival, Unity Day + season windows); 15 stays (forest campsites on the official portal, tent cities, heritage and pointer records); 10 foods. Validator extended to all companion kinds; spot `itineraries` arrays wired. Full-graph validation: 0 errors / 0 warnings.
- Phase 6 — release: GeoJSON exports (`exports/geojson/`, per-district + combined FeatureCollections via `npm run export:geojson`), stats snapshot (`exports/STATS.md`).

### Fixed
- `dang-anjan-kund`: road distances made consistent with (approximate) coordinates after L3 plausibility lint flagged the mismatch.
- Verification corrections (phase 4): SoU viewing gallery height 135→153 m; Pushpak ropeway fare ₹150→₹77; Gira Falls height 30→23 m, distances and 1 km walk-in; rafting age band 14–55 and ₹1000 rate; Jungle Safari hours 08:00–17:00, online-only booking; Valley of Flowers entry free (was ₹50); Butterfly Garden ₹60, Arogya Van ₹30, Maze Garden ₹100; Vansda closure mid-Jun–mid-Oct; `narmada-ninai-falls` relocated to verified exact coordinates (21.6669, 73.8219 — 35 km NE of Dediapada, not SW) with route text corrected; Saputara Adventure Park relocated to Governor's Hill; tribal museum ₹5/₹50 and est. 1970; Garudeshwar split darshan windows; Devmogra fair dated precisely (five days ending eve of Mahashivratri).
