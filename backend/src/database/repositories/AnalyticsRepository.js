import { createId } from "../../common/utils/id.js";
import { parseJson, stringifyJson } from "../../common/utils/json.js";
import { ensureAnalyticsSchema } from "../../modules/analytics/database/ensureAnalyticsSchema.js";

function toSnapshot(row) {
  if (!row) return null;

  return {
    id: row.id,
    metricName: row.metric_name,
    metricScope: row.metric_scope,
    scopeId: row.scope_id,
    value: row.value,
    unit: row.unit,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    dimensions: parseJson(row.dimensions_json, {}),
    computedAt: row.computed_at,
  };
}

export class AnalyticsRepository {
  constructor(db) {
    this.db = db;
    ensureAnalyticsSchema(db);
  }

  createSnapshot(input) {
    const id = input.id ?? createId("analytics");
    const computedAt = input.computedAt ?? new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO analytics (
          id, metric_name, metric_scope, scope_id, value, unit,
          period_start, period_end, dimensions_json, computed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.metricName,
        input.metricScope ?? "GLOBAL",
        input.scopeId ?? null,
        input.value,
        input.unit ?? null,
        input.periodStart,
        input.periodEnd,
        stringifyJson(input.dimensions ?? {}),
        computedAt,
      );

    return this.getById(id);
  }

  createSnapshots(items) {
    const transaction = this.db.transaction((snapshots) =>
      snapshots.map((item) => this.createSnapshot(item)),
    );
    return transaction(items);
  }

  getById(id) {
    return toSnapshot(this.db.prepare("SELECT * FROM analytics WHERE id = ?").get(id));
  }

  listSnapshots(filters = {}) {
    const where = [];
    const params = [];

    if (filters.metricName) {
      where.push("metric_name = ?");
      params.push(filters.metricName);
    }

    if (filters.metricScope) {
      where.push("metric_scope = ?");
      params.push(filters.metricScope);
    }

    if (filters.scopeId) {
      where.push("scope_id = ?");
      params.push(filters.scopeId);
    }

    const limit = Math.min(Number.parseInt(filters.limit ?? "100", 10) || 100, 500);

    return this.db
      .prepare(
        `SELECT * FROM analytics
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY computed_at DESC
        LIMIT ?`,
      )
      .all(...params, limit)
      .map(toSnapshot);
  }

  getAttackCountsByType(period) {
    return this.db
      .prepare(
        `SELECT attack_type AS attackType, COUNT(*) AS total
        FROM attacks
        WHERE created_at >= ? AND created_at <= ?
        GROUP BY attack_type
        ORDER BY total DESC`,
      )
      .all(period.start, period.end);
  }

  getAttackFrequency(period, bucket = "hour") {
    const format = bucket === "day" ? "%Y-%m-%d" : "%Y-%m-%dT%H:00:00";

    return this.db
      .prepare(
        `SELECT strftime(?, created_at) AS bucket, attack_type AS attackType, COUNT(*) AS total
        FROM attacks
        WHERE created_at >= ? AND created_at <= ?
        GROUP BY bucket, attack_type
        ORDER BY bucket ASC`,
      )
      .all(format, period.start, period.end);
  }

  getDetectionCounts(period) {
    return this.db
      .prepare(
        `SELECT
          COUNT(*) AS totalDetections,
          SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) AS criticalDetections,
          SUM(CASE WHEN severity = 'HIGH' THEN 1 ELSE 0 END) AS highDetections,
          AVG(confidence) AS averageConfidence,
          AVG(score) AS averageScore,
          AVG(risk_score) AS averageRiskScore
        FROM threat_scores
        WHERE computed_at >= ? AND computed_at <= ?`,
      )
      .get(period.start, period.end);
  }

  getAlertOutcomeCounts(period) {
    return this.db
      .prepare(
        `SELECT
          COUNT(*) AS totalAlerts,
          SUM(CASE WHEN status = 'IGNORED' THEN 1 ELSE 0 END) AS falsePositives,
          SUM(CASE WHEN status IN ('OPEN', 'INVESTIGATING', 'RESOLVED') THEN 1 ELSE 0 END) AS truePositives,
          SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) AS resolvedAlerts,
          SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) AS criticalAlerts
        FROM alerts
        WHERE created_at >= ? AND created_at <= ?`,
      )
      .get(period.start, period.end);
  }

  getMostTargetedNode(period) {
    return this.db
      .prepare(
        `SELECT
          n.id AS nodeId,
          n.node_key AS nodeKey,
          n.name AS nodeName,
          n.ip_address AS ipAddress,
          COUNT(a.id) AS attackCount
        FROM attacks a
        LEFT JOIN nodes n ON n.id = a.target_node_id
        WHERE a.created_at >= ? AND a.created_at <= ? AND a.target_node_id IS NOT NULL
        GROUP BY a.target_node_id
        ORDER BY attackCount DESC
        LIMIT 1`,
      )
      .get(period.start, period.end);
  }

  getMostVulnerableIp(period) {
    return this.db
      .prepare(
        `SELECT
          n.id AS nodeId,
          n.node_key AS nodeKey,
          n.name AS nodeName,
          n.ip_address AS ipAddress,
          AVG(ts.risk_score) AS averageRiskScore,
          MAX(ts.risk_score) AS maxRiskScore,
          COUNT(ts.id) AS threatCount
        FROM threat_scores ts
        LEFT JOIN nodes n ON n.id = ts.node_id
        WHERE ts.computed_at >= ? AND ts.computed_at <= ? AND ts.node_id IS NOT NULL
        GROUP BY ts.node_id
        ORDER BY averageRiskScore DESC, threatCount DESC
        LIMIT 1`,
      )
      .get(period.start, period.end);
  }

  getTrafficDistribution(period) {
    return this.db
      .prepare(
        `SELECT
          direction,
          protocol,
          COUNT(*) AS flowCount,
          COALESCE(SUM(packets), 0) AS packets,
          COALESCE(SUM(bytes_in + bytes_out), 0) AS bytes
        FROM traffic_logs
        WHERE timestamp >= ? AND timestamp <= ?
        GROUP BY direction, protocol
        ORDER BY flowCount DESC`,
      )
      .all(period.start, period.end);
  }

  getNodeTrafficDistribution(period) {
    return this.db
      .prepare(
        `SELECT
          n.id AS nodeId,
          n.node_key AS nodeKey,
          n.name AS nodeName,
          n.ip_address AS ipAddress,
          COUNT(t.id) AS flowCount,
          COALESCE(SUM(t.packets), 0) AS packets,
          COALESCE(SUM(t.bytes_in + t.bytes_out), 0) AS bytes
        FROM nodes n
        LEFT JOIN traffic_logs t ON (t.source_node_id = n.id OR t.dest_node_id = n.id)
          AND t.timestamp >= ? AND t.timestamp <= ?
        GROUP BY n.id
        ORDER BY flowCount DESC`,
      )
      .all(period.start, period.end);
  }

  getNodeRiskScores(period) {
    return this.db
      .prepare(
        `SELECT
          n.id AS nodeId,
          n.node_key AS nodeKey,
          n.name AS nodeName,
          n.ip_address AS ipAddress,
          n.status,
          n.health,
          n.risk_score AS storedRiskScore,
          COALESCE(AVG(ts.risk_score), 0) AS averageThreatRisk,
          COALESCE(MAX(ts.risk_score), 0) AS maxThreatRisk,
          COUNT(ts.id) AS threatCount
        FROM nodes n
        LEFT JOIN threat_scores ts ON ts.node_id = n.id
          AND ts.computed_at >= ? AND ts.computed_at <= ?
        GROUP BY n.id
        ORDER BY maxThreatRisk DESC, averageThreatRisk DESC`,
      )
      .all(period.start, period.end);
  }

  getThreatLevelAggregation(period) {
    return this.db
      .prepare(
        `SELECT severity, COUNT(*) AS total, AVG(score) AS averageScore, AVG(risk_score) AS averageRiskScore
        FROM threat_scores
        WHERE computed_at >= ? AND computed_at <= ?
        GROUP BY severity
        ORDER BY total DESC`,
      )
      .all(period.start, period.end);
  }

  getLatestNetworkHealth() {
    return this.db
      .prepare(
        "SELECT * FROM network_health WHERE node_id IS NULL ORDER BY checked_at DESC LIMIT 1",
      )
      .get();
  }

  getLatestNodeHealth() {
    return this.db
      .prepare(
        `SELECT nh.*
        FROM network_health nh
        INNER JOIN (
          SELECT node_id, MAX(checked_at) AS checked_at
          FROM network_health
          WHERE node_id IS NOT NULL
          GROUP BY node_id
        ) latest ON latest.node_id = nh.node_id AND latest.checked_at = nh.checked_at`,
      )
      .all();
  }

  getPerformanceMetrics(period) {
    return this.db
      .prepare(
        `SELECT
          COALESCE(AVG(latency_ms), 0) AS averageLatencyMs,
          COALESCE(AVG(packet_loss_pct), 0) AS averagePacketLossPct,
          COALESCE(AVG(throughput_bps), 0) AS averageThroughputBps,
          COALESCE(MAX(throughput_bps), 0) AS peakThroughputBps,
          COALESCE(AVG(active_sessions), 0) AS averageActiveSessions
        FROM network_health
        WHERE checked_at >= ? AND checked_at <= ?`,
      )
      .get(period.start, period.end);
  }
}
