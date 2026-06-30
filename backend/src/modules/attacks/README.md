# CyberSentinel XDR Attack Simulation Engine

This module contains the Attack Simulation Engine. It uses the existing Network Simulation Engine persistence model for nodes and traffic logs, and it bootstraps the approved `attacks` table when the module is constructed.

## Folder Structure

- `database/ensureAttackSchema.js` - Applies the attack schema.
- `events/AttackEvents.js` - Local attack event names.
- `services/AttackEventBus.js` - In-process event emitter for attack workflows.
- `services/AttackService.js` - Public service facade and workflow coordinator.
- `services/AttackSimulationEngine.js` - Simulator registry and execution dispatcher.
- `services/simulators/` - Individual attack simulators.
- `validators/attackValidators.js` - Request validation helpers.
- `index.js` - Module factory used by the centralized application startup.

## Attack Workflow

1. API orchestration or an internal workflow calls `AttackService`.
2. Service validates input and resolves the target node from `nodes`.
3. Service creates an `attacks` row with `RUNNING` lifecycle state.
4. Service emits `attack.started` on the local event bus.
5. `AttackSimulationEngine` dispatches to the requested simulator.
6. Simulator generates synthetic traffic logs tagged with `attack_id`.
7. Simulator returns metrics, timestamps, affected nodes, and generated logs.
8. Service updates the `attacks` row to `COMPLETED`.
9. Service records an audit log and emits `attack.completed`.

Failed simulations update the attack lifecycle to `FAILED` and emit `attack.failed`.

## Supported Simulations

- DDoS: flooding traffic from multiple source IPs with configurable intensity.
- Port Scan: sequential or randomized ports against a selected target node.
- Brute Force: repeated login attempts with success/failure tracking.
- Packet Sniffing: mirrored/intercepted packet monitoring simulation.
- Malware Propagation: infection spread between nodes with compromised-node tracking.

## Exclusions

This module does not include detection, alerting, analytics, WebSockets, or frontend code. Those concerns are integrated by the application and API layers.
