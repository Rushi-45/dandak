# 03 — Companion Schemas

Status: Draft v0.1 · Last updated: 2026-08-08 · Normative for structure; machine schemas authored in phase 5 ([spec 06](06-pipeline-and-workflow.md))

Shared rules: identity/null/formatting rules from [spec 01](01-data-model.md) apply to every entity. Each record ends with a `provenance` block — full form (as in [spec 02 §2.13](02-spot-schema.md)) for Event and Stay; lite form `{ created, last_reviewed }` for District, Itinerary, Food.

## 3.1 District — `data/districts/{district}.json`

| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | enum | R | `dang` · `narmada`. |
| `name` | object | R | `{ en }` (+ `gu`/`hi` later). |
| `headline` | string | R | One-line positioning, e.g. "Gujarat's only hill country". |
| `overview` | string | R | 200–400 words: geography, character, who it suits. |
| `hero_spots` | string[] | R | 5–8 spot ids the app features first. |
| `hubs` | array | R | `{ name, type, coordinates?, notes? }`; `type`: `town` · `railhead` · `airport` · `bus-station`. Includes Ekta Nagar station, Waghai heritage railhead, Surat/Vadodara airports. |
| `getting_there` | object | R | `{ road, rail, air }` prose. |
| `local_transport` | string | R | Ground truth: shared jeeps in Dang, autos, app-cabs absent, etc. |
| `weather_by_month` | array | R | 12 items `{ month, temp_min_c, temp_max_c, rain, notes? }`; `rain`: `none` · `low` · `moderate` · `heavy`. |
| `best_season` | string | R | Summary paragraph. |
| `emergency` | object | R | `{ police, ambulance, hospitals[], forest_dept? }`. |
| `festivals` | string[] | []ok | Event ids. |
| `foods` | string[] | []ok | Food ids. |
| `tips` | string[] | []ok | District-wide practicalities (fuel, ATMs, network dead zones). |

## 3.2 Itinerary — `data/itineraries/{slug}.json`

| Field | Type | Req | Notes |
|---|---|---|---|
| `id` / `slug` | string | R | e.g. `monsoon-waterfall-circuit`. |
| `title` | string | R | e.g. "Monsoon Waterfall Circuit — Dang in 2 Days". |
| `duration_days` | int | R | 1–5. |
| `districts` | enum[] | R | May span both. |
| `themes` | string[] | R | From the tag vocabulary. |
| `best_months` | int[] | R | |
| `base_hub` | string | R | Where you sleep/start (hub id or stay id). |
| `party` | enum | R | `family` · `couple` · `friends` · `solo` · `any`. |
| `stops` | array | R | Ordered `{ day, order, spot_id, duration_min, note? }`. |
| `day_notes` | array | []ok | `{ day, note }` — meal/stay suggestions, pacing warnings. |
| `total_drive_km` | number | N | Approximate. |
| `notes` | string | N | Caveats (monsoon road closures, booking lead time for SoU). |

Seed itineraries (built in phase 5): 1-day Saputara classic · 2-day Saputara + Waghai belt · Monsoon waterfall circuit (Gira–Girmal–interior) · 1-day SoU express · 2-day SoU family trip · Dediapada offbeat loop (Ninai–Sagai–Shoolpaneshwar) · Pilgrimage trail (Shabari Dham–Pampa–Nilkanthdham–Garudeshwar) · Tribal culture trail.

## 3.3 Event — `data/events/{slug}.json`

| Field | Type | Req | Notes |
|---|---|---|---|
| `id` / `slug` | string | R | |
| `name` | object | R | `{ en }`. |
| `type` | enum | R | `festival` · `fair` · `show` · `season-window`. |
| `district` | enum | R | |
| `spot_id` | string | N | Where it happens, if a catalogued spot. |
| `place` | string | N | Free-text location when no spot applies (e.g. "Ahwa town"). |
| `timing` | object | R | `{ recurrence: string, typical_months: int[], duration_days: int? }` — recurrence in plain words ("annually, the weekend before Holi"). |
| `description` | string | R | What actually happens; scale and vibe. |
| `scale` | enum | R | `local` · `regional` · `national`. |
| `crowd_impact` | string | N | e.g. "Saputara hotels sell out; book 3+ weeks ahead". |
| `tips` | string[] | []ok | |

Seed events: Dang Darbar (Ahwa, pre-Holi) · Saputara Monsoon Festival (Jul–Aug) · Unity Day at SoU (Oct 31) · SoU Diwali–New Year peak window (season-window) · Devmogra Mata annual fair (verify dates) · Shravan month at Shoolpaneshwar/Garudeshwar (season-window) · Republic/Independence-day SoU events (verify) · Christmas–New Year Saputara peak (season-window).

## 3.4 Stay — `data/stays/{slug}.json`

Stays are *lodging*; destination eco-campsites are also spot records and cross-reference via `spot_id`.

| Field | Type | Req | Notes |
|---|---|---|---|
| `id` / `slug` | string | R | |
| `name` | string | R | |
| `type` | enum | R | `hotel` · `resort` · `tent-city` · `eco-campsite` · `homestay` · `dharamshala` · `guesthouse`. |
| `district` | enum | R | |
| `cluster` | string | N | Same registry as spots. |
| `spot_id` | string | N | When the stay is itself a catalogued spot (Mahal, Kilad, Sagai). |
| `coordinates` | object | N | `{ lat, lng, precision }`. |
| `price_band` | enum | R | `budget` · `mid` · `premium` · `luxury` — bands, never live prices. |
| `booking` | object | R | `{ mode, url?, notes? }`; `mode`: `official-portal` · `ota` · `phone` · `walk-in`. Forest campsites book via the forest dept's eco-tourism portal — always record the official URL. |
| `contact` | string | N | |
| `amenities` | string[] | []ok | |
| `nearest_spots` | array | []ok | `{ id, distance_km }`. |
| `notes` | string | N | Honest caveats (generator hours, no network, veg-only kitchen). |

Seed stays: Tent City 1 & 2 (Ekta Nagar) · SoU-area hotels · Rajvant Palace Resort (Rajpipla) · Nilkanthdham guesthouses (Poicha) · Zarwani & Khalwani campsites · Sagai–Malsamot campsite · Saputara hotel belt + GTDC property (verify operator) · Mahal & Kilad campsites (Dang) · Don village homestays (verify) · Ahwa/Waghai basic hotels.

## 3.5 Food — `data/food/{slug}.json`

| Field | Type | Req | Notes |
|---|---|---|---|
| `id` / `slug` | string | R | |
| `name` | object | R | `{ en }`; local-script names later. |
| `type` | enum | R | `dish` · `snack` · `sweet` · `beverage` · `produce`. |
| `veg` | bool | R | |
| `districts` | enum[] | R | |
| `description` | string | R | What it is, how it's eaten, when. |
| `where_to_try` | array | []ok | `{ name, place }` — loose refs, not ids. |
| `season` | string | N | e.g. winter strawberries. |
| `cultural_note` | string | N | Respectful context ([spec 05](05-content-guidelines.md#sensitivity)). |
| `media` | object | N | Optional `{ images: [{ url, license, caption, credit, source_url }] }`, same licence enum and crediting duty as a spot's media. Added 2026-08-10 so dishes can carry photography; omitting the key stays valid. |

Seed foods: nagli (ragi) rotla · vaas nu shaak (bamboo shoot curry) · Dangi-style desi chicken · kand (purple yam) preparations · mahua-flower sweets · local honey (Saputara bee centre) · winter strawberries (Saputara) · chikoo belt produce (Bilimora–Waghai) · maize/nagli papad · Narmada-belt khichdi-kadhi thali.
