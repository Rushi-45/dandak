# 02 — Spot Record Schema

Status: Draft v0.1 · Last updated: 2026-08-08 · Normative (machine twin: [`schema/spot.schema.json`](../schema/spot.schema.json))

## 1. General rules

1. **Template completeness** — every record contains *all* keys listed below, in this order, using `null`/`[]` per the [null semantics](01-data-model.md#null-semantics-project-wide-all-entities). Leaf array-items (an image, a fee line, a nearby ref) may omit keys explicitly marked *optional*.
2. **No extra keys** — `additionalProperties: false` everywhere except `attributes` (free-form, see Appendix A).
3. **Enums** — small structural enums (`category`, `status`, `difficulty`, …) are schema-enforced; open vocabularies (`tags`, `subcategories`, `activities`, `cluster`, hub keys) are strings validated against [spec 04](04-taxonomies.md) at lint level (L3), so vocabulary growth doesn't require a schema release.
4. **Prose style** for every free-text field is governed by [spec 05](05-content-guidelines.md).
5. Column key below — **R**: required non-null · **N**: nullable · **[]ok**: empty allowed and meaningful.

## 2. Field reference

### 2.1 Identity & classification

| Field | Type | Req | Notes |
|---|---|---|---|
| `schema_version` | int | R | Currently `1`. |
| `id` | string | R | `{district}-{slug}`, immutable ([spec 01](01-data-model.md#identity-rules)). |
| `slug` | string | R | kebab-case; equals filename. |
| `name` | object | R | `{ "en": string }` required; `gu`, `hi` optional (future). No other keys. |
| `aliases` | string[] | []ok | Variant names/spellings, ≤6. e.g. `"Kevadia"` for Ekta Nagar sites. |
| `category` | enum | R | One of the 18 categories in [spec 04](04-taxonomies.md#categories). |
| `subcategories` | string[] | []ok | ≤4, only where 04 defines them (e.g. `wildlife` → `zoo`). |
| `tags` | string[] | R | 3–8 from the tag vocabulary (L3 lint). |
| `cluster` | string | N | From the cluster registry; `null` for standalone spots. |
| `status` | enum | R | `active` · `seasonal` · `temporarily_closed` · `permanently_closed`. |
| `district` | enum | R | `dang` · `narmada` (circuit district). |

### 2.2 Narrative

| Field | Type | Req | Notes |
|---|---|---|---|
| `summary` | string | R | One sentence, ≤160 chars (hard cap 200). Doubles as meta-description fallback. |
| `description` | string | N | 150–400 words, 2–4 paragraphs (`\n\n` separated). |
| `highlights` | string[] | N/[]ok | 3–6 bullets, ≤90 chars each (hard cap 120), noun/verb-first. |
| `history_legend` | string | N | Only when there is real substance; lore framed as lore ([spec 05](05-content-guidelines.md)). |
| `attributes` | object | []ok | Free-form, category-specific facts — see Appendix A. |

### 2.3 `location`

| Field | Type | Req | Notes |
|---|---|---|---|
| `taluka` | string | N | Administrative taluka. |
| `admin_district` | string | N | Only set when `outside_district` is true, e.g. `"Nashik (Maharashtra)"`. |
| `outside_district` | bool | R | Default `false`. |
| `nearest_town` | object | N | `{ name, distance_km }` — nearest town with fuel/food/ATM. |
| `coordinates` | object | R | `{ lat, lng, precision }`. `precision`: `exact` (map-verified) · `approximate` (±1 km) · `area` (village/locality centroid). Never null — worst case, town centroid + `area` + a `needs_verification` entry. |
| `altitude_m` | int | N | Only where meaningful (hill stations). |
| `distances_km` | object | []ok | Road km keyed by hub id from the district's [hub registry](04-taxonomies.md#hubs) — 3–6 entries. |

### 2.4 `access`

| Field | Type | Req | Notes |
|---|---|---|---|
| `modes` | object | R | `{ road, rail, air }`, each string N — how to arrive by each mode; nearest railhead/airport with distance. |
| `last_mile` | string | N | The final approach: walk distance, steps, trek grade. |
| `road_condition` | string | N | Honest note (ghat sections, monsoon slush, narrow forest roads). |
| `parking` | object | R | `{ available: bool N, fee: int N, notes: string N }` — parking fee lives *here*, never in `visit.fees`. |

### 2.5 `visit`

| Field | Type | Req | Notes |
|---|---|---|---|
| `timings` | array | N/[]ok | Items `{ days, open, close, note? }`. `days`: `"all"` · `"weekdays"` · `"weekends"` · array of `mon…sun`. Times `HH:MM`. `[]` = open area, no gates. |
| `fees` | array | N/[]ok | Items `{ type, amount_inr, note? }`. `type` from [04 §fee types](04-taxonomies.md#misc-enums); `amount_inr` int ≥0. `[]` = confirmed free. |
| `booking` | object | R | `{ required: bool N, url: string N, notes: string N }`. SoU-cluster records must carry the official portal URL. |
| `duration_min` | int | N | Typical visit length, minutes (15–600 lint range). |
| `best_time_of_day` | enum | N | `early-morning` · `morning` · `afternoon` · `evening` · `night` · `any`. |
| `weekly_closure` | enum | N | `mon`…`sun` — e.g. Statue of Unity closes Mondays. |
| `notes` | string | N | Anything that doesn't fit above (last-entry rules, seasonal gate changes). |

### 2.6 `seasonality`

| Field | Type | Req | Notes |
|---|---|---|---|
| `best_months` | int[] | R/[]ok | 1–12, unique. `[]` only for year-round-identical spots. |
| `avoid_months` | int[] | []ok | With the reason in `notes`. |
| `monsoon_dependent` | bool | N | `true` = the experience *is* the monsoon (waterfalls). |
| `notes` | string | N | e.g. "Full flow July–September; trickle by February." |

### 2.7 `experience`

| Field | Type | Req | Notes |
|---|---|---|---|
| `activities` | string[] | R/[]ok | From the [activities vocabulary](04-taxonomies.md#activities). |
| `difficulty` | enum | N | `easy` (drive-up/paved) · `moderate` (stairs/short trail) · `hard` (trek/exposure). |
| `suitable_for` | object | R | `{ kids, elderly, wheelchair }`, each bool N. |
| `photography_notes` | string | N | Concrete: light, angle, season, gear hint. |

### 2.8 `amenities`

| Field | Type | Req | Notes |
|---|---|---|---|
| `food` | string | N | What actually exists (stalls? restaurant? carry your own?). |
| `toilets` | enum | N | `none` · `basic` · `good`. |
| `drinking_water` | bool | N | |
| `mobile_network` | object | R | `{ jio, airtel, vi, bsnl }`, each `none` · `weak` · `ok` · `good` · null. Deliberately first-class: coverage is patchy in interior Dang and travellers plan around it. |
| `guides` | string | N | Availability + typical cost. |
| `ev_charging` | bool | N | SoU campus has some; interior Dang has none. |
| `stay_nearby` | string[] | []ok | Stay ids (or eco-campsite spot ids), ≤8. Resolved at L2 once stays exist. |

### 2.9 `safety`

| Field | Type | Req | Notes |
|---|---|---|---|
| `warnings` | string[] | []ok | ≤8, imperative mood ("Do not cross the railing"). Monsoon-slip and swimming hazards are mandatory where applicable. |
| `emergency` | object | R | `{ nearest_hospital, police, notes }`, each string N. |

### 2.10 Extras & relations

| Field | Type | Req | Notes |
|---|---|---|---|
| `tips` | string[] | []ok | ≤6 practical, non-obvious tips, ≤140 chars each. |
| `faqs` | array | []ok | ≤6 items `{ q, a }` — real questions travellers ask; feeds site FAQ blocks. |
| `nearby` | array | []ok | ≤10 items `{ id, distance_km, note? }` — other spots, id-resolved at L2. |
| `itineraries` | string[] | []ok | Itinerary slugs this spot appears in (warn-only until itineraries ship in phase 5). |

### 2.11 `media`

| Field | Type | Req | Notes |
|---|---|---|---|
| `images` | array | []ok | ≤12 items `{ url, license, caption?, credit?, source_url? }`. `license`: `own` · `cc0` · `cc-by` · `cc-by-sa` · `govt-open` · `licensed` · `unknown` (`unknown` never ships to production). Metadata only — no hosting, no hotlink-scraping. |
| `videos` | array | []ok | ≤6 items `{ url, title?, source? }`. |

### 2.12 `seo`

| Field | Type | Req | Notes |
|---|---|---|---|
| `meta_title` | string | N | ≤60 chars target (hard 70). Pattern: `{Name}, {Area} — {Hook}`. |
| `meta_description` | string | N | ≤160 chars target (hard 170). |

### 2.13 `provenance`

| Field | Type | Req | Notes |
|---|---|---|---|
| `created` | date | R | |
| `last_verified` | date | N | Stamped only after the [verification workflow](07-quality-and-verification.md) passes. |
| `confidence` | enum | R | `high` · `medium` · `low` — definitions in spec 07. |
| `sources` | array | []ok | ≤10 items `{ title, url?, publisher?, accessed? }`. |
| `needs_verification` | string[] | []ok | Dot-paths of fields awaiting verification, e.g. `"visit.fees"`. The honest ledger. |

## Appendix A — recommended `attributes` keys by category

`attributes` is free-form (schema allows anything) but stick to these recognized keys where they apply:

| Category | Recommended keys |
|---|---|
| waterfall | `height_m`, `river`, `tiers`, `pool_at_base` |
| monument | `height_m`, `opened_year`, `architect`, `dedicated_to` |
| dam | `river`, `height_m`, `length_m`, `purpose` |
| lake | `area_ha`, `boating`, `origin` (natural/man-made) |
| viewpoint | `elevation_m`, `faces` (sunrise/sunset/valley) |
| temple / religious-site | `deity`, `tradition`, `main_festival`, `dress_code` |
| wildlife | `area_km2`, `key_species`, `safari`, `entry_permit` |
| fort / palace | `era`, `built_by`, `trek_time_min` |
| adventure | `operator`, `price_range_inr`, `min_age`, `season` |
| eco-campsite | `operator` (forest-dept/private), `capacity`, `booking_portal` |

## Appendix B — full example record

Illustrative values (coordinates/distances pending verify pass — note the `needs_verification` ledger):

```json
{
  "schema_version": 1,
  "id": "dang-girmal-falls",
  "slug": "girmal-falls",
  "name": { "en": "Girmal Falls" },
  "aliases": ["Girmal Waterfall"],
  "category": "waterfall",
  "subcategories": [],
  "tags": ["monsoon", "offbeat", "photography", "nature", "picnic"],
  "cluster": "dang-interior",
  "status": "active",
  "district": "dang",
  "summary": "Gujarat's tallest waterfall — a roughly 30 m plunge on the Gira river that thunders from July to October.",
  "description": "Two to four paragraphs written per spec 05…",
  "highlights": [
    "Tallest waterfall in Gujarat at roughly 30 m",
    "Railed viewing deck directly facing the plunge",
    "Rarely crowded even at monsoon peak"
  ],
  "history_legend": null,
  "attributes": { "height_m": 30, "river": "Gira" },
  "location": {
    "taluka": "Ahwa",
    "admin_district": null,
    "outside_district": false,
    "nearest_town": { "name": "Ahwa", "distance_km": 45 },
    "coordinates": { "lat": 20.95, "lng": 73.83, "precision": "approximate" },
    "altitude_m": null,
    "distances_km": { "ahwa": 45, "saputara": 60, "waghai": 55, "surat": 160 }
  },
  "access": {
    "modes": {
      "road": "Via Ahwa; the last stretch is a narrow forest road to Girmal village",
      "rail": "Waghai (heritage narrow gauge); Bilimora Jn is the nearest broad-gauge railhead",
      "air": "Surat (~160 km)"
    },
    "last_mile": "Motorable to the viewpoint gate; short paved walk to the deck",
    "road_condition": "Tarred but narrow interior roads; slow going in rain",
    "parking": { "available": true, "fee": 0, "notes": "Small unpaved lot" }
  },
  "visit": {
    "timings": [{ "days": "all", "open": "08:00", "close": "18:00" }],
    "fees": [],
    "booking": { "required": false, "url": null, "notes": null },
    "duration_min": 60,
    "best_time_of_day": "morning",
    "weekly_closure": null,
    "notes": "Deck may close briefly after very heavy overnight rain."
  },
  "seasonality": {
    "best_months": [7, 8, 9, 10],
    "avoid_months": [3, 4, 5],
    "monsoon_dependent": true,
    "notes": "Full flow July–September; reduces to a trickle by late winter."
  },
  "experience": {
    "activities": ["sightseeing", "photography", "picnic"],
    "difficulty": "easy",
    "suitable_for": { "kids": true, "elderly": true, "wheelchair": false },
    "photography_notes": "Shoot before 10:00 for side-lit spray; carry a lens cloth — the deck sits in the mist zone in August."
  },
  "amenities": {
    "food": "Seasonal snack stalls at the parking lot; nearest reliable food is in Ahwa",
    "toilets": "basic",
    "drinking_water": false,
    "mobile_network": { "jio": "weak", "airtel": "none", "vi": "none", "bsnl": "ok" },
    "guides": "Not needed; the path is obvious",
    "ev_charging": false,
    "stay_nearby": ["dang-mahal-eco-campsite"]
  },
  "safety": {
    "warnings": [
      "Do not cross the railing — rock faces are lethal when wet",
      "No swimming at the base pool",
      "Leech protection advised on grassy paths at monsoon peak"
    ],
    "emergency": { "nearest_hospital": "Ahwa Civil Hospital (~45 km)", "police": "Ahwa PS", "notes": null }
  },
  "tips": [
    "Club it with Don hill or Mahal campsite to justify the interior drive",
    "Fuel up in Ahwa — there are no petrol pumps on the interior stretch"
  ],
  "faqs": [
    {
      "q": "Is Girmal Falls worth visiting outside monsoon?",
      "a": "October–November still has decent flow; by February it is a thin stream — go for the drive and the valley, not the falls."
    }
  ],
  "nearby": [
    { "id": "dang-mahal-eco-campsite", "distance_km": 25 },
    { "id": "dang-don-hill", "distance_km": 40, "note": "Pairs well for a full-day interior loop" }
  ],
  "itineraries": ["monsoon-waterfall-circuit"],
  "media": { "images": [], "videos": [] },
  "seo": {
    "meta_title": "Girmal Falls, Dang — Gujarat's Tallest Waterfall",
    "meta_description": "Plan a monsoon visit to the 30 m Girmal Falls in the Dang forests: timings, best months, road access from Saputara and Ahwa, and safety tips."
  },
  "provenance": {
    "created": "2026-08-08",
    "last_verified": null,
    "confidence": "medium",
    "sources": [],
    "needs_verification": ["location.coordinates", "location.distances_km", "visit.timings"]
  }
}
```
