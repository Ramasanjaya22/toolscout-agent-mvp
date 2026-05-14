import express from 'express';
import { runToolScoutAgent } from './toolscoutAgent.js';
import { getRunById, getRunStats, listRuns } from './db.js';
import { getModelConfig, validateBringYourKey } from './llmClient.js';

const app = express();
const PORT = process.env.PORT || 3001;
const MOCK_MODE = String(process.env.MOCK_MODE || 'true') === 'true';

app.use(express.json());

function validateRunPayload(req, res, next) {
  const { objective, budget } = req.body;
  if (!objective || typeof objective !== 'string' || !objective.trim()) {
    return res.status(400).json({ ok: false, error: 'objective is required' });
  }
  if (!Number.isFinite(Number(budget)) || Number(budget) <= 0) {
    return res.status(400).json({ ok: false, error: 'budget must be a positive number' });
  }
  req.validatedPayload = { objective: objective.trim(), budget: Number(budget) };
  return next();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'toolscout-agent-api', mockMode: MOCK_MODE });
});

app.post('/api/runs', validateRunPayload, async (req, res) => {
  try {
    const result = await runToolScoutAgent({ ...req.validatedPayload, mockMode: MOCK_MODE });
    return res.status(201).json({ ok: true, data: result });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/runs', (req, res) => {
  const { limit } = req.query;
  res.json({ ok: true, data: listRuns(limit) });
});

app.get('/api/runs/stats', (_req, res) => {
  res.json({ ok: true, data: getRunStats() });
});

app.get('/api/runs/:id', (req, res) => {
  const run = getRunById(req.params.id);
  if (!run) return res.status(404).json({ ok: false, error: 'run not found' });
  return res.json({ ok: true, data: run });
});

// Backward compatibility routes
app.post('/api/agent/run', validateRunPayload, async (req, res) => {
  try {
    const result = await runToolScoutAgent({ ...req.validatedPayload, mockMode: MOCK_MODE });
    return res.json({ ok: true, data: result });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});
app.get('/api/agent/runs', (req, res) => res.json({ ok: true, data: listRuns(req.query.limit) }));
app.get('/api/agent/runs/:id', (req, res) => {
  const run = getRunById(req.params.id);
  if (!run) return res.status(404).json({ ok: false, error: 'run not found' });
  return res.json({ ok: true, data: run });
});
app.get('/api/agent/stats', (_req, res) => res.json({ ok: true, data: getRunStats() }));
app.get('/api/agent/model/config', (_req, res) => res.json({ ok: true, data: getModelConfig() }));
app.post('/api/agent/model/test', async (_req, res) => res.json({ ok: true, data: await validateBringYourKey() }));

app.listen(PORT, () => {
  console.log(`ToolScout Agent API running on http://localhost:${PORT}`);
});
