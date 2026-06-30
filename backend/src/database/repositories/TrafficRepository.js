import { createId } from "../../common/utils/id.js";
import { parseJson, stringifyJson } from "../../common/utils/json.js";

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

export class TrafficRepository {
  constructor(db) {
    this.db = db;
    this.insertStatement = db.prepare(
      `INSERT INTO traffic_logs (
        id, timestamp, source_ip, dest_ip, source_node_id, dest_node_id,
        protocol, src_port, dst_port, bytes_in, bytes_out, packets,
        direction, flags, status, attack_id, anomaly_score, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
  }

  insert(input) {
    const row = this.normalizeInput(input);
    this.insertStatement.run(
      row.id,
      row.timestamp,
      row.sourceIp,
      row.destIp,
      row.sourceNodeId,
      row.destNodeId,
      row.protocol,
      row.srcPort,
      row.dstPort,
      row.bytesIn,
      row.bytesOut,
      row.packets,
      row.direction,
      row.flags,
      row.status,
      row.attackId,
      row.anomalyScore,
      stringifyJson(row.metadata),
    );
    return row;
  }

  bulkInsert(logs) {
    const transaction = this.db.transaction((items) => items.map((item) => this.insert(item)));
    return transaction(logs);
  }

  listRecent(limit = 100) {
    return this.db
      .prepare("SELECT * FROM traffic_logs ORDER BY timestamp DESC LIMIT ?")
      .all(limit)
      .map(toTrafficLog);
  }

  getStats(filters = {}) {
    if (filters.nodeId) {
      const row = this.db
        .prepare(
          `SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN dest_node_id = ? THEN 1 ELSE 0 END) AS inbound,
            SUM(CASE WHEN source_node_id = ? THEN 1 ELSE 0 END) AS outbound,
            SUM(CASE WHEN direction = 'INTERNAL' THEN 1 ELSE 0 END) AS internal,
            COALESCE(SUM(packets), 0) AS packets,
            COALESCE(SUM(bytes_in + bytes_out), 0) AS bytes
          FROM traffic_logs
          WHERE source_node_id = ? OR dest_node_id = ?`,
        )
        .get(filters.nodeId, filters.nodeId, filters.nodeId, filters.nodeId);

      return this.toStats(row);
    }

    const row = this.db
      .prepare(
        `SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN direction = 'INBOUND' THEN 1 ELSE 0 END) AS inbound,
          SUM(CASE WHEN direction = 'OUTBOUND' THEN 1 ELSE 0 END) AS outbound,
          SUM(CASE WHEN direction = 'INTERNAL' THEN 1 ELSE 0 END) AS internal,
          COALESCE(SUM(packets), 0) AS packets,
          COALESCE(SUM(bytes_in + bytes_out), 0) AS bytes
        FROM traffic_logs`,
      )
      .get();

    return this.toStats(row);
  }

  getProtocolStats() {
    return this.db
      .prepare(
        `SELECT protocol, COUNT(*) AS count, COALESCE(SUM(bytes_in + bytes_out), 0) AS bytes
        FROM traffic_logs
        GROUP BY protocol
        ORDER BY count DESC`,
      )
      .all();
  }

  deleteForNode(nodeId) {
    return this.db
      .prepare("DELETE FROM traffic_logs WHERE source_node_id = ? OR dest_node_id = ?")
      .run(nodeId, nodeId).changes;
  }

  clearAll() {
    return this.db.prepare("DELETE FROM traffic_logs").run().changes;
  }

  normalizeInput(input) {
    return {
      id: input.id ?? createId("traffic"),
      timestamp: input.timestamp ?? new Date().toISOString(),
      sourceIp: input.sourceIp,
      destIp: input.destIp,
      sourceNodeId: input.sourceNodeId ?? null,
      destNodeId: input.destNodeId ?? null,
      protocol: input.protocol,
      srcPort: input.srcPort ?? null,
      dstPort: input.dstPort ?? null,
      bytesIn: input.bytesIn ?? 0,
      bytesOut: input.bytesOut ?? 0,
      packets: input.packets ?? 0,
      direction: input.direction ?? null,
      flags: input.flags ?? null,
      status: input.status ?? "ALLOWED",
      attackId: input.attackId ?? null,
      anomalyScore: input.anomalyScore ?? 0,
      metadata: input.metadata ?? {},
    };
  }

  toStats(row) {
    return {
      total: row?.total ?? 0,
      inbound: row?.inbound ?? 0,
      outbound: row?.outbound ?? 0,
      internal: row?.internal ?? 0,
      packets: row?.packets ?? 0,
      bytes: row?.bytes ?? 0,
    };
  }
}
