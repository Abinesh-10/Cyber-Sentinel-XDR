import { createId } from "../../common/utils/id.js";
import { stringifyJson } from "../../common/utils/json.js";

export class AuditRepository {
  constructor(db) {
    this.db = db;
  }

  record(input) {
    const id = input.id ?? createId("audit");

    this.db
      .prepare(
        `INSERT INTO audit_logs (
          id, timestamp, user_id, actor_type, action, entity_type, entity_id,
          ip_address, user_agent, request_id, outcome, before_json,
          after_json, metadata_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.timestamp ?? new Date().toISOString(),
        input.userId ?? null,
        input.actorType ?? "SYSTEM",
        input.action,
        input.entityType,
        input.entityId ?? null,
        input.ipAddress ?? null,
        input.userAgent ?? null,
        input.requestId ?? null,
        input.outcome ?? "SUCCESS",
        stringifyJson(input.before ?? null),
        stringifyJson(input.after ?? null),
        stringifyJson(input.metadata ?? {}),
      );

    return { id };
  }
}
