import cors from '@fastify/cors';
import staticPlugin from '@fastify/static';
import Fastify from 'fastify';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CommerceService } from './application/commerce-service.js';
import { DomainError, toProblemDetails } from './domain/errors.js';
import { registerRoutes } from './http/routes.js';
import { PostgresCommerceRepository } from './infrastructure/postgres-commerce-repository.js';

export async function buildApp() {
  const app = Fastify({ logger: true });
  const repository = new PostgresCommerceRepository();
  const service = new CommerceService(repository);
  const directory = path.dirname(fileURLToPath(import.meta.url));
  const webRoot = process.env.WEB_ROOT || path.resolve(directory, '../../web');
  await app.register(cors, { origin: true });
  await app.register(staticPlugin, { root: webRoot, prefix: '/' });
  await registerRoutes(app, service);
  app.setErrorHandler((error, request, reply) => {
    const correlationId = String(request.headers['x-correlation-id'] || 'unavailable');
    const problem = toProblemDetails(error, request.url, correlationId);
    if (problem.status >= 500) request.log.error({ err: error, correlation_id: correlationId }, 'request failed');
    return reply.code(problem.status).type('application/problem+json').send(problem);
  });
  app.setNotFoundHandler((request, reply) => {
    if (!request.raw.url?.startsWith('/api/')) return reply.sendFile('index.html');
    const correlationId = String(request.headers['x-correlation-id'] || 'unavailable');
    return reply.code(404).type('application/problem+json').send(toProblemDetails(
      new DomainError('not_found', 404, 'Resource not found.'), request.url, correlationId,
    ));
  });
  app.addHook('onClose', async () => repository.close());
  return app;
}
