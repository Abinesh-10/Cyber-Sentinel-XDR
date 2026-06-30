import { clampScore, roundMetric, severityWeight, statusRiskPenalty } from "./ScoreMath.js";

export class RiskScoringService {
  constructor({ analyticsRepository }) {
    this.analyticsRepository = analyticsRepository;
  }

  calculate(period) {
    const rawNodeScores = this.analyticsRepository.getNodeRiskScores(period);
    const threatAggregation = this.analyticsRepository.getThreatLevelAggregation(period);
    const nodeRiskScores = rawNodeScores.map((node) => this.calculateNodeRisk(node));
    const networkRiskScore = this.calculateNetworkRisk(nodeRiskScores, threatAggregation);
    const threatLevel = this.aggregateThreatLevel(networkRiskScore, threatAggregation);

    return {
      nodeRiskScores,
      networkRiskScore,
      threatLevel,
      threatLevelAggregation: this.normalizeThreatAggregation(threatAggregation),
    };
  }

  calculateNodeRisk(node) {
    const storedRisk = Number(node.storedRiskScore ?? 0);
    const averageThreatRisk = Number(node.averageThreatRisk ?? 0);
    const maxThreatRisk = Number(node.maxThreatRisk ?? 0);
    const threatCountBoost = Math.min(20, Number(node.threatCount ?? 0) * 3);
    const healthPenalty = statusRiskPenalty(node.status, node.health);
    const score = clampScore(
      storedRisk * 0.25 +
        averageThreatRisk * 0.35 +
        maxThreatRisk * 0.25 +
        threatCountBoost +
        healthPenalty,
    );

    return {
      nodeId: node.nodeId,
      nodeKey: node.nodeKey,
      nodeName: node.nodeName,
      ipAddress: node.ipAddress,
      status: node.status,
      health: node.health,
      riskScore: score,
      storedRiskScore: roundMetric(storedRisk),
      averageThreatRisk: roundMetric(averageThreatRisk),
      maxThreatRisk: roundMetric(maxThreatRisk),
      threatCount: node.threatCount ?? 0,
    };
  }

  calculateNetworkRisk(nodeRiskScores, threatAggregation) {
    if (!nodeRiskScores.length) return 0;

    const nodeAverage =
      nodeRiskScores.reduce((sum, node) => sum + node.riskScore, 0) / nodeRiskScores.length;
    const severityTotal = threatAggregation.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
    const severityScore = severityTotal
      ? threatAggregation.reduce(
          (sum, row) => sum + severityWeight(row.severity) * Number(row.total ?? 0),
          0,
        ) / severityTotal
      : 0;

    return clampScore(nodeAverage * 0.65 + severityScore * 0.35);
  }

  aggregateThreatLevel(networkRiskScore, threatAggregation) {
    const critical = threatAggregation.find((row) => row.severity === "CRITICAL")?.total ?? 0;
    const high = threatAggregation.find((row) => row.severity === "HIGH")?.total ?? 0;

    if (networkRiskScore >= 76 || critical > 0) return "CRITICAL";
    if (networkRiskScore >= 51 || high > 0) return "HIGH";
    if (networkRiskScore >= 26) return "MEDIUM";
    return "LOW";
  }

  normalizeThreatAggregation(rows) {
    return rows.map((row) => ({
      severity: row.severity,
      total: row.total ?? 0,
      averageScore: roundMetric(row.averageScore ?? 0),
      averageRiskScore: roundMetric(row.averageRiskScore ?? 0),
    }));
  }
}
