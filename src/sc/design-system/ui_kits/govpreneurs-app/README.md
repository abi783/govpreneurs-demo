# GovPreneurs Hunter — UI kit

A clickable hi-fi recreation of the GovPreneurs Hunter web app, built directly against `tokens.css` + `type-and-components.css` from the design system root.

## Components
- `Sidebar.jsx` — primary nav rail w/ workspace + utility groups, brand stripe, user chip
- `TopBar.jsx` — sticky search header w/ "Ask Hunter" AI shortcut and `/` keyboard hint
- `OpportunityCard.jsx` — the data-dense federal opportunity row (score · narrative · meta · AI explanation)
- `AISurface.jsx` — generic Hunter agent panel + `ResearchPipeline` 4-step streaming display
- `MentorCard.jsx` — human-authored escalation pattern (cold counterweight to AI surface)
- `BrandUpsell.jsx` — Pro upsell brand-card (the only red CTA in the product)
- `Filters.jsx` — left-rail filter checkboxes for discover view
- `kit.css` — kit-specific layout shell (rail, topbar, page-head, filters)

## Demo flows in `index.html`
- **Discover** — filter rail + sortable list + Pro upsell + AI-explained opportunities
- **Saved** — bookmarked subset; click any bookmark to add/remove
- **Research** — streaming 4-phase deep-research pipeline w/ live Hunter caret
- **Mentor** — human verdict card from a senior GovCon mentor
- **Pursuits** — data table of active proposals
- **Detail view** — click any opportunity → full SoW summary, Hunter "why," mentor read, sticky action sidebar
