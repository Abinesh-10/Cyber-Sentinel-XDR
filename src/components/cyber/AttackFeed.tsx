import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { apiGet } from "../../lib/api/client";
import { useSocket } from "../../hooks/useSocket";
import { SectionHeader } from "./SectionHeader";

type Sev = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
type Entry = { sev: Sev; msg: string; ip: string; ts: string };
type BackendAlert = {
  id: string;
  createdAt?: string;
  sourceIp?: string | null;
  destIp?: string | null;
  destNodeId?: string | null;
  attackType?: string | null;
  severity?: string | null;
  title?: string | null;
  riskScore?: number | null;
};
type BackendAttack = {
  attackType?: string | null;
  name?: string | null;
  sourceIp?: string | null;
  destIp?: string | null;
  targetNodeId?: string | null;
  severity?: string | null;
  intensity?: number | null;
};
type RealtimeEnvelope<T> = {
  timestamp?: string;
  payload?: T;
};
type AttackEventPayload = {
  phase?: string;
  timestamp?: string;
  attack?: BackendAttack;
  metrics?: Record<string, unknown>;
};

const sevColor: Record<Sev, string> = {
  CRITICAL: "text-destructive",
  HIGH: "text-cyber-amber",
  MEDIUM: "text-cyber-cyan",
  LOW: "text-primary",
  INFO: "text-muted-foreground",
};

function timestamp(value?: string) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toISOString().split("T")[1]!.replace("Z", "");
  return d.toISOString().split("T")[1]!.replace("Z", "");
}

function normalizeSeverity(severity?: string | null): Sev {
  if (
    severity === "CRITICAL" ||
    severity === "HIGH" ||
    severity === "MEDIUM" ||
    severity === "LOW"
  ) {
    return severity;
  }

  return "INFO";
}

function formatAttackType(attackType?: string | null) {
  const labels: Record<string, string> = {
    DDOS: "DDoS Attack",
    PORT_SCAN: "Port Scan",
    BRUTE_FORCE: "Brute Force",
    PACKET_SNIFFING: "Packet Sniffing",
    MALWARE_PROPAGATION: "Malware Propagation",
  };

  return attackType ? (labels[attackType] ?? attackType.replaceAll("_", " ")) : "Threat";
}

function alertToEntry(alert: BackendAlert): Entry {
  const score =
    typeof alert.riskScore === "number" ? ` Â· risk ${Math.round(alert.riskScore)}` : "";

  return {
    sev: normalizeSeverity(alert.severity),
    msg: `${alert.title ?? `${formatAttackType(alert.attackType)} Detected`}${score}`,
    ip: alert.sourceIp ?? alert.destIp ?? alert.destNodeId ?? "unknown",
    ts: timestamp(alert.createdAt),
  };
}

function attackEventToEntry(event: RealtimeEnvelope<AttackEventPayload>): Entry {
  const payload = event.payload ?? {};
  const attack = payload.attack ?? {};
  const phase = payload.phase ? ` Â· ${payload.phase}` : "";
  const intensity = typeof attack.intensity === "number" ? ` Â· intensity ${attack.intensity}` : "";

  return {
    sev: normalizeSeverity(attack.severity),
    msg: `${attack.name ?? formatAttackType(attack.attackType)}${phase}${intensity}`,
    ip: attack.sourceIp ?? attack.destIp ?? attack.targetNodeId ?? "unknown",
    ts: timestamp(payload.timestamp ?? event.timestamp),
  };
}

export function AttackFeed() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket("/xdr");

  useEffect(() => {
    let mounted = true;

    apiGet<BackendAlert[]>("/alerts")
      .then((alerts) => {
        if (!mounted) return;
        setEntries(alerts.map(alertToEntry).slice(0, 60));
      })
      .catch((error) => {
        console.error("Failed to load alerts", error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleAttackDetected = (event: RealtimeEnvelope<AttackEventPayload>) => {
      setEntries((prev) => [attackEventToEntry(event), ...prev].slice(0, 60));
    };

    socket.on("attack_detected", handleAttackDetected);
    return () => {
      socket.off("attack_detected", handleAttackDetected);
    };
  }, [socket]);

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-28">
      <SectionHeader
        index="// 05"
        eyebrow="Real-Time Attack Feed"
        title="Adversary chatter, raw and unfiltered"
        description="The exact stream your SOC analysts see. Auto-correlated, MITRE-tagged, ML-prioritized."
      />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="glass-panel scanline relative overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border bg-background/60 px-4 py-2.5 font-mono text-xs">
          <div className="flex items-center gap-2 text-primary">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
            <span className="h-2.5 w-2.5 rounded-full bg-cyber-amber" />
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="ml-3 uppercase tracking-widest">/var/log/sentinel/threats.live</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="ticker-dot" /> streaming Â· tail -F
          </div>
        </div>
        <div
          ref={scrollRef}
          className="h-[440px] overflow-hidden p-4 font-mono text-[12.5px] leading-relaxed"
        >
          {entries.map((e, i) => (
            <motion.div
              key={`${e.ts}-${i}`}
              initial={i === 0 ? { opacity: 0, x: -10 } : false}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-wrap items-center gap-x-3 gap-y-0.5"
            >
              <span className="text-muted-foreground">[{e.ts}]</span>
              <span className={`font-bold ${sevColor[e.sev]}`}>[{e.sev}]</span>
              <span className="text-foreground/85">{e.msg}</span>
              <span className="text-muted-foreground">â†’ IP {e.ip}</span>
              <span className="text-primary/80">Â· auto-mitigated</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
