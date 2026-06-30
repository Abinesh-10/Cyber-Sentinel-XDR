# CyberSentinel XDR Socket.IO WebSocket Layer

This module provides the real-time communication layer for the CyberSentinel XDR backend dashboard.

It is service-only and does not create REST APIs or frontend code.

## Folder Structure

- `database/ensureRealtimeSchema.js` - Applies the `websocket_events` table.
- `events/DashboardEvents.js` - Dashboard event names and event type mapping.
- `services/ConnectionManager.js` - Tracks Socket.IO connections and lightweight client commands.
- `services/RealtimeBroadcaster.js` - Persists and broadcasts dashboard events to all clients.
- `services/EngineEventBridge.js` - Bridges domain engine events into dashboard event names.
- `index.js` - Socket.IO server setup and module factory.

## Socket Server Setup

The Socket.IO server is attached to the same HTTP server as Express in `backend/src/server.js`.

Default namespace:

`/xdr`

Default CORS:

`*`

Default connection recovery window:

`120000ms`

Environment overrides:

- `SOCKET_NAMESPACE`
- `SOCKET_CORS_ORIGIN`
- `SOCKET_RECOVERY_MS`

## Dashboard Events

The layer broadcasts these dashboard events to all connected clients:

- `alert_created`
- `attack_detected`
- `node_updated`
- `analytics_updated`
- `network_health_updated`
- `threat_detected`

Each payload is wrapped in an envelope:

```json
{
  "id": "ws_...",
  "event": "alert_created",
  "type": "ALERT",
  "timestamp": "2026-06-01T00:00:00.000Z",
  "deliveredCount": 3,
  "payload": {}
}
```

## Engine Integration

The realtime layer subscribes to existing in-process event buses:

- Network engine events become `node_updated` and `network_health_updated`.
- Attack engine events become `attack_detected`.
- Threat detection events become `threat_detected`.
- Alert events become `alert_created`.
- Analytics events become `analytics_updated`.

The app instantiates these modules so their event buses are available, but it does not mount additional REST APIs.

## Connection Management

On connection, the server emits:

- `connection_ready`

Supported lightweight client commands:

- `dashboard_subscribe`
- `dashboard_unsubscribe`
- `client_ping`

The server replies to `client_ping` with:

- `server_pong`

Socket.IO client auto reconnect is supported by Socket.IO clients. The server enables connection state recovery with the configured recovery window.

## Event Storage

Every broadcast is persisted to the `websocket_events` table with:

- Event name
- Event type
- Room
- Payload JSON
- Correlation ID
- Delivered client count
- Status
- Created timestamp

## Exclusions

This module does not include an API layer, frontend code, or report generation.
