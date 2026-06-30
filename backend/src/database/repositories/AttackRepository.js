import { createId } from "../../common/utils/id.js";
import { parseJson, stringifyJson } from "../../common/utils/json.js";
import { ensureAttackSchema } from "../../modules/attacks/database/ensureAttackSchema.js";

function toAttack(row) {
  if (!row) return null;

  return {
    id: row.id,
    attackType: row.attack_type,
    name: row.name,
    lifecycleStatus: row.lifecycle_status,
    sourceIp: row.source_ip,
    destIp: row.dest_ip,
    sourceNodeId: row.source_node_id,
    targetNodeId: row.target_node_id,
    severity: row.severity,
    vector: row.vector,
    intensity: row.intensity,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    metadata: parseJson(row.metadata_json, {}),
    metrics: parseJson(row.metrics_json, {}),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toTrafficLog(row) {
  if (!row) return null;

  return {
    id: row.id,
    timestamp: row.timestamp,
    sourceIp: row.source_ip,
    destIp: row.dest_ip,
    sourceNodeId: row.source_node_id,
    destNodeId: row.dest_node_id,
    protocol: row.protocol,
    srcPort: row.src_port,
    dstPort: row.dst_port,
    bytesIn: row.bytes_in,
    bytesOut: row.bytes_out,
    packets: row.packets,
    direction: row.direction,
    flags: row.flags,
    status: row.status,
    attackId: row.attack_id,
    anomalyScore: row.anomaly_score,
    metadata: parseJson(row.metadata_json, {}),
  };
}

export class AttackRepository {
  constructor(db) {
    this.db = db;
    ensureAttackSchema(db);
  }

  create(input) {
    const id = input.id ?? createId("attack");
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO attacks (
          id, attack_type, name, lifecycle_status, source_ip, dest_ip,
          source_node_id, target_node_id, severity, vector, intensity,
          started_at, ended_at, metadata_json, metrics_json, created_by,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.attackType,
        input.name,
        input.lifecycleStatus ?? "QUEUED",
        input.sourceIp ?? null,
        input.destIp ?? null,
        input.sourceNodeId ?? null,
        input.targetNodeId ?? null,
        input.severity ?? "LOW",
        input.vector ?? null,
        input.intensity ?? 0,
        input.startedAt ?? null,
        input.endedAt ?? null,
        stringifyJson(input.metadata ?? {}),
        stringifyJson(input.metrics ?? {}),
        input.createdBy ?? null,
        now,
        now,
      );

    return this.getById(id);
  }

  updateLifecycle(id, input) {
    this.db
      .prepare(
        `UPDATE attacks SET
          lifecycle_status = ?,
          severity = ?,
          ended_at = ?,
          metadata_json = ?,
          metrics_json = ?,
          updated_at = ?
        WHERE id = ?`,
      )
      .run(
        input.lifecycleStatus,
        input.severity,
        input.endedAt ?? null,
        stringifyJson(input.metadata ?? {}),
        stringifyJson(input.metrics ?? {}),
        new Date().toISOString(),
        id,
      );

    return this.getById(id);
  }

  getById(id) {
    return toAttack(this.db.prepare("SELECT * FROM attacks WHERE id = ?").get(id));
  }

  list(filters = {}) {
    const where = [];
    const params = [];

    if (filters.attackType) {
      where.push("attack_type = ?");
      params.push(filters.attackType);
    }

    if (filters.lifecycleStatus) {
      where.push("lifecycle_status = ?");
      params.push(filters.lifecycleStatus);
    }

    if (filters.targetNodeId) {
      where.push("target_node_id = ?");
      params.push(filters.targetNodeId);
    }

    if (filters.severity) {
      where.push("severity = ?");
      params.push(filters.severity);
    }

    const limit = Math.min(Number.parseInt(filters.limit ?? "100", 10) || 100, 500);

    return this.db
      .prepare(
        `SELECT * FROM attacks
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY created_at DESC
        LIMIT ?`,
      )
      .all(...params, limit)
      .map(toAttack);
  }

  getTrafficLogs(attackId, limit = 200) {
    return this.db
      .prepare("SELECT * FROM traffic_logs WHERE attack_id = ? ORDER BY timestamp DESC LIMIT ?")
      .all(attackId, limit)
      .map(toTrafficLog);
  }
}
