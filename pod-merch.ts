/**
 * pod-merch.ts — Roc Sigil POD / Clothing Merch extensions
 * 
 * Implements the types from workflow-model.ts + mockup/POD production helpers.
 * Designed for yolo-mode rapid development (per user --yolo review note on branding).
 * 
 * Usage in pipeline: after digital approval, call createVariantsForArtwork(...)
 * then generateMockups(...) using pre-generated or Canva-assisted images.
 */

import {
  ProductVariant,
  MockupSet,
  PODProviderRecord,
  PODProductionFile,
  ApparelType,
  ApparelSize,
} from './workflow-model';

const DEFAULT_PROVIDER: 'printful' = 'printful';

// Example apparel matrix for a sigil-style design (print-safe, high contrast)
const DEFAULT_APPAREL_MATRIX: Array<{ type: ApparelType; colors: string[] }> = [
  { type: 'tee', colors: ['black', 'white', 'navy'] },
  { type: 'hoodie', colors: ['black', 'charcoal'] },
  { type: 'poster', colors: ['white'] },
];

export function createVariantsForArtwork(
  artworkId: string,
  collectionId: string
): ProductVariant[] {
  const variants: ProductVariant[] = [];

  let variantIndex = 0;
  for (const item of DEFAULT_APPAREL_MATRIX) {
    for (const color of item.colors) {
      variants.push({
        id: `${collectionId}-pod-${variantIndex++}`,
        artworkId,
        productType: item.type,
        color,
        sizeRange: item.type === 'poster' ? [] : ['S', 'M', 'L', 'XL', '2XL'],
        placement: item.type === 'poster' ? 'full' : 'center_chest',
        mockupStyle: 'both',
        providerSku: `${item.type}-${color}-sigil-v1`,
      });
    }
  }

  return variants;
}

export function generateMockupSet(
  variant: ProductVariant,
  baseSigilImagePath: string, // e.g. the approved final.png or a branded variation
  outputDir: string
): MockupSet {
  // In yolo mode we pre-generated the hoodie mockup via image_gen.
  // For full automation this would composite the sigil onto garment templates
  // or call Canva generate-design / upload-asset-from-url + edit.
  const mockup: MockupSet = {
    variantId: variant.id,
    modelImagePath: variant.productType === 'hoodie' 
      ? `${outputDir}/mockups/hoodie-mockup.png` 
      : undefined,
    flatImagePath: `${outputDir}/${variant.productType}-${variant.color}-flat.png`,
    generatedWith: 'image_gen',
    generatedAt: new Date().toISOString(),
  };

  return mockup;
}

export function createPODProductionFile(
  variant: ProductVariant,
  approvedArtworkPath: string
): PODProductionFile {
  return {
    variantId: variant.id,
    printFilePath: approvedArtworkPath, // would be processed (transparent PNG, correct DPI)
    dimensions: variant.productType === 'poster' ? '18x24in' : '12x16in-print-area',
    bleedNotes: '0.125in bleed on all sides; safe area 0.5in from edges for apparel',
    colorProfile: 'CMYK for print (convert from RGB source)',
  };
}

export function getPrintfulExportCSV(variants: ProductVariant[], mockups: MockupSet[]): string {
  // Stub CSV for bulk import to Printful (or similar)
  const header = 'variant_id,product_type,color,size_range,placement,print_file,mockup_model,mockup_flat,provider_sku\n';
  const rows = variants.map((v, i) => {
    const mock = mockups.find(m => m.variantId === v.id);
    return [
      v.id,
      v.productType,
      v.color,
      v.sizeRange.join('|'),
      v.placement,
      v.productType, // placeholder
      mock?.modelImagePath || '',
      mock?.flatImagePath || '',
      v.providerSku || '',
    ].join(',');
  });
  return header + rows.join('\n');
}

// Example usage (for runner or CLI):
// const variants = createVariantsForArtwork('artwork-xxx', 'primordial-sigil');
// const mockups = variants.map(v => generateMockupSet(v, 'path/to/sigil.png', 'output/primordial-sigil'));
// const csv = getPrintfulExportCSV(variants, mockups);