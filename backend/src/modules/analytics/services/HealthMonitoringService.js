import { parseJson } from "../../../common/utils/json.js";
import { clampScore, roundMetric } from "./ScoreMath.js";

export class HealthMonitoringService {
  constructor({ analyticsRepository }) {
    this.analyticsRepository = analyticsRepository;
  }

  calculate(period) {
    const globalHealth = this.analyticsRepository.getLatestNetworkHealth();
    const nodeHealth = this.analyticsRepository.getLatestNodeHealth().map((row) => ({
      id: row.id,
      nodeId: row.node_id,
      healthScore: row.health_score,
      status: row.status,
      uptimePercent: row.uptime_percent,
      throughputBps: row.throughput_bps,
      packetLossPct: row.packet_loss_pct,
      latencyMs: row.latency_ms,
      activeSessions: row.active_sessions,
      openIncidents: row.open_incidents,
      metrics: parseJson(row.metrics_json, {}),
      checkedAt: row.checked_at,
    }));
    const performance = this.analyticsRepository.getPerformanceMetrics(period);

    return {
      overallNetworkHealthScore: this.overallScore(globalHealth, nodeHealth),
      globalHealth: globalHealth
        ? {
            healthScore: globalHealth.health_score,
            status: globalHealth.status,
            uptimePercent: globalHealth.uptime_percent,
            throughputBps: globalHealth.throughput_bps,
            packetLossPct: globalHealth.packet_loss_pct,
            latencyMs: globalHealth.latency_ms,
            activeSessions: globalHealth.active_sessions,
            openIncidents: globalHealth.open_incidents,
            checkedAt: globalHealth.checked_at,
          }
        : null,
      nodeHealth,
      performanceMetrics: {
        averageLatencyMs: roundMetric(performance.averageLatencyMs ?? 0),
        averagePacketLossPct: roundMetric(performance.averagePacketLossPct ?? 0, 3),
        averageThroughputBps: roundMetric(performance.averageThroughputBps ?? 0),
        peakThroughputBps: roundMetric(performance.peakThroughputBps ?? 0),
        averageActiveSessions: roundMetric(performance.averageActiveSessions ?? 0),
      },
    };
  }

  overallScore(globalHealth, nodeHealth) {
    if (globalHealth?.health_score != null) return clampScore(globalHealth.health_score);
    if (!nodeHealth.length) return 100;
    return clampScore(
      nodeHealth.reduce((sum, node) => sum + Number(node.healthScore ?? 0), 0) / nodeHealth.length,
    );
  }
}
