import { motion } from "framer-motion";
import {
  Bomb,
  KeyRound,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  ScanSearch,
  Skull,
  Square,
  Volume,
  VolumeX,
  Wifi,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { apiPost } from "../../lib/api/client";
import { SectionHeader } from "./SectionHeader";
import { useSOC, ActiveAttack } from "./SOCContext";

type AttackState = "idle" | "initializing" | "executing" | "detected";
type ReplayStatus = "idle" | "playing" | "paused" | "complete";
type AnalystMessage = {
  threat: string;
  severity: string;
  confidence: number;
  message: string;
  recommendations: string[];
};
type ProgressPoint = {
  atMs: number;
  progress: number;
  state: AttackState;
};
type AttackHistoryRecord = {
  code: string;
  title: string;
  attackType: string;
  timestamp: string;
  severity: string;
  terminalLogs: string[];
  logTimeline: Array<{ atMs: number; text: string }>;
  progressTimeline: ProgressPoint[];
  analystMessages: AnalystMessage[];
  detectionResult: string;
  durationMs: number;
};

const endpointMap = {
  "ATK.001": "/simulate/ddos",
  "ATK.002": "/simulate/portscan",
  "ATK.003": "/simulate/bruteforce",
  "ATK.004": "/simulate/sniffing",
  "ATK.005": "/simulate/malware",
} as const;

const attacks = [
  {
    icon: Bomb,
    code: "ATK.001",
    title: "DDoS Saturation",
    sub: "Layer 3/4/7 multi-vector flood",
    metrics: [
      ["Throughput", "2.4 Tbps"],
      ["Vectors", "17"],
      ["Targets", "12"],
    ],
    severity: "CRITICAL",
    endpoint: endpointMap["ATK.001"],
    payload: { targetNodeId: "CORE-01", intensity: 90 },
  },
  {
    icon: ScanSearch,
    code: "ATK.002",
    title: "Port Reconnaissance",
    sub: "Stealth SYN + service fingerprinting",
    metrics: [
      ["Speed", "9.4M pps"],
      ["Range", "1-65535"],
      ["Evasion", "TOR"],
    ],
    severity: "HIGH",
    endpoint: endpointMap["ATK.002"],
    payload: { targetNodeId: "FW-EDGE", mode: "SEQUENTIAL", portStart: 1, portEnd: 65535 },
  },
  {
    icon: KeyRound,
    code: "ATK.003",
    title: "Brute Force",
    sub: "Credential-stuffing with ML password rotation",
    metrics: [
      ["Attempts/s", "82,400"],
      ["Surface", "SSH/RDP/SMB"],
      ["Tokens", "MFA-bypass"],
    ],
    severity: "HIGH",
    endpoint: endpointMap["ATK.003"],
    payload: { targetNodeId: "CORE-01", service: "SSH", attempts: 1200, intensity: 75 },
  },
  {
    icon: Wifi,
    code: "ATK.004",
    title: "Packet Sniffing",
    sub: "MITM with on-the-fly TLS downgrade",
    metrics: [
      ["Capture", "Live"],
      ["Protocols", "23"],
      ["Mode", "Promisc"],
    ],
    severity: "ELEVATED",
    endpoint: endpointMap["ATK.004"],
    payload: { targetNodeId: "SOC-NODE", sampleSize: 120 },
  },
  {
    icon: Skull,
    code: "ATK.005",
    title: "Malware Deployment",
    sub: "Stealth payload injection across network",
    metrics: [
      ["Payload Size", "3.2 MB"],
      ["Infection Rate", "68%"],
      ["Targets", "15"],
    ],
    severity: "CRITICAL",
    endpoint: endpointMap["ATK.005"],
    payload: { targetNodeId: "DB-VAULT", vector: "RANSOMWARE", intensity: 85 },
  },
];

const sevColor: Record<string, string> = {
  CRITICAL: "text-destructive border-destructive/60 bg-destructive/10",
  HIGH: "text-cyber-amber border-cyber-amber/60 bg-cyber-amber/10",
  ELEVATED: "text-cyber-cyan border-cyber-cyan/60 bg-cyber-cyan/10",
};

const HISTORY_KEY = "cybersentinel.attackReplayHistory";
const SIMULATION_DURATION_MS = 3000;

export function AttackSimulation() {
  const { activeAttack: globalAttack, setActiveAttack, runSimulation } = useSOC();

  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [activeState, setActiveState] = useState<AttackState>("idle");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [showOverlay, setShowOverlay] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => (
    typeof window !== "undefined" && sessionStorage.getItem("attackSimMuted") === "true"
  ));
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [attackHistory, setAttackHistory] = useState<AttackHistoryRecord[]>(loadStoredHistory);
  const [replayMode, setReplayMode] = useState(false);
  const [replayAttack, setReplayAttack] = useState<AttackHistoryRecord | null>(null);
  const [replayLogs, setReplayLogs] = useState<string[]>([]);
  const [replayProgress, setReplayProgress] = useState(0);
  const [replayStatus, setReplayStatus] = useState<ReplayStatus>("idle");

  const audioContextRef = useRef<AudioContext | null>(null);
  const runningSoundIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAttackRef = useRef<(typeof attacks)[number] | null>(null);
  const overlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replayFrameRef = useRef<number | null>(null);
  const replayStartedAtRef = useRef(0);
  const replayElapsedRef = useRef(0);
  const replayAnalystShownRef = useRef(false);
  const replayStatusRef = useRef<ReplayStatus>("idle");
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayedLogs = replayMode && replayAttack ? replayLogs : logs;
  const isReplayBlocking = replayMode && (replayStatus === "playing" || replayStatus === "paused");

  useEffect(() => {
    replayStatusRef.current = replayStatus;
  }, [replayStatus]);

  useEffect(() => {
    return () => {
      stopRunningSound();
      clearTimerRefs();
      cancelReplayFrame();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedLogs]);

  useEffect(() => {
    persistHistory(attackHistory);
  }, [attackHistory]);

  // Synchronize global SOC state with local logs typing
  useEffect(() => {
    if (globalAttack) {
      setActiveCode(globalAttack.code);
      setActiveState(globalAttack.state as AttackState);
      setProgress(globalAttack.progress);
      setLogs(globalAttack.logs);
    } else if (!replayMode) {
      setActiveCode(null);
      setActiveState("idle");
      setProgress(0);
      setLogs([]);
    }
  }, [globalAttack, replayMode]);

  useEffect(() => {
    if (demoMode) {
      demoIntervalRef.current = setInterval(() => {
        if (!activeCode && !isReplayBlocking) {
          const randomAttack = attacks[Math.floor(Math.random() * attacks.length)];
          triggerRun(randomAttack);
        }
      }, 15000);
    } else if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }

    return () => {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
      }
    };
  }, [demoMode, activeCode, isReplayBlocking]);

  function ensureAudioContext() {
    if (audioContextRef.current || typeof window === "undefined") return audioContextRef.current;
    const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    audioContextRef.current = new AudioCtor();
    return audioContextRef.current;
  }

  function stopRunningSound() {
    if (runningSoundIntervalRef.current) {
      clearInterval(runningSoundIntervalRef.current);
      runningSoundIntervalRef.current = null;
    }
  }

  function clearTimerRefs() {
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    if (typingTimerRef.current !== null) clearTimeout(typingTimerRef.current);
    if (overlayTimeoutRef.current !== null) clearTimeout(overlayTimeoutRef.current);
    if (toastTimeoutRef.current !== null) clearTimeout(toastTimeoutRef.current);
  }

  function cancelReplayFrame() {
    if (replayFrameRef.current !== null) {
      cancelAnimationFrame(replayFrameRef.current);
      replayFrameRef.current = null;
    }
  }

  function clearLogs() {
    if (typingTimerRef.current !== null) clearTimeout(typingTimerRef.current);
    if (replayMode) {
      setReplayLogs([]);
      return;
    }
    setLogs([]);
  }

  function getLogSequence(code: string, title: string): string[] {
    const ts = () => new Date().toISOString().split("T")[1].replace("Z", "");

    const sequences: Record<string, string[]> = {
      "ATK.001": [
        `[${ts()}] [INFO] INIT: Initiating DDoS saturation simulation against Core Gateway...`,
        `[${ts()}] [INFO] STATUS: Establishing multi-vector botnet routing paths.`,
        `[${ts()}] [WARN] NETWORK: Ingress saturation rate rising rapidly.`,
        `[${ts()}] [ALERT] DETECTED: Layer 7 HTTP flood vector recognized. Rate: 2.4 Tbps.`,
        `[${ts()}] [SUCCESS] COMPLETION: Simulation payload delivered. Attack mitigated by Sentinel-Scrubber.`,
      ],
      "ATK.002": [
        `[${ts()}] [INFO] INIT: Running TCP Syn reconnaissance scan...`,
        `[${ts()}] [INFO] PARAMS: Scanning ports 1-65535 on target NODE-01.`,
        `[${ts()}] [WARN] STATUS: Tor routing network evasion enabled.`,
        `[${ts()}] [ALERT] DETECTED: Service fingerprinting signature matched on ports 22, 80.`,
        `[${ts()}] [SUCCESS] COMPLETION: Scan report generated. IP logged to global intelligence blacklist.`,
      ],
      "ATK.003": [
        `[${ts()}] [INFO] INIT: Dispersing credential stuffing payload via dictionary attack.`,
        `[${ts()}] [INFO] PARAMS: Targeted endpoints: SSH, RDP, SMB. Surface: CORE-01.`,
        `[${ts()}] [WARN] STATUS: MFA authorization gateway experiencing high traffic volume.`,
        `[${ts()}] [ALERT] DETECTED: 82,400 attempts/sec exceeding rate limit bounds. SSH locked down.`,
        `[${ts()}] [SUCCESS] COMPLETION: Brute force vector fully contained. Session key rotated.`,
      ],
      "ATK.004": [
        `[${ts()}] [INFO] INIT: Deploying local gateway promiscuous interceptor...`,
        `[${ts()}] [INFO] PARAMS: Capturing live packets on interface vlan-default.`,
        `[${ts()}] [WARN] SECURITY: TLS downgrade attempt detected on secure tunnel. Cipher: null.`,
        `[${ts()}] [ALERT] DETECTED: Decrypted payload buffer analysis matched known sniffing signatures.`,
        `[${ts()}] [SUCCESS] COMPLETION: Interception node isolated from network segment. Data integrity intact.`,
      ],
      "ATK.005": [
        `[${ts()}] [INFO] INIT: Loading malware propagation payload into containment sandbox...`,
        `[${ts()}] [INFO] PARAMS: Target seed node CORE-01. Vector: RANSOMWARE.`,
        `[${ts()}] [WARN] STATUS: Propagation chain attempting lateral movement across simulated nodes.`,
        `[${ts()}] [ALERT] DETECTED: Ransomware behavior matched. Infection spread quarantined.`,
        `[${ts()}] [SUCCESS] COMPLETION: Malware simulation contained. Recovery playbook staged.`,
      ],
    };

    return sequences[code] ?? [`[${ts()}] [INFO] RUNNING: Initiating simulation scenario for ${title}...`];
  }

  function buildAnalystReport(attack: (typeof attacks)[number]): AnalystMessage {
    const analysisMap: Record<string, string> = {
      "ATK.001": `Traffic volume exceeded baseline thresholds by 320%.\nPattern matching indicates a coordinated DDoS attack.`,
      "ATK.002": `Port scan detected across full range with stealth TOR routing.\nPotential reconnaissance activity identified.`,
      "ATK.003": `Credential stuffing attempts peaked at 82,400 attempts/s.\nBrute force attack targeting SSH services identified.`,
      "ATK.004": `Passive sniffing detected on VLAN interface.\nPotential MITM activity observed.`,
      "ATK.005": `Malware payload injected with 68% infection rate.\nRansomware behavior detected across multiple nodes.`,
    };

    return {
      threat: attack.title,
      severity: attack.severity,
      confidence: Math.floor(70 + Math.random() * 30),
      message: analysisMap[attack.code] || `Detected ${attack.title} with severity ${attack.severity}.`,
      recommendations: [
        "Block source IP",
        "Enable rate limiting",
        "Increase monitoring",
        "Investigate affected node",
      ],
    };
  }

  function buildHistoryRecord(attack: (typeof attacks)[number], lines: string[], analyst: AnalystMessage): AttackHistoryRecord {
    return {
      code: attack.code,
      title: attack.title,
      attackType: attack.title,
      timestamp: new Date().toISOString(),
      severity: attack.severity,
      terminalLogs: lines,
      logTimeline: buildLogTimeline(lines),
      progressTimeline: [
        { atMs: 0, progress: 0, state: "initializing" },
        { atMs: 600, progress: 12, state: "executing" },
        { atMs: 1500, progress: 48, state: "executing" },
        { atMs: 2400, progress: 82, state: "executing" },
        { atMs: SIMULATION_DURATION_MS, progress: 100, state: "detected" },
      ],
      analystMessages: [analyst],
      detectionResult: `${attack.title} detected with ${attack.severity} severity`,
      durationMs: SIMULATION_DURATION_MS,
    };
  }

  function buildLogTimeline(lines: string[]) {
    let elapsed = 220;
    return lines.map((line) => {
      const point = { atMs: elapsed, text: line };
      elapsed += line.length * 8 + 120;
      return point;
    });
  }

  function addHistory(record: AttackHistoryRecord) {
    setAttackHistory((prev) => [
      record,
      ...prev.filter((item) => item.timestamp !== record.timestamp),
    ].slice(0, 12));
  }

  function triggerAlertFeedback(message: string) {
    if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);

    setShowOverlay(true);
    setToastMessage(message);

    overlayTimeoutRef.current = setTimeout(() => setShowOverlay(false), 650);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3600);
  }

  function playLaunchSound() {
    if (isMuted) return;
    const ctx = ensureAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
    osc.connect(gain).connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  function playCompletionSound() {
    if (isMuted) return;
    const ctx = ensureAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.4);
    osc.connect(gain).connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }

  function startRunningSound() {
    if (isMuted) return;
    stopRunningSound();
    runningSoundIntervalRef.current = setInterval(() => {
      const ctx = ensureAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.connect(gain).connect(ctx.destination);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    }, 500);
  }

  function getAnimatedMetric(value: string, isThisActive: boolean, state: string) {
    if (!isThisActive || state !== "executing") return value;
    if (value.includes("-") || value.includes("/") || /^[A-Za-z]+$/.test(value)) return value;

    const match = value.match(/^([\d,.]+)/);
    if (!match) return value;

    const numStr = match[1].replace(/,/g, "");
    const num = parseFloat(numStr);
    if (isNaN(num)) return value;

    const randomFactor = 0.85 + Math.random() * 0.3;
    const fluctuated = num * randomFactor;
    const suffix = value.substring(match[0].length);
    const formattedVal = num % 1 === 0 && !numStr.includes(".")
      ? Math.round(fluctuated).toLocaleString()
      : fluctuated.toFixed(match[1].split(".")[1]?.length ?? 1);

    return `${formattedVal}${suffix}`;
  }

  async function triggerRun(attack: (typeof attacks)[number]) {
    playLaunchSound();
    startRunningSound();
    
    // Launch simulation globally
    await runSimulation(attack);

    // Track locally to update history record once completed
    const lines = getLogSequence(attack.code, attack.title);
    const analyst = buildAnalystReport(attack);
    const record = buildHistoryRecord(attack, lines, analyst);

    setTimeout(() => {
      stopRunningSound();
      playCompletionSound();
      addHistory(record);
      triggerAlertFeedback(`Global Threat Alert: ${record.detectionResult}`);
    }, SIMULATION_DURATION_MS);
  }

  function startReplay(record: AttackHistoryRecord) {
    if (activeCode !== null || isReplayBlocking) return;

    clearTimerRefs();
    cancelReplayFrame();
    stopRunningSound();
    setReplayMode(true);
    setReplayAttack(record);
    setReplayLogs([]);
    setReplayProgress(0);
    setReplayStatus("playing");
    setActiveCode(record.code);
    setActiveState("initializing");
    setProgress(0);
    setLogs([]);
    
    replayElapsedRef.current = 0;
    replayAnalystShownRef.current = false;
    replayStartedAtRef.current = performance.now();
    triggerAlertFeedback(`Replay started: ${record.title}`);
    playLaunchSound();
    runReplayFrame(record);
  }

  function runReplayFrame(record: AttackHistoryRecord) {
    const tick = () => {
      if (replayStatusRef.current !== "playing") return;

      const elapsed = replayElapsedRef.current + performance.now() - replayStartedAtRef.current;
      const timelinePoint = getProgressPoint(record.progressTimeline, elapsed);

      setReplayProgress(timelinePoint.progress);
      setProgress(timelinePoint.progress);
      setActiveState(timelinePoint.state);
      
      const logsSubset = record.logTimeline.filter((item) => item.atMs <= elapsed).map((item) => item.text);
      setReplayLogs(logsSubset);

      // Sync globally
      setActiveAttack({
        code: record.code,
        title: record.title,
        severity: record.severity,
        progress: timelinePoint.progress,
        state: timelinePoint.state === "detected" ? "detected" : "executing",
        targetNodeId: record.code === "ATK.005" ? "DB-VAULT" : record.code === "ATK.002" ? "FW-EDGE" : "CORE-01",
        logs: logsSubset,
        analystInfo: elapsed >= record.durationMs * 0.72 ? record.analystMessages[0] : {
          threat: "",
          severity: "",
          confidence: 0,
          message: "Replaying scenario timeline...",
          recommendations: [],
        },
        durationMs: record.durationMs,
      });

      if (!replayAnalystShownRef.current && elapsed >= record.durationMs * 0.72) {
        replayAnalystShownRef.current = true;
      }

      if (elapsed >= record.durationMs) {
        finishReplay(record);
        return;
      }

      replayFrameRef.current = requestAnimationFrame(tick);
    };

    replayFrameRef.current = requestAnimationFrame(tick);
  }

  function pauseReplay() {
    if (replayStatus !== "playing") return;
    replayElapsedRef.current += performance.now() - replayStartedAtRef.current;
    cancelReplayFrame();
    setReplayStatus("paused");
    stopRunningSound();
  }

  // Resume replay
  function resumeReplay() {
    if (replayStatus !== "paused" || !replayAttack) return;
    replayStartedAtRef.current = performance.now();
    setReplayStatus("playing");
    playLaunchSound();
    runReplayFrame(replayAttack);
  }

  function stopReplay() {
    cancelReplayFrame();
    stopRunningSound();
    setReplayMode(false);
    setReplayAttack(null);
    setReplayLogs([]);
    setReplayProgress(0);
    setReplayStatus("idle");
    setActiveAttack(null);
  }

  function finishReplay(record: AttackHistoryRecord) {
    cancelReplayFrame();
    stopRunningSound();
    playCompletionSound();
    setReplayLogs(record.terminalLogs);
    setReplayProgress(100);
    setProgress(100);
    setActiveState("detected");
    setReplayStatus("complete");
    
    // Final sync global
    setActiveAttack({
      code: record.code,
      title: record.title,
      severity: record.severity,
      progress: 100,
      state: "detected",
      targetNodeId: record.code === "ATK.005" ? "DB-VAULT" : record.code === "ATK.002" ? "FW-EDGE" : "CORE-01",
      logs: record.terminalLogs,
      analystInfo: record.analystMessages[0],
      durationMs: record.durationMs,
    });

    triggerAlertFeedback(`Replay complete: ${record.detectionResult}`);
    timeoutRef.current = setTimeout(() => {
      setReplayMode(false);
      setReplayAttack(null);
      setReplayLogs([]);
      setReplayProgress(0);
      setReplayStatus("idle");
      setActiveAttack(null);
    }, 2200);
  }

  return (
    <>
      <section id="simulation" className="relative mx-auto max-w-7xl px-4">
        <SectionHeader
          index="// 02"
          eyebrow="Orchestrated Attack Simulator"
          title="Mitre Mapped Threat Scenario Decks"
          description="Initiate intrusion pipelines inside virtual boundaries to audit monitoring detection profiles."
        />
        <div className="mb-4 flex items-center justify-between">
          <button
            className={`btn-cyber !py-1 !px-2 text-[10px] ${demoMode ? "bg-primary/20 text-white" : ""}`}
            onClick={() => setDemoMode((prev) => !prev)}
          >
            Demo Mode: {demoMode ? "ON" : "OFF"}
          </button>
        </div>
        
        <div className="grid gap-5 md:grid-cols-2">
          {attacks.map((a, i) => {
            const isThisActive = activeCode === a.code;
            const isAnyActive = activeCode !== null || isReplayBlocking;
            const displayProgress = replayMode && replayAttack?.code === a.code ? replayProgress : progress;

            let buttonText = "Run Scenario";
            if (isAnyActive) {
              if (isThisActive) {
                if (replayMode && replayAttack?.code === a.code) {
                  if (replayStatus === "paused") {
                    buttonText = "REPLAY PAUSED";
                  } else if (replayStatus === "complete") {
                    buttonText = "REPLAYED";
                  } else if (replayStatus === "playing") {
                    buttonText = "REPLAYING...";
                  } else {
                    buttonText = "REPLAY";
                  }
                } else if (activeState === "initializing") {
                  buttonText = "INITIALIZING...";
                } else if (activeState === "executing") {
                  buttonText = "EXECUTING...";
                } else if (activeState === "detected") {
                  buttonText = "DETECTED ✓";
                }
              } else {
                buttonText = "LOCKED";
              }
            }

            const latestHistory = attackHistory.find((h) => h.code === a.code);

            return (
              <motion.div
                key={a.code}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.1 }}
                className={`glass-panel glass-panel-hover corner-frame group relative overflow-hidden p-6 transition-all duration-300 ${
                  isThisActive && activeState !== "idle"
                    ? "border-cyber-red/80 shadow-[0_0_22px_rgba(239,68,68,0.45)]"
                    : ""
                }`}
              >
                {isThisActive && activeState !== "idle" && (
                  <>
                    <motion.div
                      initial={{ y: "-100%" }}
                      animate={{ y: "100%" }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                      className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyber-red to-transparent opacity-60 pointer-events-none z-10"
                    />
                    <div className="absolute inset-0 bg-cyber-red/5 animate-pulse pointer-events-none" />
                  </>
                )}

                <div
                  className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${
                    isThisActive && activeState !== "idle" ? "via-cyber-red" : "via-primary"
                  } to-transparent`}
                />

                <motion.div
                  animate={
                    isThisActive && activeState === "executing" ? { x: [-2, 2, -2, 2, 0] } : { x: 0 }
                  }
                  transition={
                    isThisActive && activeState === "executing"
                      ? { repeat: Infinity, duration: 0.4 }
                      : {}
                  }
                  className="w-full h-full flex flex-col"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative grid h-14 w-14 place-items-center rounded-md border border-primary/40 bg-primary/10">
                        <a.icon className="h-7 w-7 text-primary" />
                        <div className="absolute inset-0 animate-ping rounded-md border border-primary/30" />
                      </div>
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {a.code}
                        </div>
                        <h3 className="font-display text-xl font-bold">{a.title}</h3>
                        <p className="text-sm text-muted-foreground">{a.sub}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isThisActive && activeState !== "idle" && (
                        <span className="animate-pulse font-mono text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border border-cyber-red bg-cyber-red/20 text-cyber-red">
                          LIVE
                        </span>
                      )}
                      <span
                        className={`font-mono text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded border ${sevColor[a.severity]}`}
                      >
                        {a.severity}
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {a.metrics.map(([k, v]) => (
                      <div key={k} className="rounded border border-border bg-background/40 p-3">
                        <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                          {k}
                        </div>
                        <div className="mt-0.5 font-mono text-sm font-bold text-primary">
                          {getAnimatedMetric(v, isThisActive, activeState)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {isThisActive && activeState !== "idle" && (
                    <div className="mt-5 space-y-2">
                      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-primary">
                        <span>
                          {activeState === "detected"
                            ? "Threat Detected ✓"
                            : `Executing payload... ${Math.round(displayProgress)}%`}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-primary/10 border border-primary/20 overflow-hidden shadow-[0_0_10px_rgba(0,255,136,0.1)]">
                        <div
                          className="h-full bg-primary shadow-[0_0_8px_var(--neon)] transition-all duration-75 ease-out"
                          style={{ width: `${displayProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-primary">
                      <span className="ticker-dot" /> Engine armed
                    </div>
                    <button
                      className={`btn-cyber !py-2 !px-3 text-[10px] transition-all duration-300 ${
                        isThisActive
                          ? "shadow-[0_0_15px_rgba(0,255,136,0.45)] border-primary bg-primary/20 text-white"
                          : ""
                      }`}
                      onClick={() => triggerRun(a)}
                      disabled={isAnyActive}
                      aria-busy={isThisActive}
                    >
                      {isThisActive && !replayMode && <Loader2 className="h-3 w-3 animate-spin mr-1 inline-block" />}
                      {buttonText}
                    </button>
                    {latestHistory && (
                      <button
                        className="btn-cyber !py-1 !px-2 text-[10px] ml-2"
                        onClick={() => startReplay(latestHistory)}
                        disabled={isAnyActive}
                        aria-busy={replayMode && replayAttack?.code === a.code}
                      >
                        <RotateCcw className="h-3 w-3 mr-1 inline-block" />
                        Replay Attack
                      </button>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Terminal Logs View */}
        <div className="mt-8 w-full glass-panel border border-border bg-black/90 p-4 font-mono text-xs text-primary shadow-inner relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          {/* Step-by-Step Replay Timeline Visual HUD */}
          {replayMode && replayAttack && (
            <div className="mb-4 p-3.5 border border-primary/30 bg-primary/5 rounded space-y-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-primary">
                <span className="flex items-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5 animate-spin" /> REPLAYING THREAT TIMELINE: {replayAttack.title}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-primary/20 border border-primary/40">
                  {replayStatus.toUpperCase()} (P: {Math.round(replayProgress)}%)
                </span>
              </div>
              
              {/* Milestone Indicator Ticks */}
              <div className="grid grid-cols-5 text-[8.5px] font-mono text-muted-foreground text-center relative pt-1">
                <span className={replayProgress >= 0 ? "text-primary font-bold text-glow" : ""}>01 // INIT</span>
                <span className={replayProgress >= 25 ? "text-cyber-cyan font-bold text-glow" : ""}>02 // RECON</span>
                <span className={replayProgress >= 50 ? "text-cyber-amber font-bold text-glow" : ""}>03 // EXPLOIT</span>
                <span className={replayProgress >= 75 ? "text-cyber-red font-bold text-glow animate-pulse" : ""}>04 // LATERAL</span>
                <span className={replayProgress >= 100 ? "text-cyber-red font-bold text-glow" : ""}>05 // DECAY</span>
              </div>
              
              {/* Cyber Progress Indicator slide track */}
              <div className="h-1.5 w-full rounded bg-black/60 border border-primary/20 overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-cyber-cyan via-cyber-amber to-cyber-red transition-all duration-75"
                  style={{ width: `${replayProgress}%` }}
                />
                <div className="absolute inset-y-0 left-1/4 w-px bg-black/40" />
                <div className="absolute inset-y-0 left-2/4 w-px bg-black/40" />
                <div className="absolute inset-y-0 left-3/4 w-px bg-black/40" />
              </div>
              
              <div className="flex items-center justify-between text-[8px] text-muted-foreground/75 font-mono">
                <span>INCIDENT TIME: {new Date(replayAttack.timestamp).toLocaleString()}</span>
                <span>VECTOR CODE: {replayAttack.code} · RUNTIME: {replayAttack.durationMs}ms</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="uppercase tracking-widest text-[10px] text-muted-foreground">
                Sentinel Threat Simulator Terminal v1.0
              </span>
            </div>
            <div className="flex items-center gap-2">
              {replayMode && replayAttack && (
                <>
                  <button
                    onClick={replayStatus === "paused" ? resumeReplay : pauseReplay}
                    className="btn-cyber !py-1 !px-2 text-[9px] flex items-center"
                    disabled={replayStatus === "complete"}
                  >
                    {replayStatus === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={stopReplay}
                    className="btn-cyber !py-1 !px-2 text-[9px] flex items-center"
                  >
                    <Square className="h-4 w-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  const newMuted = !isMuted;
                  setIsMuted(newMuted);
                  sessionStorage.setItem("attackSimMuted", String(newMuted));
                }}
                className="btn-cyber !py-1 !px-2 text-[9px] flex items-center"
                aria-label="Toggle audio mute"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume className="h-4 w-4" />}
              </button>
              <button onClick={clearLogs} className="btn-cyber !py-1 !px-2 text-[9px]">
                CLEAR
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="h-60 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent pr-2"
          >
            {displayedLogs.length === 0 ? (
              <div className="text-muted-foreground/40 py-24 text-center text-[11px] uppercase tracking-wider animate-pulse">
                {replayMode && replayAttack
                  ? `REPLAY BUFFER ARMED — ${replayAttack.title}`
                  : "SENTINEL TERMINAL v1.0 — READY"}
              </div>
            ) : (
              <>
                {displayedLogs.map((log, index) => (
                  <div
                    key={`${log}-${index}`}
                    className="leading-relaxed whitespace-pre-wrap font-mono break-all text-primary"
                  >
                    {log}
                  </div>
                ))}
                <div className="flex items-center gap-1 h-4 mt-1">
                  <span className="h-1.5 w-1.5 bg-primary rounded-full animate-ping" />
                  <span className="inline-block w-1.5 h-3 bg-primary animate-pulse" />
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {showOverlay && <div className="fixed inset-0 bg-red-600 pointer-events-none" style={{ opacity: 0.15 }} />}
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-red-800 text-white px-4 py-2 rounded border border-red-600 shadow-[0_0_10px_rgba(255,0,0,0.7)] z-50">
          {toastMessage}
        </div>
      )}
    </>
  );
}

function getProgressPoint(timeline: ProgressPoint[], elapsed: number): ProgressPoint {
  let current = timeline[0];
  for (const point of timeline) {
    if (elapsed >= point.atMs) current = point;
  }

  const next = timeline.find((point) => point.atMs > elapsed);
  if (!next || current === next) return current;

  const span = next.atMs - current.atMs;
  const pct = span <= 0 ? 1 : (elapsed - current.atMs) / span;
  return {
    atMs: elapsed,
    state: current.state,
    progress: current.progress + (next.progress - current.progress) * pct,
  };
}

function loadStoredHistory(): AttackHistoryRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) as AttackHistoryRecord[] : [];
  } catch {
    return [];
  }
}

function persistHistory(history: AttackHistoryRecord[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}
