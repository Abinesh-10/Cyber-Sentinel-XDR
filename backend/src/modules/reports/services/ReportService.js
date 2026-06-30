import fs from "node:fs";
import path from "node:path";

export class ReportService {
  constructor({ reportRepository, analyticsModule, reportsDirectory }) {
    this.reportRepository = reportRepository;
    this.analyticsModule = analyticsModule;
    this.reportsDirectory = reportsDirectory;
  }

  listReports(filters = {}) {
    return this.reportRepository.list(filters);
  }

  getReport(id) {
    return this.reportRepository.getById(id);
  }

  generateSecurityReports(input = {}, context = {}) {
    const now = new Date();
    const rangeEnd = now.toISOString();
    const rangeStart = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const snapshot = this.analyticsModule.services.analyticsService.computeSnapshot({
      period: { start: rangeStart, end: rangeEnd },
      store: false,
    });

    const alerts = this.analyticsModule.repositories.alertRepository.list({ limit: "50" });
    const attacks = this.analyticsModule.repositories.attackRepository.list({ limit: "50" });

    const reportKey = `security-report-${Date.now()}`;
    const title = `Security Report ${now.toISOString().slice(0, 10)}`;

    const contentJson = {
      generatedAt: now.toISOString(),
      rangeStart,
      rangeEnd,
      summary: {
        totalAttacks: snapshot.attacks.totalAttacks,
        detectionAccuracy: snapshot.detections.detectionAccuracy,
        networkRiskScore: snapshot.risk.networkRiskScore,
        threatLevel: snapshot.risk.threatLevel,
        networkHealthScore: snapshot.health.overallNetworkHealthScore,
      },
      analytics: snapshot,
      recentAlerts: alerts.slice(0, 20),
      recentAttacks: attacks.slice(0, 20),
    };

    const contentText = buildTextReport({ title, rangeStart, rangeEnd, snapshot, alerts, attacks, now });

    fs.mkdirSync(this.reportsDirectory, { recursive: true });

    const jsonFile = path.join(this.reportsDirectory, `${reportKey}.json`);
    const txtFile = path.join(this.reportsDirectory, `${reportKey}.txt`);
    const jsonContent = JSON.stringify(contentJson, null, 2);

    fs.writeFileSync(jsonFile, jsonContent, "utf8");
    fs.writeFileSync(txtFile, contentText, "utf8");

    const generatedAt = now.toISOString();
    const generatedBy = context.userId ?? context.actorType ?? "API";

    const jsonReport = this.reportRepository.create({
      reportKey: `${reportKey}-json`,
      type: "SECURITY_REPORT",
      format: "JSON",
      title,
      rangeStart,
      rangeEnd,
      contentJson,
      sizeBytes: Buffer.byteLength(jsonContent, "utf8"),
      generatedBy,
      generatedAt,
      parameters: input,
    });

    const txtReport = this.reportRepository.create({
      reportKey: `${reportKey}-txt`,
      type: "SECURITY_REPORT",
      format: "TXT",
      title,
      rangeStart,
      rangeEnd,
      contentText,
      sizeBytes: Buffer.byteLength(contentText, "utf8"),
      generatedBy,
      generatedAt,
      parameters: input,
    });

    return { reports: [jsonReport, txtReport] };
  }
}

function buildTextReport({ title, rangeStart, rangeEnd, snapshot, alerts, attacks, now }) {
  const line = "=".repeat(60);
  const divider = "-".repeat(40);

  const attackLines = attacks.slice(0, 20).map(
    (a) => `  [${a.severity}] ${a.attackType} - ${a.name} (${a.lifecycleStatus}) @ ${a.createdAt}`
  );

  const alertLines = alerts.slice(0, 20).map(
    (a) => `  [${a.severity}] ${a.title} (${a.status}) @ ${a.createdAt}`
  );

  return [
    line,
    title,
    line,
    `Generated At : ${now.toISOString()}`,
    `Period Start : ${rangeStart}`,
    `Period End   : ${rangeEnd}`,
    "",
    "SUMMARY",
    divider,
    `Total Attacks       : ${snapshot.attacks.totalAttacks}`,
    `Detection Accuracy  : ${snapshot.detections.detectionAccuracy}%`,
    `Network Risk Score  : ${snapshot.risk.networkRiskScore}`,
    `Threat Level        : ${snapshot.risk.threatLevel}`,
    `Network Health      : ${snapshot.health.overallNetworkHealthScore}`,
    "",
    `RECENT ATTACKS (${attackLines.length})`,
    divider,
    ...(attackLines.length ? attackLines : ["  None"]),
    "",
    `RECENT ALERTS (${alertLines.length})`,
    divider,
    ...(alertLines.length ? alertLines : ["  None"]),
    "",
    line,
    "END OF REPORT",
    line,
  ].join("\n");
}
