---
name: govpreneurs-design
description: Use this skill to generate well-branded interfaces and assets for GovPreneurs (the AI-powered GovCon platform), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping the Hunter app and related federal-contracting surfaces.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

The system is built around three immutable rules:
1. **Three-color discipline** — Federal Blue (`--blue-7`) for all interactive/authority chrome, Brand Red (`--brand-7`) reserved exclusively for brand moments (Pro upsells, the brand stripe), AI Amber (`--ai-7`) reserved exclusively for AI-authored surfaces. Never cross the streams.
2. **Every page starts with a 3px brand stripe at top:0** (navy→red gradient via `--brand-stripe`). This is the bridge to the GoHighLevel host shell — it's non-negotiable.
3. **AI attribution is mandatory** — any AI-generated text lives inside `.ai-surface` (warm amber gradient + 1.5% noise + gradient hairline border) with an `.ai-attr` chip naming Hunter as the source.

Type stack: **Inter** for UI, **Instrument Serif italic** for one editorial moment per surface, **JetBrains Mono** with tabular figures for every number/ID/code.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out of `assets/` and `ui_kits/`, link `tokens.css` + `type-and-components.css`, and create static HTML files for the user to view. The components in `ui_kits/govpreneurs-app/` (Sidebar, TopBar, OpportunityCard, AISurface, ResearchPipeline, MentorCard, BrandUpsell) are pixel-fidelity recreations — lift them as-is rather than re-implementing.

If working on production code, read the rules in README.md and the tokens in `tokens.css` to become an expert in designing with this brand. Never invent new colors. Never use emoji. Never use Title Case in UI copy. Always tabular figures for numbers.

If the user invokes this skill without any other guidance, ask them what they want to build or design (a Hunter app surface? a Pro-tier marketing block? a federal-opportunity card? a deck for an investor meeting?), ask the standard questions about audience/scope/variations, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
