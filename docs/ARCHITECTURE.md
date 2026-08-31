# Architecture

## Principle
Commerce OS is API-first and channel-independent. PostgreSQL is the source of truth; web/PWA, desktop and mobile clients never own business data.

## Bounded modules
1. Identity & RBAC — users, roles, company/tenant, audit.
2. Catalog/PIM — products, variants, prices, media, attributes, categories.
3. Procurement — suppliers, purchase orders, receptions, costs.
4. WMS/Inventory — warehouses, stock, reservations, transfers, picking.
5. CRM — customers, consent, segments, history, service cases.
6. Sales/OMS — carts, quotes, orders, returns, refunds.
7. Payments — adapter contract for Webpay, Mercado Pago, bank transfer and future providers.
8. Tax/Accounting — DTE adapter, sales/purchase ledgers, exports for accountant/ERP.
9. Fulfilment — delivery, pickup, carriers, tracking.
10. Marketing — campaigns, promotions, coupons, attribution, social/merchant connectors.
11. B2B — companies, price lists, credit, partner APIs, marketplace integrations.
12. AI Operations — brand, catalog, CRM, partnerships and marketing agents with approval gates.
13. Integration Hub — credentials, webhooks, retries, idempotency and provider-specific adapters.
14. Observability/Audit — outbox events, agent runs, integration logs and immutable audit trail (production extension).

## Core flow
Supplier/Manual Import -> Product/PIM -> Warehouse Receipt -> Available Stock -> Storefront/Quote -> Cart/Order -> Stock Reservation -> Payment Provider -> Paid Order -> Pick/Pack/Ship -> Tax Document -> Accounting Export -> CRM -> Marketing/Retention.

## Data independence
- Dedicated PostgreSQL service; no business tables embedded in a web framework.
- Migrations versioned separately.
- API contracts are the only supported channel access path.
- Outbox events decouple side effects and external connectors.
- Object storage should hold product media/documents in production; database keeps metadata and hashes.

## Scaling path (no timeline)
- Stage A: modular monolith + PostgreSQL + PWA + mock adapters.
- Stage B: real payments, carrier and DTE provider; background workers/Redis.
- Stage C: mobile/desktop clients, marketing connectors and real AI provider.
- Stage D: split heavy modules into services only when load/ownership requires it; add analytics warehouse/search.
- Stage E: multi-company SaaS, marketplace/B2B, partner SDK, regional tax/payment adapters.
