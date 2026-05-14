import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Bot, Database, Play, RotateCcw } from 'lucide-react';
import { useToolScoutStore } from './stores/useToolScoutStore';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';

export default function App() {
  const {
    companyName,
    budget,
    runState,
    error,
    health,
    latestRun,
    selectedRunDetail,
    runHistory,
    historyState,
    setCompanyName,
    setBudget,
    runAgent,
    resetRun,
    loadDashboardData,
    checkHealth,
    loadRunDetail
  } = useToolScoutStore();

  useEffect(() => {
    checkHealth();
    loadDashboardData();
  }, [checkHealth, loadDashboardData]);

  const run = selectedRunDetail || latestRun;
  const report = run?.report_json || run;

  return (
    <main className="min-h-screen bg-stone-50 text-black">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-black/50">ToolScout Agent MVP</p>
            <h1 className="text-3xl font-semibold">Frontend Dashboard</h1>
          </div>
          <Bot className="h-9 w-9 text-violet-600" />
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <label className="mb-2 block text-xs uppercase tracking-wide text-black/50">Company Name</label>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full rounded-xl border border-black/15 bg-stone-50 p-3 text-sm" placeholder="Acme Manufacturing" />
            <label className="mb-2 mt-4 block text-xs uppercase tracking-wide text-black/50">Budget (USD)</label>
            <input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="w-full rounded-xl border border-black/15 bg-stone-50 p-3 text-sm" />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={runAgent} disabled={runState === 'running' || !companyName.trim()} className="bg-violet-600 text-white hover:bg-violet-700"><Play className="mr-2 inline h-4 w-4" />Run</Button>
              <Button onClick={resetRun}><RotateCcw className="mr-2 inline h-4 w-4" />Reset</Button>
              <Button onClick={loadDashboardData}><Database className="mr-2 inline h-4 w-4" />Refresh</Button>
            </div>
          </Card>

          <Card className="md:col-span-2 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-black/50">Backend Health</p>
              <p className="mt-1 text-sm"><Activity className="mr-1 inline h-4 w-4" />{health?.ok ? 'Online' : 'Offline'} {health?.timestamp ? `· ${new Date(health.timestamp).toLocaleString()}` : ''}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-black/50">Workflow Status</p>
              <p className="mt-1 text-lg font-medium capitalize">{runState}</p>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>

            {report && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <Card className="bg-stone-50">
                  <h3 className="font-medium">Run Result</h3>
                  <p className="mt-1 text-sm">Run ID: {run?.id || report.runId}</p>
                  <p className="text-sm">Objective: {report.objective} · Budget: ${report.budget}</p>
                  <p className="text-sm">Status: {report.status} {report.selected?.weightedScore ? `· Top Score: ${report.selected.weightedScore}` : ''}</p>
                  <p className="mt-1 text-sm">{report.selected ? `Selected ${report.selected.serviceId} from ${report.selected.provider}.` : 'No affordable match selected.'}</p>
                </Card>
                <Card className="bg-stone-50">
                  <h3 className="font-medium">Discovered Tools</h3>
                  <ul className="mt-1 text-sm list-disc pl-5">
                    {(report.discovered || []).map((tool) => <li key={tool.serviceId}>{tool.provider} / {tool.serviceId} · ${tool.estimatedCost}</li>)}
                  </ul>
                </Card>
                <Card className="bg-stone-50">
                  <h3 className="font-medium">Executed Actions</h3>
                  <ul className="mt-1 text-sm list-disc pl-5">
                    {(report.evaluations || []).map((action) => <li key={action.serviceId}>{action.provider} · score {action.score} · est ${action.estimatedCost}</li>)}
                  </ul>
                </Card>
              </motion.div>
            )}

            <Card className="bg-stone-50">
              <h3 className="font-medium">Run History</h3>
              <p className="mt-1 text-xs text-black/50">Database sync: {historyState}</p>
              <ul className="mt-2 space-y-1 text-sm">
                {runHistory.map((item) => (
                  <li key={item.runId}>
                    <button type="button" className="underline decoration-dotted" onClick={() => loadRunDetail(item.id)}>
                      #{String(item.id).padStart(4, '0')} · {item.objective} · ${item.budget} · {item.status}
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
