/**
 * scheduler.ts — in-memory, synchronous workflow runner: prompts → batches →
 * quality gate → catalog (pass) or review queue (needs_human_review).
 * No timers, network, or disk I/O. Rewritten from scratch (2026-10-14).
 *
 * Pairing rule: qualityChecks[i] and catalogInputs[i] belong to the i-th
 * candidate across all batchInputs, in order.
 */
import { createBatchGeneration, BatchGenerationInput } from './batch-generation';
import { buildPromptFromConcept, ConceptInput, PromptTemplateInput } from './concept-intake';
import { persistCatalogRecord, CatalogPersistenceInput } from './catalog-persistence';
import { reviewArtworkCandidate, QualityGateInput, QualityThresholds, DEFAULT_THRESHOLDS } from './quality-gate';
import { QueueItem, StyleProfile, WorkflowState, WORKFLOW_MODEL_VERSION } from './workflow-model';

export interface WorkflowSeed {
  concepts: ConceptInput[];
  styleProfiles: StyleProfile[];
  promptTemplates: PromptTemplateInput[];
  batchInputs: BatchGenerationInput[];
  qualityChecks: Omit<QualityGateInput, 'candidate'>[];
  catalogInputs: CatalogPersistenceInput[];
}

export interface WorkflowRunResult {
  processedConcepts: number;
  processedCandidates: number;
  publishedEntries: number;
  reviewQueueCount: number;
  rejectedCount: number;
  errors: string[];
  state: WorkflowState;
}

export function createEmptyState(): WorkflowState {
  return { version: WORKFLOW_MODEL_VERSION, concepts: [], styleProfiles: [], prompts: [], candidates: [], qualityChecks: [], licenses: [], metadata: [], catalog: [], queues: [] };
}

export function runWorkflow(seed: WorkflowSeed, options: { thresholds?: QualityThresholds; now?: string } = {}): WorkflowRunResult {
  const now = options.now ?? new Date().toISOString();
  const thresholds = options.thresholds ?? DEFAULT_THRESHOLDS;
  const state = createEmptyState();
  const errors: string[] = [];
  state.styleProfiles.push(...seed.styleProfiles);

  let processedConcepts = 0;
  for (const concept of seed.concepts) {
    const style = seed.styleProfiles.find((s) => s.id === concept.styleProfileId);
    const template = seed.promptTemplates.find((t) => t.id === concept.promptTemplateId);
    if (!style || !template) { errors.push(`concept ${concept.id}: missing style profile or template`); continue; }
    try {
      const { concept: c, prompt } = buildPromptFromConcept({ concept, styleProfile: style, template });
      state.concepts.push(c);
      state.prompts.push(prompt);
      processedConcepts++;
    } catch (e) { errors.push(`concept ${concept.id}: ${(e as Error).message}`); }
  }

  for (const batch of seed.batchInputs) state.candidates.push(...createBatchGeneration(batch).candidates);

  let published = 0, review = 0, rejected = 0;
  state.candidates.forEach((candidate, i) => {
    const check = seed.qualityChecks[i];
    if (!check) { errors.push(`candidate ${candidate.id}: no quality check supplied`); return; }
    const result = reviewArtworkCandidate({ ...check, candidate }, thresholds, now);
    state.qualityChecks.push(result);
    if (result.decision === 'pass') {
      const input = seed.catalogInputs[i];
      if (!input) { errors.push(`candidate ${candidate.id}: no catalog input supplied`); return; }
      const persisted = persistCatalogRecord({ ...input, artworkId: candidate.id }, now);
      state.metadata.push(persisted.metadata);
      state.licenses.push(persisted.license);
      state.catalog.push(persisted.entry);
      published++;
    } else if (result.decision === 'needs_human_review') {
      const item: QueueItem = { id: `review-${candidate.id}`, queueName: 'review', payloadType: 'review', payloadId: candidate.id, attempts: 0, createdAt: now, updatedAt: now };
      state.queues.push(item);
      review++;
    } else {
      candidate.rejectionReason = result.reasons[0];
      rejected++;
    }
  });

  return { processedConcepts, processedCandidates: state.candidates.length, publishedEntries: published, reviewQueueCount: review, rejectedCount: rejected, errors, state };
}
