/**
 * Canonical workflow data model for the Roc Sigil digital-art sales pipeline.
 *
 * This module defines the shared records used by concept intake, artwork
 * generation, quality control, metadata/licensing, catalog persistence,
 * publication staging, and job orchestration.
 */

export const WORKFLOW_MODEL_VERSION = '1.0.0' as const;

export const LICENSE_TYPES = [
    'personal_use',
    'commercial_use',
    'extended_commercial_use',
] as const;

export type LicenseType = (typeof LICENSE_TYPES)[number];

export const QUEUE_NAMES = [
    'concept_intake',
    'generation',
    'review',
    'publication',
    'maintenance',
] as const;

export type QueueName = (typeof QUEUE_NAMES)[number];

export const APPROVAL_STATUSES = [
    'draft',
    'pending_review',
    'approved',
    'rejected',
    'published',
] as const;

export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const REVIEW_DECISIONS = ['pass', 'reject', 'needs_human_review'] as const;

export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

export const REJECTION_REASONS = [
    'low_visual_quality',
    'style_mismatch',
    'duplicate_content',
    'incomplete_metadata',
    'policy_risk',
    'weak_commercial_appeal',
] as const;

export type RejectionReason = (typeof REJECTION_REASONS)[number];

export interface ConceptRecord {
    id: string;
    theme: string;
    buyerUseCase: string;
    styleProfileId: string;
    promptTemplateId: string;
    promptVersion: string;
    createdAt: string;
    updatedAt: string;
}

export interface StyleProfile {
    id: string;
    name: string;
    description: string;
    colorLanguage: string;
    renderingLanguage: string;
    moodLanguage: string;
    version: string;
    active: boolean;
}

export interface PromptRecord {
    id: string;
    conceptId: string;
    styleProfileId: string;
    subjectMatter: string;
    styleDescriptors: string[];
    compositionGuidance: string[];
    qualityConstraints: string[];
    negativeConstraints: string[];
    renderedPrompt: string;
    version: string;
    createdAt: string;
}

export interface ArtworkCandidate {
    id: string;
    conceptId: string;
    promptId: string;
    batchId: string;
    sourceAssetPath: string;
    previewAssetPath: string;
    storagePath: string;
    generatedAt: string;
    rejectionReason?: RejectionReason;
}

export interface QualityCheckResult {
    candidateId: string;
    decision: ReviewDecision;
    score: number;
    styleCompliance: boolean;
    compositionQuality: boolean;
    duplicateRisk: boolean;
    contentSafety: boolean;
    metadataComplete: boolean;
    reasons: RejectionReason[];
    reviewedAt: string;
}

export interface LicenseRecord {
    type: LicenseType;
    summary: string;
    termsPath: string;
    visibleBeforePurchase: boolean;
}

export interface MetadataRecord {
    id: string;
    artworkId: string;
    internalId: string;
    title: string;
    shortDescription: string;
    fullDescription: string;
    tags: string[];
    category: string;
    styleProfileId: string;
    sourcePromptId: string;
    generationDate: string;
    approvalStatus: ApprovalStatus;
    licenseType: LicenseType;
    deliveryFormat: string;
    storageLocation: string;
    publicationStatus: ApprovalStatus;
}

export interface CatalogEntry {
    id: string;
    artworkId: string;
    metadataId: string;
    licenseType: LicenseType;
    finalAssetPath: string;
    previewImagePath: string;
    metadataPath: string;
    licenseSummaryPath: string;
    downloadPackagePath: string;
    publishedAt?: string;
}

export interface QueueItem {
    id: string;
    queueName: QueueName;
    payloadType: 'concept' | 'generation' | 'review' | 'publication' | 'maintenance';
    payloadId: string;
    attempts: number;
    lastError?: string;
    nextRunAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface WorkflowState {
    version: typeof WORKFLOW_MODEL_VERSION;
    concepts: ConceptRecord[];
    styleProfiles: StyleProfile[];
    prompts: PromptRecord[];
    candidates: ArtworkCandidate[];
    qualityChecks: QualityCheckResult[];
    licenses: LicenseRecord[];
    metadata: MetadataRecord[];
    catalog: CatalogEntry[];
    queues: QueueItem[];
}

// --- POD / Clothing Merch extensions (per approved plan + POD_MERCH_EXTENSION.md) ---
export const APPAREL_TYPES = ['tee', 'hoodie', 'long_sleeve', 'poster'] as const;
export type ApparelType = (typeof APPAREL_TYPES)[number];

export const APPAREL_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'] as const;
export type ApparelSize = (typeof APPAREL_SIZES)[number];

export interface ProductVariant {
    id: string;
    artworkId: string;
    productType: ApparelType;
    color: string;
    sizeRange: ApparelSize[];
    placement: string; // e.g. 'center_chest', 'full_front'
    mockupStyle: 'model' | 'flat' | 'both';
    providerSku?: string;
    costEstimate?: number;
}

export interface MockupSet {
    variantId: string;
    modelImagePath?: string;
    flatImagePath?: string;
    detailImagePath?: string;
    generatedWith: 'image_gen' | 'canva' | 'manual';
    generatedAt: string;
}

export interface PODProviderRecord {
    id: string;
    name: 'printful' | 'printify' | 'other';
    variantId: string;
    externalProductId?: string;
    syncStatus: 'pending' | 'synced' | 'failed';
    lastSyncedAt?: string;
}

export interface PODProductionFile {
    variantId: string;
    printFilePath: string;
    dimensions: string;
    bleedNotes: string;
    colorProfile: string;
}