import { NetworkEvents } from "../events/NetworkEvents.js";

export class NetworkStateManager {
  constructor({ nodeRepository, trafficRepository, healthRepository, eventBus }) {
    this.nodeRepository = nodeRepository;
    this.trafficRepository = trafficRepository;
    this.healthRepository = healthRepository;
    this.eventBus = eventBus;
  }

  getState() {
    const nodes = this.nodeRepository.list();
    const trafficStats = this.trafficRepository.getStats();
    const protocolStats = this.trafficRepository.getProtocolStats();
    const summary = this.summarizeNodes(nodes);
    const latestHealth = this.healthRepository.getLatestGlobal();

    return {
      nodes: summary,
      traffic: {
        ...trafficStats,
        protocols: protocolStats,
      },
      networkHealth: latestHealth ?? this.computeGlobalHealth(nodes, trafficStats),
      generatedAt: new Date().toISOString(),
    };
  }

  refreshHealthSnapshots() {
    const nodes = this.nodeRepository.list();
    const trafficStats = this.trafficRepository.getStats();
    const globalHealth = this.computeGlobalHealth(nodes, trafficStats);
    const snapshot = this.healthRepository.insertSnapshot(globalHealth);

    this.eventBus.emitNetworkEvent(NetworkEvents.STATE_UPDATED, {
      networkHealth: snapshot,
      nodes: this.summarizeNodes(nodes),
      traffic: trafficStats,
    });

    return snapshot;
  }

  resetNetworkState() {
    const deletedTrafficCount = this.trafficRepository.clearAll();
    const deletedHealthCount = this.healthRepository.clearAll();
    const nodes = this.nodeRepository.list();

    for (const node of nodes) {
      this.nodeRepository.reset(node.id);
    }

    const health = this.refreshHealthSnapshots();

    return {
      deletedTrafficCount,
      deletedHealthCount,
      health,
      nodes: this.summarizeNodes(this.nodeRepository.list()),
    };
  }

  summarizeNodes(nodes) {
    return {
      total: nodes.length,
      active: nodes.filter((node) => node.status === "ONLINE").length,
      degraded: nodes.filter((node) => node.status === "DEGRADED").length,
      offline: nodes.filter((node) => node.status === "OFFLINE").length,
      compromised: nodes.filter((node) => node.status === "COMPROMISED").length,
      maintenance: nodes.filter((node) => node.status === "MAINTENANCE").length,
    };
  }

  computeGlobalHealth(nodes, trafficStats) {
    if (nodes.length === 0) {
      return {
        nodeId: null,
        healthScore: 100,
        status: "OK",
        uptimePercent: 100,
        throughputBps: 0,
        packetLossPct: 0,
        latencyMs: 0,
        activeSessions: 0,
        openIncidents: 0,
        metrics: { reason: "No nodes provisioned", trafficStats },
      };
    }

    const weights = nodes.map((node) => {
      if (node.status === "OFFLINE" || node.health === "CRIT") return 20;
      if (node.status === "DEGRADED" || node.health === "WARN") return 70;
      if (node.status === "MAINTENANCE") return 85;
      return 98;
    });

    const healthScore = Number(
      (weights.reduce((sum, value) => sum + value, 0) / weights.length).toFixed(2),
    );
    const status = healthScore < 50 ? "CRIT" : healthScore < 85 ? "WARN" : "OK";
    const activeSessions = nodes.reduce((sum, node) => sum + node.activeSessions, 0);
    const throughputBps = nodes.reduce((sum, node) => sum + node.throughputBps, 0);

    return {
      nodeId: null,
      healthScore,
      status,
      uptimePercent: Number(((this.summarizeNodes(nodes).active / nodes.length) * 100).toFixed(2)),
      throughputBps,
      packetLossPct: status === "CRIT" ? 8 : status === "WARN" ? 1.5 : 0.1,
      latencyMs: status === "CRIT" ? 300 : status === "WARN" ? 90 : 20,
      activeSessions,
      openIncidents: nodes.filter((node) => node.health === "WARN" || node.health === "CRIT")
        .length,
      metrics: {
        nodeSummary: this.summarizeNodes(nodes),
        trafficStats,
      },
    };
  }
}
