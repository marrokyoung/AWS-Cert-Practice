# CLF-C02 - AWS Certified Cloud Practitioner

Source content for Cloud Practitioner certification prep.

## Structure

```
CLF-C02/
  domains/
    cloud-concepts/
      concepts/    -- concept card JSON files
      questions/   -- question JSON files
    security-and-compliance/
      concepts/
      questions/
    cloud-technology-and-services/
      concepts/
      questions/
    billing-pricing-support/
      concepts/
      questions/
```

## Content Format

Questions and concept cards are stored as JSON files validated against the
schemas in `src/schemas/`. See `src/schemas/question.schema.ts` and
`src/schemas/concept.schema.ts` for the expected shape.

Each file must pass schema validation before the content build pipeline
will include it in the generated catalog.
