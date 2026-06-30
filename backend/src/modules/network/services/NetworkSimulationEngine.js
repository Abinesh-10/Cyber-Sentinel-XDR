import { NetworkEvents } from "../events/NetworkEvents.js";

export class NetworkSimulationEngine {
  constructor({ trafficGenerator, stateManager, eventBus, tickMs, trafficPerTick }) {
    this.trafficGenerator = trafficGenerator;
    this.stateManager = stateManager;
    this.eventBus = eventBus;
    this.tickMs = tickMs;
    this.trafficPerTick = trafficPerTick;
    this.timer = null;
    this.startedAt = null;
    this.tickCount = 0;
  }

  start(options = {}) {
    if (this.timer) {
      return this.getStatus();
    }

    if (options.tickMs) this.tickMs = options.tickMs;
    if (options.trafficPerTick) this.trafficPerTick = options.trafficPerTick;

    this.startedAt = new Date().toISOString();
    this.timer = setInterval(() => this.tick(), this.tickMs);

    this.eventBus.emitNetworkEvent(NetworkEvents.ENGINE_STARTED, this.getStatus());
    return this.getStatus();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    const status = this.getStatus();
    this.eventBus.emitNetworkEvent(NetworkEvents.ENGINE_STOPPED, status);
    return status;
  }

  tick() {
    this.tickCount += 1;
    const traffic = this.trafficGenerator.generateRandomTraffic(this.trafficPerTick);
    const health = this.stateManager.refreshHealthSnapshots();

    const payload = {
      tick: this.tickCount,
      traffic: {
        generated: traffic.generated,
        stats: traffic.stats,
      },
      health,
    };

    this.eventBus.emitNetworkEvent(NetworkEvents.ENGINE_TICK, payload);
    return payload;
  }

  reset() {
    this.stop();
    this.tickCount = 0;
    this.startedAt = null;
    const state = this.stateManager.resetNetworkState();
    this.eventBus.emitNetworkEvent(NetworkEvents.ENGINE_RESET, state);
    return state;
  }

  getStatus() {
    return {
      running: Boolean(this.timer),
      startedAt: this.startedAt,
      tickMs: this.tickMs,
      trafficPerTick: this.trafficPerTick,
      tickCount: this.tickCount,
      state: this.stateManager.getState(),
    };
  }
}
