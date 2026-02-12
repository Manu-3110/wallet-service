BEGIN;

-- =========================
-- LEDGER QUERY PERFORMANCE
-- =========================

-- balance/history queries
CREATE INDEX IF NOT EXISTS idx_ledger_wallet_created_at
ON ledger_entries (wallet_id, created_at);

CREATE INDEX IF NOT EXISTS idx_wallets_asset_type_id
ON wallets (asset_type_id);

COMMIT;
