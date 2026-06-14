# POD / Merch Extension for Roc Sigil Platform

**Status:** Initial draft (created as part of approved launch plan). Expand as we implement.

## Scope
Extend the core digital-art pipeline (PRODUCT_BRIEF, ART_GENERATION_PIPELINE, workflow model, quality gates, etc.) to support physical print-on-demand products, with emphasis on clothing (apparel) and posters.

Goal: From the same stylized artwork, reliably produce:
- Digital downloads (unchanged path)
- POD-ready deliverables (print files + multiple professional mockups)
- Structured product variants that can be synced to a POD provider

## Core Product Types (MVP)
1. **Apparel**
   - Unisex classic tee (or premium)
   - Pullover hoodie
   - (Later) long-sleeve, tank, kids, etc.

2. **Wall / Decor**
   - Standard poster (multiple sizes)
   - (Stretch) canvas, framed, metal prints

For each physical SKU we track:
- Base artwork (the generated digital piece)
- Placement (center chest, full front, sleeve hit, all-over, etc.)
- Color variants of the garment that work with the art
- Size range
- Print technique assumptions (DTG for most apparel initially; screen print notes for future)

## Variant Data Model (to be added to workflow-model.ts)
Suggested extensions (keep backward compatible with existing digital CatalogEntry / MetadataRecord):

- `ProductVariant`: id, productType (tee|hoodie|poster|...), apparelColor, sizeRange, placement, mockupStyle (model|flat|both), providerSku or mapping
- `MockupSet`: for a variant — array of { type: 'model'|'flat'|'detail', imagePath, generatedWith: 'canva'|'imagine'|'manual', notes }
- `PODProductionFile`: high-res print file path, dimensions, bleed, color profile, placement coords/instructions
- `PODProviderProduct`: link to external provider (Printful id, sync status, lastPriceCheck, etc.)

A single approved Artwork can spawn multiple `PODProduct` records (one per physical SKU/variant we decide to offer).

## Mockup & Production File Generation Pipeline (POD-specific stages)
1. **Select approved artwork** (after digital QC passes).
2. **Define target variants** for the collection (manual or rule-based from style profile + niche).
3. **Generate / composite mockups**:
   - Use Canva MCP (strong for professional apparel mockups, brand templates, easy resizing).
   - Supplement with Grok image_gen / image_edit for custom angles, lighting, or stylized model shots when Canva templates are insufficient.
   - Flat lay mockups for detail / color swatches.
4. **Prepare production files**:
   - High-resolution PNG (or PDF) with transparent background where appropriate.
   - Correct dimensions per provider spec (e.g. Printful DTG print area).
   - Add safe-area / bleed notes in metadata.
5. **Quality gate extension** (POD-specific checks):
   - Sufficient contrast / line weight for fabric printing (no tiny details that will disappear).
   - Color mode suitability (CMYK conversion notes).
   - No important elements too close to seams/edges.
   - Mockups look commercially attractive on the actual garment color.
6. **Package for provider**:
   - Per-variant folder or zip containing: print file(s), mockup images, metadata JSON snippet, placement instructions.
7. **Sync / export**:
   - CSV for bulk import to Printful/Printify.
   - Or direct API calls (future) for product creation + pricing.

## Initial Provider Strategy
- **Primary:** Printful (excellent mockup library, reliable DTG, good API + CSV, global fulfillment).
- **Fallback / parallel test:** Printify or local manual for first samples.
- Start with on-demand (no inventory). Only move to pre-made stock after real sales data.
- Track provider costs + suggested retail in the variant metadata for margin calculations.

## Branding Constraints for Apparel
- Roc Sigil mark must remain legible and correctly placed (minimum size, contrast on garment).
- Colorways chosen to complement the art style (reference the existing sigil SVG colors + generated palette).
- Every mockup must feel "on-brand" (use the same photographic treatment / lighting direction across a collection).

## Review Gate Additions for POD
In addition to digital QC:
- Printability score (detail loss risk, contrast on fabric).
- Mockup commercial appeal (does it look good on a person / in a room?).
- Brand compliance (sigil usage, no off-style elements introduced in mockups).
- Margin / pricing sanity (cost vs. target retail).

Route any borderline printability or brand items to human review with clear rejection labels (e.g. `too_fine_detail_for_dtg`, `mockup_looks_cheap`, `sigil_placement_violates_min_size`).

## Storage Layout Extension (alongside existing digital structure)
For a collection:
```
collection/
  digital/                 (existing)
  pod/
    variants/
      unisex-tee-black/
        print-file.png
        mockups/
          model-front.jpg
          flat.jpg
        metadata.json
        placement-instructions.md
      ...
    export/
      printful-bulk-import.csv   (or provider-specific)
      ...
```

Keep source artwork + prompts versioned so we can regenerate production files if provider specs change.

## Success Criteria for This Extension (part of overall launch readiness)
- At least one full collection produces both digital downloads and 2–3 real POD SKUs (e.g. black tee + white hoodie + poster) with passing extended QC.
- Mockups are high enough quality to use directly in customer-facing materials.
- Export package can be imported into Printful (or equivalent) with minimal manual cleanup.
- All traceability back to the original generated artwork is preserved.

## Open Items / To Be Detailed During Implementation
- Exact first collection themes + which variants per artwork.
- Canva template / brand kit setup for consistent mockups.
- Precise Printful size/color/print-area matrix we will support.
- Pricing model (digital tiers + apparel base price + Roc Sigil markup).
- Any legal notes for POD (trademark on apparel, etc.).

This document lives next to PRODUCT_BRIEF.md and should be updated as we implement the TS model extensions and first real batches.