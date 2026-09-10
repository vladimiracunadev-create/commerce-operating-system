import { randomUUID } from 'node:crypto';
import type { OperationContext } from '../application/context.js';

export type DomainEvent = {
  event_id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string | null;
  tenant_id: string;
  actor_id: string;
  correlation_id: string;
  causation_id: string | null;
  version: 1;
  occurred_at: string;
  payload: Record<string, unknown>;
};

export function createDomainEvent(
  context: OperationContext,
  eventType: string,
  aggregateType: string,
  aggregateId: string | null,
  payload: Record<string, unknown>,
): DomainEvent {
  return {
    event_id: randomUUID(), event_type: eventType, aggregate_type: aggregateType, aggregate_id: aggregateId,
    tenant_id: context.tenantId, actor_id: context.actorId, correlation_id: context.correlationId,
    causation_id: context.causationId, version: 1, occurred_at: new Date().toISOString(), payload,
  };
}
