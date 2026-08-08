# 09 — Roadmap (Post-v1)

Status: Draft v0.1 · Last updated: 2026-08-08 · Non-normative — aspirations ranked, not promised

## Near-term (v1.x)

| Item | Shape |
|---|---|
| **Gujarati & Hindi** | `name.gu`/`name.hi` first (non-breaking). Then schema v2: prose fields become language-keyed objects (mechanical migration script). Gujarati before Hindi — biggest audience for Dang. |
| **GeoJSON export** | `scripts/export-geojson` → one FeatureCollection per district; app map layer and QGIS-friendly. |
| **SQLite export** | Single-file DB (spots + companions), enables Datasette browsing and instant API prototyping. |
| **Static site renderer** | JSON → Markdown/Astro pages; SEO fields already in schema. |
| **Media pipeline** | Own-photography trips + licensed/CC sourcing with the license enum enforced; `unknown` licenses never ship. |
| **Read API** | OpenAPI spec over the dataset (spots, filters by category/tags/cluster/district, nearby-by-distance). |

## Later

| Item | Shape / gating criteria |
|---|---|
| **Ratings & crowd estimates** | Deferred by decision D7. Needs a defensible method (aggregated review sentiment? visit telemetry?) — never invented numbers. Crowd-by-season could ship earlier as *editorial* `low/medium/high` with provenance. |
| **Live layers** | Weather, waterfall-flow status, event calendars — app-side integrations; the dataset stays static-friendly with hook fields. |
| **Community corrections** | Issue templates → verified via spec 07 workflow → PATCH releases. |
| **District expansion** | Candidates: Tapi (Padam Dungari already flagged), Navsari (Vansda, Unai hot springs), Chhota Udepur. Criteria: v1 verified & shipped; a consumer actually using the data; ≥15 viable spots in the candidate district. |

## Explicitly never (restating spec 00)

Booking engine · live pricing · scraped copyrighted content · invented facts to fill gaps.
