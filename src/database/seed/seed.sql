BEGIN;

INSERT INTO assets (name, description, status, created_at)
VALUES
  ('Gold Coins', 'In-app gold currency','ACTIVE', NOW()),
  ('Diamonds', 'Premium in-app currency','ACTIVE', NOW()),
  ('Loyalty Points', 'Reward points for user engagement','ACTIVE', NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO wallets (user_id, asset_type_id, is_system, balance, created_at)
SELECT NULL, at.id, TRUE, 0, NOW()
FROM assets at
WHERE NOT EXISTS (
  SELECT 1 FROM wallets w
  WHERE w.asset_type_id = at.id AND w.is_system = TRUE
);

INSERT INTO users (name, email, created_at)
VALUES
  ('Alice', 'alice@example.com', NOW()),
  ('Bob',   'bob@example.com',   NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO wallets (user_id, asset_type_id, is_system, balance, created_at)
SELECT u.id, at.id, FALSE, 0, NOW()
FROM users u
CROSS JOIN assets at
WHERE u.email IN ('alice@example.com', 'bob@example.com')
AND NOT EXISTS (
  SELECT 1
  FROM wallets w
  WHERE w.user_id = u.id
    AND w.asset_type_id = at.id
    AND w.is_system = FALSE
);

UPDATE wallets w
SET balance = v.balance
FROM (
  SELECT u.id AS user_id, at.id AS asset_type_id,
         CASE
           WHEN u.email = 'alice@example.com' AND at.name = 'Gold Coins'        THEN 1000
           WHEN u.email = 'alice@example.com' AND at.name = 'Diamonds'         THEN 50
           WHEN u.email = 'alice@example.com' AND at.name = 'Loyalty Points'   THEN 200
           WHEN u.email = 'bob@example.com'   AND at.name = 'Gold Coins'        THEN 500
           WHEN u.email = 'bob@example.com'   AND at.name = 'Diamonds'          THEN 20
           WHEN u.email = 'bob@example.com'   AND at.name = 'Loyalty Points'    THEN 100
           ELSE 0
         END AS balance
  FROM users u
  CROSS JOIN assets at
  WHERE u.email IN ('alice@example.com', 'bob@example.com')
) v
WHERE w.user_id = v.user_id
  AND w.asset_type_id = v.asset_type_id
  AND w.is_system = FALSE;

INSERT INTO ledger_entries (
  wallet_id, uuid, amount, type, source_type, reference_id, request_key, metadata, created_at
)
SELECT
  w.id,
  gen_random_uuid(),
  v.balance,
  'CREDIT'::ledger_entry_type,
  'BONUS',
  CONCAT('BONUS_', u.email, '_', at.name),
  CONCAT('BONUS_', u.email, '_', at.id),
  'Initial wallet balance from system migration' AS metadata,
  NOW()
FROM wallets w
JOIN users u ON u.id = w.user_id
JOIN assets at ON at.id = w.asset_type_id
JOIN (
  SELECT u2.id AS user_id, at2.id AS asset_type_id,
         CASE
           WHEN u2.email = 'alice@example.com' AND at2.name = 'Gold Coins'        THEN 1000
           WHEN u2.email = 'alice@example.com' AND at2.name = 'Diamonds'         THEN 50
           WHEN u2.email = 'alice@example.com' AND at2.name = 'Loyalty Points'   THEN 200
           WHEN u2.email = 'bob@example.com'   AND at2.name = 'Gold Coins'        THEN 500
           WHEN u2.email = 'bob@example.com'   AND at2.name = 'Diamonds'          THEN 20
           WHEN u2.email = 'bob@example.com'   AND at2.name = 'Loyalty Points'    THEN 100
           ELSE 0
         END AS balance
  FROM users u2
  CROSS JOIN assets at2
  WHERE u2.email IN ('alice@example.com', 'bob@example.com')
) v ON v.user_id = w.user_id AND v.asset_type_id = w.asset_type_id
WHERE w.is_system = FALSE
  AND v.balance > 0
  AND NOT EXISTS (
    SELECT 1
    FROM ledger_entries le
    WHERE le.wallet_id = w.id
      AND le.request_key = CONCAT('BONUS_', u.email, '_', at.id)
  );

COMMIT;


