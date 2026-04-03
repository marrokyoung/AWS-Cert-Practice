# DynamoDB Table Naming and Ownership

## Naming Convention

All table names follow the pattern: `{env}-awscertpractice-{domain}`

Example: `prod-awscertpractice-guest-sessions`

The `{env}` prefix is sourced from the `TABLE_ENV` environment variable (defaults to `dev`).

## Table Ownership

| Table | Owner Endpoint | Purpose |
| --- | --- | --- |
| `{env}-awscertpractice-guest-sessions` | `POST /guest-sessions` | Guest session records for resume continuity |

## Boundary Rules

- Guest sessions are separate from future progress/review data.
- No progress, review, or authenticated identity data belongs in the guest-sessions table.
- Each endpoint owns exactly one table; cross-table writes go through the owning endpoint.

## Sprint 1 Status

Guest-session persistence is placeholder-only in Sprint 1. The handler returns a generated
session ID and expiry without writing to DynamoDB. The table definition exists here to
establish the naming convention before Step 5 creates the actual infrastructure.
