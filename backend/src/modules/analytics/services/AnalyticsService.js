import { AnalyticsEvents } from "../events/AnalyticsEvents.js";
import { bucketForPeriod, normalizePeriod } from "./AnalyticsPeriod.js";

export class AnalyticsService {
  constructor({
    analyticsRepository,
    attackAnalyticsService,
    detectionAnalyticsService,
    networkAnalyticsService,
    riskScoringService,
    healthMonitoringService,
    auditRepository,
    eventBus,
  }) {
    this.analyticsRepository = analyticsRepository;
    this.attackAnalyticsService = attackAnalyticsService;
    this.detectionAnalyticsService = detectionAnalyticsService;
    this.networkAnalyticsService = networkAnalyticsService;
    this.riskScoringService = riskScoringService;
    this.healthMonitoringService = healthMonitoringService;
    this.auditRepository = auditRepository;
    this.eventBus = eventBus;
  }

  computeSnapshot(input = {}, context = {}) {
    const period = normalizePeriod(input.period);
    const bucket = input.bucket ?? bucketForPeriod(period);

    this.eventBus.emitAnalyticsEvent(AnalyticsEvents.SNAPSHOT_STARTED, {
      period,
      bucket,
    });

    try {
      const snapshot = {
        period,
        bucket,
        computedAt: new Date().toISOString(),
        attacks: this.attackAnalyticsService.calculate(period, bucket),
        detections: this.detectionAnalyticsService.calculate(period),
        network: this.networkAnalyticsService.calculate(period),
        risk: this.riskScoringService.calculate(period),
        health: this.healthMonitoringService.calculate(period),
      };

      this.eventBus.emitAnalyticsEvent(AnalyticsEvents.SNAPSHOT_COMPUTED, {
        period,
        bucket,
        summary: this.snapshotSummary(snapshot),
      });

      const storedSnapshots = input.store === false ? [] : this.storeSnapshot(snapshot);

      if (storedSnapshots.length) {
        this.audit(
          "ANALYTICS_SNAPSHOT_STORED",
          null,
          null,
          { storedCount: storedSnapshots.length },
          context,
        );
        this.eventBus.emitAnalyticsEvent(AnalyticsEvents.SNAPSHOT_STORED, {
          period,
          storedCount: storedSnapshots.length,
        });
      }

      return {
        ...snapshot,
        storedSnapshots,
      };
    } catch (error) {
      this.eventBus.emitAnalyticsEvent(AnalyticsEvents.SNAPSHOT_FAILED, {
        period,
        bucket,
        error: error.message,
      });
      this.audit(
        "ANALYTICS_SNAPSHOT_FAILED",
        null,
        null,
        { error: error.message },
        {
          ...context,
          outcome: "FAILURE",
        },
      );
      throw error;
    }
  }

  listSnapshots(filters = {}) {
    return this.analyticsRepository.listSnapshots(filters);
  }

  storeSnapshot(snapshot) {
    const rows = this.buildSnapshotRows(snapshot);
    return this.analyticsRepository.createSnapshots(rows);
  }

  buildSnapshotRows(snapshot) {
    const { period } = snapshot;
    const base = {
      periodStart: period.start,
      periodEnd: period.end,
      computedAt: snapshot.computedAt,
    };

    const rows = [
      metric("total_attacks", snapshot.attacks.totalAttacks, "count", {
        totalByType: snapshot.attacks.totalByType,
        frequency: snapshot.attacks.frequency,
        bucket: snapshot.bucket,
      }),
      metric(
        "detection_accuracy",
        snapshot.detections.detectionAccuracy,
        "percent",
        snapshot.detections,
      ),
      metric("false_positives", snapshot.detections.falsePositives, "count", snapshot.detections),
      metric(
        "true_positive_rate",
        snapshot.detections.truePositiveRate,
        "percent",
        snapshot.detections,
      ),
      metric("network_risk_score", snapshot.risk.networkRiskScore, "score", {
        threatLevel: snapshot.risk.threatLevel,
        threatLevelAggregation: snapshot.risk.threatLevelAggregation,
      }),
      metric(
        "network_health_score",
        snapshot.health.overallNetworkHealthScore,
        "score",
        snapshot.health.performanceMetrics,
      ),
      metric("total_alerts", snapshot.detections.totalAlerts, "count", snapshot.detections),
      metric("critical_alerts", snapshot.detections.criticalAlerts, "count", snapshot.detections),
    ].map((row) => ({ ...base, ...row }));

    for (const item of snapshot.attacks.totalByType) {
      rows.push({
        ...base,
        metricName: "attack_count_by_type",
        metricScope: "ATTACK",
        scopeId: item.attackType,
        value: item.total,
        unit: "count",
        dimensions: item,
      });
    }

    for (const node of snapshot.risk.nodeRiskScores) {
      rows.push({
        ...base,
        metricName: "node_risk_score",
        metricScope: "NODE",
        scopeId: node.nodeId,
        value: node.riskScore,
        unit: "score",
        dimensions: node,
      });
    }

    if (snapshot.network.mostTargetedNode) {
      rows.push({
        ...base,
        metricName: "most_targeted_node",
        metricScope: "NODE",
        scopeId: snapshot.network.mostTargetedNode.nodeId,
        value: snapshot.network.mostTargetedNode.attackCount ?? 0,
        unit: "count",
        dimensions: snapshot.network.mostTargetedNode,
      });
    }

    if (snapshot.network.mostVulnerableIp) {
      rows.push({
        ...base,
        metricName: "most_vulnerable_ip",
        metricScope: "NODE",
        scopeId: snapshot.network.mostVulnerableIp.nodeId,
        value: snapshot.network.mostVulnerableIp.averageRiskScore ?? 0,
        unit: "score",
        dimensions: snapshot.network.mostVulnerableIp,
      });
    }

    return rows;
  }

  snapshotSummary(snapshot) {
    return {
      totalAttacks: snapshot.attacks.totalAttacks,
      detectionAccuracy: snapshot.detections.detectionAccuracy,
      networkRiskScore: snapshot.risk.networkRiskScore,
      threatLevel: snapshot.risk.threatLevel,
      networkHealthScore: snapshot.health.overallNetworkHealthScore,
    };
  }

  audit(action, entityId, before, after, context) {
    this.auditRepository.record({
      actorType: context.actorType ?? "SYSTEM",
      userId: context.userId,
      action,
      entityType: "ANALYTICS",
      entityId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
      outcome: context.outcome ?? "SUCCESS",
      before,
      after,
      metadata: context.metadata ?? {},
    });
  }
}

function metric(metricName, value, unit, dimensions = {}) {
  return {
    metricName,
    metricScope: "GLOBAL",
    scopeId: null,
    value,
    unit,
    dimensions,
  };
}
