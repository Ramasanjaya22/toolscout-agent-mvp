import { motion } from 'framer-motion';
import { Bot, Cable, History, Play, RotateCcw, Wallet } from 'lucide-react';
import { useToolScoutStore } from './stores/useToolScoutStore';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';

export default function App() {
  const { objective, budget, runState, error, report, runHistory, historyState, stats, modelConfig, modelTest, setObjective, setBudget, runAgent, resetRun, loadDashboardData, testModelConnection, loadRunDetail } = useToolScoutStore();

  return (
    <main className="min-h-screen bg-stone-50 text-black">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-black/50">ToolScout Agent</p>
            <h1 className="text-3xl font-semibold">Autonomous AI Service Procurement</h1>
          </div>
          <Bot className="h-9 w-9 text-violet-600" />
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <label className="mb-2 block text-xs uppercase tracking-wide text-black/50">Objective</label>
            <textarea value={objective} onChange={(e) => setObjective(e.target.value)} className="h-24 w-full rounded-xl border border-black/15 bg-stone-50 p-3 text-sm" placeholder="Find AI services for supply chain demand forecasting" />
            <label className="mb-2 mt-4 block text-xs uppercase tracking-wide text-black/50">Budget (USD)</label>
            <input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="w-full rounded-xl border border-black/15 bg-stone-50 p-3 text-sm" />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={runAgent} disabled={runState === 'running' || !objective.trim()} className="bg-violet-600 text-white hover:bg-violet-700"><Play className="mr-2 inline h-4 w-4" />Run Agent</Button>
              <Button onClick={resetRun}><RotateCcw className="mr-2 inline h-4 w-4" />Reset</Button>
              <Button onClick={loadDashboardData}><History className="mr-2 inline h-4 w-4" />Sync DB</Button>
            </div>
          </Card>

          <Card className="md:col-span-2">
            <p className="text-xs uppercase tracking-wide text-black/50">Workflow Status</p>
            <p className="mt-1 text-lg font-medium capitalize">{runState}</p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
              <Card className="bg-stone-50">Total Runs: {stats?.total_runs ?? '-'}</Card>
              <Card className="bg-stone-50">Completed: {stats?.completed_runs ?? '-'}</Card>
              <Card className="bg-stone-50">Avg Budget: {stats?.avg_budget ?? '-'}</Card>
            </div>

            <Card className="mt-4 bg-stone-50">
              <h3 className="font-medium"><Cable className="mr-2 inline h-4 w-4" />Bring Your Key Model</h3>
              <p className="mt-1 text-xs text-black/60">Provider: {modelConfig?.provider || '-'} · Model: {modelConfig?.model || '-'}</p>
              <p className="text-xs text-black/60">Key: {modelConfig?.keyPreview || 'Not configured'}</p>
              <Button className="mt-2" onClick={testModelConnection}>Test API Connection</Button>
              {modelTest && <p className="mt-2 text-xs">Status: {modelTest.connected ? 'Connected' : 'Not connected'} {modelTest.error ? `· ${modelTest.error}` : ''}</p>}
            </Card>

            {report && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
                <Card className="bg-stone-50"><h3 className="font-medium">Top Service Selection</h3><p className="mt-1 text-sm">{report.selected?.serviceId || 'No service selected'} · Weighted score {report.selected?.weightedScore || 'N/A'}</p></Card>
                <Card className="bg-stone-50"><h3 className="font-medium">Discovered Services</h3><p className="mt-1 text-sm">{report.discovered?.length || 0} discovered from mock SAP</p></Card>
                <Card className="bg-stone-50"><h3 className="font-medium">Ranking</h3><ul className="mt-1 text-sm">{report.ranked?.map((r) => <li key={r.serviceId}>{r.serviceId} · {r.weightedScore}</li>)}</ul></Card>
                <Card className="bg-stone-50"><h3 className="font-medium"><Wallet className="mr-2 inline h-4 w-4" />x402 Payment Proof</h3><p className="mt-1 text-sm">{report.payment?.txId || 'No transaction'} · {report.payment?.status || 'unsettled'}</p></Card>
              </motion.div>
            )}

            <Card className="mt-4 bg-stone-50">
              <h3 className="font-medium">Recent Runs (Click to load proof)</h3>
              <p className="mt-1 text-xs text-black/50">Database sync: {historyState}</p>
              <ul className="mt-2 space-y-1 text-sm">
                {runHistory.map((run) => (
                  <li key={run.id}>
                    <button type="button" className="underline decoration-dotted" onClick={() => loadRunDetail(run.id)}>
                      #{run.id} · {run.status} · ${run.budget} · {run.objective}
                    </button>
                  </li>
                ))}
                {!runHistory.length && <li className="text-black/50">No runs loaded.</li>}
              </ul>
            </Card>
          </Card>
        </div>
      </div>
    </main>
  );
}
