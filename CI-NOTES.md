# roc-sigil CI notes (updated 2026-10-14)

## What changed
The 5 modules run-pipeline.ts imports were missing from the repo. Bobby chose to rewrite them from scratch; they were rebuilt from how run-pipeline.ts uses them:
- `concept-intake.ts` — validates concept ↔ style profile ↔ template, renders a deterministic prompt string → PromptRecord.
- `batch-generation.ts` — builds ArtworkCandidates from existing asset paths. **No image generation** (done outside the repo).
- `quality-gate.ts` — threshold review of caller-supplied 0–1 scores → pass / reject / needs_human_review; DEFAULT_THRESHOLDS.
- `catalog-persistence.ts` — standard per-variant paths + MetadataRecord / LicenseRecord / CatalogEntry (pure; caller writes files).
- `scheduler.ts` — in-memory runWorkflow(seed): prompts → batches → gate → catalog or review queue; pairs qualityChecks[i]/catalogInputs[i] with the i-th candidate.
Also: package.json (typecheck/start/smoke/test), package-lock.json, strict tsconfig.json, .nvmrc (20), .gitignore, test/pipeline.test.ts (6 node:test tests via tsx), and .github/workflows/ci.yml.
run-pipeline.ts: small change — `ROC_SIGIL_OUTPUT_DIR` env redirects disk writes (used by `npm run smoke` → `.smoke-output/`).

## CI (.github/workflows/ci.yml)
push + PR to main, contents: read, concurrency cancel-in-progress, checkout@v4 + setup-node@v4 (Node from .nvmrc, npm cache), then npm ci → typecheck → test → smoke run → check output/ unchanged.

## Local results (Node 20.19.2)
- `npm ci` ✅, `npm run typecheck` ✅ (strict), `npm test` ✅ 6/6, `npm run smoke` ✅ (3 candidates, 3 published, 0 review; files under .smoke-output/).
- `npm start` was not run: it writes into `output/primordial-sigil/`, which isn't in the repo.

## Caveats
- The rewritten modules are new code, not the lost originals; behaviour may differ from what Bobby had locally.
- Quality scores in run-pipeline.ts are hardcoded (0.92 etc.), so the gate always passes in the demo.
- Asset files referenced (output/primordial-sigil/variant-00x/*.png) are not in the repo.
- License summaries are plain-language placeholders and should be reviewed; `licenses/*.md` terms files don't exist.

## Next steps
1. Optional: ESLint/Prettier; decide whether generated output/ belongs in git.
