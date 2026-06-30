import { createId } from "../../common/utils/id.js";
import { parseJson, stringifyJson } from "../../common/utils/json.js";
import { ensureReportSchema } from "../../modules/reports/database/ensureReportSchema.js";

function toReport(row) {
  if (!row) return null;

  return {
    id: row.id,
    reportKey: row.report_key,
    type: row.type,
    format: row.format,
    status: row.status,
    title: row.title,
    rangeStart: row.range_start,
    rangeEnd: row.range_end,
    contentJson: parseJson(row.content_json, null),
    contentText: row.content_text,
    sizeBytes: row.size_bytes,
    generatedBy: row.generated_by,
    generatedAt: row.generated_at,
    parameters: parseJson(row.parameters_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ReportRepository {
  constructor(db) {
    this.db = db;
    ensureReportSchema(db);
  }

  create(input) {
    const id = input.id ?? createId("report");
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO reports (
          id, report_key, type, format, status, title, range_start, range_end,
          content_json, content_text, size_bytes, generated_by, generated_at,
          parameters_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.reportKey,
        input.type ?? "SECURITY_REPORT",
        input.format,
        input.status ?? "COMPLETED",
        input.title,
        input.rangeStart,
        input.rangeEnd,
        input.contentJson ? stringifyJson(input.contentJson) : null,
        input.contentText ?? null,
        input.sizeBytes ?? 0,
        input.generatedBy ?? null,
        input.generatedAt ?? now,
        stringifyJson(input.parameters ?? {}),
        now,
        now,
      );

    return this.getById(id);
  }

  getById(id) {
    return toReport(this.db.prepare("SELECT * FROM reports WHERE id = ?").get(id));
  }

  list(filters = {}) {
    const where = [];
    const params = [];

    if (filters.type) {
      where.push("type = ?");
      params.push(filters.type);
    }

    if (filters.format) {
      where.push("format = ?");
      params.push(filters.format);
    }

    if (filters.status) {
      where.push("status = ?");
      params.push(filters.status);
    }

    const limit = Math.min(Number.parseInt(filters.limit ?? "100", 10) || 100, 500);

    return this.db
      .prepare(
        `SELECT * FROM reports
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY generated_at DESC, created_at DESC
        LIMIT ?`,
      )
      .all(...params, limit)
      .map(toReport);
  }
}
