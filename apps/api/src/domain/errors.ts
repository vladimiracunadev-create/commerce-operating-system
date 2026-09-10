export class DomainError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string,
    readonly meta?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

type ErrorLike = { code?: string; statusCode?: number; message?: string; meta?: Record<string, unknown> };

const titles: Record<string, string> = {
  forbidden: 'Forbidden',
  invalid_email: 'Invalid email',
  invalid_order_status: 'Invalid order status',
  insufficient_stock: 'Insufficient stock',
  not_found: 'Not found',
  order_must_be_paid: 'Order must be paid',
  tax_document_already_exists: 'Tax document already exists',
  validation_error: 'Validation failed',
};

export function toProblemDetails(error: unknown, instance: string, correlationId: string) {
  const value = error && typeof error === 'object' ? (error as ErrorLike) : {};
  const known = error instanceof DomainError || typeof value.statusCode === 'number';
  const status = known ? Number(value.statusCode) : 500;
  const code = known && value.code ? value.code : 'internal_error';
  return {
    type: `https://commerce-os.local/problems/${code}`,
    title: titles[code] || (status >= 500 ? 'Internal server error' : 'Request failed'),
    status,
    detail: known ? String(value.message || titles[code] || 'Request failed.') : 'An unexpected error occurred.',
    instance,
    code,
    correlation_id: correlationId,
    ...(value.meta ? { meta: value.meta } : {}),
  };
}
