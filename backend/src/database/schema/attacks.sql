CREATE TABLE IF NOT EXISTS attacks (
  id TEXT PRIMARY KEY,
  attack_type TEXT NOT NULL CHECK (attack_type IN ('DDOS', 'PORT_SCAN', 'BRUTE_FORCE', 'PACKET_SNIFFING', 'MALWARE_PROPAGATION')),
  name TEXT NOT NULL,
  lifecycle_status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (
    lifecycle_status IN ('QUEUED', 'INITIALIZING', 'RUNNING', 'DETECTED', 'MITIGATING', 'BLOCKED', 'COMPLETED', 'FAILED', 'CANCELLED')
  ),
  source_ip TEXT,
  dest_ip TEXT,
  source_node_id TEXT,
  target_node_id TEXT,
  severity TEXT NOT NULL DEFAULT 'LOW' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  vector TEXT,
  intensity REAL NOT NULL DEFAULT 0 CHECK (intensity >= 0 AND intensity <= 100),
  started_at TEXT,
  ended_at TEXT,
  metadata_json TEXT CHECK (metadata_json IS NULL OR json_valid(metadata_json)),
  metrics_json TEXT CHECK (metrics_json IS NULL OR json_valid(metrics_json)),
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_node_id) REFERENCES nodes(id) ON DELETE SET NULL,
  FOREIGN KEY (target_node_id) REFERENCES nodes(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_attacks_type_status ON attacks(attack_type, lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_attacks_started_at ON attacks(started_at);
CREATE INDEX IF NOT EXISTS idx_attacks_target_node ON attacks(target_node_id);
CREATE INDEX IF NOT EXISTS idx_attacks_severity ON attacks(severity);
