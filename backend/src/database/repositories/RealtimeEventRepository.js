import { createId } from "../../common/utils/id.js";
import { parseJson, stringifyJson } from "../../common/utils/json.js";
import { ensureRealtimeSchema } from "../../modules/realtime/database/ensureRealtimeSchema.js";

function toRealtimeEvent(row) {
  if (!row) return null;

  return {
    id: row.id,
    eventName: row.event_name,
    eventType: row.event_type,
    room: row.room,
    payload: parseJson(row.payload_json, {}),
    correlationId: row.correlation_id,
    deliveredCount: row.delivered_count,
    ackRequired: Boolean(row.ack_required),
    status: row.status,
    createdAt: row.created_at,
  };
}

export class RealtimeEventRepository {
  constructor(db) {
    this.db = db;
    ensureRealtimeSchema(db);
  }

  create(input) {
    const id = input.id ?? createId("ws");
    const createdAt = input.createdAt ?? new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO websocket_events (
          id, event_name, event_type, room, payload_json, correlation_id,
          delivered_count, ack_required, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.eventName,
        input.eventType,
        input.room ?? null,
        stringifyJson(input.payload ?? {}),
        input.correlationId ?? null,
        input.deliveredCount ?? 0,
        input.ackRequired ? 1 : 0,
        input.status ?? "EMITTED",
        createdAt,
      );

    return this.getById(id);
  }

  getById(id) {
    return toRealtimeEvent(this.db.prepare("SELECT * FROM websocket_events WHERE id = ?").get(id));
  }

  listRecent(limit = 100) {
    return this.db
      .prepare("SELECT * FROM websocket_events ORDER BY created_at DESC LIMIT ?")
      .all(Math.min(limit, 500))
      .map(toRealtimeEvent);
  }
}
