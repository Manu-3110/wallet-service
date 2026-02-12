CREATE EXTENSION IF NOT EXISTS pgcrypto;
BEGIN;

-- =========================
-- ENUMS
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ledger_entry_type') THEN
    CREATE TYPE ledger_entry_type AS ENUM ('CREDIT', 'DEBIT');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_status') THEN
    CREATE TYPE asset_status AS ENUM ('ACTIVE', 'INACTIVE');
  END IF;
END $$;

-- =========================
-- USERS
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- ASSET TYPES
-- =========================
CREATE TABLE IF NOT EXISTS assets (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  status asset_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- WALLETS
-- =========================
CREATE TABLE IF NOT EXISTS wallets (
  id BIGSERIAL PRIMARY KEY,

  user_id BIGINT NULL,
  asset_type_id BIGINT NOT NULL,

  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  balance INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_wallet_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_wallet_asset
    FOREIGN KEY (asset_type_id)
    REFERENCES assets(id),

  CONSTRAINT wallet_user_or_system_check
    CHECK (
      (is_system = TRUE AND user_id IS NULL)
      OR
      (is_system = FALSE AND user_id IS NOT NULL)
    ),

  CONSTRAINT wallet_balance_non_negative_user_only
    CHECK (is_system = TRUE OR balance >= 0)
);

-- =========================
-- LEDGER ENTRIES
-- =========================
CREATE TABLE IF NOT EXISTS ledger_entries (
  id BIGSERIAL PRIMARY KEY,

  wallet_id BIGINT NOT NULL,
  uuid UUID NOT NULL,
  amount INTEGER NOT NULL,
  type ledger_entry_type NOT NULL,

  source_type VARCHAR(50) NOT NULL,
  reference_id VARCHAR(100) NOT NULL,

  request_key VARCHAR(100) NOT NULL,
  metadata TEXT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_ledger_wallet
    FOREIGN KEY (wallet_id)
    REFERENCES wallets(id)
    ON DELETE CASCADE,

  CONSTRAINT uniq_wallet_idempotency
    UNIQUE (wallet_id, request_key),

  CONSTRAINT ledger_amount_positive_check
    CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_ledger_uuid ON ledger_entries(uuid);

-- -------------------------
-- Uniques (as constraints)
-- -------------------------

CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_asset_wallet
ON wallets (user_id, asset_type_id)
WHERE is_system = FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_system_asset_wallet
ON wallets (asset_type_id)
WHERE is_system = TRUE;

COMMIT;