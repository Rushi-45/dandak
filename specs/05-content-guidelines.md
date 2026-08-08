# 05 — Content Guidelines

Status: Draft v0.1 · Last updated: 2026-08-08 · Normative for all prose fields

## Voice

Write like a well-travelled friend who has actually been there: **specific, practical, warm, unhurried — never promotional.** Every sentence should either help someone decide, plan, or enjoy. If a sentence would survive on any tourism brochure unchanged, it's too generic — cut or sharpen it.

**Banned fluff** (L3 lint, warning): `breathtaking` · `mesmerizing` · `enchanting` · `magical` · `paradise` · `must-visit` · `awe-inspiring` · `jaw-dropping` · `nestled` · `hidden gem`. Show, don't gush: instead of "breathtaking views", say what you actually see ("the Sahyadri ridgeline layered in haze, three valleys deep").

## Field recipes

| Field | Recipe |
|---|---|
| `summary` | One sentence, ≤160 chars. Lead with the concrete claim ("Gujarat's tallest waterfall — a roughly 30 m plunge…"). No "located in", no throat-clearing. |
| `description` | 150–400 words, 2–4 paragraphs. **P1:** what it is + why it's worth the trip. **P2:** the on-ground experience — what you do, see, feel, in what order. **P3 (optional):** context — history, ecology, culture. **P4 (optional):** practical texture that doesn't fit structured fields. |
| `highlights` | 3–6 bullets, ≤90 chars, noun/verb-first, each a distinct selling point. No overlap with each other. |
| `history_legend` | Only when there's real substance. Lore is framed as lore: "Local tradition holds…", "The Ramayana association says…" — never myth stated as fact. Dates/rulers only when confident; otherwise hedge honestly ("built in the era of…"). |
| `photography_notes` | Concrete: time of day, direction of light, season, vantage, one gear hint max. |
| `tips` | Non-obvious and actionable ("Fuel up in Ahwa — no pumps beyond"). Never restate structured data. |
| `faqs` | Questions travellers genuinely ask (worth checking "People also ask"). Answers ≤3 sentences, honest even when unflattering. |
| `safety.warnings` | Imperative mood, one hazard each: "Do not cross the railing". No fearmongering — state the hazard and the behavior. |
| `seo.meta_title` | `{Name}, {Area} — {Hook}`, ≤60 chars. |
| `seo.meta_description` | ≤160 chars, includes one planning fact (best months, distance, fee). |

## Style rules

- **Units & numbers:** metric everywhere; numerals for all measurements; `₹` in prose, integer `amount_inr` in data; 24-hour times in data, "8 am" style allowed in prose; month names in prose, integers 1–12 in data.
- **Names:** use the current official name with the older one in brackets on first mention — "Ekta Nagar (formerly Kevadia)". The spot's `name.en` is the common signage spelling; variants go in `aliases`, not prose.
- **Transliteration:** pick the most common English signage spelling (e.g. *Nilkanthdham*, *Shabari Dham*, *Girmal*); no diacritics; be consistent across the dataset — the seed list in [spec 08](08-spot-inventory.md) fixes spellings once.
- **Honesty rules:** superlatives need a basis ("Gujarat's tallest waterfall" — verifiable) or a hedge ("said to be…"). Crowds, effort, and disappointment risks are stated plainly (a dry-season waterfall is a dry-season waterfall). Never invent specifics — an unknown fee is `null` + `needs_verification`, not a guess.
- **Distance phrasing:** distances in prose are road distances unless stated ("~45 km by road from Ahwa").

## Sensitivity

- **Tribal communities (Bhil, Kunbi, Warli, Gamit and others):** write with respect and specificity — name communities correctly, describe living culture in the present tense, never use "primitive", "untouched", "lost in time" tropes. Cultural experiences are described as hosted by people, not as exhibits.
- **Religious sites:** state practical etiquette factually (footwear, dress, photography rules, prasad customs) without endorsing or explaining away beliefs.
- **Environment:** where a spot is ecologically fragile (sanctuary cores, waterfall pools), the record says what responsible behavior looks like — this is content, not preaching: one line, concrete.
- **Alcohol:** Gujarat is a dry state — never recommend alcohol; mahua's cultural role may be described factually as heritage context.

## English-first, multilingual-ready

Prose fields are plain English strings in schema v1. The migration path (schema v2, [spec 09](09-roadmap.md)) wraps prose fields into language-keyed objects mechanically — so **never** embed language-mixed prose ("known locally as X" is fine; parallel Gujarati sentences are not). `name.gu`/`name.hi` may be added any time without a schema bump.
