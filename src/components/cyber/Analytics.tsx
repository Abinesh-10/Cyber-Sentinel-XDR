import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiGet } from "../../lib/api/client";
import { useSocket } from "../../hooks/useSocket";
import { SectionHeader } from "./SectionHeader";

type AnalyticsSnapshot = {
  attacks?: {
    totalByType?: Array<{ attackType: string; total: number }>;
    frequency?: Array<{ bucket: string; total: number; attackType?: string }>;
  };
  detections?: {
    detectionAccuracy?: number;
    truePositiveRate?: number;
  };
  risk?: {
    nodeRiskScores?: Array<{ nodeName?: string; nodeId?: string; riskScore?: number }>;
  };
  health?: {
    performanceMetrics?: {
      averageLatencyMs?: number;
    };
  };
};

const fallbackTrend = Array.from({ length: 24 }, (_, i) => ({
  t: `${String(i).padStart(2, "0")}:00`,
  detected: 4200 + Math.round(Math.sin(i / 3) * 1400 + Math.random() * 800),
  blocked: 4000 + Math.round(Math.sin(i / 3) * 1300 + Math.random() * 700),
}));

const fallbackDist = [
  { k: "Malware", v: 38 },
  { k: "Phishing", v: 22 },
  { k: "DDoS", v: 14 },
  { k: "Brute", v: 11 },
  { k: "Zero-day", v: 8 },
  { k: "Insider", v: 7 },
];

const fallbackRisk = [
  { axis: "Perimeter", A: 92 },
  { axis: "Identity", A: 78 },
  { axis: "Endpoint", A: 85 },
  { axis: "Cloud", A: 88 },
  { axis: "Data", A: 81 },
  { axis: "OT/IoT", A: 64 },
];

const NEON = "#00ff88";
const CYAN = "#5fd7ff";

export function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const { socket } = useSocket("/xdr");

  useEffect(() => {
    let mounted = true;

    loadAnalytics((snapshot) => {
      if (mounted) setAnalytics(snapshot);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const refresh = () => loadAnalytics(setAnalytics);
    socket.on("analytics_updated", refresh);
    socket.on("attack_detected", refresh);
    socket.on("alert_created", refresh);
    return () => {
      socket.off("analytics_updated", refresh);
      socket.off("attack_detected", refresh);
      socket.off("alert_created", refresh);
    };
  }, [socket]);

  const trend = trendFromAnalytics(analytics) ?? fallbackTrend;
  const dist = distributionFromAnalytics(analytics) ?? fallbackDist;
  const risk = riskFromAnalytics(analytics) ?? fallbackRisk;
  const precision = analytics?.detections?.detectionAccuracy ?? 99.74;
  const recall = analytics?.detections?.truePositiveRate ?? 99.42;
  const f1 =
    precision && recall
      ? Number(((2 * precision * recall) / (precision + recall)).toFixed(2))
      : 99.58;
  const mttr = analytics?.health?.performanceMetrics?.averageLatencyMs
    ? Number((analytics.health.performanceMetrics.averageLatencyMs / 1000).toFixed(1))
    : 92.6;

  return (
    <section id="analytics" className="relative mx-auto max-w-7xl px-4 py-28">
      <SectionHeader
        index="// 07"
        eyebrow="Security Analytics"
        title="Telemetry distilled into decisions"
        description="Every chart is wired to live Sentinel streams â€” historical depth, predictive overlays."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Threat trends Â· last 24h" sub="Detected vs Blocked">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={NEON} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={NEON} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={CYAN} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={CYAN} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(0,255,136,0.08)" />
              <XAxis dataKey="t" stroke="rgba(220,255,235,0.5)" fontSize={10} />
              <YAxis stroke="rgba(220,255,235,0.5)" fontSize={10} />
              <Tooltip
                contentStyle={{
                  background: "rgba(8,14,12,0.92)",
                  border: "1px solid rgba(0,255,136,0.4)",
                  color: NEON,
                  fontFamily: "JetBrains Mono",
                  fontSize: 12,
                }}
              />
              <Area dataKey="detected" stroke={NEON} fill="url(#g1)" strokeWidth={1.5} />
              <Area dataKey="blocked" stroke={CYAN} fill="url(#g2)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Attack distribution" sub="By class Â· last 7d">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dist}>
              <CartesianGrid stroke="rgba(0,255,136,0.08)" />
              <XAxis dataKey="k" stroke="rgba(220,255,235,0.5)" fontSize={10} />
              <YAxis stroke="rgba(220,255,235,0.5)" fontSize={10} />
              <Tooltip
                cursor={{ fill: "rgba(0,255,136,0.08)" }}
                contentStyle={{
                  background: "rgba(8,14,12,0.92)",
                  border: "1px solid rgba(0,255,136,0.4)",
                  color: NEON,
                  fontFamily: "JetBrains Mono",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="v" radius={[2, 2, 0, 0]}>
                {dist.map((_, i) => (
                  <Cell key={i} fill={i % 2 === 0 ? NEON : CYAN} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Risk surface" sub="Six-axis posture score">
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={risk}>
              <PolarGrid stroke="rgba(0,255,136,0.18)" />
              <PolarAngleAxis dataKey="axis" stroke="rgba(220,255,235,0.6)" fontSize={11} />
              <PolarRadiusAxis stroke="rgba(220,255,235,0.2)" fontSize={9} />
              <Radar dataKey="A" stroke={NEON} fill={NEON} fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Detection performance" sub="Precision vs Recall Â· model v4.281">
          <div className="grid h-[260px] grid-cols-2 gap-4">
            <Gauge label="Precision" value={precision} />
            <Gauge label="Recall" value={recall} />
            <Gauge label="F1 Score" value={f1} />
            <Gauge label="MTTR" value={mttr} suffix="s" inverse />
          </div>
        </Panel>
      </div>
    </section>
  );
}

function loadAnalytics(apply: (snapshot: AnalyticsSnapshot) => void) {
  apiGet<AnalyticsSnapshot>("/analytics")
    .then(apply)
    .catch((error) => {
      console.error("Failed to load analytics", error);
    });
}

function trendFromAnalytics(snapshot: AnalyticsSnapshot | null) {
  const rows = snapshot?.attacks?.frequency;
  if (!rows?.length) return null;

  return rows.slice(-24).map((row) => ({
    t: row.bucket?.slice(11, 16) || row.bucket,
    detected: Number(row.total ?? 0),
    blocked: Number(row.total ?? 0),
  }));
}

function distributionFromAnalytics(snapshot: AnalyticsSnapshot | null) {
  const rows = snapshot?.attacks?.totalByType;
  if (!rows?.length) return null;

  const labels: Record<string, string> = {
    DDOS: "DDoS",
    PORT_SCAN: "Port Scan",
    BRUTE_FORCE: "Brute",
    MALWARE_PROPAGATION: "Malware",
    PACKET_SNIFFING: "Sniffing",
  };

  return rows.map((row) => ({
    k: labels[row.attackType] ?? row.attackType,
    v: Number(row.total ?? 0),
  }));
}

function riskFromAnalytics(snapshot: AnalyticsSnapshot | null) {
  const nodes = snapshot?.risk?.nodeRiskScores;
  if (!nodes?.length) return null;

  return nodes.slice(0, 6).map((node) => ({
    axis: node.nodeName ?? node.nodeId ?? "Node",
    A: Number(node.riskScore ?? 0),
  }));
}

function Panel({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6 }}
      className="glass-panel glass-panel-hover corner-frame p-5"
    >
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="font-display text-base font-bold text-foreground">{title}</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {sub}
          </div>
        </div>
        <span className="ticker-dot" />
      </div>
      {children}
    </motion.div>
  );
}

function Gauge({
  label,
  value,
  suffix = "%",
  inverse = false,
}: {
  label: string;
  value: number;
  suffix?: string;
  inverse?: boolean;
}) {
  const pct = inverse ? Math.min(100, (100 / value) * 100) : value;
  const R = 42;
  const C = 2 * Math.PI * R;
  const dash = (pct / 100) * C;
  return (
    <div className="relative grid place-items-center rounded border border-border bg-background/40 p-2">
      <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(0,255,136,0.15)" strokeWidth="4" />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke="#00ff88"
          strokeWidth="4"
          strokeDasharray={`${dash} ${C}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-mono text-lg font-bold text-primary text-glow">
            {value}
            {suffix}
          </div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}
