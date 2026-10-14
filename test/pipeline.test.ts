import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPromptFromConcept } from '../concept-intake';
import { createBatchGeneration } from '../batch-generation';
import { reviewArtworkCandidate, hasCompleteMetadata } from '../quality-gate';
import { buildPublicationReadyPaths, persistCatalogRecord } from '../catalog-persistence';
import { runWorkflow, WorkflowSeed } from '../scheduler';
import { StyleProfile } from '../workflow-model';

const T = '2026-01-01T00:00:00.000Z';
const style: StyleProfile = { id: 's1', name: 'S', description: 'd', colorLanguage: 'black', renderingLanguage: 'line art', moodLanguage: 'calm', version: '1', active: true };
const concept = { id: 'c1', theme: 'Test Sigil', buyerUseCase: 'testing', styleProfileId: 's1', promptTemplateId: 't1', promptVersion: '1', createdAt: T, updatedAt: T };
const template = { id: 't1', subjectMatter: 'sigil', styleDescriptors: ['bold'], compositionGuidance: ['centered'], qualityConstraints: ['no text'], negativeConstraints: ['no gradients'], version: '1', createdAt: T };
const meta = { title: 't', shortDescription: 's', fullDescription: 'f', category: 'c', storageLocation: 'x', licenseType: 'commercial_use' as const, tags: ['a'] };
const good = { styleMatchScore: 0.9, compositionScore: 0.9, duplicateRisk: 0.1, contentSafetyScore: 0.99, metadata: meta };

function batch(n: number) {
  return createBatchGeneration({ conceptId: 'c1', promptId: 'p1', batchId: 'b1', collectionId: 'col', createdAt: T,
    variants: Array.from({ length: n }, (_, i) => ({ id: `v${i}`, generatedAt: T, asset: { sourceAssetPath: `a${i}`, previewAssetPath: `p${i}`, storagePath: `output/x/v${i}` } })) });
}
function catalogInput(i: number) {
  return { ...buildPublicationReadyPaths(`output/x/v${i}`), artworkId: `b1-v${i}`, metadataId: `m${i}`, internalId: `RS-${i}`, title: `T${i}`, shortDescription: 's', fullDescription: 'f', tags: ['a', 'a'], category: 'c', styleProfile: style, sourcePromptId: 'p1', generationDate: T, licenseType: 'commercial_use' as const, deliveryFormat: 'PNG', storageLocation: `output/x/v${i}`, approvalStatus: 'approved' as const, publicationStatus: 'published' as const };
}

test('prompt is deterministic and includes negatives', () => {
  const a = buildPromptFromConcept({ concept, styleProfile: style, template });
  const b = buildPromptFromConcept({ concept, styleProfile: style, template });
  assert.equal(a.prompt.renderedPrompt, b.prompt.renderedPrompt);
  assert.match(a.prompt.renderedPrompt, /Test Sigil/);
  assert.match(a.prompt.renderedPrompt, /Avoid: no gradients/);
});

test('prompt rejects mismatched style profile', () => {
  assert.throws(() => buildPromptFromConcept({ concept: { ...concept, styleProfileId: 'other' }, styleProfile: style, template }));
});

test('batch creates candidates and rejects duplicate ids', () => {
  assert.equal(batch(3).candidates.length, 3);
  assert.throws(() => createBatchGeneration({ conceptId: 'c', promptId: 'p', batchId: 'b', collectionId: 'c', createdAt: T,
    variants: [1, 2].map(() => ({ id: 'dup', generatedAt: T, asset: { sourceAssetPath: '', previewAssetPath: '', storagePath: '' } })) }));
});

test('quality gate: pass, reject, needs review', () => {
  const candidate = batch(1).candidates[0];
  assert.equal(reviewArtworkCandidate({ candidate, ...good }).decision, 'pass');
  assert.equal(reviewArtworkCandidate({ candidate, ...good, contentSafetyScore: 0.2 }).decision, 'reject');
  assert.equal(reviewArtworkCandidate({ candidate, ...good, styleMatchScore: 0.1 }).decision, 'reject');
  assert.equal(reviewArtworkCandidate({ candidate, ...good, styleMatchScore: 0.73 }).decision, 'needs_human_review');
  assert.equal(reviewArtworkCandidate({ candidate, ...good, metadata: undefined }).decision, 'needs_human_review');
  assert.equal(hasCompleteMetadata({ ...meta, tags: [] }), false);
  assert.throws(() => reviewArtworkCandidate({ candidate, ...good, compositionScore: 2 }));
});

test('catalog persistence builds paths and dedupes tags', () => {
  const r = persistCatalogRecord(catalogInput(0));
  assert.equal(r.entry.metadataPath, 'output/x/v0/metadata/metadata.json');
  assert.deepEqual(r.metadata.tags, ['a']);
  assert.equal(r.license.type, 'commercial_use');
  assert.equal(r.entry.publishedAt, T);
});

test('scheduler routes candidates to catalog, review queue, and rejection', () => {
  const b = batch(3);
  const seed: WorkflowSeed = {
    concepts: [concept], styleProfiles: [style], promptTemplates: [template],
    batchInputs: [{ conceptId: 'c1', promptId: 'p1', batchId: 'b1', collectionId: 'col', createdAt: T,
      variants: b.candidates.map((c, i) => ({ id: `v${i}`, generatedAt: T, asset: { sourceAssetPath: c.sourceAssetPath, previewAssetPath: c.previewAssetPath, storagePath: c.storagePath } })) }],
    qualityChecks: [good, { ...good, metadata: undefined }, { ...good, contentSafetyScore: 0 }],
    catalogInputs: [0, 1, 2].map(catalogInput),
  };
  const r = runWorkflow(seed, { now: T });
  assert.equal(r.processedConcepts, 1);
  assert.equal(r.processedCandidates, 3);
  assert.equal(r.publishedEntries, 1);
  assert.equal(r.reviewQueueCount, 1);
  assert.equal(r.rejectedCount, 1);
  assert.deepEqual(r.errors, []);
});
