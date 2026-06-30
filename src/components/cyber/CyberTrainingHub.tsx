import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ShieldAlert, Cpu, Eye, FileSpreadsheet, Lock, PlayCircle, HelpCircle, CheckCircle, XCircle } from "lucide-react";
import { useSOC } from "./SOCContext";

type QuizQuestion = {
  question: string;
  options: string[];
  answerIdx: number;
  explanation: string;
};

type TrainingTopic = {
  code: string;
  name: string;
  mitreTactic: string;
  mitreTechnique: string;
  description: string;
  mechanism: string;
  detection: string;
  prevention: string;
  investigation: string[];
  sampleLog: string;
  quiz: QuizQuestion;
};

const attackPayloads: Record<string, any> = {
  "ATK.001": {
    code: "ATK.001",
    title: "DDoS Saturation",
    severity: "CRITICAL",
    endpoint: "/simulate/ddos",
    payload: { targetNodeId: "CORE-01", intensity: 90 },
  },
  "ATK.002": {
    code: "ATK.002",
    title: "Port Reconnaissance",
    severity: "HIGH",
    endpoint: "/simulate/portscan",
    payload: { targetNodeId: "FW-EDGE", mode: "SEQUENTIAL", portStart: 1, portEnd: 65535 },
  },
  "ATK.003": {
    code: "ATK.003",
    title: "Brute Force",
    severity: "HIGH",
    endpoint: "/simulate/bruteforce",
    payload: { targetNodeId: "CORE-01", service: "SSH", attempts: 1200, intensity: 75 },
  },
  "ATK.004": {
    code: "ATK.004",
    title: "Packet Sniffing",
    severity: "ELEVATED",
    endpoint: "/simulate/sniffing",
    payload: { targetNodeId: "SOC-NODE", sampleSize: 120 },
  },
  "ATK.005": {
    code: "ATK.005",
    title: "Malware Deployment",
    severity: "CRITICAL",
    endpoint: "/simulate/malware",
    payload: { targetNodeId: "DB-VAULT", vector: "RANSOMWARE", intensity: 85 },
  },
};

export function CyberTrainingHub() {
  const { runSimulation, setActiveTab, setScore } = useSOC();

  const topics: TrainingTopic[] = [
    {
      code: "ATK.001",
      name: "DDoS Saturation",
      mitreTactic: "Impact (TA0040)",
      mitreTechnique: "Network Denial of Service (T1498)",
      description: "A volumetric flooding attack aimed at consuming network interface capacity and processing queues, rendering gateway routes unavailable to legitimate users.",
      mechanism: "Attackers orchestrate distributed botnet clusters to trigger multi-vector floods (SYN, UDP, HTTP GET/POST). The high packet rate saturates network interfaces, overflows routing buffers, and exhausts system memory structures.",
      detection: "Monitor sudden ingress throughput spikes, packet rates exceeding standard deviations, or high ratios of half-open TCP connections (SYN-ACK timeouts).",
      prevention: "Implement ingress filters, load balancing, deep packet scrubbers (e.g. Sentinel-Scrubber), and adaptive rate-limiting policies at peripheral boundaries.",
      investigation: [
        "Inspect firewall traffic logs for high volumes of small packet ingress",
        "Perform reverse-DNS on anomalous IPs to trace source ASNs",
        "Apply scrubbing profile quarantine rule to isolate malicious subnets",
        "Enable load balancing reroute to mitigate target node saturation",
      ],
      sampleLog: `[TRAFFIC] INGRESS: 184.22.109.11 -> 10.0.0.1 (PORT: 80) PROTO: TCP SYN FLOOD (Rate: 2,420,000 pps)\n[RESOURCE] CORE-01: CPU load 99.8% - RAM buffers depleted. Threshold critical.`,
      quiz: {
        question: "Which of the following is the most effective perimeter defense against a volumetric L7 DDoS flood?",
        options: [
          "A standard packet filter firewall",
          "An off-site deep packet scrubber and rate limiter",
          "Disabling the TCP SYN-ACK timeout",
          "Changing system user passwords",
        ],
        answerIdx: 1,
        explanation: "Deep packet scrubbing redirects traffic, filtering volumetric floods before they saturate localized interfaces.",
      },
    },
    {
      code: "ATK.002",
      name: "Port Reconnaissance",
      mitreTactic: "Reconnaissance (TA0043)",
      mitreTechnique: "Active Scanning (T1595)",
      description: "Active probing of system ports to identify open sockets, service versions, and system vulnerabilities, laying the ground for target penetration.",
      mechanism: "Attackers issue low-footprint TCP SYN scans, FIN scans, or UDP probes across wide ip ranges (e.g. via TOR or proxies) to finger-print OS version details without establishing full TCP handshakes.",
      detection: "Audit firewall logs for sequential port access from a single source, high frequency of connection attempts resulting in RST packets, or signature alerts from IDS tools.",
      prevention: "Configure stealth boundaries by dropping unsolicited packets, disabling ICMP replies, and enabling adaptive scan blocklists at Edge firewalls.",
      investigation: [
        "Analyze scanning pattern (e.g. sequential vs random scanners)",
        "Check IP reputation database for source node associations",
        "Block scan origins at perimeter routers",
        "Validate target services patch level for open vulnerabilities",
      ],
      sampleLog: `[PORT SCAN] SRC: 198.51.100.45 (TOR EXIT) -> DEST: 10.0.0.15\n[SCAN] SYN sequence on ports [22, 23, 80, 443, 3389, 8080] within 1.2s - Signature matched.`,
      quiz: {
        question: "What type of port scan probes open ports without initiating a full TCP handshake?",
        options: [
          "Full Connect Scan",
          "TCP SYN (Half-Open) Scan",
          "UDP ping test",
          "MAC spoof scan",
        ],
        answerIdx: 1,
        explanation: "A TCP SYN scan (half-open) issues a SYN packet and listens for the SYN-ACK response, but sends a RST packet instead of an ACK, bypassing complete handshakes.",
      },
    },
    {
      code: "ATK.003",
      name: "Credential Brute Force",
      mitreTactic: "Credential Access (TA0006)",
      mitreTechnique: "Brute Force (T1110)",
      description: "Automated stuffing of access endpoints with user-password combinations to gain illegitimate authorization into the internal network.",
      mechanism: "Credential-stuffing and password spraying targeting SSH, RDP, or web auth portals using credential lists and rotation systems to evade lockout rules.",
      detection: "Check for elevated auth failures rates (e.g. HTTP 401/403 errors), accounts accessed from disparate geological sources within minutes, or multiple usernames tested from one source.",
      prevention: "Enforce multi-factor authentication (MFA), account lockouts, rate limit login attempts, and audit password strength policies regularly.",
      investigation: [
        "Audit login attempt records for high frequency authentication failures",
        "Cross-reference user accounts targeted to lock compromise scope",
        "Temporarily quarantine source IP and force-reset credentials of compromised users",
        "Check if target account succeeded login after failures sequence",
      ],
      sampleLog: `[AUTH] FAILURE: SSH login attempt failed for user 'admin' from 203.0.113.12 (Attempt 124)\n[AUTH] STATUS: SSH session lock applied for 600s on user account 'admin'.`,
      quiz: {
        question: "Which control is the strongest mitigation against credential stuffing attacks?",
        options: [
          "Enforcing frequent password changes",
          "Configuring an intrusion detection system (IDS)",
          "Enforcing multi-factor authentication (MFA)",
          "Encrypting local SSH host keys",
        ],
        answerIdx: 2,
        explanation: "MFA renders stuffed username-password pairs useless because the attacker cannot provide the secondary factor.",
      },
    },
    {
      code: "ATK.004",
      name: "Packet Sniffing (MitM)",
      mitreTactic: "Credential Access (TA0006) / Discovery (TA0007)",
      mitreTechnique: "Network Sniffing (T1040)",
      description: "Passive or active interception of network traffic inside segment zones to harvest credentials, tokens, or cleartext communications.",
      mechanism: "Attackers establish ARP poisoning, DNS spoofing, or promiscuous listeners on localized VLAN segments to reroute packets through a compromised intermediary node.",
      detection: "Monitor host ARP tables for duplicate physical address entries, verify anomalous MAC changes, or detect sudden spikes in internal latency.",
      prevention: "Enforce end-to-end transport layer encryption (TLS 1.3), restrict DHCP scopes, enable dynamic ARP inspection (DAI), and isolate VLAN boundaries.",
      investigation: [
        "Compare active node MAC addresses to static configuration mapping",
        "Audit routing path traces for unexpected gateways hops",
        "Rotate target session tokens and revoke intermediate credentials",
        "Force security boundaries reconfiguration to segment promiscuous adapters",
      ],
      sampleLog: `[ARP] DETECT: IP 10.0.0.1 mapping duplicated to MAC AA:BB:CC:DD:EE:FF (Conflict detected)\n[SECURITY] WARNING: TLS downgrade attempt intercepted on segment vlan-02.`,
      quiz: {
        question: "What protocol is used to verify MAC-to-IP address binds and prevent network packet sniffing via ARP poisoning?",
        options: [
          "Dynamic ARP Inspection (DAI)",
          "DHCP Option 82",
          "DNSSEC validation",
          "Static NAT mappings",
        ],
        answerIdx: 0,
        explanation: "DAI validates ARP IP bindings on switch interfaces, dropping spoofed mappings to prevent interception.",
      },
    },
    {
      code: "ATK.005",
      name: "Malware & Ransomware Propagation",
      mitreTactic: "Lateral Movement (TA0008) / Execution (TA0002)",
      mitreTechnique: "Lateral Tool Transfer (T1570) / User Execution (T1204)",
      description: "Lateral spread of infected payload code across workstations and servers to achieve system lock, storage encryption, or permanent backdoors.",
      mechanism: "Malicious executables utilize SMB/RPC exploits, administrative shares, or malicious attachments to propagate silently through intranet devices.",
      detection: "Look for anomalous files system creation rates, mass modification of extension headers, process execution commands referencing shadow copies delete, or anomalous RPC network calls.",
      prevention: "Enforce endpoint protection (EDR/XDR), patch system services (SMB/WMI), disable administrative shares, and restrict service account privileges.",
      investigation: [
        "Locate index compromise node (patient zero) via timeline audit",
        "Quarantine affected workstations from local network segment",
        "Terminate propagating malware process and wipe local registry hooks",
        "Deploy forensic backup recovery playbook to restore encrypted database blocks",
      ],
      sampleLog: `[MALWARE] DETECTED: Ransomware footprint identified on DB-VAULT (PID: 4892)\n[FILE-IO] ALERT: Rapid overwrite activity on file extension *.docx -> *.crypt. Quarantined.`,
      quiz: {
        question: "How does ransomware commonly bypass traditional hash-based antivirus signatures during lateral deployment?",
        options: [
          "By modifying system registry startup keys",
          "By using polymorphic code signatures and obfuscation",
          "By deleting volume shadow copies",
          "By disabling default gateway interfaces",
        ],
        answerIdx: 1,
        explanation: "Polymorphism modifies code representation structures on each execution, evading simple static file hash database checks.",
      },
    },
  ];

  const [activeTopic, setActiveTopic] = useState<TrainingTopic>(topics[0]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizStatus, setQuizStatus] = useState<"unanswered" | "correct" | "incorrect">("unanswered");
  const [completedQuizzes, setCompletedQuizzes] = useState<Record<string, boolean>>({});

  const handleLaunch = () => {
    const payload = attackPayloads[activeTopic.code];
    if (payload) {
      setActiveTab("command-center");
      setTimeout(() => {
        runSimulation(payload);
      }, 300);
    }
  };

  const handleTopicChange = (topic: TrainingTopic) => {
    setActiveTopic(topic);
    setSelectedOption(null);
    setQuizStatus("unanswered");
  };

  const handleQuizSubmit = () => {
    if (selectedOption === null) return;

    if (selectedOption === activeTopic.quiz.answerIdx) {
      setQuizStatus("correct");
      if (!completedQuizzes[activeTopic.code]) {
        setCompletedQuizzes((prev) => ({ ...prev, [activeTopic.code]: true }));
        // Reward user by temporarily bumping cyber health score
        setScore((score) => Math.min(100, score + 4));
      }
    } else {
      setQuizStatus("incorrect");
    }
  };

  return (
    <div className="grid gap-6 py-10 lg:grid-cols-[280px_1fr]">
      {/* Topics list */}
      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground px-2 mb-3 flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" /> Threat Catalog
        </div>
        {topics.map((t) => (
          <button
            key={t.code}
            onClick={() => handleTopicChange(t)}
            className={`w-full text-left corner-frame p-4 transition-all duration-300 font-display flex flex-col gap-1 cursor-pointer ${
              activeTopic.code === t.code
                ? "bg-primary/10 border border-primary text-primary shadow-[0_0_15px_rgba(0,255,136,0.2)]"
                : "glass-panel glass-panel-hover text-foreground/80"
            }`}
          >
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground flex items-center justify-between">
              <span>{t.code}</span>
              {completedQuizzes[t.code] && (
                <span className="text-primary font-bold text-[8px] tracking-normal border border-primary/40 px-1 rounded bg-primary/10">
                  COMPLETED
                </span>
              )}
            </span>
            <span className="text-sm font-bold truncate">{t.name}</span>
          </button>
        ))}
      </div>

      {/* Detail Pane */}
      <div className="glass-panel p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-border/40 pb-4 gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
              {activeTopic.code} · TRAINING MODULE
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              {activeTopic.name}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end font-mono text-[10px] uppercase text-right">
              <span className="text-cyber-amber">Tactic: {activeTopic.mitreTactic}</span>
              <span className="text-cyber-cyan mt-0.5">Technique: {activeTopic.mitreTechnique}</span>
            </div>
            <button
              onClick={handleLaunch}
              className="btn-cyber btn-cyber-primary !py-2 !px-3 text-[10px] flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,136,0.25)] hover:scale-103 active:scale-97 transition"
            >
              <PlayCircle className="h-4 w-4" /> Try Simulating
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Theory */}
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-sm font-bold text-primary flex items-center gap-2 mb-1.5 uppercase">
                <ShieldAlert className="h-4 w-4" /> Overview
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {activeTopic.description}
              </p>
            </div>

            <div>
              <h3 className="font-display text-sm font-bold text-primary flex items-center gap-2 mb-1.5 uppercase">
                <Cpu className="h-4 w-4" /> Attack Vector & Mechanics
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {activeTopic.mechanism}
              </p>
            </div>

            <div>
              <h3 className="font-display text-sm font-bold text-primary flex items-center gap-2 mb-1.5 uppercase">
                <Eye className="h-4 w-4" /> Detection Tactics
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {activeTopic.detection}
              </p>
            </div>
          </div>

          {/* Defense & Lab */}
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-sm font-bold text-primary flex items-center gap-2 mb-1.5 uppercase">
                <Lock className="h-4 w-4" /> Mitigations & Controls
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {activeTopic.prevention}
              </p>
            </div>

            {/* Checklist */}
            <div>
              <h3 className="font-display text-sm font-bold text-primary flex items-center gap-2 mb-2 uppercase">
                <FileSpreadsheet className="h-4 w-4" /> Analyst Checklist Playbook
              </h3>
              <div className="space-y-2">
                {activeTopic.investigation.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 rounded border border-border/40 bg-black/30 p-2">
                    <input
                      type="checkbox"
                      id={`chk-${activeTopic.code}-${idx}`}
                      className="mt-0.5 rounded border-border bg-background text-primary accent-primary h-3.5 w-3.5 focus:ring-0 cursor-pointer"
                    />
                    <label
                      htmlFor={`chk-${activeTopic.code}-${idx}`}
                      className="font-mono text-[10px] text-foreground/80 leading-relaxed cursor-pointer"
                    >
                      {step}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live log sample */}
        <div className="border-t border-border/40 pt-5">
          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">
            Signature Telemetry Log Sample
          </div>
          <pre className="font-mono text-[10px] text-primary bg-black/90 p-4 border border-border rounded overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {activeTopic.sampleLog}
          </pre>
        </div>

        {/* Interactive Knowledge Check Quiz Section */}
        <div className="border-t border-border/40 pt-6">
          <h3 className="font-display text-sm font-bold text-primary flex items-center gap-2 mb-3 uppercase">
            <HelpCircle className="h-4.5 w-4.5" /> KNOWLEDGE CHECK QUIZ
          </h3>
          
          <div className="border border-border/60 rounded p-4 bg-black/40 space-y-4">
            <p className="font-mono text-xs font-bold text-foreground">
              Q: {activeTopic.quiz.question}
            </p>
            
            <div className="space-y-2 font-mono text-[11px]">
              {activeTopic.quiz.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => quizStatus === "unanswered" && setSelectedOption(i)}
                  className={`w-full text-left p-2.5 rounded border transition-all cursor-pointer ${
                    selectedOption === i
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 hover:border-primary/50 text-foreground/80"
                  }`}
                  disabled={quizStatus !== "unanswered"}
                >
                  <span className="font-bold mr-2">{String.fromCharCode(65 + i)})</span> {opt}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-border/30 pt-3">
              <span className="text-[9px] text-muted-foreground/60 uppercase">
                Success awards +4 Health Posture points
              </span>
              <button
                onClick={handleQuizSubmit}
                disabled={selectedOption === null || quizStatus !== "unanswered"}
                className="btn-cyber !py-1.5 !px-4 text-[10px]"
              >
                SUBMIT ANSWER
              </button>
            </div>

            <AnimatePresence>
              {quizStatus !== "unanswered" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {quizStatus === "correct" ? (
                    <div className="p-3 border border-primary/50 bg-primary/5 rounded space-y-1.5 text-xs text-primary leading-relaxed">
                      <span className="font-bold flex items-center gap-1.5 text-[12px] uppercase">
                        <CheckCircle className="h-4.5 w-4.5" /> Answer Correct!
                      </span>
                      <p>{activeTopic.quiz.explanation}</p>
                    </div>
                  ) : (
                    <div className="p-3 border border-cyber-red/50 bg-cyber-red/5 rounded space-y-1.5 text-xs text-cyber-red leading-relaxed">
                      <span className="font-bold flex items-center gap-1.5 text-[12px] uppercase">
                        <XCircle className="h-4.5 w-4.5" /> Answer Incorrect
                      </span>
                      <p>Review the mitigation and overview text, then click reset to try again.</p>
                      <button
                        onClick={() => {
                          setSelectedOption(null);
                          setQuizStatus("unanswered");
                        }}
                        className="btn-cyber !py-1 !px-2 text-[8px] border-cyber-red text-cyber-red mt-2"
                      >
                        TRY AGAIN
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
