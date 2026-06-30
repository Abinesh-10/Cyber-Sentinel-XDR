import { createId } from "../../common/utils/id.js";
import { parseJson, stringifyJson } from "../../common/utils/json.js";

function toHealth(row) {
  if (!row) return null;

  return {
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
  };
}

export class NetworkHealthRepository {
  constructor(db) {
    this.db = db;
  }

  insertSnapshot(input) {
    const id = input.id ?? createId("health");
    const checkedAt = input.checkedAt ?? new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO network_health (
          id, node_id, health_score, status, uptime_percent, throughput_bps,
          packet_loss_pct, latency_ms, active_sessions, open_incidents,
          metrics_json, checked_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.nodeId ?? null,
        input.healthScore,
        input.status,
        input.uptimePercent ?? null,
        input.throughputBps ?? 0,
        input.packetLossPct ?? null,
        input.latencyMs ?? null,
        input.activeSessions ?? 0,
        input.openIncidents ?? 0,
        stringifyJson(input.metrics ?? {}),
        checkedAt,
      );

    return this.getById(id);
  }

  getById(id) {
    return toHealth(this.db.prepare("SELECT * FROM network_health WHERE id = ?").get(id));
  }

  getLatestGlobal() {
    return toHealth(
      this.db
        .prepare(
          "SELECT * FROM network_health WHERE node_id IS NULL ORDER BY checked_at DESC LIMIT 1",
        )
        .get(),
    );
  }

  getLatestForNode(nodeId) {
    return toHealth(
      this.db
        .prepare("SELECT * FROM network_health WHERE node_id = ? ORDER BY checked_at DESC LIMIT 1")
        .get(nodeId),
    );
  }

  clearAll() {
    return this.db.prepare("DELETE FROM network_health").run().changes;
  }
}
