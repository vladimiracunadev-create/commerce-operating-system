import { DomainError } from './errors.js';

export function requiredText(value: unknown, field: string) {
  const clean = String(value ?? '').trim();
  if (!clean) throw new DomainError('validation_error', 400, `${field} is required`, { field });
  return clean;
}

export function positiveInteger(value: unknown, field: string) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new DomainError('validation_error', 400, `${field} must be a positive integer`, { field });
  }
  return number;
}

export function emailAddress(value: unknown) {
  const email = requiredText(value, 'email').toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new DomainError('invalid_email', 400, 'email must be valid');
  return email;
}
