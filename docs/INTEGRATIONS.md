# Integration contracts

## PaymentAdapter
- createPayment(order)
- getStatus(externalId)
- refund(payment, amount)
- verifyWebhook(headers, body)
Providers: mock (demo), Transbank Webpay, Mercado Pago, future gateways.

## TaxAdapter
- issue(document)
- getStatus(document)
- cancelOrCreditNote(document)
- download(document)
Providers: mock (demo), own SII-certified DTE implementation, market DTE provider.

## MarketingConnector
- syncCatalog(products)
- publishCampaign(campaign) [approval required]
- fetchMetrics(range)
Examples: Meta, Google Merchant, email/SMS provider.

## PartnerAdapter
- importCatalog()
- exportOrder()
- syncInventory()
- webhook(event)

## Production rules
- Secrets in a secret manager, never in database/plain env committed to Git.
- Idempotency keys for payments/order-changing requests.
- Signed webhook verification.
- Retry with backoff + dead-letter queue.
- Provider correlation IDs in logs.
