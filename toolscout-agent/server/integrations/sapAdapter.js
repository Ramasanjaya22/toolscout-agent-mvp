export async function discoverSapTools(plan, mockMode = true) {
  if (!mockMode) throw new Error('Real SAP integration not implemented.');

  return [
    { serviceId: 'sap-ai-forecast', provider: 'SAP BTP', capability: 'Demand Forecasting', estimatedCost: 120 },
    { serviceId: 'sap-ai-risk', provider: 'SAP BTP', capability: 'Risk Analysis', estimatedCost: 90 },
    { serviceId: 'sap-ai-routing', provider: 'SAP BTP', capability: 'Logistics Optimization', estimatedCost: 140 }
  ].map((tool) => ({ ...tool, matchedObjective: plan.objective }));
}
