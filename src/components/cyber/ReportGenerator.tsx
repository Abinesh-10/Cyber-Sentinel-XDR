import { motion } from "framer-motion";
import { Download, FileText, Printer, FileSpreadsheet } from "lucide-react";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../../lib/api/client";
import { SectionHeader } from "./SectionHeader";

type ReportCard = {
  id: string;
  name: string;
  range: string;
  pages: number;
  size: string;
  backendId?: string;
};
type BackendReport = {
  id: string;
  reportKey?: string;
  title?: string;
  rangeStart?: string;
  rangeEnd?: string;
  contentJson?: unknown;
  contentText?: string | null;
  sizeBytes?: number;
  format?: string;
};
type GenerateReportsResult = {
  files?: {
    json?: { fileName?: string; sizeBytes?: number };
    txt?: { fileName?: string; sizeBytes?: number };
  };
  databaseRecords?: {
    json?: BackendReport;
    txt?: BackendReport;
  };
};

const reports: ReportCard[] = [
  {
    id: "RPT-2049-A",
    name: "Weekly Threat Posture Audit",
    range: "May 24 — May 31, 2026",
    pages: 42,
    size: "3.4 MB",
  },
  { id: "RPT-2049-B", name: "Executive CISO Risk Brief", range: "Q2 2026", pages: 18, size: "1.1 MB" },
  {
    id: "RPT-2049-C",
    name: "Compliance Report · SOC 2 + ISO 27001",
    range: "Continuous Monitoring",
    pages: 96,
    size: "8.7 MB",
  },
  {
    id: "RPT-2049-D",
    name: "Adversary Profile · APT-EMBER Recon",
    range: "Last 90 days telemetry",
    pages: 27,
    size: "2.2 MB",
  },
];

interface ReportGeneratorProps {
  activeIncident?: {
    id: string;
    code: string;
    level: string;
    title: string;
    status: string;
    actions: string[];
    owner: string;
    timestamp: string;
    dataLossGb?: number;
    recordsExposed?: number;
    financialDamage?: number;
    impactLevel?: string;
    whatHappened?: string;
    whyDetected?: string;
    rootCause?: string;
    potentialImpact?: string;
  };
  onClose?: () => void;
}

export function ReportGenerator({ activeIncident, onClose }: ReportGeneratorProps) {
  const [reportCards, setReportCards] = useState<ReportCard[]>(reports);
  const [exportingId, setExportingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    apiGet<BackendReport[]>("/reports")
      .then((backendReports) => {
        if (!mounted || !backendReports.length) return;
        setReportCards(backendReports.map(reportToCard).slice(0, 4));
      })
      .catch((error) => {
        console.error("Failed to load reports", error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function exportReport(report: ReportCard) {
    setExportingId(report.id);

    try {
      if (report.backendId) {
        const existing = await apiGet<BackendReport>(`/reports/${report.backendId}`);
        downloadBackendReport(existing);
        return;
      }

      const generated = await apiPost<GenerateReportsResult>("/reports/generate", {
        period: "24h",
      });
      const txtRecord = generated.databaseRecords?.txt;
      const jsonRecord = generated.databaseRecords?.json;
      downloadBackendReport(
        txtRecord ?? jsonRecord,
        generated.files?.txt?.fileName ?? generated.files?.json?.fileName,
      );
      const latest = await apiGet<BackendReport[]>("/reports");
      if (latest.length) setReportCards(latest.map(reportToCard).slice(0, 4));
    } catch (error) {
      console.error("Failed to export report", error);
    } finally {
      setExportingId(null);
    }
  }

  const triggerPrint = () => {
    window.print();
  };

  // If rendering inside a modal for a specific incident, output the Compiled Forensics page
  if (activeIncident) {
    const formattedDate = new Date(activeIncident.timestamp).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div className="space-y-6 text-foreground font-mono print:text-black print:bg-white print:p-8">
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #print-area, #print-area * {
              visibility: visible;
            }
            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white !important;
              color: black !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}} />

        <div id="print-area" className="space-y-6">
          {/* Header */}
          <div className="border-b-2 border-primary pb-4 flex justify-between items-start print:border-black">
            <div>
              <div className="text-[10px] text-primary uppercase font-bold print:text-black">
                CYBERSENTINEL SECURITY INTELLIGENCE BRIEF
              </div>
              <h2 className="text-xl font-bold font-display uppercase mt-1 print:text-black">
                Incident Forensic Summary · {activeIncident.code}
              </h2>
              <span className="text-[10px] text-muted-foreground block print:text-black">
                Generated: {new Date().toLocaleString()} · Security Classification: CONFIDENTIAL
              </span>
            </div>
            <div className="text-right font-mono text-xs print:text-black">
              <span className={`px-2.5 py-1 border rounded font-bold uppercase ${
                activeIncident.level === "CRITICAL"
                  ? "border-red-600 bg-red-600/10 text-red-500 print:text-black print:border-black"
                  : "border-amber-500 bg-amber-500/10 text-amber-500 print:text-black print:border-black"
              }`}>
                {activeIncident.level}
              </span>
            </div>
          </div>

          {/* Metadata Matrix */}
          <div className="grid grid-cols-2 gap-4 border border-border/80 p-4 bg-black/30 rounded print:border-black print:bg-transparent print:text-black print:grid-cols-2">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Intrusion Vector</p>
              <p className="text-xs font-bold text-foreground mt-0.5 print:text-black">{activeIncident.title}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Incident Timestamp</p>
              <p className="text-xs font-bold text-foreground mt-0.5 print:text-black">{formattedDate}</p>
            </div>
            <div className="mt-2">
              <p className="text-[10px] text-muted-foreground uppercase">Assigned SOC Lead</p>
              <p className="text-xs font-bold text-foreground mt-0.5 print:text-black">{activeIncident.owner}</p>
            </div>
            <div className="mt-2">
              <p className="text-[10px] text-muted-foreground uppercase">Containment Status</p>
              <p className={`text-xs font-bold mt-0.5 print:text-black ${
                activeIncident.status === "MITIGATED" ? "text-primary print:text-black" : "text-cyber-red print:text-black"
              }`}>
                {activeIncident.status === "MITIGATED" ? "MITIGATED & QUARANTINED" : "ACTIVE CONTAINMENT IN PROGRESS"}
              </p>
            </div>
          </div>

          {/* Narrative Summary */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-primary border-b border-border/40 pb-1 print:text-black print:border-black">
              1. Executive Incident Assessment
            </h4>
            <p className="text-[11.5px] leading-relaxed text-muted-foreground print:text-black">
              {activeIncident.whatHappened ??
                `On ${formattedDate}, the CyberSentinel detection telemetry identified an anomalous signature match indicating a ${activeIncident.level} severity intrusion.`}
            </p>
          </div>

          {/* Root Cause & Vulnerability Assessment */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-primary border-b border-border/40 pb-1 print:text-black print:border-black">
              2. Technical Root Cause & Diagnostics
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed text-muted-foreground print:text-black">
              <div className="border border-border/40 p-3 bg-black/10 rounded print:border-black/20">
                <span className="text-primary font-bold block mb-1 uppercase text-[10px] print:text-black">// Why Detected</span>
                <span>{activeIncident.whyDetected ?? "Triggered baseline anomaly matching engine heuristics."}</span>
              </div>
              <div className="border border-border/40 p-3 bg-black/10 rounded print:border-black/20">
                <span className="text-primary font-bold block mb-1 uppercase text-[10px] print:text-black">// Exploit Vector / Root Cause</span>
                <span>{activeIncident.rootCause ?? "Configuration drift or unpatched port listeners on local interfaces."}</span>
              </div>
            </div>
          </div>

          {/* Blast Radius & Exposure Metrics */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-primary border-b border-border/40 pb-1 print:text-black print:border-black">
              3. Blast Radius & Business Impact Analysis
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-border/60 bg-black/40 p-3 rounded text-center print:border-black print:bg-transparent">
                <span className="text-[9px] text-muted-foreground uppercase block">Exposed Data Volume</span>
                <span className="text-lg font-bold text-cyber-cyan block mt-1 print:text-glow print:text-black">
                  {activeIncident.dataLossGb ?? 1.2} GB
                </span>
              </div>
              <div className="border border-border/60 bg-black/40 p-3 rounded text-center print:border-black print:bg-transparent">
                <span className="text-[9px] text-muted-foreground uppercase block">User Records Leaked</span>
                <span className="text-lg font-bold text-cyber-cyan block mt-1 print:text-glow print:text-black">
                  {(activeIncident.recordsExposed ?? 4500).toLocaleString()}
                </span>
              </div>
              <div className="border border-border/60 bg-black/40 p-3 rounded text-center print:border-black print:bg-transparent">
                <span className="text-[9px] text-muted-foreground uppercase block">Estimated Damages</span>
                <span className="text-lg font-bold text-cyber-red block mt-1 print:text-glow print:text-black">
                  ${(activeIncident.financialDamage ?? 25000).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Chronological Event Log Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-primary border-b border-border/40 pb-1 print:text-black print:border-black">
              4. Chronological Incident Event Timeline
            </h4>
            <div className="space-y-2 font-mono text-[10px]">
              {(() => {
                const baseDate = new Date(activeIncident.timestamp);
                const offsetTime = (ms: number) => new Date(baseDate.getTime() + ms).toLocaleTimeString();
                let timeline = [
                  { time: offsetTime(0), desc: "Initial anomaly detection flag raised by telemetry sensors." },
                  { time: offsetTime(150), desc: "Heuristic classification engine mapped vector to security rules." },
                  { time: offsetTime(600), desc: "Automated alert package dispatched to SOC Command Center dashboard." }
                ];

                if (activeIncident.code.includes("ATK.001")) {
                  timeline = [
                    { time: offsetTime(0), desc: "Inbound traffic volume exceeded baseline by 340% on perimeter nodes." },
                    { time: offsetTime(120), desc: "Sentinel-Scrubber successfully triggered DDoS suppression rules." },
                    { time: offsetTime(380), desc: "External routing switch isolated offending botnet IP ranges." },
                    { time: offsetTime(950), desc: "Suppressing flood payload. Telemetry returned to default bounds." }
                  ];
                } else if (activeIncident.code.includes("ATK.002")) {
                  timeline = [
                    { time: offsetTime(0), desc: "Sequential port scan sequence identified targeting ports 1-65535." },
                    { time: offsetTime(200), desc: "Origin tracer matched source IP to an active Tor exit node list." },
                    { time: offsetTime(500), desc: "Diagnostic ICMP port dropping triggered on perimeter firewalls." }
                  ];
                } else if (activeIncident.code.includes("ATK.003")) {
                  timeline = [
                    { time: offsetTime(0), desc: "Sharp spike of 82,400 authentication failures logged on user terminals." },
                    { time: offsetTime(150), desc: "Quarantine rule triggered. Session locked for privileged domain admins." },
                    { time: offsetTime(800), desc: "Force rotate SSH/RDP auth tokens dispatched to credentials catalog." }
                  ];
                } else if (activeIncident.code.includes("ATK.004")) {
                  timeline = [
                    { time: offsetTime(0), desc: "Localized host broadcast identified presenting duplicate MAC mappings." },
                    { time: offsetTime(240), desc: "ARP poisoning MITM signature match isolated sniffing adapters." },
                    { time: offsetTime(700), desc: "Switch segment reconfigured, isolating rogue node at physical layer." }
                  ];
                } else if (activeIncident.code.includes("ATK.005")) {
                  timeline = [
                    { time: offsetTime(0), desc: "Heuristics flagged unauthorized volume shadow copy delete process." },
                    { time: offsetTime(110), desc: "Ransomware directory encryption vector (*.crypt) isolated in sandbox." },
                    { time: offsetTime(450), desc: "Quarantined DB-VAULT filesystem access. Recover playbook staged." }
                  ];
                }

                if (activeIncident.status === "MITIGATED") {
                  timeline.push({
                    time: offsetTime(2000),
                    desc: "Forensic mitigation completed. Sentinel firewall rules updated to prevent lateral decay."
                  });
                }

                return timeline.map((evt, idx) => (
                  <div key={idx} className="flex gap-4 border-b border-border/20 pb-1.5 print:border-black/10">
                    <span className="text-primary font-bold shrink-0 print:text-black">{evt.time}</span>
                    <span className="text-foreground/95 print:text-black">{evt.desc}</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Playbooks Checklist */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-primary border-b border-border/40 pb-1 print:text-black print:border-black">
              5. Remediation Playbook Checklist
            </h4>
            <div className="space-y-2 text-xs">
              {activeIncident.actions.map((act, i) => (
                <div key={i} className="flex items-center gap-3 border-b border-border/30 pb-2 print:border-black/20">
                  <span className={`h-2 w-2 rounded-full ${
                    activeIncident.status === "MITIGATED" ? "bg-primary print:bg-black" : "bg-cyber-amber"
                  }`} />
                  <span className="text-foreground/90 font-mono print:text-black">{act}</span>
                  <span className="ml-auto font-mono text-[9px] text-muted-foreground uppercase print:text-primary print:font-bold">
                    {activeIncident.status === "MITIGATED" ? "COMPLETED" : "PENDING"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex gap-3 pt-4 border-t border-border/45 no-print justify-end">
          <button
            onClick={triggerPrint}
            className="btn-cyber flex items-center gap-2 border-primary text-primary"
          >
            <Printer className="h-4 w-4" /> Print Forensic PDF
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="btn-cyber flex items-center gap-2 border-border text-muted-foreground"
            >
              Exit Brief
            </button>
          )}
        </div>
      </div>
    );
  }

  // Otherwise, render the standard Report Card templates (preserving original behavior)
  return (
    <section id="reports" className="relative mx-auto max-w-7xl px-4 py-8">
      <SectionHeader
        index="// 10"
        eyebrow="Security Report Generator"
        title="Board-ready threat reports in one click"
        description="Compile historical metrics, incident counts, and risk posture matrices automatically into formatted audits."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        {reportCards.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, delay: i * 0.08 }}
            className="glass-panel glass-panel-hover corner-frame flex items-center gap-5 p-5"
          >
            <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-md border border-primary/40 bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
              <div className="absolute -bottom-1 right-1 rounded bg-background px-1 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-primary">
                PDF
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {r.id}
              </div>
              <div className="truncate font-display text-base font-bold">{r.name}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {r.range} · {r.pages} pages · {r.size}
              </div>
            </div>
            <button
              className="btn-cyber btn-cyber-primary !px-4 !py-2 text-[10px]"
              onClick={() => exportReport(r)}
              disabled={exportingId !== null}
              aria-busy={exportingId === r.id}
            >
              <Download className="h-4 w-4" /> {exportingId === r.id ? "Exporting" : "Export"}
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function reportToCard(report: BackendReport): ReportCard {
  return {
    id: report.reportKey ?? report.id,
    name: report.title ?? "CyberSentinel XDR Security Report",
    range: formatRange(report.rangeStart, report.rangeEnd),
    pages: report.format === "TXT" ? 8 : 12,
    size: formatBytes(report.sizeBytes),
    backendId: report.id,
  };
}

function formatRange(start?: string, end?: string) {
  if (!start && !end) return "Generated";
  return `${formatDate(start)} — ${formatDate(end)}`;
}

function formatDate(value?: string) {
  if (!value) return "Now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatBytes(value?: number) {
  if (!value) return "0 KB";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(value / 1000))} KB`;
}

function downloadBackendReport(report?: BackendReport, fallbackFileName = "security_report.txt") {
  if (!report) return;

  const isJson = report.format === "JSON" || Boolean(report.contentJson);
  const content = isJson
    ? JSON.stringify(report.contentJson ?? report, null, 2)
    : (report.contentText ?? JSON.stringify(report, null, 2));
  const fileName =
    fallbackFileName || `${report.reportKey ?? report.id}.${isJson ? "json" : "txt"}`;
  const blob = new Blob([content], { type: isJson ? "application/json" : "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
