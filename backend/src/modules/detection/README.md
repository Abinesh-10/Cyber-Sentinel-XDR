# CyberSentinel XDR Threat Detection Engine

This module contains the Threat Detection Engine. It analyzes traffic and attack simulation output from the existing Network Simulation Engine and Attack Simulation Engine, classifies threats, and stores detection results in the approved `threat_scores` table.

## Folder Structure

- `database/ensureDetectionSchema.js` - Applies the approved detection persistence schema.
- `events/DetectionEvents.js` - Local detection event names.
- `services/DetectionEventBus.js` - In-process detection event emitter.
- `services/DetectionService.js` - Public service facade for attack analysis and sweeps.
- `services/DetectionRuleEngine.js` - Rule dispatcher.
- `services/ThreatClassifier.js` - Threat score, risk score, confidence, and severity logic.
- `services/rules/` - Dedicated rules for DDoS, port scan, brute force, packet sniffing, and malware propagation.
- `index.js` - Module factory used by the centralized application startup.

## Detection Workflow

1. Caller invokes `DetectionService.detectAttack(attackId)` or `DetectionService.runSweep()`.
2. The service loads the attack, target node, and related `traffic_logs`.
3. `DetectionRuleEngine` dispatches to the matching rule by `attack_type`.
4. The rule extracts evidence and calculates rule signals.
5. `ThreatClassifier` converts rule evidence into score, risk score, confidence, and severity.
6. `ThreatScoreRepository` stores the detection result in `threat_scores`.
7. The local detection event bus emits detection lifecycle events.

## Threat Classification

- LOW: score 0-25
- MEDIUM: score 26-50
- HIGH: score 51-75
- CRITICAL: score 76-100

## Database Storage

Detection output is stored in `threat_scores`.

- `node_id` stores the target or most affected node.
- `attack_id` links to the simulated attack.
- `score`, `risk_score`, `severity`, and `confidence` store classification output.
- `computed_at` stores the detection timestamp.
- `factors_json` stores source IPs, target node, affected nodes, propagation chains, detection evidence, and rule metadata.

## Exclusions

This module does not include alert management, analytics, report generation, WebSockets, API routes, or frontend code.
