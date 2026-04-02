# Content Authoring Spec

Shared rules for all certification content in this repo. Cert-specific docs
cover only folder layout; everything about file format, naming, and validation
lives here.

## Canonical Paths

```
content/<cert>/domains/<domain>/questions/<id>.json
content/<cert>/domains/<domain>/concepts/<id>.json
```

- One JSON object per file.
- `questions/` folders may only contain question JSON files.
- `concepts/` folders may only contain concept-card JSON files.
- No array-of-items files.

## Filename Rules

- The filename (without `.json`) **must equal** the `id` field inside the file.
- IDs use **lowercase kebab-case** and should include cert/domain context
  to stay unique across the repo (e.g. `clf-c02-cloud-concepts-shared-responsibility`).
- The `cert` field must match the `<cert>` folder segment.
- The `domain` field must match the `<domain>` folder segment.

## Schemas

The zod schemas in `src/schemas/` are the single source of truth:

- `question.schema.ts` — questions
- `concept.schema.ts` — concept cards
- `aws-source-url.ts` — shared URL validator

The content build pipeline (`pnpm content:build`) validates every file against
these schemas before generating the catalog.

## Source URLs

`awsSourceUrls` must use `https://docs.aws.amazon.com/...` for now. The
allowed host list is centralized in `src/schemas/aws-source-url.ts`. If the
policy expands, update that file first.

## Status

Every question and concept card carries a `status` field:

| Value     | Meaning                                                |
| --------- | ------------------------------------------------------ |
| `draft`   | Still being written, edited, or not ready for learners |
| `ready`   | Reviewed and approved for normal learner-facing use    |

## Example Question Payload

```json
{
  "id": "saa-c03-secure-architectures-iam-policy-evaluation",
  "cert": "SAA-C03",
  "domain": "secure-architectures",
  "topic": "IAM Policy Evaluation",
  "difficulty": "intermediate",
  "type": "multiple-choice",
  "stem": "A company has an explicit allow in an IAM policy and an explicit deny in an SCP. What is the effective permission?",
  "options": [
    { "id": "a", "text": "Allow" },
    { "id": "b", "text": "Deny" },
    { "id": "c", "text": "Depends on the resource policy" },
    { "id": "d", "text": "Depends on the permission boundary" }
  ],
  "correctAnswers": ["b"],
  "explanation": "An explicit deny in any policy always overrides an allow. SCPs set the maximum permissions for accounts in an organization.",
  "distractorExplanations": {
    "a": "An explicit deny in the SCP overrides the IAM allow.",
    "c": "Resource policies cannot override an explicit SCP deny for principals in the same account.",
    "d": "Permission boundaries further restrict, but the SCP deny already blocks access."
  },
  "awsSourceUrls": [
    "https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html"
  ],
  "examVersion": "SAA-C03",
  "tags": ["iam", "scp", "policy-evaluation"],
  "status": "draft"
}
```

## Example Concept Card Payload

```json
{
  "id": "saa-c03-secure-architectures-shared-responsibility",
  "cert": "SAA-C03",
  "domain": "secure-architectures",
  "topic": "Shared Responsibility Model",
  "type": "concept",
  "title": "Shared Responsibility Model",
  "front": "Which side of the shared responsibility model covers patching the guest OS on an EC2 instance?",
  "back": "The customer is responsible for patching the guest OS. AWS manages the underlying host hardware and hypervisor.",
  "relatedQuestionIds": [],
  "awsSourceUrls": [
    "https://docs.aws.amazon.com/whitepapers/latest/aws-risk-and-compliance/shared-responsibility-model.html"
  ],
  "tags": ["shared-responsibility", "ec2"],
  "status": "draft"
}
```
