# CyberSentinel XDR Backend

CyberSentinel XDR is an integrated Node.js backend for cybersecurity simulation, detection, alerting, analytics, reporting, realtime dashboard events, and REST APIs.

## Final Project Folder Structure

- `src/app.js` - Express app composition and module graph.
- `src/server.js` - HTTP and Socket.IO process entry point.
- `src/common/logger.js` - Structured runtime logger.
- `src/config/index.js` - Runtime configuration and environment variables.
- `src/database/connection.js` - Shared Better-SQLite3 connection and base schema bootstrap.
- `src/database/schema/` - SQLite schemas for network, attacks, detection, alerts, analytics, reports, and realtime events.
- `src/database/repositories/` - Data access layer for all persisted entities.
- `src/modules/network/` - Network Simulation Engine.
- `src/modules/attacks/` - Attack Simulation Engine.
- `src/modules/detection/` - Threat Detection Engine.
- `src/modules/alerts/` - Alert Management System.
- `src/modules/analytics/` - Analytics Engine.
- `src/modules/reports/` - Report Generator.
- `src/modules/realtime/` - Socket.IO WebSocket Layer.
- `src/modules/api/` - Express.js API Layer.
- `.env.example` - Environment variable template.
- `data/` - Runtime SQLite database location by default.
- `reports/` - Generated report export folder.

## Startup Instructions

Install dependencies from the backend folder:

```powershell
cd backend
npm install
```

Create an environment file if local overrides are needed:

```powershell
Copy-Item .env.example .env
```

Start the backend:

```powershell
npm run start
```

Development mode with Node watch:

```powershell
npm run dev
```

Default HTTP URL:

`http://localhost:4000`

Default Socket.IO namespace:

`/xdr`

## Environment Variables

- `NODE_ENV` - Runtime mode. Defaults to `development`.
- `PORT` - HTTP server port. Defaults to `4000`.
- `LOG_LEVEL` - Structured log verbosity: `error`, `warn`, `info`, `debug`, or `silent`. Defaults to `info`.
- `CYBERSENTINEL_DB_PATH` - SQLite database file path. Defaults to `backend/data/cybersentinel-network.sqlite`.
- `REPORTS_DIRECTORY` - Report export directory. Defaults to `backend/reports`.
- `NETWORK_TICK_MS` - Network simulation tick interval. Defaults to `1000`.
- `NETWORK_TRAFFIC_PER_TICK` - Generated traffic logs per tick. Defaults to `25`.
- `API_CORS_ORIGIN` - REST API CORS origin. Defaults to `*`.
- `SOCKET_NAMESPACE` - Socket.IO namespace. Defaults to `/xdr`.
- `SOCKET_CORS_ORIGIN` - Socket.IO CORS origin. Defaults to `*`.
- `SOCKET_RECOVERY_MS` - Socket.IO connection recovery window. Defaults to `120000`.

## Run Commands

- `npm run start` - Start the backend.
- `npm run dev` - Start the backend with Node watch mode.

## REST API Routes

- `GET /dashboard`
- `GET /nodes`
- `GET /attacks`
- `GET /alerts`
- `GET /analytics`
- `GET /reports`
- `GET /reports/:id`
- `POST /reports/generate`
- `POST /network/start`
- `POST /network/stop`
- `POST /network/reset`
- `POST /simulate/ddos`
- `POST /simulate/portscan`
- `POST /simulate/bruteforce`
- `POST /simulate/sniffing`
- `POST /simulate/malware`

## WebSocket Events

Socket.IO broadcasts dashboard events on the configured namespace:

- `alert_created`
- `attack_detected`
- `node_updated`
- `analytics_updated`
- `network_health_updated`
- `threat_detected`

## System Architecture Summary

The backend uses a modular monolith architecture. `app.js` creates one shared SQLite connection and passes it to all modules. Each module owns its service layer, repository access, and local event bus where needed.

End-to-end simulation flow:

1. API receives a simulation request.
2. Attack Simulation Engine creates an attack and synthetic traffic.
3. Threat Detection Engine classifies the generated attack.
4. Alert Management System creates an alert from the threat score.
5. Analytics Engine refreshes stored metrics.
6. Socket.IO layer broadcasts attack, threat, alert, analytics, node, and health updates.
7. Report Generator can build JSON and TXT reports from stored analytics, alerts, and detections.

All modules share the same Better-SQLite3 database connection and persist through the approved SQLite schemas.

## Integration Report

- One startup path creates the shared SQLite connection, all engine modules, the API module, and the Socket.IO bridge.
- API simulations run the production flow: attack -> detection -> alert -> analytics.
- Socket.IO bridges Network, Attack, Detection, Alert, and Analytics event buses to dashboard events.
- Report generation is connected through `POST /reports/generate` and persists two report rows plus JSON/TXT files.
- Legacy module-local routers were removed so the centralized API router is the only HTTP route surface.
- Structured logging is available for startup, shutdown, request errors, database bootstrap, Socket.IO connections, and event broadcasts.

## Production Readiness Checklist

- Configure `NODE_ENV=production`.
- Set explicit `API_CORS_ORIGIN` and `SOCKET_CORS_ORIGIN` for the frontend origin.
- Store the SQLite database on durable storage with backup/restore procedures.
- Set `LOG_LEVEL=info` or `warn` in production, and collect stdout/stderr with the process manager.
- Run behind HTTPS-capable reverse proxy infrastructure.
- Protect API and Socket.IO access before exposing beyond a trusted simulation environment.
- Monitor database file growth for `traffic_logs`, `analytics`, and `websocket_events`.
- Schedule report cleanup or archival for the `REPORTS_DIRECTORY`.
