# Changelog

Dataset versioning per [spec 06](specs/06-pipeline-and-workflow.md#versioning--releases).

## [Unreleased]

### Added
- Phase 0 — specification suite v0.1: specs 00–09, spot schema v1 (`schema/spot.schema.json`).
- Phase 1 — scaffold: `seed/spots-master.csv` (64 spots: 32 Dang, 32 Narmada), validator (`scripts/validate.mjs`, levels L1–L3 + seed checks), stats dashboard (`scripts/stats.mjs`), vocabulary registry (`scripts/registry.json`, mirrors spec 04), example fixture (`schema/examples/spot.example.json`).
- Phase 3 — full corpus drafted: all 64 spot records (T1 22, T2 27, T3 15), knowledge-drafted per spec 05 with `needs_verification` ledgers populated; validator clean (0 errors / 0 warnings). Confidence mix: 48 medium, 16 low. Nothing verified yet — phase 4 pending.

### Fixed
- `dang-anjan-kund`: road distances made consistent with (approximate) coordinates after L3 plausibility lint flagged the mismatch.
