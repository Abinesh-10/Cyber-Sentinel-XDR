import { badRequest, notFound } from "../../../common/http/errors.js";
import { AlertEvents } from "../events/AlertEvents.js";
import { AlertStatus, assertValidSeverity, assertValidStatus } from "./AlertStatus.js";

export class AlertService {
  constructor({
    alertRepository,
    threatScoreRepository,
    attackRepository,
    nodeRepository,
    auditRepository,
    eventBus,
  }) {
    this.alertRepository = alertRepository;
    this.threatScoreRepository = threatScoreRepository;
    this.attackRepository = attackRepository;
    this.nodeRepository = nodeRepository;
    this.auditRepository = auditRepository;
    this.eventBus = eventBus;
  }

  createFromThreatScore(threatScoreId, context = {}) {
    const threatScore = this.threatScoreRepository.getById(threatScoreId);
    if (!threatScore) throw notFound("Threat score not found");

    if (threatScore.alertId) {
      const existingAlert = this.alertRepository.getById(threatScore.alertId);
      if (existingAlert) return existingAlert;
    }

    const factors = threatScore.factors ?? {};
    const attack = threatScore.attackId
      ? this.attackRepository.getById(threatScore.attackId)
      : null;
    const targetNodeId =
      threatScore.nodeId ?? factors.targetNodeId ?? factors.targetNode?.id ?? null;
    const targetNode = targetNodeId ? this.nodeRepository.getById(targetNodeId) : null;
    const attackType = factors.attackType ?? attack?.attackType ?? null;
    const sourceIp = factors.sourceIp ?? factors.sourceIps?.[0] ?? attack?.sourceIp ?? null;
    const destIp = factors.targetIp ?? targetNode?.ipAddress ?? attack?.destIp ?? null;

    const alert = this.alertRepository.create({
      sourceIp,
      destIp,
      sourceNodeId: null,
      destNodeId: targetNodeId,
      attackId: threatScore.attackId,
      attackType,
      severity: threatScore.severity,
      status: AlertStatus.OPEN,
      title: this.buildTitle(threatScore, attackType, targetNode),
      description: this.buildDescription(threatScore, attackType, targetNode),
      threatScore: threatScore.score,
      riskScore: threatScore.riskScore,
      recommendations: this.buildRecommendations(threatScore),
      history: [
        {
          action: "CREATED_FROM_THREAT_SCORE",
          threatScoreId,
          severity: threatScore.severity,
          status: AlertStatus.OPEN,
          actorType: context.actorType ?? "SYSTEM",
          userId: context.userId ?? null,
          timestamp: new Date().toISOString(),
        },
      ],
    });

    this.threatScoreRepository.linkAlert(threatScoreId, alert.id);
    this.audit("ALERT_CREATED_FROM_THREAT_SCORE", alert.id, null, alert, context);
    this.emitCreated(alert);

    return alert;
  }

  createAlert(input, context = {}) {
    this.validateAlertPayload(input);

    const alert = this.alertRepository.create({
      sourceIp: input.sourceIp ?? null,
      destIp: input.destIp ?? null,
      sourceNodeId: input.sourceNodeId ?? null,
      destNodeId: input.targetNodeId ?? input.destNodeId ?? null,
      attackId: input.attackId ?? null,
      attackType: input.threatType ?? input.attackType ?? null,
      severity: input.severity,
      status: input.status ?? AlertStatus.OPEN,
      title: input.title ?? `${input.severity} threat alert`,
      description: input.description ?? null,
      threatScore: input.threatScore ?? 0,
      riskScore: input.riskScore ?? input.threatScore ?? 0,
      recommendations: input.recommendations ?? [],
      history: [
        {
          action: "CREATED",
          severity: input.severity,
          status: input.status ?? AlertStatus.OPEN,
          actorType: context.actorType ?? "SYSTEM",
          userId: context.userId ?? null,
          timestamp: new Date().toISOString(),
        },
      ],
    });

    this.audit("ALERT_CREATED", alert.id, null, alert, context);
    this.emitCreated(alert);

    return alert;
  }

  getAlert(id) {
    const alert = this.alertRepository.getById(id);
    if (!alert) throw notFound("Alert not found");
    return alert;
  }

  listAlerts(filters = {}) {
    this.validateFilters(filters);
    return this.alertRepository.list(filters);
  }

  listPreviousAlerts(filters = {}) {
    return this.listAlerts(filters);
  }

  getHistory(alertId) {
    return this.getAlert(alertId).history ?? [];
  }

  updateStatus(alertId, input, context = {}) {
    if (!input?.status) throw badRequest("status is required");

    try {
      assertValidStatus(input.status);
    } catch (error) {
      throw badRequest(error.message);
    }

    const before = this.getAlert(alertId);
    const updated = this.alertRepository.updateStatus(alertId, {
      status: input.status,
      notes: input.notes,
      ownerUserId: input.ownerUserId,
      actorType: context.actorType ?? "SYSTEM",
      userId: context.userId,
    });

    this.audit("ALERT_STATUS_UPDATED", alertId, before, updated, context);
    this.eventBus.emitAlertEvent(AlertEvents.ALERT_STATUS_CHANGED, {
      before,
      alert: updated,
    });
    this.emitMetrics();

    return updated;
  }

  appendHistory(alertId, entry, context = {}) {
    const before = this.getAlert(alertId);
    const updated = this.alertRepository.appendHistory(alertId, {
      action: entry.action ?? "NOTE_ADDED",
      notes: entry.notes ?? null,
      actorType: context.actorType ?? "SYSTEM",
      userId: context.userId ?? null,
    });

    this.audit("ALERT_HISTORY_APPENDED", alertId, before, updated, context);
    this.eventBus.emitAlertEvent(AlertEvents.ALERT_HISTORY_APPENDED, {
      alert: updated,
      entry: updated.history.at(-1),
    });

    return updated;
  }

  getMetrics() {
    return this.alertRepository.getMetrics();
  }

  validateAlertPayload(input) {
    if (!input || typeof input !== "object") {
      throw badRequest("Alert payload must be an object");
    }

    if (!input.severity) throw badRequest("severity is required");

    try {
      assertValidSeverity(input.severity);
      assertValidStatus(input.status ?? AlertStatus.OPEN);
    } catch (error) {
      throw badRequest(error.message);
    }
  }

  validateFilters(filters) {
    try {
      if (filters.severity) assertValidSeverity(filters.severity);
      if (filters.status) assertValidStatus(filters.status);
    } catch (error) {
      throw badRequest(error.message);
    }
  }

  buildTitle(threatScore, attackType, targetNode) {
    const nodeLabel =
      targetNode?.nodeKey ?? targetNode?.name ?? threatScore.nodeId ?? "unknown target";
    return `${threatScore.severity} ${attackType ?? "THREAT"} detected on ${nodeLabel}`;
  }

  buildDescription(threatScore, attackType, targetNode) {
    const nodeLabel =
      targetNode?.name ?? targetNode?.nodeKey ?? threatScore.nodeId ?? "unknown target";
    const sourceIp = threatScore.factors?.sourceIp ?? "unknown source";
    return `Threat detection classified ${attackType ?? "unknown activity"} as ${threatScore.severity} with score ${threatScore.score}. Source IP: ${sourceIp}. Target node: ${nodeLabel}.`;
  }

  buildRecommendations(threatScore) {
    const base = ["Review related traffic logs", "Validate affected node state"];

    if (threatScore.severity === "CRITICAL") {
      return [
        "Move alert to investigating immediately",
        "Isolate affected node if confirmed",
        ...base,
      ];
    }

    if (threatScore.severity === "HIGH") {
      return ["Assign analyst owner", "Correlate attack and threat score evidence", ...base];
    }

    return base;
  }

  emitCreated(alert) {
    this.eventBus.emitAlertEvent(AlertEvents.ALERT_CREATED, { alert });
    this.emitMetrics();
  }

  emitMetrics() {
    this.eventBus.emitAlertEvent(AlertEvents.ALERT_METRICS_UPDATED, {
      metrics: this.getMetrics(),
    });
  }

  audit(action, entityId, before, after, context) {
    this.auditRepository.record({
      actorType: context.actorType ?? "SYSTEM",
      userId: context.userId,
      action,
      entityType: "ALERT",
      entityId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
      outcome: context.outcome ?? "SUCCESS",
      before,
      after,
      metadata: context.metadata ?? {},
    });
  }
}
