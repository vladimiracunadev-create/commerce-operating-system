import { DomainError } from './errors.js';

export const ORDER_STATUSES = ['draft', 'pending_payment', 'paid', 'picking', 'shipped', 'delivered', 'cancelled', 'refunded'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  draft: ['pending_payment', 'cancelled'],
  pending_payment: ['paid', 'cancelled'],
  paid: ['picking', 'refunded'],
  picking: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

export function assertOrderTransition(from: unknown, to: OrderStatus) {
  if (!isOrderStatus(from) || !transitions[from].includes(to)) {
    throw new DomainError('invalid_order_status', 409, `Order cannot transition from ${String(from)} to ${to}.`, {
      from: String(from),
      to,
    });
  }
}

export function allowedOrderTransitions(from: OrderStatus) {
  return [...transitions[from]];
}
