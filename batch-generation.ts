/**
 * batch-generation.ts — builds a batch manifest of ArtworkCandidates from
 * already-existing asset paths. It does NOT generate images: real generation
 * (image model / Canva / manual) happens outside this repo; this module only
 * records where the assets live. Rewritten from scratch (2026-10-14).
 */
import { ArtworkCandidate } from './workflow-model';

export interface BatchVariantAsset {
  sourceAssetPath: string;
  previewAssetPath: string;
  storagePath: string;
}

export interface BatchVariantInput {
  id: string;
  asset: BatchVariantAsset;
  generatedAt: string;
}

export interface BatchGenerationInput {
  conceptId: string;
  promptId: string;
  batchId: string;
  collectionId: string;
  createdAt: string;
  variants: BatchVariantInput[];
}

export interface BatchGenerationResult {
  batchId: string;
  collectionId: string;
  createdAt: string;
  candidates: ArtworkCandidate[];
}

export function candidateIdFor(batchId: string, variantId: string): string {
  return `${batchId}-${variantId}`;
}

export function createBatchGeneration(input: BatchGenerationInput): BatchGenerationResult {
  if (input.variants.length === 0) throw new Error(`Batch ${input.batchId} has no variants`);
  const seen = new Set<string>();
  const candidates = input.variants.map((v): ArtworkCandidate => {
    if (seen.has(v.id)) throw new Error(`Duplicate variant id "${v.id}" in batch ${input.batchId}`);
    seen.add(v.id);
    return {
      id: candidateIdFor(input.batchId, v.id),
      conceptId: input.conceptId,
      promptId: input.promptId,
      batchId: input.batchId,
      sourceAssetPath: v.asset.sourceAssetPath,
      previewAssetPath: v.asset.previewAssetPath,
      storagePath: v.asset.storagePath,
      generatedAt: v.generatedAt,
    };
  });
  return { batchId: input.batchId, collectionId: input.collectionId, createdAt: input.createdAt, candidates };
}
