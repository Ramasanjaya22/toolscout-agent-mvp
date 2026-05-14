# API

Base URL: `http://localhost:3001`

## `GET /api/health`
Returns API status.

## `POST /api/agent/run`
Runs the full ToolScout workflow.

Body:
```json
{
  "objective": "Find forecasting API",
  "budget": 200
}
```

## `GET /api/agent/runs?limit=20`
Returns recent runs (`limit` clamped between 1 and 100).

## `GET /api/agent/runs/:id`
Returns a single run with related `service_evaluations` and `payment_proofs`.

## `GET /api/agent/stats`
Returns aggregated run statistics:
- `total_runs`
- `completed_runs`
- `no_match_runs`
- `avg_budget`
