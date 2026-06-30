# CyberSentinel XDR Express API Layer

This module contains the REST API layer for CyberSentinel XDR. It exposes the dashboard-facing HTTP routes and coordinates the existing backend engines through controller-service boundaries.

It does not generate frontend code or a WebSocket layer. Report generation is delegated to the integrated Report Generator service.

## Folder Structure

- `controllers/` - Express controllers for each route group.
- `middleware/` - CORS, request ID, async handler, and JSON 404 middleware.
- `routes/apiRoutes.js` - Public REST route composition.
- `services/` - API-facing orchestration services.
- `index.js` - API module factory.

## Middleware

The API layer includes:

- CORS middleware.
- Request ID middleware.
- Async route wrapper.
- JSON 404 middleware.
- Shared Express error handling through `common/http/response.js`.

Environment configuration:

- `API_CORS_ORIGIN` controls the `Access-Control-Allow-Origin` header.

## Routes

Read routes:

- `GET /dashboard`
- `GET /nodes`
- `GET /attacks`
- `GET /alerts`
- `GET /analytics`
- `GET /reports`
- `GET /reports/:id`
- `POST /reports/generate`

Network control routes:

- `POST /network/start`
- `POST /network/stop`
- `POST /network/reset`

Simulation routes:

- `POST /simulate/ddos`
- `POST /simulate/portscan`
- `POST /simulate/bruteforce`
- `POST /simulate/sniffing`
- `POST /simulate/malware`

## Controller-Service Architecture

Controllers only translate HTTP requests into service calls and JSON responses.

Services coordinate the existing backend modules:

- `DashboardApiService` aggregates dashboard state.
- `NetworkApiService` controls network lifecycle and node reads.
- `AttackApiService` runs attack simulation, threat detection, alert creation, and analytics refresh.
- `AlertApiService` reads alert data.
- `AnalyticsApiService` computes current analytics snapshots.
- `ReportApiService` lists, reads, and generates reports through the integrated Report Generator service.

## Database Integration

The API layer uses existing repositories and schemas through the engine modules:

- Network tables for nodes, traffic, and health.
- Attack tables for attack simulations.
- Threat score tables for detection results.
- Alert tables for alert state.
- Analytics tables for computed metrics.
- Reports table for stored report records.

`GET /reports` lists existing report records. `POST /reports/generate` creates JSON and TXT security reports through the Report Generator module.

## Response Shape

Successful responses use:

```json
{
  "success": true,
  "data": {}
}
```

Errors use:

```json
{
  "success": false,
  "error": {
    "code": "REQUEST_ERROR",
    "message": "..."
  }
}
```

## Simulation Workflow

Simulation endpoints perform an end-to-end backend workflow:

1. Run attack simulation.
2. Run threat detection for the generated attack.
3. Create an alert from the threat score.
4. Refresh and store analytics.
5. Emit bridged realtime events when Socket.IO is attached.
6. Return all generated backend artifacts in one JSON response.

## Exclusions

This module does not include frontend code or WebSocket implementation.
