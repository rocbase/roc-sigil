/**
 * quality-gate.ts — threshold-based review of an artwork candidate.
 * Scores (0..1) are supplied by the caller; this module does not analyse images.
 * Rewritten from scratch (2026-10-14).
 */
import { ArtworkCandidate, LicenseType, QualityCheckResult, RejectionReason, ReviewDecision } from './workflow-model';

export interface QualityThresholds {
  minStyleMatch: number;
  minComposition: number;
  maxDuplicateRisk: number;
  minContentSafety: number;
  /** Scores within this margin of a threshold go to human review instead of reject. */
  reviewMargin: number;
}

export const DEFAULT_THRESHOLDS: QualityThresholds = {
  minStyleMatch: 0.75,
  minComposition: 0.7,
  maxDuplicateRisk: 0.35,
  minContentSafety: 0.9,
  reviewMargin: 0.05,
};

export interface QualityMetadata {
  title?: string;
  shortDescription?: string;
  fullDescription?: string;
  category?: string;
  storageLocation?: string;
  licenseType?: LicenseType;
  approvalStatus?: string;
  publicationStatus?: string;
  tags?: string[];
}

export interface QualityGateInput {
  candidate: ArtworkCandidate;
  styleMatchScore: number;
  compositionScore: number;
  duplicateRisk: number;
  contentSafetyScore: number;
  metadata?: QualityMetadata;
}

const REQUIRED_META: (keyof QualityMetadata)[] = ['title', 'shortDescription', 'fullDescription', 'category', 'storageLocation', 'licenseType'];

export function hasCompleteMetadata(meta: QualityMetadata | undefined): boolean {
  if (!meta) return false;
  const fieldsOk = REQUIRED_META.every((k) => typeof meta[k] === 'string' && (meta[k] as string).trim().length > 0);
  return fieldsOk && Array.isArray(meta.tags) && meta.tags.length > 0;
}

export function reviewArtworkCandidate(
  input: QualityGateInput,
  thresholds: QualityThresholds = DEFAULT_THRESHOLDS,
  reviewedAt: string = new Date().toISOString(),
): QualityCheckResult {
  for (const [k, v] of Object.entries({ styleMatchScore: input.styleMatchScore, compositionScore: input.compositionScore, duplicateRisk: input.duplicateRisk, contentSafetyScore: input.contentSafetyScore })) {
    if (!Number.isFinite(v) || v < 0 || v > 1) throw new Error(`${k} must be between 0 and 1, got ${v}`);
  }
  const t = thresholds;
  const styleCompliance = input.styleMatchScore >= t.minStyleMatch;
  const compositionQuality = input.compositionScore >= t.minComposition;
  const duplicateOk = input.duplicateRisk <= t.maxDuplicateRisk;
  const contentSafety = input.contentSafetyScore >= t.minContentSafety;
  const metadataComplete = hasCompleteMetadata(input.metadata);

  const reasons: RejectionReason[] = [];
  if (!styleCompliance) reasons.push('style_mismatch');
  if (!compositionQuality) reasons.push('low_visual_quality');
  if (!duplicateOk) reasons.push('duplicate_content');
  if (!contentSafety) reasons.push('policy_risk');
  if (!metadataComplete) reasons.push('incomplete_metadata');

  const nearMiss =
    (!styleCompliance && input.styleMatchScore >= t.minStyleMatch - t.reviewMargin) ||
    (!compositionQuality && input.compositionScore >= t.minComposition - t.reviewMargin) ||
    (!duplicateOk && input.duplicateRisk <= t.maxDuplicateRisk + t.reviewMargin);

  let decision: ReviewDecision;
  if (reasons.length === 0) decision = 'pass';
  else if (!contentSafety) decision = 'reject'; // safety failures never auto-escalate
  else if (reasons.every((r) => r === 'incomplete_metadata') || nearMiss) decision = 'needs_human_review';
  else decision = 'reject';

  const score = Number(((input.styleMatchScore + input.compositionScore + (1 - input.duplicateRisk) + input.contentSafetyScore) / 4).toFixed(4));

  return {
    candidateId: input.candidate.id,
    decision,
    score,
    styleCompliance,
    compositionQuality,
    duplicateRisk: !duplicateOk,
    contentSafety,
    metadataComplete,
    reasons,
    reviewedAt,
  };
}
