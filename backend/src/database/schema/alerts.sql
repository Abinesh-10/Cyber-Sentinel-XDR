CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  alert_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  source_ip TEXT,
  dest_ip TEXT,
  source_node_id TEXT,
  dest_node_id TEXT,
  attack_id TEXT,
  attack_type TEXT CHECK (attack_type IS NULL OR attack_type IN ('DDOS', 'PORT_SCAN', 'BRUTE_FORCE', 'PACKET_SNIFFING', 'MALWARE_PROPAGATION')),
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'IGNORED')),
  title TEXT NOT NULL,
  description TEXT,
  threat_score REAL NOT NULL DEFAULT 0 CHECK (threat_score >= 0 AND threat_score <= 100),
  risk_score REAL NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  owner_user_id TEXT,
  acknowledged_by TEXT,
  acknowledged_at TEXT,
  resolved_at TEXT,
  playbook_status TEXT CHECK (playbook_status IS NULL OR playbook_status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED')),
  recommendations_json TEXT CHECK (recommendations_json IS NULL OR json_valid(recommendations_json)),
  history_json TEXT CHECK (history_json IS NULL OR json_valid(history_json)),
  FOREIGN KEY (source_node_id) REFERENCES nodes(id) ON DELETE SET NULL,
  FOREIGN KEY (dest_node_id) REFERENCES nodes(id) ON DELETE SET NULL,
  FOREIGN KEY (attack_id) REFERENCES attacks(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_alerts_severity_status_created ON alerts(severity, status, created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_attack_id ON alerts(attack_id);
CREATE INDEX IF NOT EXISTS idx_alerts_source_node ON alerts(source_node_id);
CREATE INDEX IF NOT EXISTS idx_alerts_dest_node ON alerts(dest_node_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
