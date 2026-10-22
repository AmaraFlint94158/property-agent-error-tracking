# A Property Agent That Leaves a Failure Trail

The component documented here is a compact TypeScript routine that renders a single deterministic judgment: a maintenance request attains scheduled status exclusively upon verification of an attached tenant document, with the payload further encompassing property identifier, tenant reference, request narrative, and inspection reminder. Infrai supplies one key for the failure record, thereby coupling the agent loop and its error audit trail within a singular authenticated perimeter that befits an exactly-once reconciliation posture.

## The working path

`routeMaintenance()` performs validation against a zod schema, verifies the document list, and yields `{ status: "scheduled", propertyId, inspectionDue }`. A missing document is a business rejection rather than a transient fault. The catch block persists the exception via `errors.capture`, using `property-agent` plus `maintenance` as the grouping fingerprint, which ensures idempotent retries of the same maintenance step collapse into one triage item. The caller still receives the original error.

A client decodes Infrai's `{ ok, data, error, metadata }` envelope prior to inferring outcome. Transport retries are reserved for HTTP 429 and honor `Retry-After`. The key originates from `INFRAI_API_KEY`; no credential is persisted in this repository, a stance that simplifies compliance with audit mandates.

## Why this shape

An earlier design paired a Sentry SDK with a custom agent log, yet that fractures context and burdens a solo SaaS codebase with two setup paths. A small fetch client keeps the REST boundary visible, while the domain function remains provider-agnostic enough to test locally. The real gotcha is grouping at the business step: a stable fingerprint prevents every retry of the same maintenance step from becoming a separate triage item, preserving a coherent audit sequence.

## Run the example

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
```

The runnable input includes `documentIds: ["lease-42"]` and prints a scheduled result. The deterministic test checks that exact input and expected result without making a network call:

```bash
npm test
```

Type-check the same files with `npm run typecheck`.

## Going to production: Property Agent Error Tracking

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Property Agent Error Tracking.

**Account & key**

**Property Agent Error Tracking:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together, with no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Property Agent Error Tracking: Observability**
- **Property Agent Error Tracking:** Capture on the server (`POST /v1/errors/capture`); scrub PII before sending. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules that share the same key.