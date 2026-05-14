import { Database } from "bun:sqlite";
import { randomUUID } from "node:crypto";

const PORT = 8787;
const DB_PATH = "data/toolscout.sqlite";
const DEFAULT_BUDGET = 100;

const db = new Database(DB_PATH, { create: true });
db.exec(`
CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  budget REAL NOT NULL,
  status TEXT NOT NULL,
  score REAL NOT NULL,
  summary TEXT NOT NULL,
  discovered_tools TEXT NOT NULL,
  executed_actions TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function mockSapDiscovery(companyName: string) {
  return [
    { id: "sap-supply", name: "SAP Supply Watch", fit: 0.86 },
    { id: "sap-procure", name: "SAP ProcureFlow", fit: 0.79 },
    { id: "sap-risk", name: "SAP Risk Radar", fit: 0.74 }
  ].map((tool) => ({ ...tool, companyName }));
}

function mockAceExecution(discoveredTools: Array<{ id: string; name: string; fit: number }>) {
  return discoveredTools.map((tool) => ({
    toolId: tool.id,
    action: `Executed pilot workflow for ${tool.name}`,
    outcome: "success",
    latencyMs: Math.floor(150 + Math.random() * 300)
  }));
}

function mockX402Payment(budget: number, required: number) {
  return { approved: budget >= required, required, remaining: budget - required };
}

function scoreRun(discoveredCount: number, executedCount: number, budget: number) {
  return Math.min(60, discoveredCount * 20) + Math.min(30, executedCount * 10) + (budget > 500 ? 10 : 7);
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    if (req.method === "GET" && path === "/api/health") {
      return json({ ok: true, service: "toolscout-backend", timestamp: new Date().toISOString() });
    }

    if (req.method === "POST" && path === "/api/runs") {
      let body: any;
      try {
        body = await req.json();
      } catch {
        return json({ error: "invalid_json" }, 400);
      }

      const companyName = String(body?.companyName ?? "").trim();
      const budget = Number(body?.budget ?? DEFAULT_BUDGET);

      if (!companyName) return json({ error: "companyName is required" }, 400);
      if (!Number.isFinite(budget) || budget <= 0) return json({ error: "budget must be a positive number" }, 400);

      const requiredBudget = 250;
      const payment = mockX402Payment(budget, requiredBudget);
      if (!payment.approved) {
        return json({ error: "budget_error", message: "Budget too low for execution", required: payment.required, provided: budget }, 402);
      }

      const runId = randomUUID();
      const discoveredTools = mockSapDiscovery(companyName);
      const executedActions = mockAceExecution(discoveredTools);
      const score = scoreRun(discoveredTools.length, executedActions.length, budget);
      const summary = `Completed run for ${companyName} with ${discoveredTools.length} tools discovered and ${executedActions.length} actions executed.`;
      const createdAt = new Date().toISOString();

      db.query(`INSERT INTO runs (id, company_name, budget, status, score, summary, discovered_tools, executed_actions, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(runId, companyName, budget, "completed", score, summary, JSON.stringify(discoveredTools), JSON.stringify(executedActions), createdAt);

      return json({ runId, status: "completed", companyName, budget, score, summary, discoveredTools, executedActions, createdAt }, 201);
    }

    if (req.method === "GET" && path === "/api/runs") {
      const rows = db.query(`SELECT id, company_name, budget, status, score, summary, created_at FROM runs ORDER BY datetime(created_at) DESC`).all() as any[];
      return json({ runs: rows.map((r) => ({ runId: r.id, companyName: r.company_name, budget: r.budget, status: r.status, score: r.score, summary: r.summary, createdAt: r.created_at })) });
    }

    if (req.method === "GET" && path.startsWith("/api/runs/")) {
      const runId = decodeURIComponent(path.replace("/api/runs/", ""));
      const row = db.query(`SELECT * FROM runs WHERE id = ?`).get(runId) as any;
      if (!row) return json({ error: "run_not_found" }, 404);
      return json({
        runId: row.id,
        companyName: row.company_name,
        budget: row.budget,
        status: row.status,
        score: row.score,
        summary: row.summary,
        discoveredTools: JSON.parse(row.discovered_tools),
        executedActions: JSON.parse(row.executed_actions),
        createdAt: row.created_at
      });
    }

    return json({ error: "not_found" }, 404);
  }
});

console.log(`ToolScout backend listening on http://localhost:${PORT}`);
