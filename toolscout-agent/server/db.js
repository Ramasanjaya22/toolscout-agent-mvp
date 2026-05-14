import Database from 'better-sqlite3';

const dbPath = process.env.DB_PATH || './toolscout.db';
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS agent_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    objective TEXT NOT NULL,
    budget REAL NOT NULL CHECK (budget >= 0),
    status TEXT NOT NULL,
    report_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS service_evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER NOT NULL,
    service_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    score REAL NOT NULL,
    estimated_cost REAL NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(run_id) REFERENCES agent_runs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS payment_proofs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER NOT NULL,
    tx_id TEXT NOT NULL,
    amount REAL NOT NULL,
    network TEXT NOT NULL,
    status TEXT NOT NULL,
    proof_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(run_id) REFERENCES agent_runs(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_agent_runs_created_at ON agent_runs(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status);
  CREATE INDEX IF NOT EXISTS idx_service_evaluations_run_id ON service_evaluations(run_id);
  CREATE INDEX IF NOT EXISTS idx_payment_proofs_run_id ON payment_proofs(run_id);
`);

const insertRunStmt = db.prepare(`INSERT INTO agent_runs (objective, budget, status, report_json) VALUES (?, ?, ?, ?)`);
const updateRunStmt = db.prepare(`UPDATE agent_runs SET status = ?, report_json = ? WHERE id = ?`);
const insertEvaluationStmt = db.prepare(`INSERT INTO service_evaluations (run_id, service_id, provider, score, estimated_cost, notes) VALUES (?, ?, ?, ?, ?, ?)`);
const insertPaymentProofStmt = db.prepare(`INSERT INTO payment_proofs (run_id, tx_id, amount, network, status, proof_json) VALUES (?, ?, ?, ?, ?, ?)`);
const listRunsStmt = db.prepare('SELECT * FROM agent_runs ORDER BY id DESC LIMIT ?');
const getRunStmt = db.prepare('SELECT * FROM agent_runs WHERE id = ?');
const listEvaluationsForRunStmt = db.prepare('SELECT * FROM service_evaluations WHERE run_id = ? ORDER BY id ASC');
const listPaymentsForRunStmt = db.prepare('SELECT * FROM payment_proofs WHERE run_id = ? ORDER BY id ASC');
const runStatsStmt = db.prepare(`
  SELECT
    COUNT(*) AS total_runs,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_runs,
    SUM(CASE WHEN status = 'no_match' THEN 1 ELSE 0 END) AS no_match_runs,
    ROUND(AVG(budget), 2) AS avg_budget
  FROM agent_runs
`);

export function createRun({ objective, budget }) {
  const res = insertRunStmt.run(objective, budget, 'running', JSON.stringify({ objective, budget, status: 'running' }));
  return res.lastInsertRowid;
}

export function finalizeRun({ runId, status, report }) {
  updateRunStmt.run(status, JSON.stringify(report), runId);
}

export function saveEvaluations(runId, evaluations) {
  const tx = db.transaction((rows) => rows.forEach((r) => insertEvaluationStmt.run(runId, r.serviceId, r.provider, r.score, r.estimatedCost, r.notes || '')));
  tx(evaluations);
}

export function savePaymentProof(runId, proof) {
  insertPaymentProofStmt.run(runId, proof.txId, proof.amount, proof.network, proof.status, JSON.stringify(proof));
}

export function listRuns(limit = 20) {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(100, Number(limit))) : 20;
  return listRunsStmt.all(safeLimit).map((r) => ({ ...r, report_json: JSON.parse(r.report_json) }));
}

export function getRunById(id) {
  const safeId = Number(id);
  if (!Number.isInteger(safeId) || safeId <= 0) return null;

  const run = getRunStmt.get(safeId);
  if (!run) return null;

  return {
    ...run,
    report_json: JSON.parse(run.report_json),
    evaluations: listEvaluationsForRunStmt.all(safeId),
    payment_proofs: listPaymentsForRunStmt.all(safeId)
  };
}

export function getRunStats() {
  return runStatsStmt.get();
}
