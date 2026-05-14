import { discoverSapTools } from './integrations/sapAdapter.js';
import { executeAceService } from './integrations/aceDataCloudAdapter.js';
import { settleX402Payment } from './integrations/x402Adapter.js';
import { createRun, finalizeRun, saveEvaluations, savePaymentProof } from './db.js';

function buildPlan(objective, budget) {
  return {
    objective,
    budget,
    stages: ['planning', 'sap_discovery', 'ace_execution', 'x402_settlement', 'scoring', 'reporting']
  };
}

function scoreServices(evaluations, budget) {
  return evaluations
    .map((item) => {
      const costEfficiency = Math.max(0, 100 - (item.estimatedCost / Math.max(budget, 1)) * 100);
      const weightedScore = Number((item.score * 0.75 + costEfficiency * 0.25).toFixed(2));
      return { ...item, weightedScore, costEfficiency: Number(costEfficiency.toFixed(2)) };
    })
    .sort((a, b) => b.weightedScore - a.weightedScore);
}

export async function runToolScoutAgent({ objective, budget, mockMode = true }) {
  const runId = createRun({ objective, budget });

  const plan = buildPlan(objective, budget);
  const discovered = await discoverSapTools(plan, mockMode);
  const affordable = discovered.filter((service) => service.estimatedCost <= budget);

  const evaluations = [];
  for (const service of affordable) {
    const result = await executeAceService(service, mockMode);
    evaluations.push(result);
  }

  const paymentProofs = [];
  for (const evaluation of evaluations) {
    const payment = await settleX402Payment(evaluation.estimatedCost, mockMode);
    paymentProofs.push({ ...payment, serviceId: evaluation.serviceId });
  }

  const ranked = scoreServices(evaluations, budget);
  const selected = ranked[0] || null;
  const selectedPayment = selected ? paymentProofs.find((p) => p.serviceId === selected.serviceId) || null : null;

  const report = {
    runId,
    objective,
    budget,
    plan,
    discovered,
    affordable,
    evaluations,
    paymentProofs,
    ranked,
    selected,
    payment: selectedPayment,
    status: selected ? 'completed' : 'no_match',
    generatedAt: new Date().toISOString()
  };

  saveEvaluations(runId, evaluations);
  for (const proof of paymentProofs) savePaymentProof(runId, proof);
  finalizeRun({ runId, status: report.status, report });

  return report;
}
