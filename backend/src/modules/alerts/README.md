# CyberSentinel XDR Alert Management System

This module contains the Alert Management System. It consumes stored threat detection results from `threat_scores`, creates linked alerts, manages alert status/history, and exposes alert metrics through services.

## Folder Structure

- `database/ensureAlertSchema.js` - Applies the alert persistence schema.
- `events/AlertEvents.js` - Local alert event names.
- `services/AlertEventBus.js` - In-process event emitter for alert workflows.
- `services/AlertService.js` - Main service for creation, status management, history, queries, and metrics.
- `services/AlertStatus.js` - Alert statuses and severity constants.
- `index.js` - Module factory used by the centralized application startup.

## Database Integration

Alerts are stored in the `alerts` table.

Stored fields include:

- Alert ID and alert key
- Created and updated timestamps
- Source IP and destination IP
- Source node and target node
- Attack ID and threat type
- Severity
- Description
- Status
- Threat score and risk score
- Recommendations
- Historical records in `history_json`

When an alert is created from a threat score, the originating `threat_scores.alert_id` value is updated with the new alert ID.

## Alert Workflow

1. Threat Detection Engine stores a row in `threat_scores`.
2. Alert Management System receives a service call to create an alert from that threat score.
3. `AlertService` loads the threat score, attack, and target node.
4. `AlertService` builds the alert title, description, severity, target context, and recommendations.
5. `AlertRepository` saves the alert to SQLite.
6. `ThreatScoreRepository` links the threat score to the alert.
7. `AuditRepository` records the creation action.
8. `AlertEventBus` emits alert creation and metrics events.

## Status Lifecycle

Supported statuses:

- `OPEN`
- `INVESTIGATING`
- `RESOLVED`
- `IGNORED`

Status updates append a historical record to `history_json`, preserve the previous state, and emit a local `alert.status.changed` event.

## Alert History

Alert history is stored as append-only JSON entries inside each alert row. Entries include action, notes, actor type, user ID, previous status, new status, and timestamp where applicable.

## Alert Metrics

`AlertService.getMetrics()` returns:

- Total alerts
- Critical alerts
- Resolved alerts
- Active alerts
- Ignored alerts

Active alerts are alerts with status `OPEN` or `INVESTIGATING`.

## Event Flow

Local events:

- `alert.created`
- `alert.status.changed`
- `alert.history.appended`
- `alert.metrics.updated`

These events are emitted only through the in-process event bus. No WebSocket layer is generated.

## Exclusions

This module does not include analytics, report generation, WebSockets, API routes, or frontend code.
