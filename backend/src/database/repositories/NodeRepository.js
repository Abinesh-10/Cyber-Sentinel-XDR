import { createId, createNodeKey } from "../../common/utils/id.js";
import { parseJson, stringifyJson } from "../../common/utils/json.js";

function toNode(row) {
  if (!row) return null;

  return {
    id: row.id,
    nodeKey: row.node_key,
    name: row.name,
    type: row.type,
    ipAddress: row.ip_address,
    subnet: row.subnet,
    region: row.region,
    status: row.status,
    health: row.health,
    riskScore: row.risk_score,
    uptimeSeconds: row.uptime_seconds,
    throughputBps: row.throughput_bps,
    activeSessions: row.active_sessions,
    trafficCount: row.traffic_count ?? 0,
    inboundTrafficCount: row.inbound_traffic_count ?? 0,
    outboundTrafficCount: row.outbound_traffic_count ?? 0,
    metadata: parseJson(row.metadata_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDevice(row) {
  if (!row) return null;

  return {
    id: row.id,
    nodeId: row.node_id,
    deviceType: row.device_type,
    vendor: row.vendor,
    model: row.model,
    os: row.os,
    firmware: row.firmware,
    simulated: Boolean(row.simulated),
    sensorVersion: row.sensor_version,
    cpuLoad: row.cpu_load,
    memoryLoad: row.memory_load,
    lastSeenAt: row.last_seen_at,
    metadata: parseJson(row.metadata_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function healthForStatus(status) {
  if (status === "OFFLINE" || status === "COMPROMISED") return "CRIT";
  if (status === "DEGRADED" || status === "MAINTENANCE") return "WARN";
  return "OK";
}

export class NodeRepository {
  constructor(db) {
    this.db = db;
  }

  create(input) {
    const now = new Date().toISOString();
    const nodeId = createId("node");
    const deviceId = createId("device");
    const status = input.status ?? "ONLINE";
    const health = input.health ?? healthForStatus(status);
    const nodeKey = input.nodeKey ?? createNodeKey();
    const name = input.deviceName ?? input.name;
    const type = input.deviceType ?? input.type;

    const transaction = this.db.transaction(() => {
      this.db
        .prepare(
          `INSERT INTO nodes (
            id, node_key, name, type, ip_address, subnet, region, status,
            health, risk_score, uptime_seconds, throughput_bps,
            active_sessions, metadata_json, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          nodeId,
          nodeKey,
          name,
          type,
          input.ipAddress,
          input.subnet ?? null,
          input.region ?? null,
          status,
          health,
          input.riskScore ?? 0,
          input.uptimeSeconds ?? 0,
          input.throughputBps ?? 0,
          input.activeSessions ?? 0,
          stringifyJson(input.metadata ?? {}),
          now,
          now,
        );

      this.db
        .prepare(
          `INSERT INTO devices (
            id, node_id, device_type, vendor, model, os, firmware,
            simulated, sensor_version, cpu_load, memory_load, last_seen_at,
            metadata_json, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          deviceId,
          nodeId,
          type,
          input.vendor ?? null,
          input.model ?? null,
          input.os ?? null,
          input.firmware ?? null,
          input.simulated === false ? 0 : 1,
          input.sensorVersion ?? "sentinel-sim-1.0",
          input.cpuLoad ?? 0,
          input.memoryLoad ?? 0,
          now,
          stringifyJson(input.deviceMetadata ?? {}),
          now,
          now,
        );
    });

    transaction();
    return this.getById(nodeId);
  }

  list(filters = {}) {
    const where = [];
    const params = [];

    if (filters.status) {
      where.push("n.status = ?");
      params.push(filters.status);
    }

    if (filters.health) {
      where.push("n.health = ?");
      params.push(filters.health);
    }

    if (filters.type) {
      where.push("n.type = ?");
      params.push(filters.type);
    }

    const sql = `
      SELECT
        n.*,
        COUNT(t.id) AS traffic_count,
        SUM(CASE WHEN t.dest_node_id = n.id THEN 1 ELSE 0 END) AS inbound_traffic_count,
        SUM(CASE WHEN t.source_node_id = n.id THEN 1 ELSE 0 END) AS outbound_traffic_count
      FROM nodes n
      LEFT JOIN traffic_logs t ON t.source_node_id = n.id OR t.dest_node_id = n.id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      GROUP BY n.id
      ORDER BY n.created_at DESC
    `;

    return this.db
      .prepare(sql)
      .all(...params)
      .map(toNode);
  }

  getById(id) {
    const node = this.db
      .prepare(
        `SELECT
          n.*,
          COUNT(t.id) AS traffic_count,
          SUM(CASE WHEN t.dest_node_id = n.id THEN 1 ELSE 0 END) AS inbound_traffic_count,
          SUM(CASE WHEN t.source_node_id = n.id THEN 1 ELSE 0 END) AS outbound_traffic_count
        FROM nodes n
        LEFT JOIN traffic_logs t ON t.source_node_id = n.id OR t.dest_node_id = n.id
        WHERE n.id = ?
        GROUP BY n.id`,
      )
      .get(id);

    if (!node) return null;

    const device = this.db.prepare("SELECT * FROM devices WHERE node_id = ?").get(id);
    return {
      ...toNode(node),
      device: toDevice(device),
    };
  }

  getByIp(ipAddress) {
    const row = this.db.prepare("SELECT * FROM nodes WHERE ip_address = ?").get(ipAddress);
    return toNode(row);
  }

  update(id, input) {
    const existing = this.getById(id);
    if (!existing) return null;

    const status = input.status ?? existing.status;
    const health = input.health ?? healthForStatus(status);
    const now = new Date().toISOString();

    this.db
      .prepare(
        `UPDATE nodes SET
          name = ?,
          type = ?,
          ip_address = ?,
          subnet = ?,
          region = ?,
          status = ?,
          health = ?,
          risk_score = ?,
          metadata_json = ?,
          updated_at = ?
        WHERE id = ?`,
      )
      .run(
        input.deviceName ?? input.name ?? existing.name,
        input.deviceType ?? input.type ?? existing.type,
        input.ipAddress ?? existing.ipAddress,
        input.subnet ?? existing.subnet,
        input.region ?? existing.region,
        status,
        health,
        input.riskScore ?? existing.riskScore,
        stringifyJson(input.metadata ?? existing.metadata ?? {}),
        now,
        id,
      );

    if (input.deviceType || input.vendor || input.model || input.os || input.firmware) {
      this.db
        .prepare(
          `UPDATE devices SET
            device_type = ?,
            vendor = ?,
            model = ?,
            os = ?,
            firmware = ?,
            updated_at = ?
          WHERE node_id = ?`,
        )
        .run(
          input.deviceType ?? input.type ?? existing.device?.deviceType ?? existing.type,
          input.vendor ?? existing.device?.vendor ?? null,
          input.model ?? existing.device?.model ?? null,
          input.os ?? existing.device?.os ?? null,
          input.firmware ?? existing.device?.firmware ?? null,
          now,
          id,
        );
    }

    return this.getById(id);
  }

  updateRuntimeMetrics(id, metrics) {
    this.db
      .prepare(
        `UPDATE nodes SET
          uptime_seconds = uptime_seconds + ?,
          throughput_bps = ?,
          active_sessions = ?,
          updated_at = ?
        WHERE id = ?`,
      )
      .run(
        metrics.uptimeIncrementSeconds ?? 0,
        metrics.throughputBps ?? 0,
        metrics.activeSessions ?? 0,
        new Date().toISOString(),
        id,
      );

    return this.getById(id);
  }

  reset(id) {
    const existing = this.getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE nodes SET
          status = 'ONLINE',
          health = 'OK',
          risk_score = 0,
          throughput_bps = 0,
          active_sessions = 0,
          updated_at = ?
        WHERE id = ?`,
      )
      .run(now, id);

    return this.getById(id);
  }

  delete(id) {
    const result = this.db.prepare("DELETE FROM nodes WHERE id = ?").run(id);
    return result.changes > 0;
  }
}
