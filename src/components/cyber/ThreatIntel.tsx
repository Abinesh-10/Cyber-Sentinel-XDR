import { motion } from "framer-motion";
import { AlertTriangle, Crosshair, Gauge, HeartPulse, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api/client";
import { useSocket } from "../../hooks/useSocket";
import { LiveCounter } from "./LiveCounter";
import { SectionHeader } from "./SectionHeader";

type Dashboard = {
  attacks?: {
    summary?: { totalAttacks?: number };
  };
  alerts?: {
    metrics?: { activeAlerts?: number; criticalAlerts?: number };
  };
  analytics?: {
    detections?: { detectionAccuracy?: number };
    health?: { overallNetworkHealthScore?: number };
  };
};

export function ThreatIntel() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const { socket } = useSocket("/xdr");

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const refresh = () => loadDashboard();
    socket.on("attack_detected", refresh);
    socket.on("alert_created", refresh);
    socket.on("analytics_updated", refresh);
    socket.on("network_health_updated", refresh);
    return () => {
      socket.off("attack_detected", refresh);
      socket.off("alert_created", refresh);
      socket.off("analytics_updated", refresh);
      socket.off("network_health_updated", refresh);
    };
  }, [socket]);

  async function loadDashboard() {
    try {
      setDashboard(await apiGet<Dashboard>("/dashboard"));
    } catch (error) {
      console.error("Failed to load threat intelligence dashboard", error);
    }
  }

  const cards = [
    {
      icon: ShieldAlert,
      label: "Total Attacks (24h)",
      val: (
        <LiveCounter
          start={2840122}
          step={5}
          intervalMs={100}
          value={dashboard?.attacks?.summary?.totalAttacks}
        />
      ),
      sub: "+12.4% vs 7d avg",
      color: "text-primary",
    },
    {
      icon: Crosshair,
      label: "Active Threats",
      val: (
        <LiveCounter
          start={184}
          step={1}
          intervalMs={1400}
          value={dashboard?.alerts?.metrics?.activeAlerts}
        />
      ),
      sub: `${dashboard?.alerts?.metrics?.criticalAlerts ?? 3} critical in flight`,
      color: "text-cyber-amber",
    },
    {
      icon: Gauge,
      label: "Detection Accuracy",
      val: `${(dashboard?.analytics?.detections?.detectionAccuracy ?? 99.987).toFixed(3)}%`,
      sub: "Î” +0.011 / week",
      color: "text-primary",
    },
    {
      icon: HeartPulse,
      label: "Network Health",
      val: (dashboard?.analytics?.health?.overallNetworkHealthScore ?? 98.4).toFixed(1),
      sub: "Index Â· all sites",
      color: "text-cyber-cyan",
    },
    {
      icon: AlertTriangle,
      label: "Critical Alerts",
      val: (
        <LiveCounter
          start={27}
          step={1}
          intervalMs={4000}
          value={dashboard?.alerts?.metrics?.criticalAlerts}
        />
      ),
      sub: "MTTR 4m 12s",
      color: "text-destructive",
    },
  ];

  return (
    <section id="intel" className="relative mx-auto max-w-7xl px-4 py-28">
      <SectionHeader
        index="// 04"
        eyebrow="Threat Intelligence Center"
        title="The pulse of your global security posture"
      />
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.07 }}
            className="glass-panel glass-panel-hover corner-frame relative overflow-hidden p-5"
          >
            <div className="flex items-center justify-between">
              <c.icon className={`h-5 w-5 ${c.color}`} />
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                LIVE
              </span>
            </div>
            <div className="mt-4 font-display text-3xl font-bold text-glow text-primary">
              {c.val}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {c.label}
            </div>
            <div className="mt-3 text-xs text-foreground/70">{c.sub}</div>
            <div className="mt-4 h-1 w-full overflow-hidden rounded bg-border">
              <div className="h-full w-2/3 bg-gradient-to-r from-primary/60 to-primary animate-pulse" />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
