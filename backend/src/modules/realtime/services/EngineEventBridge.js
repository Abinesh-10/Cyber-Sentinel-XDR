import { AlertEvents } from "../../alerts/events/AlertEvents.js";
import { AnalyticsEvents } from "../../analytics/events/AnalyticsEvents.js";
import { AttackEvents } from "../../attacks/events/AttackEvents.js";
import { DetectionEvents } from "../../detection/events/DetectionEvents.js";
import { NetworkEvents } from "../../network/events/NetworkEvents.js";
import { DashboardEvents } from "../events/DashboardEvents.js";

export class EngineEventBridge {
  constructor({ modules, broadcaster, logger = null }) {
    this.modules = modules;
    this.broadcaster = broadcaster;
    this.logger = logger;
    this.bindings = [];
  }

  bind() {
    this.bindNetworkEvents();
    this.bindAttackEvents();
    this.bindDetectionEvents();
    this.bindAlertEvents();
    this.bindAnalyticsEvents();
    this.logger?.info("engine_events_bound", {
      bindings: this.bindings.length,
    });
  }

  unbind() {
    for (const binding of this.bindings) {
      binding.eventBus.off(binding.eventName, binding.handler);
    }
    this.bindings = [];
    this.logger?.info("engine_events_unbound");
  }

  bindNetworkEvents() {
    const eventBus = this.modules.networkModule?.eventBus;
    if (!eventBus) return;

    this.on(eventBus, NetworkEvents.NODE_CREATED, (event) =>
      this.emitNodeUpdated("created", event),
    );
    this.on(eventBus, NetworkEvents.NODE_UPDATED, (event) =>
      this.emitNodeUpdated("updated", event),
    );
    this.on(eventBus, NetworkEvents.NODE_DELETED, (event) =>
      this.emitNodeUpdated("deleted", event),
    );
    this.on(eventBus, NetworkEvents.NODE_RESET, (event) => this.emitNodeUpdated("reset", event));
    this.on(eventBus, NetworkEvents.STATE_UPDATED, (event) => this.emitNetworkHealth(event));
    this.on(eventBus, NetworkEvents.ENGINE_TICK, (event) => this.emitNetworkHealth(event));
    this.on(eventBus, NetworkEvents.ENGINE_RESET, (event) => this.emitNetworkHealth(event));
  }

  bindAttackEvents() {
    const eventBus = this.modules.attackModule?.eventBus;
    if (!eventBus) return;

    this.on(eventBus, AttackEvents.ATTACK_STARTED, (event) =>
      this.emitAttackDetected("started", event),
    );
    this.on(eventBus, AttackEvents.ATTACK_COMPLETED, (event) =>
      this.emitAttackDetected("completed", event),
    );
    this.on(eventBus, AttackEvents.ATTACK_NODE_IMPACTED, (event) =>
      this.emitAttackDetected("node_impacted", event),
    );
  }

  bindDetectionEvents() {
    const eventBus = this.modules.detectionModule?.eventBus;
    if (!eventBus) return;

    this.on(eventBus, DetectionEvents.THREAT_CLASSIFIED, (event) =>
      this.emitThreatDetected("classified", event),
    );
    this.on(eventBus, DetectionEvents.DETECTION_STORED, (event) =>
      this.emitThreatDetected("stored", event),
    );
  }

  bindAlertEvents() {
    const eventBus = this.modules.alertModule?.eventBus;
    if (!eventBus) return;

    this.on(eventBus, AlertEvents.ALERT_CREATED, (event) => {
      this.broadcaster.broadcast(DashboardEvents.ALERT_CREATED, {
        action: "created",
        timestamp: event.timestamp,
        ...event.payload,
      });
    });
  }

  bindAnalyticsEvents() {
    const eventBus = this.modules.analyticsModule?.eventBus;
    if (!eventBus) return;

    this.on(eventBus, AnalyticsEvents.SNAPSHOT_COMPUTED, (event) =>
      this.emitAnalyticsUpdated("computed", event),
    );
    this.on(eventBus, AnalyticsEvents.SNAPSHOT_STORED, (event) =>
      this.emitAnalyticsUpdated("stored", event),
    );
  }

  on(eventBus, eventName, handler) {
    eventBus.on(eventName, handler);
    this.bindings.push({ eventBus, eventName, handler });
  }

  emitNodeUpdated(action, event) {
    this.broadcaster.broadcast(DashboardEvents.NODE_UPDATED, {
      action,
      timestamp: event.timestamp,
      ...event.payload,
    });
  }

  emitNetworkHealth(event) {
    this.broadcaster.broadcast(DashboardEvents.NETWORK_HEALTH_UPDATED, {
      timestamp: event.timestamp,
      ...event.payload,
    });
  }

  emitAttackDetected(phase, event) {
    this.broadcaster.broadcast(DashboardEvents.ATTACK_DETECTED, {
      phase,
      timestamp: event.timestamp,
      ...event.payload,
    });
  }

  emitThreatDetected(phase, event) {
    this.broadcaster.broadcast(DashboardEvents.THREAT_DETECTED, {
      phase,
      timestamp: event.timestamp,
      ...event.payload,
    });
  }

  emitAnalyticsUpdated(phase, event) {
    this.broadcaster.broadcast(DashboardEvents.ANALYTICS_UPDATED, {
      phase,
      timestamp: event.timestamp,
      ...event.payload,
    });
  }
}
