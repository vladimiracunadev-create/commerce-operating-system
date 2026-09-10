import { randomUUID } from 'node:crypto';

export const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';
export const DEMO_WAREHOUSE_ID = '00000000-0000-0000-0000-000000000010';

export type OperationContext = {
  tenantId: string;
  warehouseId: string;
  actorId: string;
  role: string;
  correlationId: string;
  causationId: string | null;
};

export function createDemoContext(headers: Record<string, unknown>): OperationContext {
  const role = String(headers['x-demo-role'] || 'company_admin');
  return {
    tenantId: DEMO_TENANT_ID,
    warehouseId: DEMO_WAREHOUSE_ID,
    actorId: String(headers['x-demo-actor'] || `demo:${role}`),
    role,
    correlationId: String(headers['x-correlation-id'] || randomUUID()),
    causationId: headers['x-causation-id'] ? String(headers['x-causation-id']) : null,
  };
}
