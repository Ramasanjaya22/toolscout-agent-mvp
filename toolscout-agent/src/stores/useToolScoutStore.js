import { create } from 'zustand';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

export const useToolScoutStore = create((set, get) => ({
  companyName: '',
  budget: 300,
  runState: 'idle',
  error: null,
  health: null,
  latestRun: null,
  selectedRunDetail: null,
  runHistory: [],
  historyState: 'idle',

  setCompanyName: (companyName) => set({ companyName }),
  setBudget: (budget) => set({ budget }),
  resetRun: () => set({ runState: 'idle', latestRun: null, error: null, selectedRunDetail: null }),

  checkHealth: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Health check failed');
      set({ health: payload });
    } catch (error) {
      set({ health: { ok: false, error: error.message } });
    }
  },

  loadDashboardData: async () => {
    set({ historyState: 'loading' });
    try {
      const response = await fetch(`${API_BASE_URL}/api/runs`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to load runs');
      set({
        runHistory: payload.runs || [],
        historyState: 'loaded'
      });
    } catch (_error) {
      set({ historyState: 'failed' });
    }
  },

  loadRunDetail: async (runId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/runs/${runId}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to load run detail');
      set({ selectedRunDetail: payload, latestRun: payload, runState: 'completed', error: null });
    } catch (error) {
      set({ error: error.message });
    }
  },

  runAgent: async () => {
    const { companyName, budget, loadDashboardData } = get();
    set({ runState: 'running', error: null, latestRun: null, selectedRunDetail: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, budget: Number(budget) })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || payload.error || 'Run failed');
      }
      set({ runState: 'completed', latestRun: payload, selectedRunDetail: payload });
      await loadDashboardData();
    } catch (error) {
      set({ runState: 'failed', error: error.message });
    }
  }
}));
