# CyberSentinel XDR Analytics Engine

This module contains the Analytics Engine. It computes attack, detection, network, risk, and health metrics from the existing Network Simulation Engine, Attack Simulation Engine, Threat Detection Engine, and Alert Management System.

The module is service-only. It does not define API routes, WebSockets, report generation, or frontend code.

## Folder Structure

- `database/ensureAnalyticsSchema.js` - Applies the approved `analytics` table.
- `events/AnalyticsEvents.js` - Local analytics event names.
- `services/AnalyticsEventBus.js` - In-process analytics event emitter.
- `services/AnalyticsPeriod.js` - Period normalization and bucket selection.
- `services/ScoreMath.js` - Shared scoring and percentage helpers.
- `services/AttackAnalyticsService.js` - Attack totals and frequency over time.
- `services/DetectionAnalyticsService.js` - Detection accuracy, false positives, and true positive rate.
- `services/NetworkAnalyticsService.js` - Most targeted node, vulnerable IP, and traffic distribution.
- `services/RiskScoringService.js` - Node risk scores, network risk score, and threat aggregation.
- `services/HealthMonitoringService.js` - Overall network health and performance metrics.
- `services/AnalyticsService.js` - Snapshot orchestration and analytics persistence.
- `index.js` - Module factory used by the centralized application startup.

## Analytics Responsibilities

### Attack Analytics

- Total attacks per type:
  - `DDOS`
  - `PORT_SCAN`
  - `BRUTE_FORCE`
  - `MALWARE_PROPAGATION`
  - `PACKET_SNIFFING`
- Attack frequency grouped by hour or day.

### Detection Analytics

- Detection accuracy.
- False positives from ignored alerts.
- True positive rate from non-ignored alerts.
- Average confidence, threat score, and risk score from `threat_scores`.

### Network Analytics

- Most targeted node from attack targets.
- Most vulnerable IP from threat score risk averages.
- Traffic distribution by direction and protocol.
- Node-level traffic distribution.

### Risk Scoring

Node risk score is calculated from:

- Stored node risk score.
- Average threat risk.
- Maximum threat risk.
- Threat count boost.
- Node status and health penalty.

Network risk score is calculated from:

- Average node risk.
- Severity-weighted threat aggregation.

Threat levels are aggregated into:

- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

### Health Monitoring

- Overall network health score from latest global health snapshot or node health average.
- Average latency.
- Average packet loss.
- Average and peak throughput.
- Average active sessions.

## Database Integration

Computed analytics are stored in the approved `analytics` table.

Snapshot rows include:

- Metric name
- Metric scope
- Scope ID when applicable
- Numeric value
- Unit
- Period start and end
- Dimensions JSON
- Computed timestamp

Complex metric context, such as attack type distributions and node details, is stored in `dimensions_json`.

## Event Flow

Local events:

- `analytics.snapshot.started`
- `analytics.snapshot.computed`
- `analytics.snapshot.stored`
- `analytics.snapshot.failed`

These events are in-process only and are not WebSocket events.

## Usage Boundary

This module exports `createAnalyticsModule({ db })`. Consumers can call `analyticsService.computeSnapshot()` or `analyticsService.listSnapshots()` after integration.

## Exclusions

This module does not include a report generator, WebSocket layer, API layer, or frontend code.
