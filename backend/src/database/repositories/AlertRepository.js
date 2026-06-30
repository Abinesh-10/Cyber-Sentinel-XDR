import { createId } from "../../common/utils/id.js";
import { parseJson, stringifyJson } from "../../common/utils/json.js";
import { ensureAlertSchema } from "../../modules/alerts/database/ensureAlertSchema.js";

function toAlert(row) {
  if (!row) return null;

  return {
    id: row.id,
    alertKey: row.alert_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sourceIp: row.source_ip,
    destIp: row.dest_ip,
    sourceNodeId: row.source_node_id,
    destNodeId: row.dest_node_id,
    attackId: row.attack_id,
    attackType: row.attack_type,
    severity: row.severity,
    status: row.status,
    title: row.title,
    description: row.description,
    threatScore: row.threat_score,
    riskScore: row.risk_score,
    ownerUserId: row.owner_user_id,
    acknowledgedBy: row.acknowledged_by,
    acknowledgedAt: row.acknowledged_at,
    resolvedAt: row.resolved_at,
    playbookStatus: row.playbook_status,
    recommendations: parseJson(row.recommendations_json, []),
    history: parseJson(row.history_json, []),
  };
}

export class AlertRepository {
  constructor(db) {
    this.db = db;
    ensureAlertSchema(db);
  }

  create(input) {
    const id = input.id ?? createId("alert");
    const alertKey = input.alertKey ?? createAlertKey();
    const now = input.createdAt ?? new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO alerts (
          id, alert_key, created_at, updated_at, source_ip, dest_ip,
          source_node_id, dest_node_id, attack_id, attack_type, severity,
          status, title, description, threat_score, risk_score,
          owner_user_id, acknowledged_by, acknowledged_at, resolved_at,
          playbook_status, recommendations_json, history_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        alertKey,
        now,
        now,
        input.sourceIp ?? null,
        input.destIp ?? null,
        input.sourceNodeId ?? null,
        input.destNodeId ?? null,
        input.attackId ?? null,
        input.attackType ?? null,
        input.severity,
        input.status ?? "OPEN",
        input.title,
        input.description ?? null,
        input.threatScore ?? 0,
        input.riskScore ?? 0,
        input.ownerUserId ?? null,
        input.acknowledgedBy ?? null,
        input.acknowledgedAt ?? null,
        input.resolvedAt ?? null,
        input.playbookStatus ?? null,
        stringifyJson(input.recommendations ?? []),
        stringifyJson(input.history ?? []),
      );

    return this.getById(id);
  }

  getById(id) {
    return toAlert(this.db.prepare("SELECT * FROM alerts WHERE id = ?").get(id));
  }

  getByAttackId(attackId) {
    return this.db
      .prepare("SELECT * FROM alerts WHERE attack_id = ? ORDER BY created_at DESC")
      .all(attackId)
      .map(toAlert);
  }

  list(filters = {}) {
    const where = [];
    const params = [];

    if (filters.severity) {
      where.push("severity = ?");
      params.push(filters.severity);
    }

    if (filters.status) {
      where.push("status = ?");
      params.push(filters.status);
    }

    if (filters.attackType) {
      where.push("attack_type = ?");
      params.push(filters.attackType);
    }

    if (filters.attackId) {
      where.push("attack_id = ?");
      params.push(filters.attackId);
    }

    if (filters.nodeId) {
      where.push("(source_node_id = ? OR dest_node_id = ?)");
      params.push(filters.nodeId, filters.nodeId);
    }

    const limit = Math.min(Number.parseInt(filters.limit ?? "100", 10) || 100, 500);

    return this.db
      .prepare(
        `SELECT * FROM alerts
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY created_at DESC
        LIMIT ?`,
      )
      .all(...params, limit)
      .map(toAlert);
  }

  updateStatus(id, input) {
    const existing = this.getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const history = [
      ...(existing.history ?? []),
      {
        action: "STATUS_CHANGED",
        from: existing.status,
        to: input.status,
        notes: input.notes ?? null,
        actorType: input.actorType ?? "SYSTEM",
        userId: input.userId ?? null,
        timestamp: now,
      },
    ];
    const resolvedAt =
      input.status === "RESOLVED" || input.status === "IGNORED" ? now : existing.resolvedAt;
    const acknowledgedAt =
      input.status === "INVESTIGATING" && !existing.acknowledgedAt ? now : existing.acknowledgedAt;

    this.db
      .prepare(
        `UPDATE alerts SET
          status = ?,
          owner_user_id = ?,
          acknowledged_by = ?,
          acknowledged_at = ?,
          resolved_at = ?,
          history_json = ?,
          updated_at = ?
        WHERE id = ?`,
      )
      .run(
        input.status,
        input.ownerUserId ?? existing.ownerUserId,
        input.userId ?? existing.acknowledgedBy,
        acknowledgedAt,
        resolvedAt,
        stringifyJson(history),
        now,
        id,
      );

    return this.getById(id);
  }

  appendHistory(id, entry) {
    const existing = this.getById(id);
    if (!existing) return null;

    const history = [
      ...(existing.history ?? []),
      {
        ...entry,
        timestamp: entry.timestamp ?? new Date().toISOString(),
      },
    ];

    this.db
      .prepare("UPDATE alerts SET history_json = ?, updated_at = ? WHERE id = ?")
      .run(stringifyJson(history), new Date().toISOString(), id);

    return this.getById(id);
  }

  getMetrics() {
    const row = this.db
      .prepare(
        `SELECT
          COUNT(*) AS total_alerts,
          SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) AS critical_alerts,
          SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) AS resolved_alerts,
          SUM(CASE WHEN status IN ('OPEN', 'INVESTIGATING') THEN 1 ELSE 0 END) AS active_alerts,
          SUM(CASE WHEN status = 'IGNORED' THEN 1 ELSE 0 END) AS ignored_alerts
        FROM alerts`,
      )
      .get();

    return {
      totalAlerts: row.total_alerts ?? 0,
      criticalAlerts: row.critical_alerts ?? 0,
      resolvedAlerts: row.resolved_alerts ?? 0,
      activeAlerts: row.active_alerts ?? 0,
      ignoredAlerts: row.ignored_alerts ?? 0,
    };
  }
}

function createAlertKey() {
  const suffix = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `ALERT-${Date.now()}-${suffix}`;
}
