# Wallet Service — Ledger-Based Virtual Asset System

This project implements a **high-integrity wallet service** for a closed-loop virtual asset platform (gaming coins / loyalty points style).
It supports wallet **top-up**, **bonus**, and **spend** flows with:

- ACID database transactions
- Double-entry ledger accounting
- Idempotent transaction handling
- Concurrency and race-condition safety
- Deterministic locking to reduce deadlocks
- Full auditability via immutable ledger rows

The design prioritizes **correctness under load**, **maintainability**, and **clear audit trails**.

---

# Features

- Multiple asset types (Gold Coins, Diamonds, Loyalty Points)
- One wallet per user per asset
- One system (treasury) wallet per asset
- Double-entry ledger per transaction
- Idempotent writes using idempotency keys
- Concurrency-safe balance updates
- UUID grouping for paired ledger entries
- Swagger API documentation
- DTO validation with strict whitelisting

---

# Tech Stack (and Why)

## NestJS (Node.js)

- Modular architecture (users / assets / wallets / transactions)
- Strong DI + testable services
- Excellent Swagger + validation integration
- Good fit for scalable service structure

## PostgreSQL

- Strong ACID guarantees
- Row-level locking support
- Check constraints + partial indexes
- Reliable for financial-style correctness

## Sequelize (sequelize-typescript)

- Clean model definitions
- Transaction + lock support
- Works well with NestJS injection model

## Ledger + Balance Hybrid Model

- Ledger = audit source of truth
- Balance column = fast read optimization
- All balance updates remain transactional and guarded

---

## Project Structure (Modules)

The codebase is split into dedicated NestJS modules for maintainability and separation of concerns:

- **UsersModule** — user creation and lookup
- **AssetsModule** — asset type creation and listing
- **WalletModule** — wallet and ledger domain logic, internally split into:
  - `read/` — wallet balance reads and ledger query APIs
  - `write/` — transactional flows (top-up, bonus, spend) with ACID + ledger entries

---

# How to Spin Up the Database and Run the Seed Script

This project includes:

- Dockerfile for API
- docker-compose.yml for API + PostgreSQL
- Auto schema + seed execution on DB startup

## Step 1 — Start Everything

```bash
docker compose up --build
```

This will:

- build NestJS app image
- start PostgreSQL container
- create database
- run schema migrations automatically
- run seed data automatically
- start API server

---

## Step 2 — Access Service

API:

```
http://localhost:3000
```

Swagger:

```
http://localhost:3000/api/docs
```

Postgres exposed at:

```
localhost:5433
```

---

## 🗄️ Database Initialization in Docker

These files are auto-executed on container startup:

- 001_init_schema.sql
- 002_indexes.sql
- 003_seed.sql

Mounted into:

```
/docker-entrypoint-initdb.d/
```

So no manual seed command is required when using Docker.

---

## Step 3 — Seed Data Created

The seed section inserts:

### Asset Types

- Gold Coins
- Diamonds
- Loyalty Points

### Users

- Alice
- Bob

### Wallets

- One system wallet per asset
- One wallet per user per asset

### Initial Balances

- Alice and Bob funded with sample balances
- Matching initial Bonus ledger entries written
- Each Initial Bonus ledger row has a generated UUID

---

## Step 4 — Start Application

```bash
npm install
npm run start
```

Service runs at:

```
http://localhost:3000
```

Swagger docs:

```
http://localhost:3000/api/docs
```

---

## Step 5 — View Tables Using pgAdmin (Optional but Recommended)

If you want to visually inspect tables, constraints, and seed data, use **pgAdmin** (or any PostgreSQL GUI like **TablePlus** / **DBeaver**).

### 1) Install pgAdmin

Download and install pgAdmin for your OS.

### 2) Create a new server connection

In pgAdmin:

- Right click **Servers** → **Register** → **Server...**

**General**

- **Name**: `wallet_db_local`

**Connection**

- **Host name/address**: `localhost`
- **Port**: `5433`
- **Maintenance database**: `wallet_db`
- **Username**: `wallet_user`
- **Password**: `wallet_pass`

Click **Save**.

### 3) Browse tables

Navigate to:

- **Servers → wallet_db_local → Databases → wallet_db → Schemas → public → Tables**

You should see:

- `users`
- `assets`
- `wallets`
- `ledger_entries`

### 4) View data

Right click any table → **View/Edit Data → All Rows**  
This lets you confirm seed rows exist and ledger entries are being written.

---

# 📊 Data Models (Entity Schema)

The system architecture relies on four core entities to ensure **ACID correctness**, **auditability**, and **concurrency safety**.  
Below is a structured summary of the critical fields for each model.

These models map directly to the database tables created by the migration scripts.

---

## 1️⃣ User Entity (`users`)

Represents the platform account holder.

**Key Fields**

- `id` — Primary Key (BIGINT, auto-increment)
- `name` — User display name
- `email` — Unique identifier (unique constraint enforced)
- `created_at` — Creation timestamp

**Purpose**

- Root identity for wallet ownership
- One user can own multiple wallets (one per asset type)

---

## 2️⃣ Asset Entity (`asset_types`)

Defines the virtual currencies supported by the platform (e.g., Gold Coins, Diamonds).

**Key Fields**

- `id` — Primary Key (BIGINT)
- `name` — Unique asset name
- `description` — Optional description
- `status` — ENUM (`ACTIVE`, `INACTIVE`)
- `created_at` — Creation timestamp

**Purpose**

- Defines allowed asset classes
- `status` acts as a global transaction enable/disable switch
- Prevents transactions on inactive assets

---

## 3️⃣ Wallet Entity (`wallets`)

The bridge between **Users** and **Assets**.  
This is the table where **row-level locks** are applied during transactions.

**Key Fields**

- `id` — Primary Key (BIGINT)
- `user_id` — FK → users.id (nullable for system wallets)
- `asset_type_id` — FK → asset_types.id
- `is_system` — Boolean flag (true = treasury/system wallet)
- `balance` — Integer running balance
- `created_at` — Creation timestamp

**Constraints**

- One wallet per (user, asset)
- One system wallet per asset
- DB CHECK constraint prevents negative balance for user wallets

**Purpose**

- Fast balance reads (O(1))
- Lock target for concurrency control
- Ownership container for ledger entries

---

## 4️⃣ Ledger Entry Entity (`ledger_entries`)

The **immutable audit source of truth**.  
Every transaction generates a **double-entry pair** (user + system).

**Key Fields**

- `id` — Primary Key (BIGINT)
- `wallet_id` — FK → wallets.id
- `uuid` — Transaction group ID (shared across entry pair)
- `amount` — Transaction magnitude (> 0 enforced)
- `type` — ENUM (`CREDIT`, `DEBIT`)
- `request_key` — Idempotency key
- `source_type` — Action category (TOP_UP / BONUS / SPEND)
- `reference_id` — External reference (payment/order id)
- `metadata` — Optional context payload
- `created_at` — Timestamp

**Indexes & Constraints**

- Unique composite index: `(wallet_id, request_key)`
- Prevents duplicate writes at DB level
- Amount must be positive
- Immutable rows (never updated — only inserted)

---

# API Overview

Link: http://localhost:3000/api/docs

## Assets

- POST /assets (Basic Auth) — create asset
- GET /assets — list active assets
- GET /assets/:id — get asset

## Users

- POST /users — create user
- GET /users?userId= or ?email= — fetch user

## Wallet Read APIs

- GET /wallets/:userId/balance
- GET /wallets/:userId/ledger

## Transactions

- POST /wallets/transactions/topup
- POST /wallets/transactions/bonus
- POST /wallets/transactions/spend

All transaction endpoints are:

- ACID
- idempotent
- concurrency safe

---

# Functional Logic Coverage (Assignment Requirements)

## Wallet Top-up (Purchase)

User receives credits from system wallet.
Creates double-entry ledger rows and updates balances atomically.

## Bonus / Incentive

System credits free assets to user.
Same transactional + ledger flow as top-up.

## Spend / Purchase

User spends credits.
Balance guarded and cannot go negative.

---

# Concurrency Strategy (Critical Requirement)

Concurrency correctness is enforced at **database level**, not in memory.

## What Concurrency Bugs This Prevents

This design prevents:

- Lost updates — two concurrent spends cannot overwrite each other
- Double spends — guarded debit update + row locks prevent overdraft
- Split-brain balance — ledger and balance always update together
- Duplicate credits — idempotency + unique constraints prevent replay effects

---

## ACID Transactions

Every transaction flow runs inside a DB transaction:

- ledger writes + balance updates commit together
- failures roll back completely

---

## Row-Level Locks

Wallet rows are loaded with pessimistic locks:

```sql
SELECT … FOR UPDATE
```

This prevents concurrent transactions from modifying the same wallet rows simultaneously.

Both:

- user wallet
- system wallet

are locked inside the same transaction.

---

## Atomic Balance Updates

Balances are updated using SQL expressions:

```sql
balance = balance + amt
balance = balance - amt
```

Never read-modify-write in application memory.

---

## Non-Negative Enforcement

User wallets cannot go negative.

### DB constraint

```sql
CHECK (is_system = TRUE OR balance >= 0)
```

### Guarded debit update

```sql
UPDATE ... WHERE balance >= amt
```

Even under race conditions, overdraft cannot occur.

---

## Deterministic Lock Scope

Only two rows are locked per transaction:

- user wallet row
- system wallet row

Locks are always acquired in the same logical order:

```
system wallet → user wallet
```

This keeps lock scope minimal and reduces deadlock risk.

---

## Deadlock & Serialization Retry (High-Load Safety)

Transactions are automatically retried when PostgreSQL reports:

- deadlock_detected (40P01)
- serialization_failure (40001)

A bounded retry wrapper with small backoff is used.
Because all writes are idempotent, retries are safe and cannot double-apply effects.

---

# Idempotency Strategy

Each write request requires:

```
request_key
```

## Enforcement Layers

### Database

```sql
UNIQUE(wallet_id, request_key)
```

### Application

- pre-check for existing ledger entry
- if found → return existing result

### Race-safe fallback

If two identical requests race:

- one insert succeeds
- second hits unique constraint
- service catches error and returns committed result

This guarantees **exactly-once effect**.

---

# Ledger-Based Double Entry (Brownie Point)

Each transaction writes two rows:

| Wallet | Entry           |
| ------ | --------------- |
| User   | CREDIT or DEBIT |
| System | opposite type   |

Both rows share:

- same uuid
- same request_key
- same reference fields

Benefits:

- full audit trail
- easy reconciliation
- financial-style correctness
- debug traceability

---

# UUID Grouping

Each transaction generates:

```
uuid = randomUUID()
```

Stored in both ledger rows.

Purpose:

- group paired entries
- trace one logical transfer
- simplify audit queries

---

# System Wallet Model

Each asset has one system wallet acting as the central counterparty for all issuances (Top-ups/Bonuses) and sinks (Spend).

Design Decision:

- System Wallet: Allows a negative balance. It represents the Total Circulating Supply of the asset.

- User Wallets: Strictly non-negative via DB constraints.

Reasoning: This is a Zero-Sum Ledger. We do not assume a pre-funded treasury; instead, the system wallet "mints" the asset. If the system balance is -1000, it is a mathematical guarantee that the sum of all user wallets is exactly +1000. This allows for perfect auditability and reconciliation.

---

# Validation & Input Safety

- DTO validation using class-validator
- Custom global validation pipe
- Whitelist enabled
- Unknown fields rejected
- Query + body validated
- Email normalized via transform

---

# Error Handling

Consistent HTTP exceptions:

- 400 — invalid amount / insufficient balance / duplicate user
- 404 — user / wallet / asset not found
- idempotent replay — returns SUCCESS with existing result

---

# Assignment Brownie Points Covered

- Double-entry ledger architecture
- Idempotent transaction processing
- Concurrency-safe balance updates
- Row-level locking
- Deterministic lock ordering
- UUID grouping for transfers
- DB-level integrity constraints

---

# Future Improvements

- Redis idempotency cache
- Auth + CSRF layer
- Snapshot tables for ledger rollups

---

# Authentication & Authorization Note

For simplicity and focus on transactional correctness, concurrency control, and ledger integrity, this assignment implementation does **not** enable authentication and authorization guards by default.

However, the service is structured to support standard NestJS guards easily.

## Transaction APIs (Top-up / Bonus / Spend / Wallet Reads)

All wallet and transaction endpoints should be protected using:

- JWT authentication
- User-scoped authorization
- Request identity bound to authenticated user_id

Example:

- Apply `JwtAuthGuard` to all `/wallets/*` and transaction routes
- Derive `user_id` from JWT claims instead of request body

---

## Asset Creation APIs (Admin Only)

Asset creation and configuration endpoints should be restricted to administrators using:

- Basic Auth or Admin JWT roles
- Role-based guard (e.g., `RolesGuard`)
- Admin-only route protection

Example:

- `POST /assets` protected by Basic Auth or Admin JWT role
- Only treasury/admin users allowed to define asset types

---

## Why Not Enabled Here

Authentication is intentionally omitted in this submission to keep the focus on:

- ACID transaction correctness
- Concurrency safety
- Idempotent processing
- Ledger-based accounting design

Security guards can be added without changing the transaction or ledger architecture.

---

# Summary

This wallet service is designed for:

- correctness under concurrency
- auditability
- idempotent writes
- scalable structure
- maintainable modular code

---
