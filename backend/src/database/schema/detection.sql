CREATE TABLE IF NOT EXISTS threat_scores (
  id TEXT PRIMARY KEY,
  node_id TEXT,
  attack_id TEXT,
  alert_id TEXT,
  score REAL NOT NULL CHECK (score >= 0 AND score <= 100),
  risk_score REAL NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  confidence REAL NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  model_version TEXT,
  factors_json TEXT CHECK (factors_json IS NULL OR json_valid(factors_json)),
  computed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE SET NULL,
  FOREIGN KEY (attack_id) REFERENCES attacks(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_threat_scores_computed_at ON threat_scores(computed_at);
CREATE INDEX IF NOT EXISTS idx_threat_scores_node_id ON threat_scores(node_id);
CREATE INDEX IF NOT EXISTS idx_threat_scores_attack_id ON threat_scores(attack_id);
CREATE INDEX IF NOT EXISTS idx_threat_scores_alert_id ON threat_scores(alert_id);
CREATE INDEX IF NOT EXISTS idx_threat_scores_severity ON threat_scores(severity);
