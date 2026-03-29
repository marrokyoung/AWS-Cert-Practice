# SAA-C03 - AWS Certified Solutions Architect Associate

Source content for Solutions Architect Associate certification prep.

## Structure

```
SAA-C03/
  domains/
    secure-architectures/
      concepts/    -- concept card JSON files
      questions/   -- question JSON files
    resilient-architectures/
      concepts/
      questions/
    high-performing-architectures/
      concepts/
      questions/
    cost-optimized-architectures/
      concepts/
      questions/
```

## Content Format

Questions and concept cards are stored as JSON files validated against the
schemas in `src/schemas/`. See `src/schemas/question.schema.ts` and
`src/schemas/concept.schema.ts` for the expected shape.

Each file must pass schema validation before the content build pipeline
will include it in the generated catalog.
