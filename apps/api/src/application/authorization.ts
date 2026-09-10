import { DomainError } from '../domain/errors.js';

const permissions: Record<string, readonly string[]> = {
  company_admin: ['*'],
  warehouse: ['read', 'stock'],
  sales: ['read', 'customers', 'orders', 'payments'],
  marketing: ['read', 'agents'],
  accountant: ['read', 'tax'],
  ai_operator: ['read', 'agents'],
  auditor: ['read'],
  customer: ['read'],
  platform_owner: ['*'],
};

export function assertCapability(role: string, capability: string) {
  const allowed = permissions[role] || [];
  if (!allowed.includes('*') && !allowed.includes(capability)) {
    throw new DomainError('forbidden', 403, `Role ${role} cannot execute ${capability}.`, { role, capability });
  }
}
