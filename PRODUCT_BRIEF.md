# Product Brief
## Automated Digital Art + Print-on-Demand / Clothing Business Platform (Roc Sigil)

### Goal
Build a platform that generates high-quality stylized commercial digital artwork and sells it with high automation, supporting **both digital downloads and print-on-demand (POD) / clothing merchandise** (apparel, posters, home goods). Start semi-automated with human review gates; design for progressive autonomy.

The business is branded **Roc Sigil** (see `roc_sigil_minimal.svg` for core mark).

### Current Decisions (Updated 2026-06-14)
- **Sales channels:** Digital downloads (fast validation + low complexity) **+** POD/clothing (tees, hoodies, posters, etc.) as parallel track from the beginning.
- **Automation level:** Semi-automated with mandatory review gates initially.
- **Art style focus:** Stylized commercial digital art with consistent "Roc Sigil" aesthetic (sigil-inspired geometry, bold symbolic elements, modern graphic feel — adaptable to apparel prints).
- **Fulfillment:** Digital direct + POD providers (start with Printful or Printify via API/CSV/manual; generate production-ready files + professional mockups).
- **Marketplace / storefront:** Initially direct catalog + simple web storefront (Vercel). Expand to Etsy, Shopify, or dedicated marketplaces later.

### Target Outcome
The system must:
- Generate saleable artwork and merch concepts consistently
- Organize everything into a store-ready catalog with full metadata + licensing
- Automatically prepare digital deliverables and POD production packages (print files + mockups per variant)
- Enforce quality + review gates before anything reaches customers
- Support scheduled autonomous runs while keeping human oversight on borderline or high-value items
- Enable rapid expansion from digital-only validation to full clothing line

### Operating Constraints
- Human review remains in the loop for initial launch (quality, brand fit, policy).
- Every published item (digital or physical) must have explicit, buyer-visible licensing / usage rights.
- POD variants must produce reliable, print-safe files and attractive mockups.
- Traceability: every output links back to source concept, prompt, style profile, and generation batch.
- Start lean: validate with digital downloads + a small POD test collection before heavy inventory commitments.

### Dual Fulfillment Path (Digital + POD/Clothing)
**Digital downloads (primary fast path for validation):**
- High-resolution files (PNG/JPG + optional vector/PDF where style allows)
- Tiered licensing (personal, commercial, extended)
- Direct delivery after purchase

**Print-on-Demand / Clothing (parallel from launch):**
- Core products: unisex tees, hoodies, posters, possibly totes / other apparel
- Per-product variants: sizes (S–3XL or standard ranges), colors (core + accent that work with the art)
- Production assets: print-ready files (high-res PNG or PDF with proper bleed/ safe areas) + placement instructions
- Customer-facing: high-quality mockups (model + flat) generated via Canva + image tools
- Provider strategy: Printful (or Printify) — begin with their mockup generator + API/CSV sync; manual order fulfillment initially, automate later

Initial niches/themes should translate cleanly to both digital art and clothing prints:
- Sigil / symbolic / geometric (core brand)
- Stylized nature / abstract landscape
- Modern tech / cyber + organic fusion
- Bold typographic + iconographic statements (commercial friendly)

### Selected Fulfillment Paths
1. **Digital downloads and licensing** (immediate)
2. **POD/clothing via Printful-style provider** (mockups + production files from day one)

### Next / Open Planning Questions (Address in POD_MERCH_EXTENSION.md)
- Exact first 2–3 collections and how they map to apparel SKUs.
- Specific POD provider integration details (API keys, mockup API vs. pre-generated, shipping regions).
- Pricing strategy (digital tiers vs. apparel base + markup).
- Review criteria tuned for printability (line weight, color separation, detail loss on fabric).
- Storefront vs. marketplace priority (own site on Vercel + Etsy test?).

See `POD_MERCH_EXTENSION.md` (to be created) for detailed variant definitions, mockup pipeline, and provider export formats.