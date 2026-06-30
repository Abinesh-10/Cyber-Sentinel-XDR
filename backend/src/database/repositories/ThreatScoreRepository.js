import { createId } from "../../common/utils/id.js";
import { parseJson, stringifyJson } from "../../common/utils/json.js";
import { ensureDetectionSchema } from "../../modules/detection/database/ensureDetectionSchema.js";

function toThreatScore(row) {
  if (!row) return null;

  return {
    id: row.id,
    nodeId: row.node_id,
    attackId: row.attack_id,
    alertId: row.alert_id,
    score: row.score,
    riskScore: row.risk_score,
    severity: row.severity,
    confidence: row.confidence,
    modelVersion: row.model_version,
    factors: parseJson(row.factors_json, {}),
    computedAt: row.computed_at,
  };
}

export class ThreatScoreRepository {
  constructor(db) {
    this.db = db;
    ensureDetectionSchema(db);
  }

  create(input) {
    const id = input.id ?? createId("score");
    const computedAt = input.computedAt ?? new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO threat_scores (
          id, node_id, attack_id, alert_id, score, risk_score, severity,
          confidence, model_version, factors_json, computed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.nodeId ?? null,
        input.attackId ?? null,
        input.alertId ?? null,
        input.score,
        input.riskScore,
        input.severity,
        input.confidence ?? 0,
        input.modelVersion ?? null,
        stringifyJson(input.factors ?? {}),
        computedAt,
      );

    return this.getById(id);
  }

  getById(id) {
    return toThreatScore(this.db.prepare("SELECT * FROM threat_scores WHERE id = ?").get(id));
  }

  getLatestForAttack(attackId) {
    return toThreatScore(
      this.db
        .prepare(
          "SELECT * FROM threat_scores WHERE attack_id = ? ORDER BY computed_at DESC LIMIT 1",
        )
        .get(attackId),
    );
  }

  linkAlert(threatScoreId, alertId) {
    this.db
      .prepare("UPDATE threat_scores SET alert_id = ? WHERE id = ?")
      .run(alertId, threatScoreId);

    return this.getById(threatScoreId);
  }

  list(filters = {}) {
    const where = [];
    const params = [];

    if (filters.attackId) {
      where.push("attack_id = ?");
      params.push(filters.attackId);
    }

    if (filters.nodeId) {
      where.push("node_id = ?");
      params.push(filters.nodeId);
    }

    if (filters.severity) {
      where.push("severity = ?");
      params.push(filters.severity);
    }

    const limit = Math.min(Number.parseInt(filters.limit ?? "100", 10) || 100, 500);

    return this.db
      .prepare(
        `SELECT * FROM threat_scores
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY computed_at DESC
        LIMIT ?`,
      )
      .all(...params, limit)
      .map(toThreatScore);
  }
}
