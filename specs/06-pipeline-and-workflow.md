# 06 — Pipeline & Workflow

Status: Draft v0.1 · Last updated: 2026-08-08 · Normative

## Phases

| Phase | Name | Inputs | Outputs | Exit criteria |
|---|---|---|---|---|
| 0 | **Specification** | brainstorm | `specs/` suite + `schema/spot.schema.json` | Specs internally consistent; inventory reviewed by owner |
| 1 | **Scaffold** | specs | `seed/spots-master.csv` (from [spec 08](08-spot-inventory.md)), `scripts/validate`, repo plumbing | `validate` runs clean on an empty dataset + the spec 02 example |
| 2 | **Calibration samples** | seed list | 3 fully-worked records: one SoU sub-attraction, one Saputara classic, one offbeat interior spot | Owner signs off tone/depth; guidelines updated with learnings |
| 3 | **Mass generation** | seed + calibrated style | All Tier-1 → Tier-2 → Tier-3 records, drafted from knowledge, `needs_verification` honestly populated | 100% L1+L2 pass; L3 warnings triaged |
| 4 | **Verification** | drafted records | Volatile fields web-verified, `last_verified` + sources stamped, coordinates precision upgraded | All T1 verified; T2 ≥80%; remaining flagged |
| 5 | **Companions** | spot data | District, itinerary, event, stay, food records + their machine schemas | Counts per [spec 00 success criteria](00-vision-and-scope.md#success-criteria-v10-tag); refs resolve |
| 6 | **Exports & release** | full dataset | stats page, GeoJSON export, `CHANGELOG.md`, git tag `v1.0` | Success criteria all green |

Phases 3–4 run in **batches of 10–15 records**: draft batch → validate → verify → commit. Never draft the whole corpus before the first verification pass — early verification feedback recalibrates drafting.

## Per-record workflow (phases 3–4)

1. Pick the next seed row (tier order); copy the key template.
2. Draft all fields per [spec 05](05-content-guidelines.md); unknown facts → `null` + `needs_verification` path. Never guess volatile facts.
3. Self-check against the [Definition of Done](07-quality-and-verification.md#definition-of-done) checklist.
4. Run `validate` (L1–L3); fix errors, triage warnings.
5. **Verify pass:** work through `needs_verification` per the [verification workflow](07-quality-and-verification.md#verification-workflow); record sources; upgrade `confidence`; stamp `last_verified`.
6. Commit (see conventions below).

## Tooling

- **Validator:** decided at phase 1 by what's on the machine — Node 18+ (`ajv`) preferred, else Python 3.10+ (`jsonschema`). Requirements regardless of stack: single command (`npm run validate` / `scripts/validate.ps1`), Windows-first, zero network calls, exit code 0 = clean.
- **Checks implemented:** L1 schema, L2 referential, L3 sanity lints — full list in [spec 07](07-quality-and-verification.md#validation-levels).
- **Stats:** `scripts/stats` prints per-district/tier/confidence counts and a `needs_verification` leaderboard — the project's progress dashboard.
- **File writing:** UTF-8 **without BOM**, LF, 2-space indent ([spec 01](01-data-model.md#formatting-conventions-all-json-and-markdown)).

## Git conventions

- **Branch:** trunk-based on `main` (solo project); short-lived branches only for schema changes.
- **Commits:** Conventional Commits.
  - `feat(spot): add dang-girmal-falls`
  - `feat(spot): verify narmada-statue-of-unity fees and timings`
  - `fix(spot): correct dang-gira-falls coordinates`
  - `docs(specs): tighten tag vocabulary`
  - `feat(schema): v2 — multilingual prose fields` (breaking → see below)
- **Batch commits** are fine in phase 3 (`feat(spot): add saputara cluster batch (8 records)`).

## Versioning & releases

- **Dataset version** (git tags): semver. MAJOR = `schema_version` bump/breaking layout change; MINOR = new records or fields; PATCH = corrections.
- `CHANGELOG.md` starts at phase 1; every enum/vocab change ([spec 04 governance](04-taxonomies.md)) and every verification sweep gets a line.
- A release = tag + regenerated stats + (from phase 6) regenerated exports.
