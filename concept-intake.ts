/**
 * concept-intake.ts — turns a concept + style profile + prompt template into a
 * PromptRecord with a deterministic rendered prompt string.
 * Rewritten from scratch (2026-10-14) from how run-pipeline.ts uses it.
 */
import { ConceptRecord, PromptRecord, StyleProfile } from './workflow-model';

export type ConceptInput = ConceptRecord;

export interface PromptTemplateInput {
  id: string;
  subjectMatter: string;
  styleDescriptors: string[];
  compositionGuidance: string[];
  qualityConstraints: string[];
  negativeConstraints: string[];
  version: string;
  createdAt: string;
}

export interface BuildPromptInput {
  concept: ConceptInput;
  styleProfile: StyleProfile;
  template: PromptTemplateInput;
}

export interface BuildPromptResult {
  concept: ConceptRecord;
  prompt: PromptRecord;
}

export function validateConcept(concept: ConceptInput, styleProfile: StyleProfile, template: PromptTemplateInput): string[] {
  const errors: string[] = [];
  if (!concept.id) errors.push('concept.id is required');
  if (!concept.theme.trim()) errors.push('concept.theme is required');
  if (concept.styleProfileId !== styleProfile.id) errors.push(`concept.styleProfileId "${concept.styleProfileId}" does not match style profile "${styleProfile.id}"`);
  if (concept.promptTemplateId !== template.id) errors.push(`concept.promptTemplateId "${concept.promptTemplateId}" does not match template "${template.id}"`);
  if (!styleProfile.active) errors.push(`style profile "${styleProfile.id}" is not active`);
  return errors;
}

export function renderPrompt(concept: ConceptInput, styleProfile: StyleProfile, template: PromptTemplateInput): string {
  const parts = [
    `${template.subjectMatter}, theme: ${concept.theme}`,
    `for ${concept.buyerUseCase}`,
    `style: ${styleProfile.renderingLanguage}; ${styleProfile.colorLanguage}; mood: ${styleProfile.moodLanguage}`,
    template.styleDescriptors.join(', '),
    template.compositionGuidance.join(', '),
    template.qualityConstraints.join(', '),
  ];
  const negative = template.negativeConstraints.length ? ` Avoid: ${template.negativeConstraints.join(', ')}.` : '';
  return parts.filter(Boolean).join('. ') + '.' + negative;
}

/** Throws if the concept is inconsistent with its style profile/template. */
export function buildPromptFromConcept(input: BuildPromptInput): BuildPromptResult {
  const { concept, styleProfile, template } = input;
  const errors = validateConcept(concept, styleProfile, template);
  if (errors.length) throw new Error(`Invalid concept: ${errors.join('; ')}`);
  const prompt: PromptRecord = {
    id: `prompt-${concept.id}-${template.id}-v${template.version}`,
    conceptId: concept.id,
    styleProfileId: styleProfile.id,
    subjectMatter: template.subjectMatter,
    styleDescriptors: [...template.styleDescriptors],
    compositionGuidance: [...template.compositionGuidance],
    qualityConstraints: [...template.qualityConstraints],
    negativeConstraints: [...template.negativeConstraints],
    renderedPrompt: renderPrompt(concept, styleProfile, template),
    version: template.version,
    createdAt: concept.updatedAt,
  };
  return { concept: { ...concept }, prompt };
}
