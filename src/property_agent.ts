import { z } from "zod";
import { infrai } from "./infrai_client.js";

export const maintenanceRequest = z.object({
  propertyId: z.string().min(1), tenantId: z.string().min(1), request: z.string().min(1), documentIds: z.array(z.string()).default([]), inspectionDue: z.string().datetime()
});
export type MaintenanceRequest = z.infer<typeof maintenanceRequest>;

export async function routeMaintenance(input: unknown): Promise<{ status: "scheduled"; propertyId: string; inspectionDue: string }> {
  const item = maintenanceRequest.parse(input);
  try {
    if (item.documentIds.length === 0) throw new Error("tenant document is required before scheduling");
    return { status: "scheduled", propertyId: item.propertyId, inspectionDue: item.inspectionDue };
  } catch (error) {
    await infrai.errors.capture({ title: "property-agent maintenance step failed", message: String(error), level: "error", fingerprint: ["property-agent", "maintenance"], exception: String(error), context: { propertyId: item.propertyId, tenantId: item.tenantId, request: item.request, documentIds: item.documentIds, inspectionDue: item.inspectionDue } });
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await routeMaintenance({ propertyId: "building-7", tenantId: "tenant-42", request: "leaking sink", documentIds: ["lease-42"], inspectionDue: "2026-10-01T09:00:00.000Z" });
  console.log(JSON.stringify(result));
}
