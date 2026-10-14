/**
 * catalog-persistence.ts — builds MetadataRecord / LicenseRecord / CatalogEntry
 * objects and the standard on-disk paths for a variant. Pure functions: the
 * caller (run-pipeline.ts) does the actual file writes.
 * License summaries are plain-language descriptions, not legal advice; terms
 * files under licenses/ are referenced but must be written/reviewed by the owner.
 * Rewritten from scratch (2026-10-14).
 */
import { ApprovalStatus, CatalogEntry, LicenseRecord, LicenseType, MetadataRecord, StyleProfile } from './workflow-model';

export interface PublicationReadyPaths {
  finalAssetPath: string;
  previewImagePath: string;
  metadataPath: string;
  licenseSummaryPath: string;
  downloadPackagePath: string;
}

export function buildPublicationReadyPaths(storageBase: string): PublicationReadyPaths {
  const base = storageBase.replace(/\/+$/, '');
  return {
    finalAssetPath: `${base}/approved/final.png`,
    previewImagePath: `${base}/preview/preview.png`,
    metadataPath: `${base}/metadata/metadata.json`,
    licenseSummaryPath: `${base}/license/license-summary.txt`,
    downloadPackagePath: `${base}/package/download.zip`,
  };
}

export interface CatalogPersistenceInput extends PublicationReadyPaths {
  artworkId: string;
  metadataId: string;
  internalId: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  tags: string[];
  category: string;
  styleProfile: StyleProfile;
  sourcePromptId: string;
  generationDate: string;
  licenseType: LicenseType;
  deliveryFormat: string;
  storageLocation: string;
  approvalStatus: ApprovalStatus;
  publicationStatus: ApprovalStatus;
}

export interface PersistedCatalogRecord {
  metadata: MetadataRecord;
  license: LicenseRecord;
  entry: CatalogEntry;
}

const LICENSE_SUMMARIES: Record<LicenseType, string> = {
  personal_use: 'Personal use license: display and print for your own non-commercial use. No resale or redistribution.',
  commercial_use: 'Commercial use license: use in commercial projects and products you sell. No resale or redistribution of the artwork file itself.',
  extended_commercial_use: 'Extended commercial license: commercial use including merchandise for resale. No resale or redistribution of the artwork file itself.',
};

export function buildLicenseRecord(type: LicenseType): LicenseRecord {
  return { type, summary: LICENSE_SUMMARIES[type], termsPath: `licenses/${type}.md`, visibleBeforePurchase: true };
}

export function persistCatalogRecord(input: CatalogPersistenceInput, publishedAt?: string): PersistedCatalogRecord {
  if (!input.title.trim()) throw new Error(`Catalog record ${input.internalId} has no title`);
  if (input.tags.length === 0) throw new Error(`Catalog record ${input.internalId} has no tags`);
  const metadata: MetadataRecord = {
    id: input.metadataId,
    artworkId: input.artworkId,
    internalId: input.internalId,
    title: input.title,
    shortDescription: input.shortDescription,
    fullDescription: input.fullDescription,
    tags: [...new Set(input.tags)],
    category: input.category,
    styleProfileId: input.styleProfile.id,
    sourcePromptId: input.sourcePromptId,
    generationDate: input.generationDate,
    approvalStatus: input.approvalStatus,
    licenseType: input.licenseType,
    deliveryFormat: input.deliveryFormat,
    storageLocation: input.storageLocation,
    publicationStatus: input.publicationStatus,
  };
  const entry: CatalogEntry = {
    id: `catalog-${input.internalId}`,
    artworkId: input.artworkId,
    metadataId: input.metadataId,
    licenseType: input.licenseType,
    finalAssetPath: input.finalAssetPath,
    previewImagePath: input.previewImagePath,
    metadataPath: input.metadataPath,
    licenseSummaryPath: input.licenseSummaryPath,
    downloadPackagePath: input.downloadPackagePath,
    ...(input.publicationStatus === 'published' ? { publishedAt: publishedAt ?? input.generationDate } : {}),
  };
  return { metadata, license: buildLicenseRecord(input.licenseType), entry };
}
