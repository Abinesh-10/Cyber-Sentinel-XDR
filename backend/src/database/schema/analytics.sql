CREATE TABLE IF NOT EXISTS analytics (
  id TEXT PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_scope TEXT NOT NULL CHECK (metric_scope IN ('GLOBAL', 'NODE', 'ATTACK', 'ALERT', 'USER')),
  scope_id TEXT,
  value REAL NOT NULL,
  unit TEXT,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  dimensions_json TEXT CHECK (dimensions_json IS NULL OR json_valid(dimensions_json)),
  computed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_analytics_metric_period ON analytics(metric_name, period_end);
CREATE INDEX IF NOT EXISTS idx_analytics_scope ON analytics(metric_scope, scope_id);
CREATE INDEX IF NOT EXISTS idx_analytics_period ON analytics(period_start, period_end);
