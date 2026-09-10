import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { CommerceService } from '../application/commerce-service.js';
import { createDemoContext } from '../application/context.js';
import type { JsonRecord } from '../application/ports.js';

type ApiRequest = FastifyRequest<{ Params: { id?: string; agent?: string }; Body: JsonRecord }>;

function context(request: FastifyRequest, reply: FastifyReply) {
  const operation = createDemoContext(request.headers);
  request.headers['x-correlation-id'] = operation.correlationId;
  reply.header('x-correlation-id', operation.correlationId);
  return operation;
}

export async function registerRoutes(app: FastifyInstance, service: CommerceService) {
  app.get('/health', async () => service.health());
  app.get('/ready', async (_request, reply) => (await service.ready()) ? { ok: true, database: 'ready' } : reply.code(503).send({ ok: false, database: 'unavailable' }));
  app.get('/api/demo/users', async (request, reply) => service.users(context(request, reply)));
  app.get('/api/demo/state', async (request, reply) => service.state(context(request, reply)));
  app.post('/api/demo/reset', async (request, reply) => service.reset(context(request, reply)));
  app.post('/api/products', async (request, reply) => reply.code(201).send(await service.product(context(request, reply), request.body as JsonRecord)));
  app.post('/api/stock/receive', async (request, reply) => service.stock(context(request, reply), request.body as JsonRecord));
  app.post('/api/customers', async (request, reply) => reply.code(201).send(await service.customer(context(request, reply), request.body as JsonRecord)));
  app.post('/api/orders', async (request, reply) => reply.code(201).send(await service.order(context(request, reply), request.body as JsonRecord)));
  app.post('/api/orders/:id/pay/mock', async (request: ApiRequest, reply) => service.pay(context(request, reply), request.params.id));
  app.post('/api/orders/:id/tax-document/mock', async (request: ApiRequest, reply) => service.tax(context(request, reply), request.params.id));
  app.post('/api/agents/:agent', async (request: ApiRequest, reply) => service.agent(context(request, reply), request.params.agent, request.body as JsonRecord));
  app.get('/api/integrations', async () => service.integrations());
}
