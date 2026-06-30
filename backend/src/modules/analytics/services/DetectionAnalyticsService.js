import { percentage, roundMetric } from "./ScoreMath.js";

export class DetectionAnalyticsService {
  constructor({ analyticsRepository }) {
    this.analyticsRepository = analyticsRepository;
  }

  calculate(period) {
    const detections = this.analyticsRepository.getDetectionCounts(period);
    const outcomes = this.analyticsRepository.getAlertOutcomeCounts(period);
    const totalDetections = detections.totalDetections ?? 0;
    const falsePositives = outcomes.falsePositives ?? 0;
    const truePositives = outcomes.truePositives ?? Math.max(0, totalDetections - falsePositives);
    const adjudicated = truePositives + falsePositives;
    const detectionAccuracy = adjudicated
      ? percentage(truePositives, adjudicated)
      : roundMetric((detections.averageConfidence ?? 0) * 100);
    const truePositiveRate = adjudicated ? percentage(truePositives, adjudicated) : 0;
    const falsePositiveRate = adjudicated ? percentage(falsePositives, adjudicated) : 0;

    return {
      totalDetections,
      criticalDetections: detections.criticalDetections ?? 0,
      highDetections: detections.highDetections ?? 0,
      averageConfidence: roundMetric(detections.averageConfidence ?? 0, 3),
      averageThreatScore: roundMetric(detections.averageScore ?? 0),
      averageRiskScore: roundMetric(detections.averageRiskScore ?? 0),
      totalAlerts: outcomes.totalAlerts ?? 0,
      truePositives,
      falsePositives,
      resolvedAlerts: outcomes.resolvedAlerts ?? 0,
      criticalAlerts: outcomes.criticalAlerts ?? 0,
      detectionAccuracy,
      truePositiveRate,
      falsePositiveRate,
    };
  }
}
