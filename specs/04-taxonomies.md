# 04 — Taxonomies & Enum Registry

Status: Draft v0.1 · Last updated: 2026-08-08 · Normative — the single source of truth for every controlled vocabulary

**Governance:** adding/renaming a value = edit this file (+ `schema/spot.schema.json` if schema-enforced) + a `CHANGELOG.md` line, in one commit. Records may only use values listed here; the linter (L3) warns on strays.

## Categories

Schema-enforced. Exactly one per spot.

| Category | Definition | Examples |
|---|---|---|
| `waterfall` | Natural falls | Gira, Girmal, Zarwani, Ninai |
| `viewpoint` | Points/hills visited for the view | Sunset Point, Table Point, Don Hill |
| `lake` | Waterbodies visited as waterbodies | Saputara Lake |
| `garden` | Curated plantings | Rose Garden, Valley of Flowers, Cactus Garden, Waghai Botanical |
| `park` | Built leisure/edutainment parks | Children Nutrition Park, Unity Glow Garden, Dino Trail |
| `temple` | Active temples/shrines with structures | Nageshwar Mahadev, Shabari Dham, Nilkanthdham, Devmogra Mata |
| `religious-site` | Sacred sites that aren't primarily temples | Pampa Sarovar, Anjan Kund, Kabirvad, Shivghat |
| `museum` | Museums/interpretation centres | Saputara Tribal Museum |
| `wildlife` | Sanctuaries, national parks, zoos, safaris | Purna WLS, Shoolpaneshwar WLS, Vansda NP, Jungle Safari |
| `fort` | Forts and ruins | Hatgadh, Rupgadh, Junaraj |
| `palace` | Palaces/heritage mansions | Rajvant Palace |
| `monument` | Built monuments/memorials | Statue of Unity |
| `dam` | Dams/reservoirs visited as sights | Sardar Sarovar viewpoints, Karjan |
| `adventure` | Activity-first attractions | Pushpak Ropeway, River Rafting, Ekta Cruise |
| `eco-campsite` | Destination campsites with day activities | Mahal, Kilad, Sagai–Malsamot |
| `cultural` | Living-culture experiences | Artist Village, Rajpipla heritage walk |
| `market` | Shopping destinations | Ekta Mall |
| `show` | Scheduled performances | SoU Laser Light & Sound Show |

## Subcategories

Only these categories have subcategory vocabularies (else `[]`):

| Category | Allowed subcategories |
|---|---|
| `wildlife` | `sanctuary`, `national-park`, `zoo`, `safari-park` |
| `garden` | `botanical`, `floral`, `themed` |
| `adventure` | `ropeway`, `rafting`, `boating`, `aerial`, `activity-park` |
| `viewpoint` | `hill-station` |
| `eco-campsite` | `forest-department`, `private` |

## Tags

Lint-enforced (L3), 3–8 per spot, lowercase-kebab.

`monsoon` · `winter` · `summer-escape` · `offbeat` · `popular` · `family` · `kids` · `couples` · `adventure` · `pilgrimage` · `mythology` · `history` · `heritage` · `tribal-culture` · `nature` · `wildlife` · `birding` · `photography` · `sunrise` · `sunset` · `trekking` · `picnic` · `boating` · `architecture` · `shopping` · `food` · `evening` · `free-entry` · `ticketed` · `weekend-getaway`

Usage notes: `offbeat` and `popular` are mutually exclusive. `ticketed`/`free-entry` should match `visit.fees`. `monsoon` on any spot whose experience peaks Jul–Sep; `mythology` where `history_legend` carries lore (Shabari Dham, Anjan Kund, Pampa Sarovar, Kabirvad).

## Clusters

One per spot, nullable, never cross-district. App renders clusters as "areas".

| Cluster id | District | Label | Covers |
|---|---|---|---|
| `saputara` | dang | Saputara Hill Station | Lake, points, gardens, ropeway, museum + Hatgadh (adjacent) |
| `waghai` | dang | Waghai Belt | Gira Falls, Botanical Garden, Kilad, Vansda NP (adjacent), Padam Dungari (adjacent) |
| `dang-interior` | dang | Interior Dang | Girmal, Don, Purna WLS, Mahal, Shabari Dham, Pampa Sarovar, Anjan Kund, Shivghat |
| `sou-complex` | narmada | Statue of Unity Complex | Ticketed campus attractions at Ekta Nagar |
| `ekta-nagar-area` | narmada | Around Ekta Nagar | Zarwani, Khalwani rafting, Garudeshwar, Shoolpaneshwar temple |
| `dediapada-belt` | narmada | Dediapada & Shoolpaneshwar Belt | Ninai, Shoolpaneshwar WLS, Sagai–Malsamot, Devmogra |
| `rajpipla` | narmada | Rajpipla Town & Around | Palaces, Harsiddhi Mata, heritage walk, Karjan, Junaraj |
| `poicha` | narmada | Poicha Riverbank | Nilkanthdham + Kabirvad (adjacent) |

## Hubs

Allowed keys for `location.distances_km`, per district. Rule: 3–6 entries per spot, always including the nearest hub, plus `saputara` (Dang spots) or `ekta-nagar` (Narmada spots) where sensible.

| District | Hub keys |
|---|---|
| dang | `saputara` · `ahwa` · `waghai` · `subir` · `bilimora` · `nashik` · `surat` · `vadodara` · `ahmedabad` · `mumbai` |
| narmada | `ekta-nagar` · `rajpipla` · `dediapada` · `sagbara` · `poicha` · `vadodara` · `bharuch` · `ankleshwar` · `surat` · `ahmedabad` · `mumbai` |

## Activities

Lint-enforced (L3) vocabulary for `experience.activities`:

`sightseeing` · `photography` · `boating` · `rafting` · `ropeway-ride` · `safari` · `jungle-trail` · `trekking` · `nature-walk` · `birdwatching` · `camping` · `cycling` · `picnic` · `shopping` · `darshan` · `museum-visit` · `show` · `stargazing` · `village-tour` · `adventure-activities`

## Misc enums

Schema-enforced unless noted.

| Enum | Values |
|---|---|
| `status` | `active` · `seasonal` · `temporarily_closed` · `permanently_closed` |
| `district` | `dang` · `narmada` |
| coordinate `precision` | `exact` · `approximate` · `area` |
| `difficulty` | `easy` · `moderate` · `hard` |
| `best_time_of_day` | `early-morning` · `morning` · `afternoon` · `evening` · `night` · `any` |
| `weekly_closure` / timing days | `mon` · `tue` · `wed` · `thu` · `fri` · `sat` · `sun` (days also: `all` · `weekdays` · `weekends`) |
| fee `type` | `entry` · `camera` · `activity` · `safari` · `boating` · `ropeway` · `rafting` · `guide` · `show` · `combo` · `other` (parking fees live in `access.parking.fee`) |
| `toilets` | `none` · `basic` · `good` |
| network level | `none` · `weak` · `ok` · `good` |
| image `license` | `own` · `cc0` · `cc-by` · `cc-by-sa` · `govt-open` · `licensed` · `unknown` |
| stay `price_band` | `budget` · `mid` · `premium` · `luxury` |
| stay `type` | `hotel` · `resort` · `tent-city` · `eco-campsite` · `homestay` · `dharamshala` · `guesthouse` |
| event `type` | `festival` · `fair` · `show` · `season-window` |
| event `scale` | `local` · `regional` · `national` |
| `confidence` | `high` · `medium` · `low` ([spec 07](07-quality-and-verification.md)) |
| food `type` | `dish` · `snack` · `sweet` · `beverage` · `produce` |
| itinerary `party` | `family` · `couple` · `friends` · `solo` · `any` |
