-- Upgrade path from the 0.3.0 schema. Safe to execute more than once.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_quantity_nonnegative') THEN
    ALTER TABLE stock ADD CONSTRAINT stock_quantity_nonnegative CHECK (quantity >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_reserved_nonnegative') THEN
    ALTER TABLE stock ADD CONSTRAINT stock_reserved_nonnegative CHECK (reserved >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_reserved_within_quantity') THEN
    ALTER TABLE stock ADD CONSTRAINT stock_reserved_within_quantity CHECK (reserved <= quantity) NOT VALID;
  END IF;
END $$;

ALTER TABLE stock VALIDATE CONSTRAINT stock_quantity_nonnegative;
ALTER TABLE stock VALIDATE CONSTRAINT stock_reserved_nonnegative;
ALTER TABLE stock VALIDATE CONSTRAINT stock_reserved_within_quantity;

CREATE UNIQUE INDEX IF NOT EXISTS payments_mock_idempotency
ON payments(provider, (payload->>'idempotency_key'))
WHERE payload ? 'idempotency_key';
