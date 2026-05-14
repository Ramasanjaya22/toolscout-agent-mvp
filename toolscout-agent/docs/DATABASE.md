# DATABASE

ToolScout Agent uses SQLite (`better-sqlite3`) with automatic schema setup on backend boot.

## Engine
- File path: `DB_PATH` env var (defaults to `./toolscout.db`)
- Pragmas:
  - `journal_mode=WAL`
  - `foreign_keys=ON`
  - `synchronous=NORMAL`

## Tables

### `agent_runs`
Stores the top-level result of each autonomous run.

Columns:
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `objective` TEXT NOT NULL
- `budget` REAL NOT NULL CHECK (`budget >= 0`)
- `status` TEXT NOT NULL (`completed` / `no_match`)
- `report_json` TEXT NOT NULL (full structured report)
- `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP

Indexes:
- `idx_agent_runs_created_at`
- `idx_agent_runs_status`

### `service_evaluations`
Stores per-service Ace evaluation outputs for each run.

Columns:
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `run_id` INTEGER NOT NULL → `agent_runs.id` (ON DELETE CASCADE)
- `service_id` TEXT NOT NULL
- `provider` TEXT NOT NULL
- `score` REAL NOT NULL
- `estimated_cost` REAL NOT NULL
- `notes` TEXT
- `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP

Index:
- `idx_service_evaluations_run_id`

### `payment_proofs`
Stores x402 settlement proofs for selected services.

Columns:
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `run_id` INTEGER NOT NULL → `agent_runs.id` (ON DELETE CASCADE)
- `tx_id` TEXT NOT NULL
- `amount` REAL NOT NULL
- `network` TEXT NOT NULL
- `status` TEXT NOT NULL
- `proof_json` TEXT NOT NULL
- `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP

Index:
- `idx_payment_proofs_run_id`

## Data Access Helpers (`server/db.js`)
- `saveRun({ objective, budget, status, report })`
- `saveEvaluations(runId, evaluations)`
- `savePaymentProof(runId, proof)`
- `listRuns(limit = 20)` (clamped `1..100`)
- `getRunById(id)` (includes joined evaluations + payment proofs)
- `getRunStats()` (aggregated totals and average budget)

This setup keeps the MVP mock-first while being ready for future migration to real adapters.
