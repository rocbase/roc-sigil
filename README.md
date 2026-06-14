# Roc Sigil

**Automated Digital Art + Print-on-Demand Clothing Business Platform**

Stylized commercial line art (sigil-inspired) sold as digital downloads and POD apparel/posters.

## Current Status (Yolo Implementation Phase)
- Product direction: Dual digital + POD/clothing from day one (see PRODUCT_BRIEF.md and POD_MERCH_EXTENSION.md)
- Core TS pipeline + catalog system (run-pipeline.ts demonstrates end-to-end for first "Primordial Sigil" collection)
- POD extensions: ProductVariant, MockupSet, PODProviderRecord + helper functions + Printful CSV export stub
- Branding: roc_sigil_minimal.svg base + yolo-generated variations and hoodie mockup
- Storefront: static HTML demo ready for Vercel (lists 3 digital editions + POD mockup with licenses)
- First collection live on disk: 3 variants with metadata + commercial licenses
- GitHub: this repo (created via MCP during yolo run)

## Quick Start (Local)
```bash
cd "Desktop/roc sigil/roc biz"
npx tsx run-pipeline.ts   # produces/refreshes catalog entries (yolo - no prompts)
```

Open `output/storefront/index.html` in a browser to preview the launch collection.

## Key Files
- `run-pipeline.ts` — main orchestrator
- `workflow-model.ts` — core records + new POD merch types
- `pod-merch.ts` — variant creation, mockups, CSV export
- `output/primordial-sigil/` — generated assets + metadata + licenses
- `output/storefront/` — customer-facing demo
- `output/branding/` — sigil variations

## Next (per approved plan)
- More collections + real scheduler automation
- Canva MCP for pro mockups/brand kits
- Push full code + assets to this repo
- Vercel deploy of storefront
- Full E2E verification + sellable mini-catalog

Yolo mode enabled (user review comment "--yolo" on branding section) for fast creative iteration.

Repo created and managed with Grok Build MCPs during implementation.