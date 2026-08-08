# Changelog

Dataset versioning per [spec 06](specs/06-pipeline-and-workflow.md#versioning--releases).

## [Unreleased]

### Added
- Phase 0 — specification suite v0.1: specs 00–09, spot schema v1 (`schema/spot.schema.json`).
- Phase 1 — scaffold: `seed/spots-master.csv` (64 spots: 32 Dang, 32 Narmada), validator (`scripts/validate.mjs`, levels L1–L3 + seed checks), stats dashboard (`scripts/stats.mjs`), vocabulary registry (`scripts/registry.json`, mirrors spec 04), example fixture (`schema/examples/spot.example.json`).
