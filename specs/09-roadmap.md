# 09 — Roadmap (Post-v1)

Status: Draft v0.1 · Last updated: 2026-08-08 · Non-normative — aspirations ranked, not promised

## Near-term (v1.x)

| Item | Shape |
|---|---|
| **Gujarati & Hindi** | `name.gu`/`name.hi` first (non-breaking). Then schema v2: prose fields become language-keyed objects (mechanical migration script). Gujarati before Hindi — biggest audience for Dang. |
| **GeoJSON export** | `scripts/export-geojson` → one FeatureCollection per district; app map layer and QGIS-friendly. |
| **SQLite export** | Single-file DB (spots + companions), enables Datasette browsing and instant API prototyping. |
| **Website/app** | Next.js per the proposed consumer stack below; SEO fields already in schema. |
| **Media pipeline** | Own-photography trips + licensed/CC sourcing with the license enum enforced; `unknown` licenses never ship. |
| **Read API** | OpenAPI spec over the dataset; served as Next.js route handlers per the stack note below (spots, filters by category/tags/cluster/district, nearby-by-distance). |

## Proposed consumer stack (noted 2026-08-08 — proposal, not a locked decision)

- **Framework:** Next.js (App Router). Spot/itinerary pages statically generated from `data/` (`generateStaticParams`); ISR refresh after verification sweeps. Owner is fluent in React/Next — velocity over framework purity.
- **UI:** Tailwind; MapLibre GL over the GeoJSON export; client-side filters driven by the schema enums (category/tags/cluster/district).
- **Animation:** Motion (formerly Framer Motion) — yes, for filter/card transitions, galleries and itinerary reveals. Guardrails: `LazyMotion` + `m` components, no above-the-fold animation on content pages, `MotionConfig reducedMotion="user"`, transform/opacity only.
- **API:** Next.js route handlers reading the same JSON (later the SQLite export for query-shaped endpoints) — one repo, one deploy covers both declared consumers (D5).
- **Hosting:** Vercel or Cloudflare free tier.
- **User features (accounts/reviews/trip-saving):** stay deferred (D7); Supabase is the default candidate if/when they arrive.
- The dataset remains the source of truth; the app is a consumer. Nothing in this note may leak requirements back into the schema without a decisions-log entry.

## Later

| Item | Shape / gating criteria |
|---|---|
| **Ratings & crowd estimates** | Deferred by decision D7. Needs a defensible method (aggregated review sentiment? visit telemetry?) — never invented numbers. Crowd-by-season could ship earlier as *editorial* `low/medium/high` with provenance. |
| **Live layers** | Weather, waterfall-flow status, event calendars — app-side integrations; the dataset stays static-friendly with hook fields. |
| **Community corrections** | Issue templates → verified via spec 07 workflow → PATCH releases. |
| **District expansion** | Candidates: Tapi (Padam Dungari already flagged), Navsari (Vansda, Unai hot springs), Chhota Udepur. Criteria: v1 verified & shipped; a consumer actually using the data; ≥15 viable spots in the candidate district. |

## Explicitly never (restating spec 00)

Booking engine · live pricing · scraped copyrighted content · invented facts to fill gaps.
