import { create } from 'zustand';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const useToolScoutStore = create((set, get) => ({
  objective: '',
  budget: 150,
  runState: 'idle',
  error: null,
  report: null,
  selectedRunDetail: null,
  runHistory: [],
  historyState: 'idle',
  stats: null,
  modelConfig: null,
  modelTest: null,

  setObjective: (objective) => set({ objective }),
  setBudget: (budget) => set({ budget }),
  resetRun: () => set({ runState: 'idle', report: null, error: null, selectedRunDetail: null }),

  loadDashboardData: async () => {
    set({ historyState: 'loading' });
    try {
      const [runsRes, statsRes, modelRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/agent/runs?limit=8`),
        fetch(`${API_BASE_URL}/api/agent/stats`),
        fetch(`${API_BASE_URL}/api/agent/model/config`)
      ]);
      const [runsPayload, statsPayload, modelPayload] = await Promise.all([runsRes.json(), statsRes.json(), modelRes.json()]);
      set({
        runHistory: runsPayload.data || [],
        stats: statsPayload.data || null,
        modelConfig: modelPayload.data || null,
        historyState: 'loaded'
      });
    } catch (_error) {
      set({ historyState: 'failed' });
    }
  },

  loadRunDetail: async (runId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agent/runs/${runId}`);
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Failed to load run detail');
      set({ selectedRunDetail: payload.data, report: payload.data.report_json, runState: 'completed' });
    } catch (error) {
      set({ error: error.message });
    }
  },

  testModelConnection: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agent/model/test`, { method: 'POST' });
      const payload = await response.json();
      set({ modelTest: payload.data || null });
    } catch (error) {
      set({ modelTest: { connected: false, error: error.message } });
    }
  },

  runAgent: async () => {
    const { objective, budget, loadDashboardData } = get();
    set({ runState: 'running', error: null, report: null, selectedRunDetail: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/agent/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective, budget: Number(budget) })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Run failed');
      set({ runState: 'completed', report: payload.data });
      await loadDashboardData();
    } catch (error) {
      set({ runState: 'failed', error: error.message });
    }
  }
}));
