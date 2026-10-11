import assert from "node:assert/strict";
import { routeMaintenance } from "./property_agent.js";

const result = await routeMaintenance({ propertyId: "building-7", tenantId: "tenant-42", request: "leaking sink", documentIds: ["lease-42"], inspectionDue: "2026-10-01T09:00:00.000Z" });
assert.deepEqual(result, { status: "scheduled", propertyId: "building-7", inspectionDue: "2026-10-01T09:00:00.000Z" });
console.log("maintenance request decision: scheduled");
