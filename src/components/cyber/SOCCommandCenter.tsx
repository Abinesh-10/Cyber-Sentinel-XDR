import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  DollarSign,
  Database,
  AlertCircle,
  CheckCircle2,
  Terminal,
  Server,
  Zap,
  Globe,
  Radio,
  Clock,
  ArrowRight,
  TrendingDown
} from "lucide-react";
import { useSOC } from "./SOCContext";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export function SOCCommandCenter() {
  const { currentScore, activeAttack, incidents, financialImpact } = useSOC();
  const [activeAnalystTab, setActiveAnalystTab] = useState<"what" | "why" | "impact" | "mitigate">("what");
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const openIncidents = incidents.filter((i) => i.status !== "MITIGATED");
  const eventStreamRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the live event stream to the bottom
  useEffect(() => {
    if (eventStreamRef.current) {
      eventStreamRef.current.scrollTo({
        top: eventStreamRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [incidents, activeAttack]);

  // Set default selected incident if none selected
  useEffect(() => {
    if (!selectedIncidentId && incidents.length > 0) {
      const firstActive = incidents.find(i => i.status !== "MITIGATED");
      if (firstActive) {
        setSelectedIncidentId(firstActive.id);
      } else {
        setSelectedIncidentId(incidents[0].id);
      }
    }
  }, [incidents, selectedIncidentId]);

  // Sync selection to active attack if one begins
  useEffect(() => {
    if (activeAttack) {
      setSelectedIncidentId("active-simulation");
    }
  }, [activeAttack]);

  // Resolve the selected incident's data
  const getSelectedIncidentDetails = () => {
    if (activeAttack && selectedIncidentId === "active-simulation") {
      return {
        id: "active-simulation",
        code: activeAttack.code,
        level: activeAttack.severity,
        title: activeAttack.title,
        status: "INVESTIGATING",
        actions: activeAttack.analystInfo.recommendations,
        owner: "AI SOC Agent",
        timestamp: new Date().toISOString(),
        whatHappened: activeAttack.analystInfo.whatHappened ?? "An active simulation exploit has been launched.",
        whyDetected: activeAttack.analystInfo.whyDetected ?? "Heuristics and traffic spikes matched active threat signatures.",
        rootCause: activeAttack.analystInfo.rootCause ?? "Simulated intrusion path active.",
        potentialImpact: activeAttack.analystInfo.potentialImpact ?? "Active intrusion progress timeline is active.",
        confidence: activeAttack.analystInfo.confidence ?? 95,
      };
    }

    const found = incidents.find(i => i.id === selectedIncidentId);
    if (found) {
      return {
        ...found,
        confidence: found.level === "CRITICAL" ? 98.4 : found.level === "HIGH" ? 92.5 : 88.0,
      };
    }

    return null;
  };

  const selectedDetails = getSelectedIncidentDetails();

  // Severity counts for active incidents donut chart
  const criticalCount = openIncidents.filter((i) => i.level === "CRITICAL").length;
  const highCount = openIncidents.filter((i) => i.level === "HIGH").length;
  const mediumCount = openIncidents.filter((i) => i.level === "MEDIUM" || i.level === "ELEVATED").length;
  const lowCount = openIncidents.filter((i) => i.level === "LOW").length;

  const severityPieData = [
    { name: "Critical", value: criticalCount, color: "#ef4444" },
    { name: "High", value: highCount, color: "#facc15" },
    { name: "Medium", value: mediumCount, color: "#00d9ff" },
    { name: "Low", value: lowCount, color: "#00ff88" },
  ].filter((d) => d.value > 0);

  const pieDataToUse =
    severityPieData.length > 0
      ? severityPieData
      : [{ name: "All Clean", value: 1, color: "rgba(0, 255, 136, 0.12)" }];

  // Mock global threat feed items for realistic enterprise SOC cockpit
  const mockThreatFeed = [
    { id: "TF-1", vector: "T1566.001", source: "185.220.101.4", country: "RU", type: "Spearphishing Link", status: "BLOCKED" },
    { id: "TF-2", vector: "T1078.003", source: "103.88.232.14", country: "CN", type: "Cloud Account Compromise", status: "INVESTIGATING" },
    { id: "TF-3", vector: "T1190", source: "84.21.172.90", country: "NL", type: "Exploit Public-Facing App", status: "CONTAINED" },
    { id: "TF-4", vector: "T1210", source: "193.189.100.2", country: "KP", type: "Exploitation of Remote Services", status: "BLOCKED" },
  ];

  return (
    <div className="space-y-12 py-8">
      {/* Page Title & Description */}
      <div>
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-primary block mb-2">
          // EXECUTIVE SECURITY OPERATIONS CENTER
        </span>
        <h1 className="font-display text-4xl font-black tracking-tight text-foreground uppercase">
          Command Center Console
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl mt-1.5">
          Real-time threat monitoring telemetry, active event streams, vulnerability analysis queues, and cognitive agent diagnostics.
        </p>
      </div>

      {/* Top HUD: Dynamic Security Indicators Strip (All card sizes increased by 30-50% with more padding) */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Futuristic Cyber Health Score Gauge */}
        <div className="glass-panel corner-frame p-6.5 flex items-center justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block">
              Cyber Health Posture
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-display font-bold text-primary text-glow">
                {currentScore}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block font-bold">
              {currentScore >= 85
                ? "STATE: OPTIMIZED"
                : currentScore >= 65
                  ? "STATE: ELEVATED RISK"
                  : "STATE: CRITICAL ALERT"}
            </span>
          </div>

          <div className="relative h-20 w-20 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="33"
                stroke="rgba(0, 255, 136, 0.05)"
                strokeWidth="5"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r="33"
                stroke={currentScore >= 85 ? "#00ff88" : currentScore >= 65 ? "#facc15" : "#ef4444"}
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 33}
                strokeDashoffset={2 * Math.PI * 33 * (1 - currentScore / 100)}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <Shield
              className={`absolute h-7.5 w-7.5 ${
                currentScore >= 85
                  ? "text-primary"
                  : currentScore >= 65
                    ? "text-cyber-amber"
                    : "text-cyber-red animate-pulse"
              }`}
            />
          </div>
        </div>

        {/* Active Threats Counter & Severity Donut Chart */}
        <div className="glass-panel corner-frame p-6.5 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block">
              Active Incident Queue
            </span>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-4xl font-display font-bold text-glow ${
                  openIncidents.length > 0 ? "text-cyber-red" : "text-primary"
                }`}
              >
                {openIncidents.length}
              </span>
              {activeAttack && (
                <span className="text-[9px] text-cyber-red animate-pulse uppercase tracking-widest font-mono font-bold">
                  · SIM ACTIVE
                </span>
              )}
            </div>
            <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block">
              Mitigated: {incidents.filter(i => i.status === "MITIGATED").length} total
            </span>
          </div>

          <div className="relative h-18 w-18 shrink-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieDataToUse}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={28}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieDataToUse.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <ShieldAlert
                className={`h-5 w-5 ${
                  openIncidents.length > 0 ? "text-cyber-red animate-pulse" : "text-primary/30"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Financial Damage exposure */}
        <div className="glass-panel corner-frame p-6.5 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-2 flex-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block">
              Financial Damage exposure
            </span>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-3xl font-display font-bold text-glow ${
                  financialImpact.financialDamage > 0 ? "text-cyber-red" : "text-primary"
                }`}
              >
                ${financialImpact.financialDamage.toLocaleString()}
              </span>
              <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-mono font-bold">
                {financialImpact.level} IMPACT
              </span>
            </div>
            <div className="w-full bg-border/20 h-1.5 rounded overflow-hidden mt-2 relative">
              <div
                className={`h-full transition-all duration-500 ${
                  financialImpact.level === "CRITICAL"
                    ? "bg-cyber-red"
                    : financialImpact.level === "HIGH"
                      ? "bg-cyber-amber"
                      : "bg-cyber-cyan"
                }`}
                style={{
                  width: `${Math.min(100, Math.max(5, (financialImpact.financialDamage / 5000000) * 100))}%`,
                }}
              />
            </div>
          </div>
          <div className="relative shrink-0 ml-3">
            <div className="h-12 w-12 rounded-full border border-border/80 bg-background flex items-center justify-center text-primary shadow-[0_0_12px_rgba(0,255,136,0.1)]">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Blast Radius: Data compromised */}
        <div className="glass-panel corner-frame p-6.5 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block">
              Compromised Records
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2.5xl font-display font-bold text-cyber-cyan text-glow">
                {financialImpact.dataLossGb} GB
              </span>
              <span className="text-xs text-muted-foreground">
                / {financialImpact.recordsExposed.toLocaleString()} recs
              </span>
            </div>
            <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block">
              Data leak vulnerability scope
            </span>
          </div>
          <div className="relative shrink-0">
            <div className="h-12 w-12 rounded-full border border-cyber-cyan/40 bg-cyber-cyan/10 flex items-center justify-center text-cyber-cyan shadow-[0_0_12px_rgba(0,217,255,0.1)]">
              <Database className="h-5.5 w-5.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Operations Grid - 2 Column Layout with plenty of spacing and visual breathing room */}
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        
        {/* Left Column: Live event stream + threat feed */}
        <div className="space-y-8">
          {/* Real-time Threat Logs Event stream */}
          <div className="glass-panel p-6 relative overflow-hidden min-h-[350px] flex flex-col">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
              <h3 className="font-display text-sm font-bold tracking-wider flex items-center gap-2.5">
                <Terminal className="h-5 w-5 text-primary text-glow" /> REAL-TIME EVENT STREAM
              </h3>
              <span className="font-mono text-[8px] bg-primary/20 border border-primary/45 px-3 py-1 rounded text-primary uppercase tracking-[0.2em] animate-pulse">
                STREAMING LIVE
              </span>
            </div>

            {/* Custom Log Terminal Wrapper */}
            <div
              ref={eventStreamRef}
              className="flex-1 h-80 overflow-y-auto space-y-3 font-mono text-[10.5px] pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent scroll-smooth"
            >
              {incidents.map((inc) => {
                const isMitigated = inc.status === "MITIGATED";
                const isCritical = inc.level === "CRITICAL";
                const isHigh = inc.level === "HIGH";

                let borderClass = "border-border/20 bg-black/10";
                if (!isMitigated) {
                  if (isCritical) borderClass = "border-cyber-red/30 bg-cyber-red/5";
                  else if (isHigh) borderClass = "border-cyber-amber/30 bg-cyber-amber/5";
                  else borderClass = "border-cyber-cyan/30 bg-cyber-cyan/5";
                } else {
                  borderClass = "border-primary/25 bg-primary/5";
                }

                return (
                  <div
                    key={inc.id}
                    className={`flex items-start justify-between gap-4 border p-3.5 rounded-lg transition-all duration-300 hover:bg-black/30 ${borderClass}`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${
                          isMitigated
                            ? "bg-primary shadow-[0_0_8px_#00ff88]"
                            : isCritical
                              ? "bg-cyber-red animate-ping"
                              : isHigh
                                ? "bg-cyber-amber"
                                : "bg-cyber-cyan"
                        }`}
                      />
                      <div>
                        <p className="text-foreground font-semibold font-display tracking-wide uppercase text-[11px]">
                          {inc.title}
                        </p>
                        <p className="text-muted-foreground/80 mt-1 leading-relaxed">
                          Origin: Intranet · Node:{" "}
                          <span className="text-foreground font-bold">{inc.owner}</span> · Mitigation Status:{" "}
                          <span className={isMitigated ? "text-primary" : "text-cyber-amber"}>
                            {isMitigated ? "CONTAINED & QUARANTINED" : inc.actions[0]}
                          </span>
                        </p>
                        <p className="text-muted-foreground/50 text-[9px] mt-1 font-mono">
                          ID: {inc.id} · MITRE ATT&CK CODE: {inc.code}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[8px] font-extrabold border ${
                          isMitigated
                            ? "border-primary bg-primary/10 text-primary"
                            : isCritical
                              ? "border-cyber-red bg-cyber-red/10 text-cyber-red"
                              : isHigh
                                ? "border-cyber-amber bg-cyber-amber/10 text-cyber-amber"
                                : "border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan"
                        }`}
                      >
                        {isMitigated ? "MITIGATED" : inc.level}
                      </span>
                      <span className="block text-[8px] text-muted-foreground/60 mt-3 font-mono flex items-center justify-end gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(inc.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                );
              })}
              {incidents.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 text-center uppercase tracking-widest py-20">
                  <ShieldCheck className="h-10 w-10 text-primary/30 mb-3 animate-pulse" />
                  <span>No threat signals detected. Intranet secure.</span>
                </div>
              )}
            </div>
          </div>

          {/* Threat Intelligence Feed Grid (Reduces density, highlights details) */}
          <div className="glass-panel p-6 relative overflow-hidden">
            <h3 className="font-display text-sm font-bold border-b border-border/40 pb-4 mb-4 tracking-wider flex items-center gap-2.5">
              <Globe className="h-5 w-5 text-cyber-cyan" /> DEEP INTEL INGRESS THREAT FEED
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {mockThreatFeed.map((tf) => (
                <div key={tf.id} className="border border-border/20 bg-black/20 p-4 rounded-lg flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30 px-1.5 py-0.5 rounded">
                        {tf.vector}
                      </span>
                      <span className="font-mono text-xs font-bold text-foreground">
                        IP: {tf.source}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground block">
                      Type: {tf.type} ({tf.country})
                    </span>
                  </div>
                  <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded ${
                    tf.status === "BLOCKED" 
                      ? "text-primary bg-primary/10 border border-primary/20" 
                      : tf.status === "CONTAINED"
                        ? "text-cyber-cyan bg-cyber-cyan/10 border border-cyber-cyan/20"
                        : "text-cyber-amber bg-cyber-amber/10 border border-cyber-amber/20 animate-pulse"
                  }`}>
                    {tf.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive incident queue + AI diagnostics */}
        <div className="space-y-8">
          
          {/* Active Incident selector queue (Interactive List) */}
          <div className="glass-panel p-6 relative overflow-hidden">
            <h3 className="font-display text-sm font-bold border-b border-border/40 pb-4 mb-4 tracking-wider flex items-center gap-2.5">
              <Radio className="h-5 w-5 text-cyber-amber" /> SELECT CORRESPONDING INCIDENT QUEUE
            </h3>
            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {activeAttack && (
                <button
                  onClick={() => setSelectedIncidentId("active-simulation")}
                  className={`w-full text-left p-3.5 border rounded-lg transition font-mono flex items-center justify-between cursor-pointer ${
                    selectedIncidentId === "active-simulation"
                      ? "border-cyber-red bg-cyber-red/10 text-white shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                      : "border-cyber-red/35 bg-cyber-red/5 text-cyber-red hover:bg-cyber-red/10"
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-widest block font-bold text-cyber-red animate-pulse">
                      ★ Active Attack Simulation
                    </span>
                    <h4 className="text-[11px] font-bold uppercase truncate max-w-[200px]">
                      {activeAttack.title}
                    </h4>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyber-red text-white uppercase tracking-widest">
                    ACTIVE
                  </span>
                </button>
              )}

              {incidents.map((inc) => (
                <button
                  key={inc.id}
                  onClick={() => setSelectedIncidentId(inc.id)}
                  className={`w-full text-left p-3.5 border rounded-lg transition font-mono flex items-center justify-between cursor-pointer ${
                    selectedIncidentId === inc.id
                      ? "border-primary bg-primary/10 text-white shadow-[0_0_12px_rgba(0,255,136,0.15)]"
                      : "border-border/30 bg-black/20 hover:border-primary/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-widest block">
                      Code: {inc.code}
                    </span>
                    <h4 className="text-[11px] font-bold uppercase truncate max-w-[200px] text-foreground">
                      {inc.title}
                    </h4>
                  </div>
                  <span className={`text-[9.5px] font-bold ${
                    inc.status === "MITIGATED" ? "text-primary" : "text-cyber-amber"
                  }`}>
                    {inc.status}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Security Analyst explanation panel */}
          <div className="glass-panel corner-frame p-6 relative overflow-hidden min-h-[350px] flex flex-col justify-between">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
            
            <div>
              <h3 className="font-display text-sm font-bold border-b border-border/40 pb-4 mb-4 tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-primary text-glow" /> AI SOC COGNITIVE DIAGNOSTICS
                </span>
                <span className="font-mono text-[8px] bg-primary/25 border border-primary/45 px-2.5 py-0.5 rounded text-primary">
                  SECURE DIAGNOSTIC
                </span>
              </h3>

              {selectedDetails ? (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border border-cyber-cyan/35 bg-cyber-cyan/5 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5.5 w-5.5 text-cyber-cyan shrink-0 animate-pulse" />
                      <div>
                        <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest block">
                          Investigating Vector
                        </span>
                        <h4 className="font-display text-xs font-bold text-foreground uppercase tracking-wider">
                          {selectedDetails.title}
                        </h4>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-[9px] text-muted-foreground block">AI Confidence</span>
                      <span className="font-mono text-xs font-bold text-primary">
                        {selectedDetails.confidence}%
                      </span>
                    </div>
                  </div>

                  {/* HUD tabbed selector inside AI SOC analyst */}
                  <div className="flex border-b border-border/30 text-[9px] font-mono">
                    {(["what", "why", "impact", "mitigate"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveAnalystTab(tab)}
                        className={`flex-1 pb-2 font-bold uppercase tracking-wider transition cursor-pointer ${
                          activeAnalystTab === tab
                            ? "text-primary border-b-2 border-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tab === "what"
                          ? "What Happened"
                          : tab === "why"
                            ? "Why Detected"
                            : tab === "impact"
                              ? "Threat Impact"
                              : "Mitigation"}
                      </button>
                    ))}
                  </div>

                  {/* Tab contents */}
                  <div className="min-h-[160px] text-xs leading-relaxed font-mono">
                    <AnimatePresence mode="wait">
                      {activeAnalystTab === "what" && (
                        <motion.div
                          key="what"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="p-4 border border-border/20 bg-black/40 rounded-lg space-y-2"
                        >
                          <span className="text-primary font-bold block">// DIAGNOSED ANOMALY VECTOR</span>
                          <p className="text-foreground/90 leading-relaxed">
                            {selectedDetails.whatHappened}
                          </p>
                          <p className="text-muted-foreground/75 text-[10px] mt-1.5 italic">
                            Target node scope: {selectedDetails.owner}
                          </p>
                        </motion.div>
                      )}

                      {activeAnalystTab === "why" && (
                        <motion.div
                          key="why"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="p-4 border border-border/20 bg-black/40 rounded-lg space-y-2"
                        >
                          <span className="text-primary font-bold block">// DETECTION HEURISTICS</span>
                          <p className="text-foreground/90 leading-relaxed">
                            {selectedDetails.whyDetected}
                          </p>
                          <div className="text-[10px] bg-cyber-red/10 border border-cyber-red/20 text-cyber-red p-2.5 rounded">
                            TRIGGER KEY: {selectedDetails.code}
                          </div>
                        </motion.div>
                      )}

                      {activeAnalystTab === "impact" && (
                        <motion.div
                          key="impact"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="p-4 border border-border/20 bg-black/40 rounded-lg space-y-2.5"
                        >
                          <span className="text-primary font-bold block">// BUSINESS RISK & CRITICALLY</span>
                          <p className="text-foreground/90 leading-relaxed">
                            {selectedDetails.potentialImpact}
                          </p>
                          <div className="grid grid-cols-2 gap-3 text-[10px] text-muted-foreground pt-1.5">
                            <div className="border border-border/20 p-2 rounded bg-black/10">
                              <span className="block font-bold">Mitigation Node:</span>
                              <span className="text-[9px] text-foreground font-semibold">
                                {selectedDetails.owner}
                              </span>
                            </div>
                            <div className="border border-border/20 p-2 rounded bg-black/10">
                              <span className="block font-bold">Risk Assessment:</span>
                              <span
                                className={`text-[9px] font-bold uppercase ${
                                  selectedDetails.level === "CRITICAL"
                                    ? "text-cyber-red"
                                    : "text-cyber-amber"
                                }`}
                              >
                                {selectedDetails.level} Level
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {activeAnalystTab === "mitigate" && (
                        <motion.div
                          key="mitigate"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="space-y-3"
                        >
                          <span className="text-primary font-bold text-[10px] uppercase block mb-1">
                            Recommended Containment Action Checklist
                          </span>
                          <div className="space-y-2">
                            {selectedDetails.actions.slice(0, 3).map((rec: string, i: number) => (
                              <div
                                key={i}
                                className="flex items-center gap-2.5 bg-muted/10 p-2.5 border border-border/20 rounded-lg"
                              >
                                <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0" />
                                <span className="text-[10px] text-foreground/90">{rec}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center font-mono">
                  <Activity className="h-10 w-10 text-muted-foreground/30 animate-pulse mb-3" />
                  <p className="text-xs text-muted-foreground/50 uppercase tracking-widest">
                    Awaiting incident context selection
                  </p>
                  <span className="text-[9px] text-muted-foreground/30 mt-1 max-w-[200px]">
                    Select any threat signature in the queue list above to read diagnostic logs.
                  </span>
                </div>
              )}
            </div>

            {selectedDetails && (
              <div className="border-t border-border/30 pt-4 mt-6 flex justify-between items-center text-[10px] font-mono text-muted-foreground">
                <span>Vector: {selectedDetails.code}</span>
                <span className="flex items-center gap-1.5 uppercase font-bold text-primary">
                  Status: {selectedDetails.status}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
