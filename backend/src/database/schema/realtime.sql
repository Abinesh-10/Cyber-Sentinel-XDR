CREATE TABLE IF NOT EXISTS websocket_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('NODE', 'TRAFFIC', 'ATTACK', 'ALERT', 'ANALYTICS', 'REPORT', 'SYSTEM', 'THREAT')),
  room TEXT,
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  correlation_id TEXT,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  ack_required INTEGER NOT NULL DEFAULT 0 CHECK (ack_required IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'EMITTED' CHECK (status IN ('QUEUED', 'EMITTED', 'ACKED', 'FAILED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_websocket_events_created_at ON websocket_events(created_at);
CREATE INDEX IF NOT EXISTS idx_websocket_events_event_name ON websocket_events(event_name);
CREATE INDEX IF NOT EXISTS idx_websocket_events_correlation_id ON websocket_events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_websocket_events_room ON websocket_events(room);
