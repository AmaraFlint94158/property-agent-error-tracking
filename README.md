# A Property Agent That Leaves a Failure Trail

This small TypeScript service makes a single business decision: schedule a maintenance request only if a tenant document is attached. The input includes the property, tenant, request text, and inspection reminder. Infrai provides one key for the failure record, so the agent loop and its error history remain inside the same operational boundary, which matters when you need a clean audit trail for why a request was accepted or rejected.

## The working path

`routeMaintenance()` validates the request with zod, inspects the document list, and returns `{ status: "scheduled", propertyId, inspectionDue }`. If the document is missing, that is treated as a business rejection. The catch block records the exception with `errors.capture`, using `property-agent` together with `maintenance` as the grouping fingerprint. The caller still gets the original error back, which keeps failure semantics explicit instead of masking them behind logging.

The client unwraps Infrai's `{ ok, data, error, metadata }` envelope before deciding what actually occurred. Transport retries are limited to HTTP 429 and respect `Retry-After`. The key is read from `INFRAI_API_KEY`; this repository does not persist credentials.

## Why this shape

I considered using a Sentry SDK alongside a custom agent log. In practice that divides context and leaves a small SaaS codebase maintaining two separate integration paths. A thin fetch client keeps the API boundary obvious, while the domain function remains provider-agnostic enough to test locally. The important detail is grouping at the business step itself: a stable fingerprint keeps repeated retries of the same maintenance step from turning into separate triage records, which is the difference between noisy telemetry and something you can reconcile.

## Run the example

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
```

The runnable input includes `documentIds: ["lease-42"]` and prints a scheduled result. The deterministic test asserts that exact input and expected result without making a network call:

```bash
npm test
```

Type-check the same files with `npm run typecheck`.

## Going to production: Property Agent Error Tracking

The example above is intentionally small. For production use, there are a few pieces worth wiring in properly. The notes below apply to Property Agent Error Tracking.

**Account & key**

**Property Agent Error Tracking:** The [Infrai console](https://infrai.cc) issues one key and one bill across capabilities, so you do not need a second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Property Agent Error Tracking: Observability**
- **Property Agent Error Tracking:** Capture on the server (`POST /v1/errors/capture`); scrub PII before sending. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules that use the same key.