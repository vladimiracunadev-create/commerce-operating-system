# Commerce Operating System

Generic commercial platform skeleton for selling almost any physical/digital product while keeping the business core independent from web/mobile/desktop channels.

## Demo already included
The runnable demo proves one end-to-end slice:

Product creation -> warehouse receipt -> customer -> order + stock reservation -> mock payment -> stock deduction -> mock tax document -> audit/outbox events -> AI agent proposal.

It is intentionally safe: real money, SII emission and social publication are adapter slots, not silently executed.

## Run
```bash
docker compose up --build
```
Open http://localhost:8080

API health: http://localhost:8080/health
Agent health: http://localhost:8100/health

## Optional real LLM endpoint
The agent service accepts an OpenAI-compatible chat-completions endpoint through:
- LLM_BASE_URL
- LLM_API_KEY
- LLM_MODEL

Without those variables, all five agents run in deterministic safe-fallback mode, so the demo remains fully usable offline from an LLM provider.

## Suggested repository name
`commerce-operating-system`

## Product surfaces
- Web storefront/PWA (first channel)
- Admin/backoffice web/PWA
- Desktop wrapper: Tauri over the same admin/API (next surface)
- Mobile: React Native/Flutter/Capacitor client against the same API
- Partner/API channel for B2B and marketplaces

## Why PostgreSQL is separate
The DB is a standalone service and source of truth. The website can be replaced without migrating core business data. External apps access business functions through APIs.

## Production additions
Authentication (OIDC/passkeys/MFA), tenant-level RLS, Redis/worker, real payment adapters, real SII/provider DTE adapter, object storage/CDN, carrier integrations, audit immutability, backup/restore, observability, WAF/rate limiting, CI/CD and security scanning.

See `docs/` for architecture, roles/agents and integration contracts.
