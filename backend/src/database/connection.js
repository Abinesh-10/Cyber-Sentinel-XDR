import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createDatabase(databasePath, { logger } = {}) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const db = new Database(databasePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  logger?.info("database_connected", { databasePath });

  // Load all schemas in dependency order
  const schemas = [
    "network.sql",
    "attacks.sql",
    "alerts.sql",
    "detection.sql",
    "realtime.sql",
    "reports.sql",
    "analytics.sql",
  ];

  for (const schemaFile of schemas) {
    const schemaPath = path.join(__dirname, "schema", schemaFile);
    const schema = fs.readFileSync(schemaPath, "utf8");
    db.exec(schema);
  }

  // Seed nodes matching the frontend NetworkTopology if none exist
  const count = db.prepare("SELECT COUNT(*) as count FROM nodes").get().count;
  if (count === 0) {
    const seedNodes = [
      {
        id: "CORE-01",
        node_key: "node-core-01",
        name: "Core Router",
        type: "ROUTER",
        ip_address: "10.0.0.1",
        subnet: "10.0.0.0/24",
        region: "GLOBAL",
        status: "ONLINE",
        health: "OK",
        risk_score: 12,
      },
      {
        id: "FW-EDGE",
        node_key: "node-fw-edge",
        name: "Firewall Edge",
        type: "FIREWALL",
        ip_address: "10.0.0.2",
        subnet: "10.0.0.0/24",
        region: "US-EAST",
        status: "ONLINE",
        health: "OK",
        risk_score: 5,
      },
      {
        id: "DC-EU-1",
        node_key: "node-dc-eu-1",
        name: "EU Data Center",
        type: "SERVER",
        ip_address: "10.0.1.1",
        subnet: "10.0.1.0/24",
        region: "EU-WEST",
        status: "ONLINE",
        health: "WARN",
        risk_score: 54,
      },
      {
        id: "DC-US-2",
        node_key: "node-dc-us-2",
        name: "US Data Center",
        type: "SERVER",
        ip_address: "10.0.2.1",
        subnet: "10.0.2.0/24",
        region: "US-WEST",
        status: "ONLINE",
        health: "OK",
        risk_score: 15,
      },
      {
        id: "IOT-MESH",
        node_key: "node-iot-mesh",
        name: "IoT Mesh Gateway",
        type: "GATEWAY",
        ip_address: "10.0.3.1",
        subnet: "10.0.3.0/24",
        region: "GLOBAL",
        status: "ONLINE",
        health: "CRIT",
        risk_score: 92,
      },
      {
        id: "SOC-NODE",
        node_key: "node-soc-node",
        name: "SOC Monitoring Node",
        type: "WORKSTATION",
        ip_address: "10.0.4.1",
        subnet: "10.0.4.0/24",
        region: "US-EAST",
        status: "ONLINE",
        health: "OK",
        risk_score: 10,
      },
      {
        id: "CLOUD-AWS",
        node_key: "node-cloud-aws",
        name: "AWS Cloud Gateway",
        type: "GATEWAY",
        ip_address: "10.0.5.1",
        subnet: "10.0.5.0/24",
        region: "GLOBAL",
        status: "ONLINE",
        health: "OK",
        risk_score: 8,
      },
      {
        id: "ENDPOINT",
        node_key: "node-endpoint",
        name: "Endpoints Segment Hub",
        type: "SWITCH",
        ip_address: "10.0.6.1",
        subnet: "10.0.6.0/24",
        region: "US-EAST",
        status: "ONLINE",
        health: "WARN",
        risk_score: 40,
      },
      {
        id: "DB-VAULT",
        node_key: "node-db-vault",
        name: "Database Vault",
        type: "DATABASE",
        ip_address: "10.0.7.1",
        subnet: "10.0.7.0/24",
        region: "US-EAST",
        status: "ONLINE",
        health: "OK",
        risk_score: 18,
      },
    ];

    const stmt = db.prepare(`
      INSERT INTO nodes (
        id, node_key, name, type, ip_address, subnet, region, status, health, risk_score, uptime_seconds, throughput_bps, active_sessions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 12268800, 38200000, 14302)
    `);

    const deviceStmt = db.prepare(`
      INSERT INTO devices (
        id, node_id, device_type, vendor, model, os, firmware, simulated, sensor_version, cpu_load, memory_load, last_seen_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'sentinel-sim-1.0', 12.5, 45.2, datetime('now'))
    `);

    const tx = db.transaction(() => {
      for (const node of seedNodes) {
        stmt.run(
          node.id,
          node.node_key,
          node.name,
          node.type,
          node.ip_address,
          node.subnet,
          node.region,
          node.status,
          node.health,
          node.risk_score,
        );

        deviceStmt.run(
          "dev-" + node.id.toLowerCase(),
          node.id,
          node.type,
          "CyberSentinel Sim Vendor",
          "CS-Sim-v1",
          "SentinelOS",
          "v1.0.4",
        );
      }
    });
    tx();
    logger?.info("database_seeded", { nodes: seedNodes.length });
  }

  return db;
}
