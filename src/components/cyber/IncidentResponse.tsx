import type React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertOctagon, ShieldCheck, Siren, Workflow, FileText, RotateCcw, ShieldAlert, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useSOC } from "./SOCContext";
import { SectionHeader } from "./SectionHeader";
import { ReportGenerator } from "./ReportGenerator";

const lvlClass: Record<string, string> = {
  CRITICAL: "text-destructive border-destructive/50 bg-destructive/10",
  HIGH: "text-cyber-amber border-cyber-amber/50 bg-cyber-amber/10",
  MEDIUM: "text-cyber-cyan border-cyber-cyan/50 bg-cyber-cyan/10",
  LOW: "text-cyber-cyan border-cyber-cyan/50 bg-cyber-cyan/10",
};

const statusIcon: Record<string, React.ReactNode> = {
  CONTAINING: <Siren className="h-4.5 w-4.5 text-cyber-red animate-pulse" />,
  MITIGATED: <ShieldCheck className="h-4.5 w-4.5 text-primary" />,
  INVESTIGATING: <Workflow className="h-4.5 w-4.5 text-cyber-cyan" />,
};

export function IncidentResponse() {
  const { incidents, mitigateIncident, activeAttack, setActiveAttack, setScore } = useSOC();
  const [executingCode, setExecutingCode] = useState<string | null>(null);
  const [activeReportIncident, setActiveReportIncident] = useState<any | null>(null);
  const [replayingCode, setReplayingCode] = useState<string | null>(null);
  const [replayProgress, setReplayProgress] = useState(0);

  async function executeIncident(code: string) {
    setExecutingCode(code);
    try {
      await mitigateIncident(code);
    } catch (error) {
      console.error("Failed to execute incident response", error);
    } finally {
      setExecutingCode(null);
    }
  }

  // Local step-by-step Attack Replay loop that links directly to the topology SVG path visualizer
  function triggerAttackReplay(inc: any) {
    if (activeAttack) return; // Simulation or replay already running
    
    setReplayingCode(inc.code);
    setReplayProgress(0);

    const targetNode = inc.code === "ATK.005" ? "DB-VAULT" : inc.code === "ATK.002" ? "FW-EDGE" : "CORE-01";
    
    // 1. Initialize activeAttack state
    setActiveAttack({
      code: inc.code,
      title: inc.title,
      severity: inc.level,
      progress: 0,
      state: "initializing",
      targetNodeId: targetNode,
      logs: [`[INFO] REPLAY INIT: Commencing walk-through replay of incident ${inc.id}...`],
      analystInfo: {
        threat: inc.title,
        severity: inc.level,
        confidence: 96,
        message: `Forensic timeline replay of ${inc.title} target vectors.`,
        recommendations: inc.actions,
        whatHappened: inc.whatHappened,
        whyDetected: inc.whyDetected,
        rootCause: inc.rootCause,
        potentialImpact: inc.potentialImpact
      },
      durationMs: 4000
    });

    let currentProg = 0;
    const interval = setInterval(() => {
      currentProg += 10;
      setReplayProgress(currentProg);

      setActiveAttack(prev => {
        if (!prev) return null;
        const nextLogs = [...prev.logs];
        
        if (currentProg === 20) {
          nextLogs.push(`[INFO] RECONNAISSANCE: Attacker executing scanner vectors targeting port boundaries.`);
        } else if (currentProg === 50) {
          nextLogs.push(`[WARN] INTRUSION CONFIRMED: Privilege escalation attempt flagged on node ${targetNode}.`);
        } else if (currentProg === 85) {
          nextLogs.push(`[ALERT] HIGH RISK: Contagion expanding laterally. Mitigation playbook checklist loaded.`);
        } else if (currentProg === 100) {
          nextLogs.push(`[SUCCESS] REPLAY COMPLETED: Perimeter threat quarantined. End-to-end audit brief stored.`);
        }

        return {
          ...prev,
          progress: currentProg,
          state: currentProg === 100 ? "detected" : "executing",
          logs: nextLogs
        };
      });

      if (currentProg >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setReplayingCode(null);
          setActiveAttack(null);
        }, 1500);
      }
    }, 400);
  }

  return (
    <section id="response" className="relative mx-auto max-w-7xl px-4 py-8">
      {/* Title */}
      <div className="mb-10">
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-primary block mb-2">
          // INCIDENT DISCOVERY & AUTOMATED PLAYBOOKS
        </span>
        <h1 className="font-display text-4xl font-black tracking-tight text-foreground uppercase">
          Incident Response Orchestrator
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl mt-1.5">
          Review active threat alarms, launch lateral-movement attack replays, deploy firewall mitigations, and export printable CISO summaries.
        </p>
      </div>
      
      {/* Card listing (30-50% larger cards with sleek grid layout, max 3 cards per row) */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {incidents.map((inc, i) => (
          <motion.div
            key={inc.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, delay: i * 0.08 }}
            className={`glass-panel glass-panel-hover corner-frame relative overflow-hidden p-6.5 flex flex-col justify-between min-h-[380px] ${
              inc.status !== "MITIGATED"
                ? inc.level === "CRITICAL"
                  ? "border-cyber-red bg-cyber-red/5"
                  : "border-cyber-amber bg-cyber-amber/5"
                : "border-primary/25"
            }`}
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/20 pb-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {inc.code}
                </span>
                <span
                  className={`rounded border px-2.5 py-0.5 font-mono text-[9px] font-extrabold uppercase tracking-widest ${lvlClass[inc.level]}`}
                >
                  {inc.level}
                </span>
              </div>
              
              <h3 className="mt-4 font-display text-lg font-bold leading-snug tracking-wide text-foreground uppercase truncate-2-lines">
                {inc.title}
              </h3>

              {/* Status Indicator Bar */}
              <div className="mt-4.5 flex items-center gap-2.5 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-primary">
                {statusIcon[inc.status]}
                <span className="font-mono text-[11px] uppercase tracking-widest font-semibold">
                  Status · {inc.status}
                </span>
              </div>

              {/* Remedial Playbook Steps */}
              <div className="mt-5 space-y-2">
                <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
                  Remedial containment playbook
                </div>
                <ul className="space-y-1.5 text-[11.5px] text-foreground/80 font-mono">
                  {inc.actions.slice(0, 3).map((a, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 truncate">
                      <AlertOctagon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="mt-6 border-t border-border/20 pt-4 font-mono text-[10.5px] uppercase tracking-widest flex flex-col gap-3">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="truncate max-w-[140px]">Lead · {inc.owner}</span>
                <span className="text-[9px] text-muted-foreground/60">{new Date(inc.timestamp).toLocaleTimeString()}</span>
              </div>
              
              <div className="flex gap-2">
                {/* PDF Forensic Report trigger */}
                <button
                  className="btn-cyber flex-1 !py-2 text-[9px] flex items-center justify-center gap-1 border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/10"
                  onClick={() => setActiveReportIncident(inc)}
                >
                  <FileText className="h-3.5 w-3.5" /> Report
                </button>

                {/* Attack Replay trigger */}
                <button
                  className={`btn-cyber flex-1 !py-2 text-[9px] flex items-center justify-center gap-1 border-cyber-amber text-cyber-amber hover:bg-cyber-amber/10 ${
                    activeAttack ? "opacity-50 pointer-events-none" : ""
                  }`}
                  onClick={() => triggerAttackReplay(inc)}
                  disabled={activeAttack !== null}
                  aria-busy={replayingCode === inc.code}
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${replayingCode === inc.code ? "animate-spin" : ""}`} /> 
                  {replayingCode === inc.code ? `${replayProgress}%` : "Replay"}
                </button>

                {/* Mitigation trigger */}
                <button
                  className={`btn-cyber flex-grow !py-2 text-[9px] ${
                    inc.status === "MITIGATED" ? "opacity-55 pointer-events-none" : ""
                  }`}
                  onClick={() => executeIncident(inc.code)}
                  disabled={executingCode !== null || inc.status === "MITIGATED"}
                  aria-busy={executingCode === inc.code}
                >
                  {inc.status === "MITIGATED" ? "Contained ✓" : executingCode === inc.code ? "Mitigating..." : "Mitigate"}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Forensic Report Generator Modal */}
      {activeReportIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-panel border border-primary bg-black/95 p-8 rounded-xl animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setActiveReportIncident(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-white font-mono text-xs uppercase border border-border px-3 py-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
            >
              Close [X]
            </button>
            <ReportGenerator activeIncident={activeReportIncident} onClose={() => setActiveReportIncident(null)} />
          </div>
        </div>
      )}
    </section>
  );
}
