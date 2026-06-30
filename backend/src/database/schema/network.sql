PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  node_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  ip_address TEXT NOT NULL UNIQUE,
  subnet TEXT,
  region TEXT,
  status TEXT NOT NULL DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'DEGRADED', 'COMPROMISED', 'MAINTENANCE')),
  health TEXT NOT NULL DEFAULT 'OK' CHECK (health IN ('OK', 'WARN', 'CRIT')),
  risk_score REAL NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  uptime_seconds INTEGER NOT NULL DEFAULT 0,
  throughput_bps INTEGER NOT NULL DEFAULT 0,
  active_sessions INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT CHECK (metadata_json IS NULL OR json_valid(metadata_json)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL,
  device_type TEXT NOT NULL,
  vendor TEXT,
  model TEXT,
  os TEXT,
  firmware TEXT,
  simulated INTEGER NOT NULL DEFAULT 1 CHECK (simulated IN (0, 1)),
  sensor_version TEXT,
  cpu_load REAL CHECK (cpu_load IS NULL OR (cpu_load >= 0 AND cpu_load <= 100)),
  memory_load REAL CHECK (memory_load IS NULL OR (memory_load >= 0 AND memory_load <= 100)),
  last_seen_at TEXT,
  metadata_json TEXT CHECK (metadata_json IS NULL OR json_valid(metadata_json)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS connections (
  id TEXT PRIMARY KEY,
  source_node_id TEXT NOT NULL,
  dest_node_id TEXT NOT NULL,
  protocol TEXT,
  bandwidth_bps INTEGER,
  latency_ms REAL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DEGRADED', 'DOWN')),
  metadata_json TEXT CHECK (metadata_json IS NULL OR json_valid(metadata_json)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_node_id) REFERENCES nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (dest_node_id) REFERENCES nodes(id) ON DELETE CASCADE,
  CHECK (source_node_id <> dest_node_id),
  UNIQUE (source_node_id, dest_node_id, protocol)
);

CREATE TABLE IF NOT EXISTS traffic_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  source_ip TEXT NOT NULL,
  dest_ip TEXT NOT NULL,
  source_node_id TEXT,
  dest_node_id TEXT,
  protocol TEXT NOT NULL,
  src_port INTEGER CHECK (src_port IS NULL OR (src_port >= 0 AND src_port <= 65535)),
  dst_port INTEGER CHECK (dst_port IS NULL OR (dst_port >= 0 AND dst_port <= 65535)),
  bytes_in INTEGER NOT NULL DEFAULT 0,
  bytes_out INTEGER NOT NULL DEFAULT 0,
  packets INTEGER NOT NULL DEFAULT 0,
  direction TEXT CHECK (direction IS NULL OR direction IN ('INBOUND', 'OUTBOUND', 'INTERNAL')),
  flags TEXT,
  status TEXT NOT NULL DEFAULT 'ALLOWED' CHECK (status IN ('ALLOWED', 'BLOCKED', 'DROPPED', 'MIRRORED')),
  attack_id TEXT,
  anomaly_score REAL NOT NULL DEFAULT 0 CHECK (anomaly_score >= 0 AND anomaly_score <= 100),
  metadata_json TEXT CHECK (metadata_json IS NULL OR json_valid(metadata_json)),
  FOREIGN KEY (source_node_id) REFERENCES nodes(id) ON DELETE SET NULL,
  FOREIGN KEY (dest_node_id) REFERENCES nodes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS network_health (
  id TEXT PRIMARY KEY,
  node_id TEXT,
  health_score REAL NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
  status TEXT NOT NULL CHECK (status IN ('OK', 'WARN', 'CRIT', 'UNKNOWN')),
  uptime_percent REAL CHECK (uptime_percent IS NULL OR (uptime_percent >= 0 AND uptime_percent <= 100)),
  throughput_bps INTEGER NOT NULL DEFAULT 0,
  packet_loss_pct REAL CHECK (packet_loss_pct IS NULL OR (packet_loss_pct >= 0 AND packet_loss_pct <= 100)),
  latency_ms REAL,
  active_sessions INTEGER NOT NULL DEFAULT 0,
  open_incidents INTEGER NOT NULL DEFAULT 0,
  metrics_json TEXT CHECK (metrics_json IS NULL OR json_valid(metrics_json)),
  checked_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  user_id TEXT,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('USER', 'SYSTEM', 'SERVICE')),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  request_id TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('SUCCESS', 'FAILURE', 'DENIED')),
  before_json TEXT CHECK (before_json IS NULL OR json_valid(before_json)),
  after_json TEXT CHECK (after_json IS NULL OR json_valid(after_json)),
  metadata_json TEXT CHECK (metadata_json IS NULL OR json_valid(metadata_json))
);

CREATE INDEX IF NOT EXISTS idx_nodes_type_status ON nodes(type, status);
CREATE INDEX IF NOT EXISTS idx_nodes_health ON nodes(health);
CREATE INDEX IF NOT EXISTS idx_nodes_region ON nodes(region);
CREATE INDEX IF NOT EXISTS idx_devices_node_id ON devices(node_id);
CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(device_type);
CREATE INDEX IF NOT EXISTS idx_connections_source ON connections(source_node_id);
CREATE INDEX IF NOT EXISTS idx_connections_dest ON connections(dest_node_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
CREATE INDEX IF NOT EXISTS idx_traffic_timestamp ON traffic_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_traffic_source_ip ON traffic_logs(source_ip);
CREATE INDEX IF NOT EXISTS idx_traffic_dest_ip ON traffic_logs(dest_ip);
CREATE INDEX IF NOT EXISTS idx_traffic_source_node_time ON traffic_logs(source_node_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_traffic_dest_node_time ON traffic_logs(dest_node_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_traffic_protocol ON traffic_logs(protocol);
CREATE INDEX IF NOT EXISTS idx_network_health_checked_at ON network_health(checked_at);
CREATE INDEX IF NOT EXISTS idx_network_health_node_status ON network_health(node_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
