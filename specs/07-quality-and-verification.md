# 07 — Quality & Verification

Status: Draft v0.1 · Last updated: 2026-08-08 · Normative

## Confidence levels (`provenance.confidence`)

| Level | Criteria |
|---|---|
| `high` | Volatile fields verified against ≥2 independent current sources (or 1 official source), coordinates `exact`, `last_verified` stamped |
| `medium` | Drafted from knowledge, internally consistent, no contradictions found; some `needs_verification` entries open |
| `low` | Existence or key facts uncertain; record published only with `status` reflecting reality and prominent `needs_verification` |

## Volatile vs stable fields

| Class | Fields | Policy |
|---|---|---|
| **Volatile** | `visit.fees`, `visit.timings`, `visit.booking.url`, `visit.weekly_closure`, `status`, `access.parking.fee`, adventure `attributes.operator`/prices | Must be web-verified before `last_verified` is stamped; re-verify on cadence below |
| **Semi-stable** | `location.coordinates`, `location.distances_km`, `amenities.*`, `stay_nearby` | Verify once (maps/official); re-verify only on signals |
| **Stable** | names, category, narrative, geography, history | Knowledge-drafted; spot-check during editorial review |

## Verification workflow

1. Take the record's `needs_verification` list.
2. Check sources in **hierarchy order** — higher beats lower on conflict:
   1. Official portals: Statue of Unity official site/ticketing portal, Gujarat Tourism, Gujarat Forest Dept eco-tourism portals, district NIC sites
   2. Recent reputable news (fee/timing change announcements)
   3. Map providers (coordinates, road distances)
   4. Recent traveller reports/blogs (amenities ground truth only — never for fees)
3. `high` confidence needs 2 independent agreeing sources, or 1 official.
4. Record each consulted source in `provenance.sources` with `accessed` date.
5. Remove resolved paths from `needs_verification`; add newly-discovered doubts.
6. Stamp `last_verified`, upgrade `confidence`, commit with a `verify` message.

**Conflict rule:** when sources disagree, prefer the hierarchy; if still ambiguous, state the range in prose ("₹30–50 depending on season"), keep the path in `needs_verification`, and cap confidence at `medium`.

## Re-verification cadence

| Scope | Cadence |
|---|---|
| `sou-complex` cluster (highest-stakes, changes often) | 90 days |
| All other volatile fields | 180 days |
| Stable fields / full-record editorial sweep | 365 days |

`scripts/stats` surfaces overdue records (today − `last_verified` > cadence).

## Validation levels

| Level | Name | Enforcement | Checks |
|---|---|---|---|
| **L1** | Schema | error | Record validates against `schema/spot.schema.json` |
| **L2** | Referential | error | Unique `id`s; `id`/`slug`/path agreement; `nearby[].id`, `stay_nearby[]`, itinerary `stops[].spot_id`, district `hero_spots[]` all resolve; `cluster` in registry and matches district. *Grace rule:* refs to not-yet-built entity types (itineraries before phase 5) are warnings |
| **L3** | Sanity lint | warning | Coordinates in district bbox (Dang: lat 20.30–21.10, lng 73.25–74.00; Narmada: lat 21.35–22.10, lng 73.20–74.10; `outside_district` records use a widened box); `distances_km` within 0.8×–3× haversine; tags 3–8 & in vocab; activities/subcategories in vocab; hub keys valid for district; `summary` ≤160; banned-fluff scan; `duration_min` 15–600; fees ≤₹5000 (flag); `best_months` ⊆ 1–12; key-order matches template; `offbeat`/`popular` and `ticketed`/`free-entry` consistency |
| **L4** | Editorial | human | Definition of Done review below |

Error budget: **zero** L1/L2 errors at every commit; L3 warnings triaged (fixed, or waived with a one-line reason in `provenance.sources` notes).

## Definition of Done (per record)

- [ ] All template keys present, in order; nulls only where genuinely unknown
- [ ] `summary`, `description`, `highlights` written per [spec 05](05-content-guidelines.md) recipes
- [ ] Coordinates present, `precision` honest
- [ ] 3–8 tags; category/cluster sensible; tag-consistency lints clean
- [ ] Fees/timings either verified or `null` + `needs_verification` (never guessed)
- [ ] Safety warnings present where hazards exist (waterfalls: mandatory)
- [ ] `mobile_network` populated (or all-null + flagged)
- [ ] ≥2 `nearby` refs where possible; `stay_nearby` where sensible
- [ ] Provenance complete; `confidence` justified by the definitions above
- [ ] Validator clean (L1–L2), L3 triaged

## Correction etiquette

Fix-forward: corrections are new commits (`fix(spot): …`), never history rewrites. Any fact edit updates `provenance` in the same commit (source added, or `needs_verification` adjusted). If a traveller-facing error is found post-release, it ships in the next PATCH release with a `CHANGELOG.md` line.
