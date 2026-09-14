# Analytic panels and Firestore migration

Each `analyticTypes` document is a parent panel with its existing name and price, plus `children: [{ id, name, unit, referenceRange }]` and `schemaVersion: 2`. Child IDs stay stable during editing. Price is charged once per parent panel.

Each `analyticResults` document retains the parent ID/name and price and stores child snapshots with their result values. Catalog changes and deletions do not rewrite historical results. Selected panels are saved in one atomic batch.

Existing documents are migrated in place, retaining their Firestore IDs, original fields and timestamps. An old flat type gets one child with the same name; an old result gets one child containing its exact original text. Unknown units and reference ranges remain blank. Edit the catalog to define the lab's child tests and ranges; historical free text is never automatically split into clinical measurements.

The app checks the migration before catalog/result reads. It uses server reads and transactions, skips version 2 documents, and retries after failures. It requires Firestore read/update access to `analyticTypes` and `analyticResults`; no collections or indexes are added.

With Node 24 and the project's `.env`:

```sh
node scripts/migrate-analytic-hierarchy.mjs          # dry run
node scripts/migrate-analytic-hierarchy.mjs --apply  # migrate
node --test scripts/analytic-schema.test.mjs
```

Applied to project `bekheit-lab` on 2026-09-14: 15 analytic types and 6 results. A subsequent server dry run reported zero pending documents in both collections.

## Meaningful catalog examples

`src/data/analyticCatalog.ts` defines 15 panels and 38 child tests. Each range is explicitly labeled as a published adult example requiring lab review. Individual source URLs are saved with the children and linked from the catalog. Lab staff can edit the ranges and units to match their assays. These are not pediatric or pregnancy reference intervals or patient-specific treatment targets.

Sources: [ABIM January 2026](https://www.abim.org/media/e2wdwdqu/laboratory-reference-ranges.pdf), [Oxford University Hospitals urea](https://www.ouh.nhs.uk/biochemistry/tests/tests-catalogue/urea/), [UCSF urinalysis](https://prod.ucsfhealth.org/care/medical-tests/urinalysis), [Mayo PT/INR](https://www.mayoclinic.org/tests-procedures/prothrombin-time/about/pac-20384661), [Mayo vitamin D](https://www.mayocliniclabs.com/test-catalog/Overview/83670), and [Mayo Access hsTnI](https://prd1.mayocliniclabs.com/test-catalog/overview/614422).

`node scripts/populate-analytic-catalog.mjs` previews the update; `--apply` applies it. It updates only migrated legacy placeholders, retains document IDs and prices, preserves patient results, and skips previously populated or customized panels. Fresh catalog seeding also uses these child definitions.
