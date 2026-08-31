# Users, roles and agents

## Human roles
- platform_owner: manages SaaS tenants/platform policies.
- company_admin: company configuration, users, integrations.
- warehouse: receipts, stock, transfers, picking.
- sales: customers, quotes, orders, returns.
- marketing: campaigns and content approvals.
- accountant: tax documents, accounting exports, reconciliation.
- customer: storefront, orders, invoices/receipts, profile.
- ai_operator: executes/reviews agent proposals.
- auditor: read-only audit and traceability.

Production must enforce permissions at API/service and row/tenant level, not only in UI.

## AI agents included
1. Brand Agent — corporate identity, tone, creative briefs.
2. Catalog Agent — product onboarding, normalization, taxonomy, SEO, quality checks.
3. CRM Agent — segmentation and next-best-action with consent enforcement.
4. Partnerships Agent — suppliers/B2B/API opportunities and integration checklists.
5. Marketing Agent — campaigns, audience, content, experiments and KPI proposals.

Default governance: agents propose; humans approve write/publish/send actions. Every run is persisted in agent_runs and generates an outbox event.
