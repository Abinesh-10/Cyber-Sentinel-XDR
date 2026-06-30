import React, { createContext, useContext, useState, useEffect } from "react";
import { useSocket } from "../../hooks/useSocket";
import { apiGet, apiPost } from "../../lib/api/client";
import { soundEngine } from "../../lib/sound";

export type TabType =
  | "home"
  | "command-center"
  | "threat-intel"
  | "network-topology"
  | "attack-simulator"
  | "incident-response"
  | "reports-analytics"
  | "ai-analyst"
  | "enterprise";

export type AnalystMessage = {
  threat: string;
  severity: string;
  confidence: number;
  message: string;
  recommendations: string[];
  whatHappened?: string;
  whyDetected?: string;
  rootCause?: string;
  potentialImpact?: string;
};

export type Incident = {
  id: string;
  code: string;
  level: string;
  title: string;
  status: "CONTAINING" | "MITIGATED" | "INVESTIGATING";
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

export type ActiveAttack = {
  code: string;
  title: string;
  severity: string;
  progress: number;
  state: "idle" | "initializing" | "executing" | "detected" | "mitigated";
  targetNodeId: string;
  logs: string[];
  analystInfo: AnalystMessage;
  durationMs: number;
};

export type ChatMessage = {
  sender: "user" | "ciso";
  text: string;
  timestamp: string;
};

type SOCContextType = {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  currentScore: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  activeAttack: ActiveAttack | null;
  setActiveAttack: React.Dispatch<React.SetStateAction<ActiveAttack | null>>;
  incidents: Incident[];
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
  mitigateIncident: (code: string) => Promise<void>;
  runSimulation: (attack: any) => Promise<void>;
  chatHistory: ChatMessage[];
  askCISO: (text: string) => void;
  financialImpact: {
    dataLossGb: number;
    recordsExposed: number;
    financialDamage: number;
    level: string;
  };
};

const SOCContext = createContext<SOCContextType | undefined>(undefined);

// Metadata generator for security intelligence
export function getDetailedIncidentMetadata(code: string, title: string, severity: string, targetNode = "CORE-01") {
  const normCode = code.toUpperCase();
  const normTitle = title.toLowerCase();

  // 1. DDoS Saturation
  if (normCode.includes("ATK.001") || normTitle.includes("ddos") || normTitle.includes("flood")) {
    return {
      dataLossGb: 142,
      recordsExposed: 2450000,
      financialDamage: 1250000,
      impactLevel: "CRITICAL",
      whatHappened: "A coordinated volumetric DDoS flood saturated internal packet processing queues at the perimeter firewall boundary, aiming to exhaust socket availability.",
      whyDetected: "Ingress throughput surged by 340% above the 7-day moving baseline. Signature scrubbers flagged a massive count of half-open TCP SYN transactions.",
      rootCause: "Absence of active rate-limiting profiles on the peripheral routing switch and unthrottled external SYN requests.",
      potentialImpact: "Denial of access to internet-facing portals, server performance collapse, and degradation of internal VLAN routing paths.",
    };
  }

  // 2. Port Reconnaissance
  if (normCode.includes("ATK.002") || normTitle.includes("scan") || normTitle.includes("recon")) {
    return {
      dataLossGb: 0.8,
      recordsExposed: 1200,
      financialDamage: 15000,
      impactLevel: "LOW",
      whatHappened: "A stealthy TCP port scan mapped listener sockets across subnet boundaries, finger-printing endpoint OS versions and software dependencies.",
      whyDetected: "Edge firewall logs identified over 12,000 connection requests targeting sequential ports from an untrusted source IP routing through a Tor exit node.",
      rootCause: "Overly permissive outbound ICMP configurations and open diagnostic listeners exposed on edge firewalls.",
      potentialImpact: "Leaking internal directory topology, providing target profiles for active intrusion payloads and zero-day execution exploits.",
    };
  }

  // 3. Credential Brute Force
  if (normCode.includes("ATK.003") || normTitle.includes("force") || normTitle.includes("stuff")) {
    return {
      dataLossGb: 14.5,
      recordsExposed: 85000,
      financialDamage: 240000,
      impactLevel: "HIGH",
      whatHappened: "An automated credential-stuffing attack targeting authentication gateways (SSH, RDP, and VPN portals) using credential rotation algorithms.",
      whyDetected: "Auth logs flagged a sharp spike of 82,400 authentication failures within a 5-minute interval targeting privileged service accounts.",
      rootCause: "Lack of multi-factor authentication (MFA) requirements on administrative gateways and lax session block locks.",
      potentialImpact: "Unauthorized domain controller access, system privilege escalation, and credential leakage leading to broad directory compromise.",
    };
  }

  // 4. Packet Sniffing
  if (normCode.includes("ATK.004") || normTitle.includes("sniff") || normTitle.includes("mitm")) {
    return {
      dataLossGb: 8.2,
      recordsExposed: 19500,
      financialDamage: 75000,
      impactLevel: "MODERATE",
      whatHappened: "A packet interception sniffer operating on localized VLAN routing blocks, performing active ARP poisoning to redirect host data streams.",
      whyDetected: "IDS alerts flagged rapid duplicate MAC mapping conflicts matching spoofed hardware addresses for default gateways.",
      rootCause: "Dynamic ARP Inspection (DAI) and IP Source Guard disabled on localized layer-2 access switches.",
      potentialImpact: "Harvesting administrative session tokens, leakage of cleartext API authorization headers, and interception of key user database requests.",
    };
  }

  // 5. Malware Deployment
  if (normCode.includes("ATK.005") || normTitle.includes("malware") || normTitle.includes("ransom")) {
    return {
      dataLossGb: 284,
      recordsExposed: 5120000,
      financialDamage: 3800000,
      impactLevel: "CRITICAL",
      whatHappened: "A multi-stage ransomware deployment and lateral tool transfer attempting to override file systems and encrypt core databases.",
      whyDetected: "Host endpoint agents flagged suspicious file system commands modifying extensions to (*.crypt) alongside unapproved shadow copy deletion processes.",
      rootCause: "Remote code execution exploits triggered against unpatched server message block (SMB) file-sharing protocols.",
      potentialImpact: "Irreversible encryption of primary production databases, persistent service disruptions, and exposure to extortive double-data leaks.",
    };
  }

  // Fallback default
  return {
    dataLossGb: severity === "CRITICAL" ? 110 : severity === "HIGH" ? 22 : 1.5,
    recordsExposed: severity === "CRITICAL" ? 1800000 : severity === "HIGH" ? 75000 : 3500,
    financialDamage: severity === "CRITICAL" ? 950000 : severity === "HIGH" ? 180000 : 20000,
    impactLevel: severity === "CRITICAL" ? "CRITICAL" : severity === "HIGH" ? "HIGH" : "MODERATE",
    whatHappened: `An active ${title} intrusion attempt of ${severity} severity level was flagged running unauthorized network commands on host segments.`,
    whyDetected: `Intrusion engine generated alert sequence based on anomalous traffic flow signature metrics exceeding established limits.`,
    rootCause: `Default credentials, unpatched service hooks, or security configuration drift on local interfaces.`,
    potentialImpact: `Compromise of host machine ${targetNode}, lateral traversal to localized core routers, and data leakage risks.`,
  };
}

export function SOCProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [currentScore, setScore] = useState(95);
  const [activeAttack, setActiveAttack] = useState<ActiveAttack | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: "ciso",
      text: "Welcome to the CyberSentinel CISO virtual assistant. Ask me anything about our threat posture, risk vectors, or mitigation status.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const { socket } = useSocket("/xdr");

  // Load initial incidents from backend /alerts
  const loadAlerts = async () => {
    try {
      const data = await apiGet<any[]>("/alerts");
      const mapped = data.map((alert: any): Incident => {
        const sev = alert.severity ?? "MEDIUM";
        const code = alert.alertKey ?? alert.id;
        const title = alert.title ?? alert.description ?? "Security Incident";
        const meta = getDetailedIncidentMetadata(code, title, sev);
        return {
          id: alert.id,
          code: code,
          level: sev,
          title: title,
          status: alert.status === "RESOLVED" || alert.status === "IGNORED" ? "MITIGATED" : alert.status === "INVESTIGATING" ? "INVESTIGATING" : "CONTAINING",
          actions: alert.recommendations || [
            "Isolate host node",
            "Run credential rotation",
            "Audit outbound traffic",
          ],
          owner: alert.ownerUserId ?? "SOC Team",
          timestamp: alert.created_at || new Date().toISOString(),
          ...meta,
        };
      });
      setIncidents(mapped);

      // Dynamically calculate current score based on open incidents
      const openCount = mapped.filter((i) => i.status !== "MITIGATED").length;
      if (openCount > 0) {
        const totalPenalty = mapped
          .filter((i) => i.status !== "MITIGATED")
          .reduce((sum, item) => {
            if (item.level === "CRITICAL") return sum + 25;
            if (item.level === "HIGH") return sum + 15;
            return sum + 8;
          }, 0);
        setScore(Math.max(24, 98 - totalPenalty));
      } else {
        setScore(98);
      }
    } catch (err) {
      console.error("Failed to load initial alerts", err);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  // Listen for real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleAlertCreated = () => {
      loadAlerts();
      soundEngine.play("alert");
    };

    const handleAttackDetected = (data: any) => {
      // Sync score drops and incident updates
      loadAlerts();
      soundEngine.play("alert");
    };

    const handleThreatDetected = () => {
      loadAlerts();
      soundEngine.play("alert");
    };

    socket.on("alert_created", handleAlertCreated);
    socket.on("attack_detected", handleAttackDetected);
    socket.on("threat_detected", handleThreatDetected);

    return () => {
      socket.off("alert_created", handleAlertCreated);
      socket.off("attack_detected", handleAttackDetected);
      socket.off("threat_detected", handleThreatDetected);
    };
  }, [socket]);

  // Mitigate threat function
  const mitigateIncident = async (code: string) => {
    try {
      await apiPost("/network/reset");
      setIncidents((current) =>
        current.map((item) =>
          item.code === code ? { ...item, status: "MITIGATED" } : item,
        ),
      );
      // Increase score back
      setScore((s) => Math.min(98, s + 20));
      // Reset active attack if it was mitigated
      if (activeAttack && activeAttack.code === code) {
        setActiveAttack(null);
      }
      soundEngine.play("success");
      // Re-query alerts to keep everything synced with DB
      setTimeout(loadAlerts, 500);
    } catch (err) {
      console.error("Failed to mitigate incident", err);
      soundEngine.play("error");
    }
  };

  // Run simulation inside the context so it propagates
  const runSimulation = async (attack: any) => {
    if (activeAttack) return;

    const targetNode = attack.payload?.targetNodeId || "CORE-01";
    const initialMeta = getDetailedIncidentMetadata(attack.code, attack.title, attack.severity, targetNode);

    setActiveAttack({
      code: attack.code,
      title: attack.title,
      severity: attack.severity,
      progress: 0,
      state: "initializing",
      targetNodeId: targetNode,
      logs: [`[INFO] INIT: Spawning simulation sandbox for ${attack.title}...`],
      analystInfo: {
        threat: attack.title,
        severity: attack.severity,
        confidence: 0,
        message: "Threat initialization sequence starting.",
        recommendations: [],
        whatHappened: initialMeta.whatHappened,
        whyDetected: initialMeta.whyDetected,
        rootCause: initialMeta.rootCause,
        potentialImpact: initialMeta.potentialImpact,
      },
      durationMs: 3000,
    });

    try {
      await apiPost(attack.endpoint, attack.payload);

      // Simulate execution steps
      let localProgress = 0;
      const interval = setInterval(() => {
        localProgress += 10;
        setActiveAttack((prev) => {
          if (!prev) return null;
          const nextLogs = [...prev.logs];
          if (localProgress === 20) {
            nextLogs.push(`[INFO] CONNECTING: Probing endpoints and firewall routing...`);
          } else if (localProgress === 50) {
            nextLogs.push(`[WARN] INTRUSION: Payload injected. Lateral movement trace detected.`);
          } else if (localProgress === 80) {
            nextLogs.push(`[ALERT] HIGH RISK: Host integrity breach imminent on ${prev.targetNodeId}.`);
          }
          return {
            ...prev,
            progress: localProgress,
            state: "executing",
            logs: nextLogs,
          };
        });

        if (localProgress >= 100) {
          clearInterval(interval);
          setActiveAttack((prev) => {
            if (!prev) return null;
            const completedLogs = [
              ...prev.logs,
              `[ALERT] SIGNATURE MATCH: Classifying threat as ${prev.title.toUpperCase()}.`,
              `[SUCCESS] AUDIT: Log timeline stored in database. AI containment rules triggered.`,
            ];

            const severityPenalty = prev.severity === "CRITICAL" ? 30 : prev.severity === "HIGH" ? 20 : 10;
            setScore((s) => Math.max(30, s - severityPenalty));

            const finalMeta = getDetailedIncidentMetadata(prev.code, prev.title, prev.severity, prev.targetNodeId);

            return {
              ...prev,
              progress: 100,
              state: "detected",
              logs: completedLogs,
              analystInfo: {
                threat: prev.title,
                severity: prev.severity,
                confidence: Math.floor(82 + Math.random() * 15),
                message: `coordinated ${prev.title} attack vector identified routing through ${prev.targetNodeId}. Anomalous volume exceeded standard operations baseline by ${prev.severity === "CRITICAL" ? "340%" : "180%"}.`,
                recommendations: [
                  `Apply traffic rate limits on firewall boundary`,
                  `Quarantine target node ${prev.targetNodeId} immediately`,
                  `Force rotate access token and SSH session keys`,
                  `Generate post-incident analysis report for forensics`,
                ],
                whatHappened: finalMeta.whatHappened,
                whyDetected: finalMeta.whyDetected,
                rootCause: finalMeta.rootCause,
                potentialImpact: finalMeta.potentialImpact,
              },
            };
          });

          // Wait a bit and refresh alerts
          setTimeout(() => {
            loadAlerts();
          }, 500);
        }
      }, 300);
    } catch (err) {
      console.error("Simulation trigger failed", err);
      setActiveAttack(null);
    }
  };

  // AI CISO chat handler
  const askCISO = (text: string) => {
    const userMsg: ChatMessage = {
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString(),
    };
    setChatHistory((prev) => [...prev, userMsg]);

    setTimeout(() => {
      let replyText = "I have analyzed our security profile. ";
      const activeCount = incidents.filter((i) => i.status !== "MITIGATED").length;
      const totalExposure = incidents
        .filter((i) => i.status !== "MITIGATED")
        .reduce((sum, i) => sum + (i.financialDamage || 0), 0);

      const lower = text.toLowerCase();
      if (lower.includes("how secure") || lower.includes("security score") || lower.includes("posture")) {
        replyText += `Our current cyber health score stands at ${currentScore}/100. ${
          currentScore >= 85
            ? "We are maintaining a strong posture, but must remain alert for passive reconnaissance."
            : currentScore >= 65
              ? `We are in an ELEVATED threat environment. We have ${activeCount} open incident(s) dragging our metrics down. Containment operations should be prioritized.`
              : `CRITICAL ALERT: Multiple unmitigated breaches detected. Our health score is severely degraded at ${currentScore}/100. Immediate containment of critical nodes is required.`
        }`;
      } else if (lower.includes("fix first") || lower.includes("priority") || lower.includes("remed")) {
        const topInc = incidents.find((i) => i.status !== "MITIGATED" && i.level === "CRITICAL") ||
                       incidents.find((i) => i.status !== "MITIGATED" && i.level === "HIGH");
        if (topInc) {
          replyText += `Priority 1 is containment of ${topInc.title} (${topInc.code}) on its targeted hosts. We recommend running the mitigation playbook to isolate the nodes and rotate credentials. This will reduce our financial exposure by $${(topInc.financialDamage || 0).toLocaleString()}.`;
        } else {
          replyText += "All high-severity incidents are contained. Our primary recommendation is to enforce adaptive MFA on external auth portals and reduce IoT device perimeter exposure.";
        }
      } else if (lower.includes("danger") || lower.includes("threat") || lower.includes("attack")) {
        const criticalCount = incidents.filter((i) => i.status !== "MITIGATED" && i.level === "CRITICAL").length;
        replyText += `We are monitoring ${activeCount} active threat indicators. ${
          criticalCount > 0
            ? `The most dangerous vector is an active compromise of Core database assets with a projected exposure of $${totalExposure.toLocaleString()}.`
            : `The most significant risk is scanning and reconnaissance activity across public nodes, which can lead to targeted intrusion attempts.`
        }`;
      } else {
        replyText += `Regarding your query: standard operating protocols recommend running daily scanning simulations, verifying endpoint telemetry in the Digital Twin view, and generating forensic reports from the Incident Response tab. Let me know if you would like me to compile a risk brief.`;
      }

      const cisoMsg: ChatMessage = {
        sender: "ciso",
        text: replyText,
        timestamp: new Date().toLocaleTimeString(),
      };
      setChatHistory((prev) => [...prev, cisoMsg]);
    }, 800);
  };

  // Dynamically calculate active financial impact based on running attack / alerts
  const getDynamicFinancialImpact = () => {
    let lossGb = 0;
    let records = 0;
    let damage = 0;
    let level = "LOW";

    const activeIncidents = incidents.filter((i) => i.status !== "MITIGATED");
    if (activeIncidents.length > 0) {
      activeIncidents.forEach((i) => {
        lossGb += i.dataLossGb || 0;
        records += i.recordsExposed || 0;
        damage += i.financialDamage || 0;
      });
      const hasCritical = activeIncidents.some((i) => i.level === "CRITICAL");
      const hasHigh = activeIncidents.some((i) => i.level === "HIGH");
      level = hasCritical ? "CRITICAL" : hasHigh ? "HIGH" : "MODERATE";
    }

    if (activeAttack) {
      const targetNode = activeAttack.targetNodeId || "CORE-01";
      const meta = getDetailedIncidentMetadata(activeAttack.code, activeAttack.title, activeAttack.severity, targetNode);
      lossGb += (activeAttack.progress / 100) * (meta.dataLossGb ?? 0);
      records += (activeAttack.progress / 100) * (meta.recordsExposed ?? 0);
      damage += (activeAttack.progress / 100) * (meta.financialDamage ?? 0);
      if (meta.impactLevel === "CRITICAL") level = "CRITICAL";
      else if (meta.impactLevel === "HIGH" && level !== "CRITICAL") level = "HIGH";
      else if (level !== "CRITICAL" && level !== "HIGH") level = "MODERATE";
    }

    return {
      dataLossGb: Math.round(lossGb * 10) / 10,
      recordsExposed: Math.round(records),
      financialDamage: Math.round(damage),
      level,
    };
  };

  return (
    <SOCContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentScore,
        setScore,
        activeAttack,
        setActiveAttack,
        incidents,
        setIncidents,
        mitigateIncident,
        runSimulation,
        chatHistory,
        askCISO,
        financialImpact: getDynamicFinancialImpact(),
      }}
    >
      {children}
    </SOCContext.Provider>
  );
}

export function useSOC() {
  const context = useContext(SOCContext);
  if (!context) {
    throw new Error("useSOC must be used within a SOCProvider");
  }
  return context;
}
