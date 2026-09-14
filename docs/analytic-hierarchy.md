# Analytic catalog and reports

## Active catalog: analytics.pdf

The catalog was replaced from the user's eight-page PDF on 2026-09-14. `src/data/analyticCatalog.ts` contains only test definitions, not patient identities, measured values, or diagnostic comments.

| PDF page | Report group | Tests |
| --- | --- | ---: |
| 1 | Clinical Chemistry Report | 2 |
| 2 | Hormones Report | 2 |
| 3 | Urine Analysis Report | 17 |
| 4 | Stool Analysis Report | 16 |
| 5 | Urine Culture & Sensitivity | 6 |
| 6 | Complete Blood Picture | 16 |
| 7 | H. Pylori Ag in Stool (Qualitative) | 1 |
| 8 | Kidney Functions | 3 |

Each parent represents one report page/group and has an ordered array of children. `section` preserves headings such as Physical Examination, Culture, and CBC. Supported `resultType` values are numeric, text, qualitative, range, and differential. Numeric fields allow qualified values such as `<10,000`; qualitative fields suggest choices and allow custom text. Missing units and ranges remain blank. Suggested choices are UI aids, not prefilled findings.

Differential children store the relative unit/range in `unit` and `referenceRange`. `absoluteEnabled`, `absoluteUnit`, and `absoluteReferenceRange` configure the second measurement. In the PDF, Segmented and Bands have relative results only; the other five differential rows support both. Absolute values are entered independently, never inferred from the WBC result. The PDF does not specify an absolute-count unit.

Reference data is copied from the supplied report, not independently validated for every patient population. The source prints `fl` for urine specific gravity and `0 - 2` as the absolute basophil range; those unusual entries are preserved for lab review. Prices start at 0 EGP because the PDF contains no prices. No antibiotics/susceptibility table is present on its culture page; no antibiotic results are invented.

`generalComment` on a catalog parent is an optional template. It is copied into an editable per-patient report comment and saved on the result document. The PDF's patient-specific normal-blood-picture comment is deliberately not a default.

## Results and printing

Results snapshot the entire child definition plus `result` and, where enabled, `absoluteResult`. Updating or replacing the catalog does not change historical patient reports. Saving all selected panels uses one Firestore batch. Required absolute counts are validated separately. Group comments retain line breaks and print below their group's tests. Printing uses the latest saved result for each parent ID and omits previous-result comparison sections. Existing notes and legacy flat results remain readable.

## Firestore replacement

```sh
node scripts/replace-catalog-from-pdf.mjs          # preview
node scripts/replace-catalog-from-pdf.mjs --apply  # back up and replace
node --test scripts/analytic-schema.test.mjs scripts/analytic-values.test.mjs scripts/analytic-report.test.mjs
```

Uses the project `.env` and Node 24. Before mutation it backs up the complete catalog under ignored `backups/`, checks for concurrent edits, and atomically deletes old catalog entries and inserts the eight deterministic PDF IDs. It skips a successfully installed PDF catalog to preserve later edits. It never writes to patients or analyticResults, and compares result-document fingerprints before and after replacement.

Completed replacement: 15 old entries replaced by 8 report groups / 63 children. All 7 existing patient result documents verified unchanged. Backup: `backups/analytic-types-before-pdf-1789416976915.json`.

Fresh-app seeding uses the same PDF catalog with deterministic IDs and does not overwrite existing records. The earlier in-place hierarchy migration remains for legacy flat records, preserving their IDs, original result text, prices and timestamps.
