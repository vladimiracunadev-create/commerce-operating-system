import type { OperationContext } from './context.js';

export type JsonRecord = Record<string, unknown>;

export interface CommerceRepository {
  close(): Promise<void>;
  ready(): Promise<boolean>;
  users(context: OperationContext): Promise<JsonRecord[]>;
  state(context: OperationContext): Promise<JsonRecord>;
  reset(context: OperationContext): Promise<void>;
  createProduct(context: OperationContext, input: JsonRecord): Promise<JsonRecord>;
  receiveStock(context: OperationContext, productId: string, quantity: number): Promise<JsonRecord>;
  createCustomer(context: OperationContext, input: JsonRecord): Promise<JsonRecord>;
  createOrder(context: OperationContext, input: JsonRecord): Promise<JsonRecord>;
  payOrder(context: OperationContext, orderId: string, idempotencyKey: string): Promise<JsonRecord>;
  cancelOrder(context: OperationContext, orderId: string, reason: string): Promise<JsonRecord>;
  expireReservations(context: OperationContext, olderThanMinutes: number): Promise<JsonRecord>;
  issueTaxDocument(context: OperationContext, orderId: string): Promise<JsonRecord>;
  saveAgentRun(context: OperationContext, agent: string, input: JsonRecord, output: JsonRecord): Promise<void>;
}
